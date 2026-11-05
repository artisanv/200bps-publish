"""Recycle your best posts.

Zernio re-posts a published post every N weeks or months (its own `recycling`
setting), rotating through new versions of the caption (`contentVariations`,
2-20, used in turn). We pick the candidates from the user's own results
(follows, then saves + shares, then reach; never invented numbers), Claude
writes new hooks on request, and nothing starts without a typed "go".

Zernio limits: up to 10 posts recycling per account; TikTok (and YouTube) are
never recycled. Published posts accept only this recycling change.
"""
from __future__ import annotations

import time

import checks
import hitl
from store import append_log, read_json, state_dir, write_json
from zernio import Zernio

MAX_ACTIVE = 10
MAX_VARIATIONS = 20
SKIP = ("tiktok", "youtube")
FREQ = ("week", "month")


def _path():
    return state_dir() / "recycle.json"


def _db() -> dict:
    return read_json(_path()) or {"drafts": {}, "state": {}}


def _save(db: dict) -> None:
    write_json(_path(), db)


def _cache() -> dict:
    return read_json(state_dir() / "cache.json") or {}


def _score(m: dict) -> tuple:
    return ((m.get("follows") or 0), (m.get("saves") or 0) + (m.get("shares") or 0), (m.get("reach") or 0))


def best(n: int = 8) -> dict:
    """The user's best published posts that Zernio can recycle, best first."""
    db = _db()
    rows: dict[str, dict] = {}
    for p in _cache().get("posts") or []:
        zid = p.get("zid")
        if not zid or p.get("platform") in SKIP:
            continue
        r = rows.setdefault(zid, {"postId": zid, "caption": p.get("caption") or "", "platforms": [], "urls": {},
                                  "publishedAt": p.get("publishedAt"), "thumb": p.get("thumb"),
                                  "metrics": {k: 0 for k in ("follows", "saves", "shares", "reach", "likes", "comments")}})
        if p.get("platform") not in r["platforms"]:
            r["platforms"].append(p.get("platform"))
        if p.get("url"):
            r["urls"][p.get("platform")] = p["url"]
        for k in r["metrics"]:
            r["metrics"][k] += (p.get("metrics") or {}).get(k) or 0
    ranked = sorted(rows.values(), key=lambda r: _score(r["metrics"]), reverse=True)
    top = [r for r in ranked if any(_score(r["metrics"]))][:n]
    for r in top:
        r["state"] = db["state"].get(r["postId"])
        r["draft"] = db["drafts"].get(r["postId"])
    active = [k for k, s in db["state"].items() if (s or {}).get("enabled")]
    return {"posts": top, "active": active, "max": MAX_ACTIVE,
            "basis": "results" if top else "none",
            "note": "" if top else "No published post has results yet. Recycling needs at least one post with follows, saves, shares or reach."}


def _read(z: Zernio, post_id: str) -> dict:
    p = z.post(post_id)
    return p.get("post", p)


def state(post_id: str) -> dict:
    """Read the post's recycling from Zernio and remember it."""
    p = _read(Zernio(), post_id)
    rec = p.get("recycling") or {}
    db = _db()
    db["state"][post_id] = {**rec, "status": p.get("status"), "checked": int(time.time())}
    _save(db)
    return {"postId": post_id, "status": p.get("status"), "recycling": rec, "content": p.get("content") or "",
            "platforms": [x.get("platform") for x in p.get("platforms") or []]}


def save_variations(post_id: str, variations: list[str], note: str = "", via: str = "dashboard") -> dict:
    """Store new caption versions (Claude's or the user's) for this post; nothing goes to Zernio."""
    vs = [str(v).strip() for v in variations if str(v).strip()][:MAX_VARIATIONS]
    db = _db()
    db["drafts"][post_id] = {"variations": vs, "note": note[:300], "via": via, "ts": int(time.time())}
    _save(db)
    return db["drafts"][post_id]


def ask_hooks(post_id: str, topic: str = "") -> dict:
    """Ask Claude (through the dashboard's request queue) for new hooks."""
    post = next((r for r in best(50)["posts"] if r["postId"] == post_id), None)
    if not post:
        raise ValueError("That post isn't in your best posts list.")
    m = post["metrics"]
    n = hitl.add_note(
        f"Write 3-5 new versions of my post {post_id} for recycling: same message, a fresh hook in the first line, "
        f"my voice and language. Then save them with: bps.py recycle hooks --post {post_id} --file <json list>.",
        {"type": "recycle_hooks", "postId": post_id, "caption": post["caption"][:3000], "platforms": post["platforms"],
         "metrics": m, "topic": topic[:300]})
    return {"note": n["id"]}


def _limits(platforms: list[str]) -> int:
    caps = [checks.RULES[p]["caption_max"] for p in platforms if p in checks.RULES]
    return min(caps) if caps else 2200


def validate(post_id: str, gap: int, freq: str, times: int | None, variations: list[str], platforms: list[str]) -> list[str]:
    errs = []
    if freq not in FREQ:
        errs.append("Repeat every week(s) or month(s).")
    if not isinstance(gap, int) or not 1 <= gap <= 12:
        errs.append("The gap is 1 to 12.")
    if times is not None and not 1 <= times <= 52:
        errs.append("Stop after 1 to 52 reposts.")
    vs = [v for v in variations if v.strip()]
    if len(vs) == 1:
        errs.append("Add at least 2 new versions, or none (then the same caption is reposted).")
    if len(vs) > MAX_VARIATIONS:
        errs.append(f"Up to {MAX_VARIATIONS} versions.")
    cap = _limits([p for p in platforms if p not in SKIP])
    for i, v in enumerate(vs, 1):
        if len(v) > cap:
            errs.append(f"Version {i} is {len(v)} characters; the limit on this post's networks is {cap}.")
    return errs


def enable(post_id: str, gap: int, freq: str, times: int | None, variations: list[str], confirm: str, via: str = "dashboard",
           start: str = "") -> dict:
    """Start recycling a published post (typed go)."""
    if (confirm or "").strip().lower() != "go":
        raise PermissionError("Type go to start recycling.")
    z = Zernio()
    p = _read(z, post_id)
    if p.get("status") != "published":
        raise ValueError("Only published posts can be recycled. Schedule this one first.")
    plats = [x.get("platform") for x in p.get("platforms") or []]
    if all(x in SKIP for x in plats):
        raise ValueError("Zernio doesn't recycle TikTok posts.")
    vs = [str(v).strip() for v in variations if str(v).strip()]
    errs = validate(post_id, gap, freq, times, vs, plats)
    if errs:
        raise ValueError(" ".join(errs))
    db = _db()
    active = [k for k, s in db["state"].items() if (s or {}).get("enabled") and k != post_id]
    if len(active) >= MAX_ACTIVE:
        raise ValueError(f"Zernio allows {MAX_ACTIVE} posts recycling at once. Stop one first.")
    rec = {"enabled": True, "gap": gap, "gapFreq": freq, "expireCount": times, "contentVariations": vs}
    # start from today (or the day the user picked), never from the post's old date: no surprise catch-up reposts
    from datetime import datetime, timezone
    try:
        sd = datetime.fromisoformat(start.replace("Z", "+00:00")) if start else datetime.now(timezone.utc)
    except ValueError:
        raise ValueError("Pick a valid first repost date.") from None
    if sd.tzinfo is None:
        sd = sd.replace(tzinfo=timezone.utc)
    if sd < datetime.now(timezone.utc).replace(second=0, microsecond=0):
        sd = datetime.now(timezone.utc)
    rec["startDate"] = sd.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    z.update_post(post_id, {"recycling": rec})
    back = state(post_id)                       # what Zernio really has now
    append_log({"event": "recycle_on", "postId": post_id, "gap": gap, "freq": freq, "times": times,
                "variations": len(vs), "via": via})
    ok = bool(back["recycling"].get("enabled"))
    return {**back, "verified": ok, "skipped": [x for x in plats if x in SKIP]}


def disable(post_id: str, via: str = "dashboard") -> dict:
    """Stop recycling (copies already made stay as they are)."""
    z = Zernio()
    z.update_post(post_id, {"recycling": {"enabled": False}})
    back = state(post_id)
    append_log({"event": "recycle_off", "postId": post_id, "via": via})
    return {**back, "verified": not back["recycling"].get("enabled")}
