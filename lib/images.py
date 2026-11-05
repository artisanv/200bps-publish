"""Create images with OpenAI (gpt-image), optionally from reference images.

* No references → POST /v1/images/generations
* References     → POST /v1/images/edits (multipart, image[] per file)

Everything lands in <workspace>/.bps/images/: the PNGs, uploaded references
(refs/) and index.json (prompt, model, settings, references, time). The key is
read from .env and sent only to api.openai.com.
"""
from __future__ import annotations

import base64
import json
import mimetypes
import re
import shutil
import time
import urllib.error
import urllib.request
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from store import config, load_env, read_json, save_config, state_dir, workspace, write_json

API = "https://api.openai.com/v1/images"
DEFAULT_MODEL = "gpt-image-2"
FALLBACK_MODELS = ["gpt-image-2", "gpt-image-1.5", "gpt-image-1", "gpt-image-1-mini"]
# plain words in the UI → API values
SHAPES = {"square": "1024x1024", "tall": "1024x1536", "wide": "1536x1024", "auto": "auto"}
QUALITY = {"draft": "low", "standard": "medium", "best": "high"}
DEFAULTS = {"model": DEFAULT_MODEL, "shape": "square", "quality": "standard", "n": 1}
MAX_REFS = 10
MAX_N = 4
IMG_EXT = {".png", ".jpg", ".jpeg", ".webp"}
TIMEOUT = 300


def img_dir() -> Path:
    d = state_dir() / "images"
    (d / "refs").mkdir(parents=True, exist_ok=True)
    return d


def _index_path() -> Path:
    return img_dir() / "index.json"


def gallery() -> list[dict]:
    rows = read_json(_index_path(), []) or []
    return [r for r in rows if (img_dir() / r["file"]).exists()]


def _save_index(rows: list[dict]) -> None:
    write_json(_index_path(), rows[-500:])


# ---------------- settings + models ----------------
def settings() -> dict:
    s = {**DEFAULTS, **(config().get("images") or {})}
    if s["shape"] not in SHAPES:
        s["shape"] = DEFAULTS["shape"]
    if s["quality"] not in QUALITY:
        s["quality"] = DEFAULTS["quality"]
    return s


def save_settings(**kw) -> dict:
    cfg = config()
    cur = cfg.setdefault("images", {})
    for k in ("model", "shape", "quality", "n"):
        if kw.get(k) not in (None, ""):
            cur[k] = kw[k]
    if cur.get("shape") and cur["shape"] not in SHAPES:
        raise ValueError("Shape must be square, tall, wide or auto.")
    if cur.get("quality") and cur["quality"] not in QUALITY:
        raise ValueError("Quality must be draft, standard or best.")
    save_config(cfg)
    return settings()


MODELS_MAX_AGE = 24 * 3600            # re-read OpenAI's model list once a day
_REFRESHING = {"on": False}


def refresh_models(force: bool = False) -> bool:
    """Keep the model list fresh: ask OpenAI again when the last check is
    older than a day (in the background, so the window never waits), or now
    with force (the "Check now" button / `image models --refresh`)."""
    from providers import last_tests, test
    if not has_key():
        return False
    t = last_tests().get("OPENAI_API_KEY") or {}
    if not force and time.time() - float(t.get("ts") or 0) < MODELS_MAX_AGE:
        return False
    if force:
        test("OPENAI_API_KEY")
        return True
    if _REFRESHING["on"]:
        return False
    import threading
    def run():
        try:
            test("OPENAI_API_KEY")
        except Exception:
            pass
        finally:
            _REFRESHING["on"] = False
    _REFRESHING["on"] = True
    threading.Thread(target=run, daemon=True).start()
    return True


def mark_models_seen(ids: list[str] | None = None) -> dict:
    """The user saw the "new model" notice: stop showing those models as new."""
    cfg = config()
    cur = cfg.setdefault("images", {})
    seen = set(cur.get("seenModels") or FALLBACK_MODELS)
    seen |= set(ids or (models()["main"] + models()["pinned"]))
    cur["seenModels"] = sorted(seen)
    save_config(cfg)
    return models()


def models() -> dict:
    """Image models this key can use, from the last key test. Short names
    first, dated (pinned) versions after. `new` = short names the user hasn't
    been told about yet (anything after the built-in list)."""
    from providers import last_tests
    t = last_tests().get("OPENAI_API_KEY") or {}
    ids = [m["id"] for m in (t.get("items") or []) if m.get("kind") == "image"]
    source = "key" if ids else "fallback"
    ids = ids or FALLBACK_MODELS
    seen = set((config().get("images") or {}).get("seenModels") or FALLBACK_MODELS)
    dated = re.compile(r"-\d{4}-\d{2}-\d{2}$")
    def rank(m):                                  # default first, then newest version, minis after
        v = re.search(r"(\d+(?:\.\d+)?)", m)
        return (m != DEFAULT_MODEL, m.startswith("chatgpt"), -float(v.group(1)) if v else 0, "mini" in m, m)
    main = sorted([m for m in ids if not dated.search(m)], key=rank)
    pinned = sorted([m for m in ids if dated.search(m)], reverse=True)
    new = [m for m in main if m not in seen and not m.startswith("chatgpt")] if source == "key" else []
    return {"main": main, "pinned": pinned, "source": source, "tested": t.get("ts"), "new": new,
            "checking": _REFRESHING["on"], "maxAge": MODELS_MAX_AGE}


def has_key() -> bool:
    return bool(load_env().get("OPENAI_API_KEY"))


# ---------------- references ----------------
def ref_path(ref: str) -> Path:
    """A reference: a file in .bps/images (generated or uploaded) or any image
    inside the workspace."""
    root = workspace()
    p = (Path(ref) if Path(ref).is_absolute() else root / ref).resolve()
    if root not in p.parents or p.suffix.lower() not in IMG_EXT or not p.is_file():
        raise ValueError(f"Reference not found (images inside this folder only): {ref}")
    return p


def rel(p: Path) -> str:
    return str(p.resolve().relative_to(workspace()))


def save_upload(name: str, data_b64: str) -> dict:
    ext = Path(name or "ref.png").suffix.lower()
    if ext not in IMG_EXT:
        raise ValueError("Use a PNG, JPG or WEBP image.")
    try:
        raw = base64.b64decode(data_b64.split(",", 1)[-1], validate=False)
    except Exception:
        raise ValueError("That file couldn't be read.")
    if len(raw) > 20 * 1024 * 1024:
        raise ValueError("Reference images must be under 20 MB.")
    stem = re.sub(r"[^A-Za-z0-9_-]+", "-", Path(name).stem)[:40].strip("-") or "ref"
    f = img_dir() / "refs" / f"{time.strftime('%Y%m%d-%H%M%S')}-{stem}{'.jpg' if ext == '.jpeg' else ext}"
    f.write_bytes(raw)
    return {"path": rel(f), "name": f.name}


# ---------------- OpenAI calls ----------------
def _err(e: urllib.error.HTTPError) -> str:
    try:
        b = json.loads(e.read() or b"{}")
        m = (b.get("error") or {}).get("message") or ""
    except Exception:
        m = ""
    if e.code in (401, 403) and "verif" in m.lower():
        return "OpenAI needs your organisation verified for this model: " + m[:200]
    if e.code in (401, 403):
        return "OpenAI refused the key (HTTP %d). Test it in Settings → Keys." % e.code
    if e.code == 429:
        return "OpenAI says: too many requests or no credit left. " + m[:200]
    return f"OpenAI HTTP {e.code}: {m[:300] or 'no details'}"


def _call(url: str, body: bytes, ctype: str, key: str) -> dict:
    req = urllib.request.Request(url, data=body, headers={"Authorization": f"Bearer {key}", "Content-Type": ctype,
                                                          "User-Agent": "200bps-publish"})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise RuntimeError(_err(e))
    except urllib.error.URLError as e:
        raise RuntimeError(f"Can't reach OpenAI: {e.reason}")


def _multipart(fields: dict, files: list[tuple[str, Path]]) -> tuple[bytes, str]:
    b = "----bps" + uuid.uuid4().hex
    out = []
    for k, v in fields.items():
        out.append(f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    for k, p in files:
        ct = mimetypes.guess_type(p.name)[0] or "image/png"
        out.append(f'--{b}\r\nContent-Disposition: form-data; name="{k}"; filename="{p.name}"\r\nContent-Type: {ct}\r\n\r\n'.encode()
                   + p.read_bytes() + b"\r\n")
    return b"".join(out) + f"--{b}--\r\n".encode(), "multipart/form-data; boundary=" + b


def _one(key: str, prompt: str, model: str, size: str, quality: str, refs: list[Path], edit: bool = False,
         mask: Path | None = None) -> dict:
    if refs:
        fields = {"model": model, "prompt": prompt, "size": size, "quality": quality}
        if edit:                                    # keep the source picture's faces, text and layout
            fields["input_fidelity"] = "high"
        files = [("image[]", p) for p in refs] + ([("mask", mask)] if mask else [])
        body, ct = _multipart(fields, files)
        try:
            return _call(API + "/edits", body, ct, key)
        except RuntimeError as e:
            if not edit or "input_fidelity" not in str(e):
                raise
            fields.pop("input_fidelity")              # this model doesn't take it
            body, ct = _multipart(fields, files)
            return _call(API + "/edits", body, ct, key)
    body = json.dumps({"model": model, "prompt": prompt, "size": size, "quality": quality, "n": 1}).encode()
    return _call(API + "/generations", body, "application/json", key)


def generate(prompt: str, refs: list[str] | None = None, model: str = "", shape: str = "", quality: str = "",
             n: int = 0, via: str = "chat", edit_of: str = "", mask: str = "", notes: list | None = None) -> dict:
    """Make new images. With edit_of, the first picture is changed as the
    prompt says and everything else is kept (other refs are extra guides).
    mask (base64 PNG, same size as the picture): its transparent parts are
    the only places that may change (the dashboard draws it from the user's
    pins and boxes); notes are those marks, kept with the result."""
    prompt = (prompt or "").strip()
    if not prompt:
        raise ValueError("Describe the image you want.")
    if len(prompt) > 8000:
        raise ValueError("The description is too long (8000 characters max).")
    key = load_env().get("OPENAI_API_KEY", "")
    if not key:
        raise ValueError("Add your OpenAI key first: Settings → Keys → OpenAI.")
    s = settings()
    model = model or s["model"]
    shape = shape or s["shape"]
    quality = quality or s["quality"]
    if shape not in SHAPES or quality not in QUALITY:
        raise ValueError("Unknown shape or quality.")
    n = max(1, min(MAX_N, int(n or s["n"] or 1)))
    refs = list(dict.fromkeys(([edit_of] if edit_of else []) + list(refs or [])))
    if len(refs) > MAX_REFS:
        raise ValueError(f"Up to {MAX_REFS} reference images.")
    ref_paths = [ref_path(r) for r in refs]
    mask_path = None
    if mask and edit_of:
        raw = base64.b64decode(mask.split(",", 1)[-1], validate=False)
        if not raw.startswith(b"\x89PNG") or len(raw) > 4 * 1024 * 1024:
            raise ValueError("The marks couldn't be turned into a mask (PNG under 4 MB).")
        mask_path = img_dir() / "refs" / f"mask-{uuid.uuid4().hex[:8]}.png"
        mask_path.parent.mkdir(parents=True, exist_ok=True)
        mask_path.write_bytes(raw)
    ask = (f"Edit the first image. Keep everything that isn't mentioned exactly as it is. Change: {prompt}"
           if edit_of else prompt)
    t0 = time.time()
    import jobs
    from concurrent.futures import as_completed
    expect = {"draft": 15, "standard": 30, "best": 60}.get(quality, 30) + (10 if ref_paths else 0)
    jid = jobs.start("image", (f"Editing a picture ({n} version{'s' if n > 1 else ''})" if edit_of else f"Making {n} image{'s' if n > 1 else ''}") + (f" from {len(ref_paths)} guide{'s' if len(ref_paths) > 1 else ''}" if ref_paths else ""),
                     total=n if n > 1 else None, estimate=expect, step=f"OpenAI {model} is drawing…")
    with ThreadPoolExecutor(max_workers=n) as ex:      # n images in parallel
        futs = [ex.submit(_one, key, ask, model, SHAPES[shape], QUALITY[quality], ref_paths, bool(edit_of), mask_path) for _ in range(n)]
        results, errors = [], []
        for f in as_completed(futs):
            try:
                results.append(f.result())
            except RuntimeError as e:
                errors.append(str(e))
            jobs.progress(jid, done=len(results) + len(errors), step=f"{len(results)} of {n} ready")
    if not results:
        jobs.finish(jid, ok=False, error=errors[0] if errors else "No image came back.")
        raise RuntimeError(errors[0] if errors else "No image came back.")
    jobs.finish(jid, step=f"{len(results)} image{'s' if len(results) > 1 else ''} made in {round(time.time() - t0)}s")
    stamp = time.strftime("%Y%m%d-%H%M%S")
    slug = re.sub(r"[^a-z0-9]+", "-", prompt.lower())[:36].strip("-") or "image"
    rows, made = gallery(), []
    for i, d in enumerate(results):
        item = (d.get("data") or [{}])[0]
        if not item.get("b64_json"):
            errors.append("OpenAI returned no image data.")
            continue
        fname = f"{stamp}-{slug}-{i + 1}.{d.get('output_format') or 'png'}"
        (img_dir() / fname).write_bytes(base64.b64decode(item["b64_json"]))
        row = {"id": uuid.uuid4().hex[:10], "file": fname, "prompt": prompt, "model": model, "shape": shape,
               "quality": quality, "size": d.get("size") or SHAPES[shape], "refs": refs, "ts": int(time.time()),
               "secs": round(time.time() - t0, 1), "via": via, **({"editOf": edit_of} if edit_of else {}),
               **({"notes": notes[:20]} if notes else {}), **({"masked": True} if mask_path else {})}
        rows.append(row)
        made.append(row)
    _save_index(rows)
    from store import append_log
    append_log({"ts": int(time.time()), "event": "image", "model": model, "n": len(made), "refs": len(refs), "via": via,
                **({"edit": True} if edit_of else {})})
    return {"images": made, "errors": errors, "secs": round(time.time() - t0, 1)}


# ---------------- after generating ----------------
def get(image_id: str) -> dict:
    for r in gallery():
        if r["id"] == image_id:
            return r
    raise ValueError("Image not found.")


def path_of(image_id: str) -> Path:
    return img_dir() / get(image_id)["file"]


def delete(image_id: str) -> None:
    rows = gallery()
    keep = [r for r in rows if r["id"] != image_id]
    if len(keep) == len(rows):
        raise ValueError("Image not found.")
    gone = next(r for r in rows if r["id"] == image_id)
    trash = state_dir() / "trash" / "images"
    trash.mkdir(parents=True, exist_ok=True)
    shutil.move(str(img_dir() / gone["file"]), str(trash / gone["file"]))   # recoverable
    _save_index(keep)


def keep_outside(image_id: str, data_b64: str) -> dict:
    """Store the dashboard's composite of a masked edit: the edited pixels
    inside the user's marks pasted onto the untouched original. OpenAI's
    own output is kept next to it as <name>-openai.png."""
    rows = gallery()
    row = next((r for r in rows if r["id"] == image_id), None)
    if not row or not row.get("masked"):
        raise ValueError("Only an edit made with marks can be finished this way.")
    raw = base64.b64decode(data_b64.split(",", 1)[-1], validate=False)
    if not raw.startswith(b"\x89PNG") or len(raw) > 40 * 1024 * 1024:
        raise ValueError("The finished picture couldn't be read.")
    f = img_dir() / row["file"]
    keep = f.with_name(f.stem + "-openai" + f.suffix)
    if not keep.exists():
        shutil.copy2(f, keep)
    out = f.with_suffix(".png")
    out.write_bytes(raw)
    if out != f:
        f.unlink(missing_ok=True)
    row.update(file=out.name, kept="outside", v=int(time.time()))
    _save_index(rows)
    return row


def _next_name(folder: Path, ext: str) -> str:
    nums = [int(m.group(1)) for f in folder.iterdir() if (m := re.match(r"^(\d+)", f.name))]
    n = max(nums, default=0) + 1
    return f"{n:02d}-ai{ext}"


def _native(*args: str) -> dict:
    """The computer's own file manager dialog (lib/picker.py); blocks until closed."""
    import subprocess
    import sys
    try:
        r = subprocess.run([sys.executable, str(Path(__file__).with_name("picker.py")), *args],
                           capture_output=True, text=True, timeout=900)
        return json.loads((r.stdout or "").strip().splitlines()[-1])
    except Exception as e:
        return {"ok": False, "error": str(e)[:200]}


def save_as(image_id: str) -> dict:
    """Save a copy anywhere: the file manager's own "Save as" window."""
    src = path_of(image_id)
    got = _native(str(Path.home() / "Pictures" if (Path.home() / "Pictures").is_dir() else Path.home()),
                  "--save", src.name, "Save image as")
    if not got.get("ok"):
        raise ValueError("no-native-picker" if got.get("error") == "no-native-picker" else got.get("error") or "The save window failed.")
    if not got.get("files"):
        return {"cancelled": True}
    dest = Path(got["files"][0]).expanduser()
    if dest.suffix.lower() not in IMG_EXT:
        dest = dest.with_name(dest.name + src.suffix)
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dest)
    return {"path": str(dest)}


def copy_to(image_id: str, folder: str = "", pick: bool = False) -> dict:
    """Copy an image into a post folder. With no folder, the current post's
    folder; if that post is still a draft its media list is refreshed. With
    pick, the user chooses the folder in the file manager (any folder)."""
    import media
    import plan as plans
    src = path_of(image_id)
    p = plans.load()
    if pick:
        got = _native(str(Path(p["folder"]).resolve().parent if p else workspace()), "--folder", "Save the image into which folder?")
        if not got.get("ok"):
            raise ValueError("no-native-picker" if got.get("error") == "no-native-picker" else got.get("error") or "The folder window failed.")
        if not got.get("folders"):
            return {"cancelled": True}
        d = Path(got["folders"][0]).resolve()
    elif folder:
        root = workspace()
        d = (Path(folder) if Path(folder).is_absolute() else root / folder).resolve()
        if root not in d.parents:
            raise ValueError("Pick a folder inside this workspace.")
        d.mkdir(parents=True, exist_ok=True)
    else:
        if not p:
            raise ValueError("There's no current post. Type a folder to save into.")
        d = Path(p["folder"]).resolve()
    dest = d / _next_name(d, src.suffix)
    shutil.copy2(src, dest)
    root = workspace()
    out = {"file": dest.name, "folder": rel(d) if root in d.parents or d == root else str(d), "addedToPost": False}
    if p and Path(p["folder"]).resolve() == d and plans.editable(p) and not p.get("postId"):
        from checks import post_type
        p["media"] = media.scan_folder(d)["media"]
        p["type"] = post_type(p["media"])
        if p.get("status") == "awaiting_approval":
            p["status"] = "draft"                  # re-confirm with the new image
        plans.recheck(p)
        plans.save(p, via="dashboard")
        out["addedToPost"] = True
    return out


def suggest_prompt(text: str, note: str = "") -> dict:
    """Claude's answer to "Help me write the prompt": shown in the image window."""
    if not (text or "").strip():
        raise ValueError("Pass --prompt with the suggested prompt.")
    s = {"text": text.strip()[:8000], "note": (note or "").strip()[:500], "ts": int(time.time())}
    write_json(img_dir() / "suggested.json", s)
    return {"ok": True, **s}


def state() -> dict:
    import plan as plans
    p = plans.load()
    post_media = []
    if p:
        for m in p.get("media", []):
            f = Path(p["folder"]) / m["file"]
            if f.suffix.lower() in IMG_EXT and f.exists():
                post_media.append({"path": rel(f), "file": m["file"], "plan": p["id"]})
    try:
        refresh_models()                          # stale list → re-read it in the background
    except Exception:
        pass
    return {"hasKey": has_key(), "settings": settings(), "models": models(),
            "claude": claude_state(), "claudeShapes": {k: list(v) for k, v in CLAUDE_SIZES.items()},
            "shapes": list(SHAPES), "qualities": list(QUALITY), "maxRefs": MAX_REFS, "maxN": MAX_N,
            "gallery": list(reversed(gallery()))[:60],
            "suggested": read_json(img_dir() / "suggested.json"),
            "post": {"id": p["id"], "folder": rel(Path(p["folder"])) if p else None, "media": post_media,
                     "editable": bool(plans.editable(p) and not p.get("postId"))} if p else None}


# ---------------- Claude designs it (HTML/SVG → PNG) ----------------
# Claude can't paint photos the way gpt-image does. It designs in code:
# typography, layouts, carousel slides, charts, diagrams, quote cards. The
# dashboard asks (a `claude_image` request); Claude writes one HTML file per
# design and runs `bps.py image claude --html ...`; the page is rendered with
# the same headless browser as Reel covers, at the post's real pixel size.
# Free: no image credit is used. The HTML is kept so it can be changed later.
CLAUDE_SIZES = {"square": (1080, 1080), "tall": (1080, 1350), "wide": (1920, 1080), "story": (1080, 1920)}
CLAUDE_MODEL = "claude-design"


def _claude_path() -> Path:
    return img_dir() / "claude.json"


def claude_state() -> dict | None:
    """The open request (if any) and when Claude last answered."""
    s = read_json(_claude_path(), None)
    if s and s.get("status") == "asked" and time.time() - s.get("ts", 0) > 3600:
        s["status"] = "stale"
    return s


def ask_claude(prompt: str, shape: str = "tall", n: int = 1, refs: list[str] | None = None, edit_of: str = "") -> dict:
    """Queue "Claude, design this" for the listening loop."""
    import hitl
    import jobs
    prompt = (prompt or "").strip()
    if not prompt:
        raise ValueError("Describe the image you want.")
    shape = shape if shape in CLAUDE_SIZES else "tall"
    n = max(1, min(MAX_N, int(n or 1)))
    refs = [rel(ref_path(r)) for r in (refs or [])][:MAX_REFS]
    src = None
    if edit_of:
        row = get(edit_of)
        if not row.get("html") or not (workspace() / row["html"]).exists():
            raise ValueError("Only a Claude design can be changed this way.")
        src = row
        shape = row.get("shape") or shape
    w, h = CLAUDE_SIZES[shape]
    jid = jobs.start("image", ("Claude is changing a design" if src else f"Claude is designing {n} image{'s' if n > 1 else ''}"),
                     estimate=90 * n, step="Waiting for Claude Code…")
    action = {"type": "claude_image", "prompt": prompt[:4000], "shape": shape, "width": w, "height": h, "n": n,
              "refs": refs, "job": jid, "template": "templates/claude-image.html"}
    if src:
        action.update(editOf=src["id"], html=src["html"], file=rel(img_dir() / src["file"]))
    note = hitl.add_note(("Change this Claude design: " if src else f"Design {n} image{'s' if n > 1 else ''} ({shape} {w}x{h}): ") + prompt[:300], action)
    write_json(_claude_path(), {"status": "asked", "ts": int(time.time()), "noteId": note["id"], "job": jid, "n": n,
                                "shape": shape, "prompt": prompt[:4000], **({"editOf": src["id"]} if src else {})})
    return {"queued": note["id"], "job": jid}


def claude_render(html_files: list[str], prompt: str = "", shape: str = "", note: str = "") -> dict:
    """Claude's answer: render each HTML file to a PNG in the gallery."""
    import cover
    import jobs
    st = claude_state() or {}
    shape = shape or st.get("shape") or "tall"
    if shape not in CLAUDE_SIZES:
        raise ValueError("Shape must be square, tall, wide or story.")
    if not html_files:
        raise ValueError("Pass --html with at least one design file.")
    w, h = CLAUDE_SIZES[shape]
    jid = st.get("job") if st.get("status") == "asked" else None
    t0 = time.time()
    keep = img_dir() / "claude"
    keep.mkdir(parents=True, exist_ok=True)
    stamp = time.strftime("%Y%m%d-%H%M%S")
    prompt = (prompt or st.get("prompt") or "").strip()
    slug = re.sub(r"[^a-z0-9]+", "-", prompt.lower())[:30].strip("-") or "design"
    rows, made, errors = gallery(), [], []
    for i, f in enumerate(html_files):
        src = Path(f).expanduser()
        if not src.is_file() or src.suffix.lower() not in (".html", ".htm"):
            errors.append(f"Not an HTML file: {f}")
            continue
        jobs.progress(jid, step=f"Rendering design {i + 1} of {len(html_files)}")
        name = f"{stamp}-claude-{slug}-{i + 1}"
        html_keep = keep / (name + ".html")
        if src.resolve() != html_keep.resolve():
            shutil.copy2(src, html_keep)
        out = img_dir() / (name + ".png")
        try:
            cover.render_png(html_keep, out, w, h)
        except RuntimeError as e:
            errors.append(str(e))
            continue
        row = {"id": uuid.uuid4().hex[:10], "file": out.name, "prompt": prompt, "model": CLAUDE_MODEL, "engine": "claude",
               "shape": shape, "quality": "design", "size": f"{w}x{h}", "refs": [], "ts": int(time.time()),
               "secs": round(time.time() - t0, 1), "via": "claude", "html": rel(html_keep),
               **({"note": note.strip()[:500]} if note else {}), **({"editOf": st["editOf"]} if st.get("editOf") else {})}
        rows.append(row)
        made.append(row)
    _save_index(rows)
    if jid:
        if made:
            jobs.finish(jid, step=f"{len(made)} Claude design{'s' if len(made) > 1 else ''} ready")
        else:
            jobs.finish(jid, ok=False, error=errors[0] if errors else "Nothing was rendered.")
    write_json(_claude_path(), {**st, "status": "ready" if made else "failed", "answered": int(time.time()),
                                "images": [r["id"] for r in made], "note": (note or "").strip()[:500],
                                "errors": errors})
    from store import append_log
    append_log({"ts": int(time.time()), "event": "image", "model": CLAUDE_MODEL, "n": len(made), "via": "claude"})
    return {"images": made, "errors": errors}
