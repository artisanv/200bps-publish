"""Background jobs: what is working right now, and how far along it is.

Long tasks (making images, publishing, batch scheduling, uploads, key tests,
refreshing from Zernio) register a job here and report progress. Jobs are kept
in .bps/jobs.json so work started from the chat (`bps.py image gen`, `batch
run`, `publish`) shows in the dashboard too.

    jid = jobs.start("image", "Making 2 images", total=2)
    jobs.progress(jid, done=1, step="Image 1 of 2 ready")
    jobs.finish(jid)                       # or finish(jid, ok=False, error="...")

`estimate=` gives a job without real steps a moving bar: it fills against the
expected seconds and stops at 95% until the work ends.

Finished jobs stay visible for a minute. A running job whose process is gone,
or that hasn't reported for 10 minutes, is shown as stopped.
"""
from __future__ import annotations

import os
import threading
import time
import uuid
from contextlib import contextmanager

from store import read_json, state_dir, write_json

KEEP_DONE = 60          # seconds a finished job stays in the list
STALE = 600             # no update for this long → stopped
_LOCK = threading.RLock()
_LOCAL = threading.local()


def _path():
    return state_dir() / "jobs.json"


def _load() -> dict:
    return read_json(_path(), {}) or {}


def _save(rows: dict) -> None:
    write_json(_path(), rows)


def _alive(pid: int) -> bool:
    try:
        os.kill(pid, 0)
        return True
    except ProcessLookupError:
        return False
    except (PermissionError, OSError):
        return True


def _update(jid: str, **fields) -> dict | None:
    with _LOCK:
        rows = _load()
        j = rows.get(jid)
        if not j:
            return None
        j.update(fields)
        j["updated"] = time.time()
        _save(rows)
        return j


def start(kind: str, label: str, total: int | None = None, estimate: float | None = None, step: str = "") -> str:
    jid = uuid.uuid4().hex[:8]
    now = time.time()
    with _LOCK:
        rows = _load()
        rows = {k: v for k, v in rows.items() if not _gone(v, now)}
        rows[jid] = {"id": jid, "kind": kind, "label": label[:120], "state": "running", "step": step[:160],
                     "total": total, "done": 0, "pct": 0, "estimate": estimate, "started": now, "updated": now,
                     "pid": os.getpid()}
        _save(rows)
    return jid


def progress(jid: str | None, done: int | None = None, pct: float | None = None, step: str | None = None,
             total: int | None = None) -> None:
    if not jid:
        return
    f: dict = {}
    if total is not None:
        f["total"] = total
    if done is not None:
        f["done"] = done
    if pct is not None:
        f["pct"] = max(0, min(100, round(pct)))
    if step is not None:
        f["step"] = step[:160]
    _update(jid, **f)


def finish(jid: str | None, ok: bool = True, error: str = "", step: str | None = None) -> None:
    if not jid:
        return
    f = {"state": "done" if ok else "failed", "finished": time.time(), "error": (error or "")[:300]}
    if ok:
        f["pct"] = 100
    if step is not None:
        f["step"] = step[:160]
    _update(jid, **f)


@contextmanager
def job(kind: str, label: str, total: int | None = None, estimate: float | None = None, step: str = ""):
    """`with jobs.job(...) as jid:` — finishes (or fails) the job automatically.
    Code deeper down can report with jobs.here(...)."""
    jid = start(kind, label, total, estimate, step)
    prev = getattr(_LOCAL, "jid", None)
    _LOCAL.jid = jid
    try:
        yield jid
    except BaseException as e:
        finish(jid, ok=False, error=str(e) or type(e).__name__)
        raise
    else:
        j = _load().get(jid) or {}
        if j.get("state") == "running":
            finish(jid)
    finally:
        _LOCAL.jid = prev


def here(**kw) -> None:
    """Report progress for the job running on this thread, if any."""
    progress(getattr(_LOCAL, "jid", None), **kw)


def current() -> str | None:
    return getattr(_LOCAL, "jid", None)


# ---------------- reading ----------------
def _gone(j: dict, now: float) -> bool:
    return j.get("state") != "running" and now - (j.get("finished") or j.get("updated") or 0) > KEEP_DONE


def _view(j: dict, now: float) -> dict:
    j = dict(j)
    if j["state"] == "running" and (now - j.get("updated", 0) > STALE or not _alive(int(j.get("pid") or 0))):
        j["state"], j["error"] = "lost", "Stopped before it finished."
    pct = j.get("pct") or 0
    if j["state"] == "running":
        if j.get("total"):
            pct = max(pct, 100 * (j.get("done") or 0) / j["total"])
        if j.get("estimate"):
            pct = max(pct, min(95, 100 * (now - j["started"]) / max(1, j["estimate"])))
        pct = min(pct, 99)
    j["pct"] = round(pct)
    j["secs"] = round((j.get("finished") or now) - j["started"], 1)
    j.pop("pid", None)
    return j


def _claude() -> list[dict]:
    """Dashboard requests Claude hasn't finished yet: shown as 'Claude is working'."""
    import hitl
    labels = {"new_post": "Writing a caption", "image_prompt": "Writing an image prompt", "fix_request": "Writing a fix",
              "ideas_request": "Thinking of ideas", "report": "Preparing a report", "idea": "Drafting a post",
              "assign": "Preparing a post", "reschedule": "Moving a post"}
    out, now = [], time.time()
    listening = hitl.listening()
    for n in hitl.notes(unread_only=True):
        a = n.get("action") or {}
        typ = a.get("type") or "note"
        label = labels.get(typ, "Reading your note")
        out.append({"id": "n-" + n["id"], "kind": "claude", "label": "Claude: " + label,
                    "step": ("Working on it…" if listening else "Waiting for Claude to start listening"),
                    "state": "running", "pct": None, "indeterminate": True, "started": n["ts"],
                    "secs": round(now - n["ts"]), "text": (n.get("text") or "")[:160]})
    return out


def active() -> list[dict]:
    """Running jobs first (newest first), then ones finished in the last minute."""
    now = time.time()
    with _LOCK:
        rows = _load()
        keep = {k: v for k, v in rows.items() if not _gone(v, now)}
        if len(keep) != len(rows):
            _save(keep)
    views = [_view(j, now) for j in keep.values()]
    try:
        views += _claude()
    except Exception:
        pass
    views.sort(key=lambda j: (j["state"] != "running", -(j.get("started") or 0)))
    return views


def summary() -> dict:
    items = active()
    run = [j for j in items if j["state"] == "running"]
    known = [j["pct"] for j in run if j.get("pct") is not None]
    return {"running": len(run), "pct": round(sum(known) / len(known)) if known else None, "items": items}
