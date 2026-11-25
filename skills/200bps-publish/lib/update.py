"""Is there a newer 200bps Publish on GitHub?

Once a day, in the background, the dashboard reads the small RELEASE.json that the repository ships next to the
plugin (a plain GET to GitHub with a generic User-Agent: nothing about the user, their posts or keys is sent) and
compares its `build` with the one this copy came with. A newer build shows a banner with the exact way to update
this install. Settings → Preferences turns the check off (config `updates.check = false`); BPS_UPDATE_URL=off too.
"""
from __future__ import annotations

import json
import os
import re
import threading
import time
import urllib.request

from store import SKILL_DIR, VERSION, config, read_json, save_config, state_dir, write_json

URL = "https://raw.githubusercontent.com/artisanv/200bps-publish/main/skills/200bps-publish/RELEASE.json"
RELEASES = "https://github.com/artisanv/200bps-publish/releases/latest"
DAY = 86400
_RUNNING = [False]
_LOCK = threading.Lock()


def _url() -> str:
    return os.environ.get("BPS_UPDATE_URL", URL)


def _cache() -> dict:
    return read_json(state_dir() / "update.json") or {}


def _save(c: dict) -> None:
    write_json(state_dir() / "update.json", c)


def enabled() -> bool:
    return _url() != "off" and (config().get("updates") or {}).get("check", True) is not False


def local() -> dict:
    """What this copy is: RELEASE.json shipped with it (version + build)."""
    r = read_json(SKILL_DIR / "RELEASE.json") or {}
    return {"version": str(r.get("version") or VERSION), "build": str(r.get("build") or ""), "date": str(r.get("date") or "")}


def fetch() -> dict:
    req = urllib.request.Request(_url(), headers={"User-Agent": "200bps-publish", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=8) as r:
        data = json.loads(r.read(64 * 1024).decode("utf-8"))
    return {k: str(data.get(k) or "")[:300] for k in ("version", "build", "date", "notes", "notes_ar", "release")}


def refresh(force: bool = False) -> dict:
    """Read GitHub now (or when the last check is a day old). Errors are kept, never raised."""
    c = _cache()
    if not force and time.time() - c.get("checked", 0) < DAY:
        return c
    try:
        c.update(remote=fetch(), checked=int(time.time()), error=None)
    except Exception as e:                       # offline, GitHub down, a bad file: try again tomorrow
        c.update(checked=int(time.time()), error=str(e)[:160])
    _save(c)
    return c


def how(path: str | None = None) -> dict:
    """The exact way to update this install, from where the plugin lives."""
    p = (path or SKILL_DIR.resolve().as_posix()).replace("\\", "/")
    m = re.search(r"/\.claude/plugins/cache/([^/]+)/", p)
    if m:
        return {"kind": "plugin", "commands": [f"/plugin marketplace update {m.group(1)}", "/reload-plugins"], "marketplace": m.group(1)}
    if "/.claude/skills/" in p:
        return {"kind": "zip", "url": RELEASES}
    return {"kind": "plugin", "commands": ["/plugin marketplace update", "/reload-plugins"], "marketplace": ""}


def status() -> dict:
    """For the dashboard. Never waits for the network: a stale check runs in the background."""
    if not enabled():
        return {"enabled": False}
    c = _cache()
    if time.time() - c.get("checked", 0) >= DAY:
        with _LOCK:
            if not _RUNNING[0]:
                _RUNNING[0] = True

                def run():
                    try:
                        refresh(force=True)
                    finally:
                        _RUNNING[0] = False
                threading.Thread(target=run, daemon=True).start()
    loc, rem = local(), c.get("remote") or {}
    newer = bool(rem.get("build")) and rem["build"] > (loc.get("build") or "")
    return {"enabled": True, "available": newer and rem.get("build") != c.get("dismissed"), "newer": newer,
            "current": loc, "latest": rem if newer else None, "how": how(), "checked": c.get("checked"), "error": c.get("error")}


def dismiss(build: str) -> dict:
    """"Later": hide the banner for this build; a newer one shows again."""
    c = _cache()
    c["dismissed"] = str(build)[:40]
    _save(c)
    return status()


def set_check(on: bool) -> dict:
    cfg = config()
    cfg.setdefault("updates", {})["check"] = bool(on)
    save_config(cfg)
    return status()
