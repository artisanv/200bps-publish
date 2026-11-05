"""Readiness checks. Run before anything else; never prints secrets."""
from __future__ import annotations

import re
import shutil
import sys

from store import config, load_env, workspace
from zernio import Zernio, ZernioError

KEY_RE = re.compile(r"^sk_[0-9a-fA-F]{64}$")


def run(online: bool = True) -> dict:
    out = []

    def add(id_, status, msg, fix=None):
        out.append({"id": id_, "status": status, "msg": msg, "fix": fix})

    v = sys.version_info
    add("python", "pass" if v >= (3, 9) else "fail", f"Python {v.major}.{v.minor}",
        None if v >= (3, 9) else "Install Python 3.9 or newer.")

    add("ffprobe", "pass" if shutil.which("ffprobe") else "warn",
        "ffprobe found (video specs can be verified)." if shutil.which("ffprobe") else "ffprobe not found; video specs can't be verified.",
        None if shutil.which("ffprobe") else "Install ffmpeg (includes ffprobe): https://ffmpeg.org/download.html")

    import cover
    b = cover.browser()
    add("browser", "pass" if b else "warn",
        "Chrome/Chromium found (designed covers available)." if b else "No Chrome/Chromium/Edge found; designed covers are off (frame and photo covers still work).",
        None if b else "Install Google Chrome or Chromium, or set BPS_BROWSER to its path.")

    ws = workspace()
    env_p = ws / ".env"
    env = load_env()
    key = env.get("ZERNIO_API_KEY", "")
    if not env_p.exists() and not key:
        add("env", "fail", "Zernio API key not set.",
            "Open the dashboard and paste your key in the “Connect Zernio” card (Settings → Keys). Get one at zernio.com → Settings → API keys.")
    elif not key:
        add("env", "fail", "Zernio API key not set.", "Paste it in the dashboard: Settings → Keys (or the “Connect Zernio” card).")
    elif not KEY_RE.match(key):
        add("env", "warn", "The Zernio key doesn't look like sk_ + 64 characters.", "Paste it again in the dashboard: Settings → Keys.")
    else:
        add("env", "pass", "Zernio API key present (not shown).")

    if (ws / ".git").exists():
        gi = (ws / ".gitignore").read_text() if (ws / ".gitignore").exists() else ""
        ok = any(l.strip() in (".env", "/.env", "*.env") for l in gi.splitlines())
        add("gitignore", "pass" if ok else "fail",
            ".env is git-ignored." if ok else "This folder is a git repo and .env is NOT ignored.",
            None if ok else "Add .env and .bps/ to .gitignore before committing.")

    cfg = config()
    add("setup", "pass" if cfg.get("accounts") else "warn",
        "Setup complete." if cfg.get("accounts") else "Setup not done yet.",
        None if cfg.get("accounts") else "Run the setup wizard: ask the agent to set up 200bps-publish.")

    if online and key:
        z = Zernio()
        try:
            accts = z.accounts()
            add("zernio", "pass", f"Zernio reachable; {len(accts)} connected account(s).")
            plats = sorted({a.get("platform") for a in accts})
            add("accounts", "pass" if accts else "fail",
                ("Connected: " + ", ".join(plats)) if accts else "No social accounts connected in Zernio.",
                None if accts else "Connect Instagram and LinkedIn at zernio.com, then run this check again.")
            import accounts as _acct
            rec = _acct.reconcile(accts)
            if rec["auto"]:
                add("accounts_auto", "pass", "Saved the only connected account: " + ", ".join(rec["auto"]) + ".")
            if rec["missing"]:
                add("platforms", "warn", "In your settings but not connected in Zernio: " + ", ".join(rec["missing"]) + ". Posts will skip them.",
                    "Connect them from the dashboard (Settings → Accounts → Connect), or remove them from platforms in setup.")
            for n in rec["notes"]:
                add("accounts_note", "warn", n, "Pick the account again in setup.")
            stale = [f"{a.get('platform')} @{a.get('username')}" for a in accts if a.get("needsReconnection") or a.get("isActive") is False]
            if stale:
                add("reconnect", "warn", "Needs reconnection: " + ", ".join(stale), "Reconnect these in Zernio.")
            for name, fn, addon in (
                ("analytics", lambda: z.best_time(), "Analytics"),
                ("inbox", lambda: z.automations(cfg.get("profile_id")), "Inbox"),
            ):
                try:
                    fn()
                    add(name, "pass", f"Zernio {addon} available.")
                except ZernioError as e:
                    if e.status in (402, 403):
                        add(name, "warn", f"Zernio {addon} add-on not active; related features will be hidden.",
                            f"Enable the {addon} add-on in Zernio if you want this.")
                    else:
                        add(name, "warn", f"{addon} check failed: {e}")
        except ZernioError as e:
            add("zernio", "fail", f"Zernio rejected the request: {e.code or e.status}.",
                "Check the API key in .env, or your network connection.")

    ok = all(c["status"] != "fail" for c in out)
    return {"ok": ok, "checks": out}
