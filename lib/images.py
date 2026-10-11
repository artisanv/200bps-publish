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


def models() -> dict:
    """Image models this key can use, from the last key test. Short names
    first, dated (pinned) versions after."""
    from providers import last_tests
    t = last_tests().get("OPENAI_API_KEY") or {}
    ids = [m["id"] for m in (t.get("items") or []) if m.get("kind") == "image"]
    source = "key" if ids else "fallback"
    ids = ids or FALLBACK_MODELS
    dated = re.compile(r"-\d{4}-\d{2}-\d{2}$")
    def rank(m):                                  # default first, then newest version, minis after
        v = re.search(r"(\d+(?:\.\d+)?)", m)
        return (m != DEFAULT_MODEL, m.startswith("chatgpt"), -float(v.group(1)) if v else 0, "mini" in m, m)
    main = sorted([m for m in ids if not dated.search(m)], key=rank)
    pinned = sorted([m for m in ids if dated.search(m)], reverse=True)
    return {"main": main, "pinned": pinned, "source": source, "tested": t.get("ts")}


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


def _one(key: str, prompt: str, model: str, size: str, quality: str, refs: list[Path]) -> dict:
    if refs:
        body, ct = _multipart({"model": model, "prompt": prompt, "size": size, "quality": quality},
                              [("image[]", p) for p in refs])
        return _call(API + "/edits", body, ct, key)
    body = json.dumps({"model": model, "prompt": prompt, "size": size, "quality": quality, "n": 1}).encode()
    return _call(API + "/generations", body, "application/json", key)


def generate(prompt: str, refs: list[str] | None = None, model: str = "", shape: str = "", quality: str = "",
             n: int = 0, via: str = "chat") -> dict:
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
    refs = list(dict.fromkeys(refs or []))
    if len(refs) > MAX_REFS:
        raise ValueError(f"Up to {MAX_REFS} reference images.")
    ref_paths = [ref_path(r) for r in refs]
    t0 = time.time()
    import jobs
    from concurrent.futures import as_completed
    expect = {"draft": 15, "standard": 30, "best": 60}.get(quality, 30) + (10 if ref_paths else 0)
    jid = jobs.start("image", f"Making {n} image{'s' if n > 1 else ''}" + (f" from {len(ref_paths)} guide{'s' if len(ref_paths) > 1 else ''}" if ref_paths else ""),
                     total=n if n > 1 else None, estimate=expect, step=f"OpenAI {model} is drawing…")
    with ThreadPoolExecutor(max_workers=n) as ex:      # n images in parallel
        futs = [ex.submit(_one, key, prompt, model, SHAPES[shape], QUALITY[quality], ref_paths) for _ in range(n)]
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
               "secs": round(time.time() - t0, 1), "via": via}
        rows.append(row)
        made.append(row)
    _save_index(rows)
    from store import append_log
    append_log({"ts": int(time.time()), "event": "image", "model": model, "n": len(made), "refs": len(refs), "via": via})
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


def _next_name(folder: Path, ext: str) -> str:
    nums = [int(m.group(1)) for f in folder.iterdir() if (m := re.match(r"^(\d+)", f.name))]
    n = max(nums, default=0) + 1
    return f"{n:02d}-ai{ext}"


def copy_to(image_id: str, folder: str = "") -> dict:
    """Copy an image into a post folder. With no folder, the current post's
    folder; if that post is still a draft its media list is refreshed."""
    import media
    import plan as plans
    src = path_of(image_id)
    p = plans.load()
    if folder:
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
    out = {"file": dest.name, "folder": rel(d), "addedToPost": False}
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
    return {"hasKey": has_key(), "settings": settings(), "models": models(),
            "shapes": list(SHAPES), "qualities": list(QUALITY), "maxRefs": MAX_REFS, "maxN": MAX_N,
            "gallery": list(reversed(gallery()))[:60],
            "suggested": read_json(img_dir() / "suggested.json"),
            "post": {"id": p["id"], "folder": rel(Path(p["folder"])) if p else None, "media": post_media,
                     "editable": bool(plans.editable(p) and not p.get("postId"))} if p else None}
