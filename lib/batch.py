"""Batch scheduling: pick several post folders, give each a time, approve once.

Flow (dashboard or chat):
  1. scan()            every post folder in the workspace (a folder with a caption)
  2. prepare(folders)  analyse each into its own plan, without changing the current post
  3. suggest(...)      a time for each post: the weekday's best slot from the user's
                       own data, else a fixed hour; skips days that already have a post
  4. run(items, "go")  the user typed go once for exactly this list. Every post is
                       created in Zernio as SCHEDULED (never "publish now"), using the
                       same checks and publish path as a single post.

Nothing here publishes without the typed "go", and every time must be in the future.
"""
from __future__ import annotations

import threading
import time
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

import media
import plan as plans
from store import append_log, config, read_json, state_dir, workspace

SKIP_DIRS = {".bps", ".claude", ".git", "node_modules", "__pycache__", "dist", ".venv", "venv"}
MAX_DEPTH = 4
MAX_BATCH = 30
MIN_LEAD = timedelta(minutes=15)


def _tz() -> ZoneInfo:
    return ZoneInfo(config().get("timezone", "UTC"))


def _rel(p: Path) -> str:
    try:
        return str(p.resolve().relative_to(workspace()))
    except ValueError:
        return str(p)


# Everything stays inside the workspace (the project folder). A folder the user
# picks outside it is COPIED into the posts folder (my-posts/<name>) and the copy
# is used; the original is only read, never referenced again.
def _roots_file() -> Path:
    return state_dir() / "batch_roots.json"


def roots() -> list[Path]:
    """Older versions remembered outside folders; only ones inside the workspace still count."""
    return [Path(x) for x in read_json(_roots_file(), []) or [] if Path(x).is_dir() and _inside(Path(x).resolve(), workspace())]


def _inside(p: Path, base: Path) -> bool:
    return p == base or base in p.parents


def resolve_folder(rel: str) -> Path:
    """A folder path from the dashboard: inside the workspace or a folder the
    user picked with Browse…"""
    root = workspace()
    p = (Path(rel) if Path(rel).is_absolute() else root / rel).resolve()
    if not any(_inside(p, b) for b in [root, *roots()]):
        raise ValueError("Pick that folder with Browse… first.")
    if not p.is_dir():
        raise ValueError(f"Folder not found: {rel}")
    return p


def browse_root() -> Path:
    return workspace()


IMPORT_SKIP = {".git", "node_modules", "__pycache__", ".venv", "venv", ".bps", ".claude"}
MAX_IMPORT = 4 * 1024 ** 3                  # 4 GB per imported folder


def import_folder(src: Path) -> Path:
    """Copy a folder from outside the project into the posts folder; returns the copy."""
    import shutil
    src = src.resolve()
    if _inside(src, workspace()):
        return src
    if src == Path(src.anchor) or src == Path.home().resolve():
        raise ValueError("Pick a post folder, not your whole home folder or disk.")
    size = 0
    for f in src.rglob("*"):
        if f.is_file() and not any(x in IMPORT_SKIP or x.startswith(".") for x in f.relative_to(src).parts):
            size += f.stat().st_size
            if size > MAX_IMPORT:
                raise ValueError("That folder is over 4 GB. Pick a smaller post folder.")
    base = workspace() / (config().get("posts_dir") or "my-posts")
    dest, i = base / src.name, 2
    while dest.exists():
        dest, i = base / f"{src.name}-{i}", i + 1
    shutil.copytree(src, dest, ignore=lambda d, names: [n for n in names if n in IMPORT_SKIP or n.startswith(".")])
    append_log({"event": "folder_imported", "from": str(src), "to": _rel(dest)})
    return dest


def fs_list(path: str = "") -> dict:
    """Sub-folders of one folder, for the built-in folder browser (project folder only)."""
    home, ws = browse_root(), workspace()
    p = Path(path).expanduser().resolve() if path else ws
    if not (_inside(p, home) or _inside(p, ws)) or not p.is_dir():
        p = ws
    dirs = []
    try:
        kids = sorted((k for k in p.iterdir() if k.is_dir() and not k.name.startswith(".") and k.name not in SKIP_DIRS), key=lambda x: x.name.lower())
    except OSError:
        kids = []
    for k in kids[:400]:
        try:
            post = _has_caption(k)
        except OSError:
            continue
        dirs.append({"name": k.name, "path": str(k), "post": post})
    parent = p.parent if p != p.parent and (_inside(p.parent, home) or _inside(p.parent, ws)) else None
    return {"path": str(p), "parent": str(parent) if parent else None, "post": _has_caption(p), "dirs": dirs,
            "home": str(home), "workspace": str(ws)}


def add_roots(paths: list[str], native: bool = False) -> list[str]:
    """Remember folders the user chose; returns the post folders found in them
    (a chosen folder can be one post, or hold many)."""
    found = []
    for raw in paths:
        p = Path(raw).expanduser().resolve()
        if not p.is_dir():
            continue
        if not _inside(p, workspace()):
            if not native:
                continue                  # the built-in browser only shows the project folder
            p = import_folder(p)          # copied in: everything stays inside the project
        found += [str(d) for d in _walk(p)]
    from store import write_json
    write_json(_roots_file(), [])         # no outside folders are remembered any more
    return found


def pick() -> dict:
    """The computer's own folder picker (blocks until the user closes it)."""
    import subprocess
    import sys
    import json as _json
    helper = Path(__file__).with_name("picker.py")
    try:
        r = subprocess.run([sys.executable, str(helper), str(workspace())], capture_output=True, text=True, timeout=900)
        out = _json.loads((r.stdout or "").strip().splitlines()[-1])
    except Exception as e:
        return {"ok": False, "error": str(e)[:200]}
    if out.get("ok") and out.get("folders"):
        out["found"] = add_roots(out["folders"], native=True)
    return out


def _has_caption(d: Path) -> bool:
    return any(f.is_file() and f.suffix.lower() in (".txt", ".md") and f.stem.lower().split(".")[0] in media.CAPTION_NAMES
               for f in d.iterdir())


def _plans_by_folder() -> dict[str, dict]:
    out = {}
    for f in (state_dir() / "plans").glob("*.json"):
        p = read_json(f) or {}
        if p.get("folder"):
            out[str(Path(p["folder"]).resolve())] = p
    return out


def _walk(base: Path) -> list[Path]:
    """Post folders at or under base (a post folder is not searched further)."""
    found = []

    def walk(d: Path, depth: int):
        try:
            if _has_caption(d) and d != workspace():
                found.append(d.resolve())
                return
            kids = sorted(d.iterdir(), key=lambda x: x.name.lower())
        except OSError:
            return
        if depth >= MAX_DEPTH:
            return
        for k in kids:
            if k.is_dir() and not k.name.startswith(".") and k.name not in SKIP_DIRS:
                walk(k, depth + 1)

    walk(base.resolve(), 0)
    return found


def scan() -> list[dict]:
    """Every post folder under the workspace, with what it holds and whether
    it was already sent to Zernio."""
    known = _plans_by_folder()
    found, seen = [], set()
    for base in [workspace(), *roots()]:
        for d in _walk(base):
            if d not in seen:
                seen.add(d); found.append(d)
    out = []
    for d in found:
        files = sorted((f for f in d.iterdir() if f.is_file() and not f.name.startswith(".")), key=lambda x: x.name.lower())
        meds = [f for f in files if media.kind(f) and f.stem.lower() not in ("cover", "thumbnail", "thumb")]
        cap_file = next((f for f in files if f.suffix.lower() in (".txt", ".md") and f.stem.lower() in media.CAPTION_NAMES), None)
        caption = cap_file.read_text(encoding="utf-8", errors="ignore").strip() if cap_file else ""
        kinds = [media.kind(f) for f in meds]
        ptype = ("reel" if kinds == ["video"] else "document" if "document" in kinds else
                 "carousel" if len(meds) > 1 else "single" if meds else "text")
        cover = next((f for f in files if f.stem.lower() in ("cover", "thumbnail", "thumb") and media.kind(f) == "image"), None)
        thumb = cover or next((f for f in meds if media.kind(f) == "image"), None)
        video = next((f for f in meds if media.kind(f) == "video"), None)
        pl = known.get(str(d.resolve())) or {}
        out.append({
            "folder": _rel(d), "name": d.name, "outside": not _inside(d, workspace()), "caption": caption[:400], "type": ptype, "count": len(meds),
            "thumb": thumb.name if thumb else None, "video": video.name if video else None,
            "plan": pl.get("id"), "status": pl.get("status") or "new",
            "at": (pl.get("schedule") or {}).get("at"), "postId": (pl.get("result") or {}).get("postId"),
            "modified": int(max([f.stat().st_mtime for f in files] or [d.stat().st_mtime])),
        })
    return out


def folder_file(rel: str, name: str) -> Path:
    """A media file inside a post folder, for dashboard thumbnails."""
    d = resolve_folder(rel)
    f = (d / name).resolve()
    if f.parent != d or not f.is_file() or not media.kind(f):
        raise ValueError("Not a media file in that folder.")
    return f


def prepare(folders: list[str]) -> list[dict]:
    """Analyse each folder into its own plan. The current post is not changed."""
    if not folders:
        raise ValueError("Pick at least one folder.")
    if len(folders) > MAX_BATCH:
        raise ValueError(f"Up to {MAX_BATCH} posts per batch.")
    out = []
    for rel in folders:
        d = resolve_folder(rel)
        row = {"folder": _rel(d), "name": d.name}
        try:
            p = plans.analyze(str(d), make_current=False)
            row.update({"plan": p["id"], "type": p["type"], "platforms": p["platforms"], "status": p["status"],
                        "caption": next(iter(p["captions"].values()), "")[:400],
                        "score": {k: v.get("value") for k, v in p["score"].items()},
                        "blocking": [c["msg"] for c in p["blocking"]],
                        "warnings": [c["msg"] for c in p["checks"] if c["status"] == "warn"][:4],
                        "media": [{"file": m["file"], "kind": m["kind"]} for m in p["media"][:1]],
                        "hasCover": bool(p.get("cover")),
                        "sent": p.get("status") in ("scheduled", "published")})
        except ValueError as e:
            row.update({"error": str(e)})
        out.append(row)
    return out


def _busy_days(tz: ZoneInfo) -> set[str]:
    """Days that already have a scheduled or published post in Zernio."""
    days = set()
    for p in (read_json(state_dir() / "cache.json") or {}).get("zposts") or []:
        when = p.get("scheduledFor") or next((x.get("publishedAt") for x in p.get("platforms") or [] if x.get("publishedAt")), None)
        if when and p.get("status") in ("scheduled", "publishing", "published", "partial"):
            try:
                days.add(datetime.fromisoformat(when.replace("Z", "+00:00")).astimezone(tz).date().isoformat())
            except ValueError:
                pass
    return days


def _best_for_day(bt: dict, weekday: int) -> dict | None:
    """The weekday's best hour from the user's own posts: a peak that beats
    their average, preferring medium/high confidence over one lucky post.
    If the day has none, their strongest overall slot's hour."""
    if bt.get("basis") != "data":
        return None
    day = next((d for d in bt.get("byDay") or [] if d.get("day") == weekday), None)
    peaks = [p for p in (day or {}).get("peaks") or [] if (p.get("lift") or 0) > 0]
    pick = next((p for p in peaks if p.get("confidence") in ("high", "medium")), peaks[0] if peaks else None)
    if pick:
        return {**pick, "scope": "day"}
    top = (bt.get("slots") or [None])[0]
    return {**top, "scope": "overall"} if top else None


def suggest(count: int, start: str = "", every: int = 1, days: list[int] | None = None,
            mode: str = "best", hour: int = 20, minute: int = 0, skip_busy: bool = True) -> list[dict]:
    """`count` future times, one per chosen day. days = weekdays to use
    (0 = Sunday … 6 = Saturday); empty means every `every` days."""
    tz = _tz()
    now = datetime.now(tz)
    bt = (read_json(state_dir() / "cache.json") or {}).get("besttime") or {}
    busy = _busy_days(tz) if skip_busy else set()
    try:
        d = datetime.strptime(start, "%Y-%m-%d").date() if start else now.date()
    except ValueError:
        raise ValueError("Start date must look like 2026-10-12.")
    every = max(1, min(int(every or 1), 14))
    days = sorted({int(x) for x in (days or []) if 0 <= int(x) <= 6})
    out, last, guard = [], None, 0
    while len(out) < count and guard < 800:
        guard += 1
        wd = (d.weekday() + 1) % 7
        ok = (wd in days) if days else (last is None or (d - last).days >= every)
        if ok and d.isoformat() not in busy:
            pk = _best_for_day(bt, wd) if mode == "best" else None
            h, m = (pk["hour"], 0) if pk else (hour, minute)
            when = datetime(d.year, d.month, d.day, h, m, tzinfo=tz)
            if when >= now + MIN_LEAD:
                out.append({"at": when.isoformat(), "basis": ("best" if pk["scope"] == "day" else "overall") if pk else "fixed",
                            "lift": pk.get("lift") if pk else None, "posts": pk.get("posts") if pk else None,
                            "confidence": pk.get("confidence") if pk else None})
                last = d
        d += timedelta(days=1)
    return out


def to_iso(at: str) -> str:
    """Accept '2026-10-12T20:00' (account time zone) or a full ISO time."""
    tz = _tz()
    try:
        dt = datetime.fromisoformat(at.replace("Z", "+00:00"))
    except ValueError:
        raise ValueError(f"Bad time: {at}")
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=tz)
    return dt.astimezone(tz).replace(second=0, microsecond=0).isoformat()


# ---------------------------------------------------------------- run
_JOB: dict = {}
_LOCK = threading.Lock()


def status() -> dict:
    with _LOCK:
        return {k: (list(map(dict, v)) if k == "items" else v) for k, v in _JOB.items()} if _JOB else {"state": "idle"}


def validate(items: list[dict]) -> list[dict]:
    """Check the whole batch before anything is sent: all-or-nothing."""
    import accounts as acct
    from zernio import Zernio
    if not items:
        raise ValueError("Nothing to schedule.")
    if len(items) > MAX_BATCH:
        raise ValueError(f"Up to {MAX_BATCH} posts per batch.")
    tz = _tz()
    now = datetime.now(tz)
    rec = acct.reconcile(acct.live(Zernio()))
    seen, out, problems = set(), [], []
    for it in items:
        pid = str(it.get("plan") or "")
        p = plans.load(pid) if pid else None
        if not p or pid in seen:
            problems.append(f"Unknown or repeated post: {pid or '?'}")
            continue
        seen.add(pid)
        name = Path(p["folder"]).name
        if not plans.editable(p):
            problems.append(f"{name}: already {p.get('status')}")
            continue
        at = to_iso(str(it.get("at") or ""))
        if datetime.fromisoformat(at) < now + MIN_LEAD:
            problems.append(f"{name}: the time has passed (pick at least 15 minutes from now)")
        missing = [x for x in p["platforms"] if x not in rec["connected"]]
        if missing:
            problems.append(f"{name}: not connected in Zernio: {', '.join(missing)}")
        p["schedule"] = {"mode": "at", "at": at, "via": "batch"}
        plans.recheck(p)
        if p["blocking"]:
            problems.append(f"{name}: " + "; ".join(c["msg"] for c in p["blocking"]))
        out.append({"plan": pid, "name": name, "at": at})
    if problems:
        raise ValueError("Fix first: " + " · ".join(problems))
    return out


def run(items: list[dict], typed: str, via: str = "dashboard", wait: bool = False) -> dict:
    """The user typed go once for exactly this list. Each post is created in
    Zernio as scheduled, one at a time; progress is readable with status()."""
    import hitl
    if (typed or "").strip().lower() != "go":
        raise PermissionError("Type go to schedule the batch.")
    with _LOCK:
        if _JOB.get("state") == "running":
            raise ValueError("A batch is already being scheduled.")
    checked = validate(items)
    job_id = f"b{int(time.time())}"
    with _LOCK:
        _JOB.clear()
        _JOB.update({"id": job_id, "state": "running", "started": int(time.time()), "via": via,
                     "items": [{**c, "state": "queued"} for c in checked]})

    import jobs
    jid = jobs.start("batch", f"Scheduling {len(checked)} posts", total=len(checked))

    def work():
        for i, row in enumerate(_JOB["items"]):
            jobs.progress(jid, done=i, step=f"Post {i + 1} of {len(checked)}: {row.get('name') or ''}")
            with _LOCK:
                row["state"] = "sending"
            try:
                p = plans.load(row["plan"])
                p["schedule"] = {"mode": "at", "at": row["at"], "via": "batch"}
                p["status"] = "awaiting_approval"
                plans.recheck(p)
                plans.save(p, via=via, make_current=False)
                p = plans.publish(p, confirm=True, make_current=False)
                res = p.get("result") or {}
                with _LOCK:
                    row.update({"state": "done", "postId": res.get("postId"), "status": p.get("status")})
            except Exception as e:  # one failure doesn't stop the rest; it is reported
                try:
                    p = plans.load(row["plan"])
                    if p and p.get("status") == "awaiting_approval":
                        p["status"] = "draft"
                        plans.save(p, record=False, make_current=False)
                except Exception:
                    pass
                with _LOCK:
                    row.update({"state": "failed", "error": str(e)[:400]})
        with _LOCK:
            _JOB["state"] = "done"
            _JOB["finished"] = int(time.time())
            ok = [r for r in _JOB["items"] if r["state"] == "done"]
            bad = [r for r in _JOB["items"] if r["state"] == "failed"]
        jobs.finish(jid, ok=bool(ok) or not bad, error=f"{len(bad)} failed" if bad else "",
                    step=f"{len(ok)} scheduled" + (f", {len(bad)} failed" if bad else ""))
        (state_dir() / "cache.json").unlink(missing_ok=True)      # Posts tab and calendar show them on next load
        append_log({"event": "batch_schedule", "id": job_id, "ok": [r["postId"] for r in ok], "failed": [r["plan"] for r in bad]})
        lines = [f"- {r['name']}: {r['at']}" for r in ok] + [f"- FAILED {r['name']}: {r.get('error')}" for r in bad]
        hitl.add_note(f"Batch scheduled from the {via}: {len(ok)} scheduled, {len(bad)} failed.\n" + "\n".join(lines),
                      {"type": "batch_scheduled", "id": job_id, "ok": len(ok), "failed": len(bad)})

    if wait:
        work()
    else:
        threading.Thread(target=work, daemon=True).start()
    return status()
