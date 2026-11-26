"""Connected accounts: keep config.accounts in step with what Zernio has.

* If a supported platform has exactly one connected account and none is saved
  in config, it is saved automatically (and reported, so the agent tells the user).
* Platforms without a connected account are never put into a plan.
"""
from __future__ import annotations

import re
import time

from store import config, read_json, save_config, state_dir, write_json

SUPPORTED = ("instagram", "linkedin", "tiktok", "snapchat", "facebook")
# Networks the dashboard can connect today, and ones shown as "coming soon".
# To add a network later: move it into CONNECTABLE and into plan.PLATFORMS.
CONNECTABLE = ("instagram", "linkedin", "tiktok", "snapchat", "facebook")
COMING_SOON = ("threads", "twitter", "youtube", "pinterest", "bluesky")


def profile_id(z) -> str | None:
    """The Zernio profile to connect accounts into (config, an account's profile, or the first profile)."""
    cfg = config()
    if cfg.get("profile_id"):
        return cfg["profile_id"]
    for a in (live(z) or []):
        pid = a.get("profileId")
        pid = pid.get("_id") if isinstance(pid, dict) else pid
        if pid:
            return pid
    try:
        ps = z.profiles()
        ps = ps.get("profiles", ps) if isinstance(ps, dict) else ps
        return (ps[0] or {}).get("_id") if ps else None
    except Exception:
        return None


# Zernio's own account limit (a 402 "Add a payment method to connect more than N accounts").
# It is Zernio's rule, not this skill's: remembered so the dashboard can say so before the next try.
LIMIT_FILE = "account_limit.json"


def limit_hit(err) -> dict | None:
    """If a Zernio error is its account-limit answer (402), remember it and return {max, at, zernio}."""
    if getattr(err, "status", None) != 402:
        return None
    body = getattr(err, "body", None)
    msg = str((body.get("error") or body.get("message") or "") if isinstance(body, dict) else (body or err))
    m = re.search(r"more than (\d+) (?:social )?accounts?", msg, re.I)
    rec = {"max": int(m.group(1)) if m else None, "at": int(time.time()), "zernio": msg[:300]}
    write_json(state_dir() / LIMIT_FILE, rec)
    return rec


def known_limit() -> dict | None:
    return read_json(state_dir() / LIMIT_FILE) or None


def limit_check(n_accounts: int) -> None:
    """More accounts than the remembered limit (a payment method was added): forget it."""
    rec = known_limit()
    if rec and rec.get("max") is not None and n_accounts > rec["max"]:
        clear_limit()


def clear_limit() -> None:
    (state_dir() / LIMIT_FILE).unlink(missing_ok=True)


def limit_text(rec: dict | None) -> str:
    n = (rec or {}).get("max")
    return (f"Zernio allows {n} connected accounts" if n else "Zernio's account limit is reached") + \
        " until a payment method is added to your Zernio account (zernio.com). This is Zernio's rule, not this skill's."


def enable_platform(platform: str) -> None:
    """After connecting, include the platform in posts (config.platforms)."""
    cfg = config()
    plats = cfg.get("platforms") or list(SUPPORTED)
    if platform in SUPPORTED and platform not in plats:
        plats.append(platform)
        cfg["platforms"] = plats
        save_config(cfg)


def live(z) -> list[dict] | None:
    try:
        return z.accounts()
    except Exception:
        return None


def reconcile(accts: list[dict] | None) -> dict:
    """Return {"auto": [...], "missing": [...], "connected": [...]} and save any auto-picks."""
    cfg = config()
    saved = cfg.setdefault("accounts", {})
    auto, notes = [], []
    if accts is not None:
        by = {}
        for a in accts:
            if a.get("platform") in SUPPORTED and a.get("isActive", True) is not False:
                by.setdefault(a["platform"], []).append(a)
        for p, lst in by.items():
            cur = (saved.get(p) or {}).get("id")
            if cur and not any(a.get("_id") == cur for a in lst):
                notes.append(f"Saved {p} account is no longer connected in Zernio.")
                cur = None
                saved.pop(p, None)
            if not cur and len(lst) == 1:
                saved[p] = {"id": lst[0]["_id"], "username": lst[0].get("username")}
                auto.append(f"{p} @{lst[0].get('username')}")
                if not cfg.get("profile_id"):
                    pid = lst[0].get("profileId")
                    cfg["profile_id"] = pid.get("_id") if isinstance(pid, dict) else pid
        live_platforms = set(by)
        for p in list(saved):
            if p not in live_platforms:
                saved.pop(p, None)
        if auto or notes or set(saved) != set(cfg.get("accounts", {})):
            pass
        save_config(cfg)
    connected = [p for p in SUPPORTED if (saved.get(p) or {}).get("id")]
    wanted = cfg.get("platforms") or list(SUPPORTED)
    missing = [p for p in wanted if p not in connected]
    return {"auto": auto, "connected": connected, "missing": missing, "notes": notes}
