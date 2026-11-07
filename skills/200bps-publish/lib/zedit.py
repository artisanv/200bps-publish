"""Change a post that is already in Zernio from the dashboard's Plan tab:
move it to another time, or edit its caption.

Both change something that will go public, so each needs its own typed word
(move / edit), exactly like publish needs "go". Published posts can't be
changed in Zernio. After the change the post is read back, so the dashboard
reports what Zernio really has.
"""
from __future__ import annotations

import time
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import hitl
import plan as plans
from store import append_log, config, state_dir
from zernio import Zernio

EDITABLE = ("scheduled", "draft", "failed", "partial", "cancelled")


def _post(z: Zernio, post_id: str) -> dict:
    p = z.post(post_id)
    return p.get("post", p)


def _check(z: Zernio, post_id: str, typed: str, word: str) -> dict:
    if (typed or "").strip().lower() != word:
        raise PermissionError(f'Type {word} to confirm.')
    if not post_id:
        raise ValueError("No post.")
    p = _post(z, post_id)
    if p.get("status") not in EDITABLE:
        raise ValueError(f"This post is {p.get('status')}; Zernio can't change it any more.")
    return p


def _local_plan(post_id: str) -> dict | None:
    for f in (state_dir() / "plans").glob("*.json"):
        p = plans.load(f.stem)
        if p and (p.get("result") or {}).get("postId") == post_id:
            return p
    return None


def move(post_id: str, at_local: str, typed: str) -> dict:
    """at_local is 'YYYY-MM-DDTHH:MM' in the user's timezone."""
    z = Zernio()
    _check(z, post_id, typed, "move")
    tz = ZoneInfo(config().get("timezone", "UTC"))
    try:
        when = datetime.fromisoformat(str(at_local)[:16]).replace(tzinfo=tz)
    except ValueError:
        raise ValueError("Pick a day and a time.") from None
    if when < datetime.now(tz) + timedelta(minutes=15):
        raise ValueError("Pick a time at least 15 minutes from now.")
    at = when.isoformat()
    z.update_post(post_id, {"scheduledFor": at, "timezone": str(tz)})
    back = _post(z, post_id)
    want = when.astimezone(timezone.utc)
    off = [t.get("platform") for t in back.get("platforms") or []
           if t.get("scheduledFor") and abs((datetime.fromisoformat(t["scheduledFor"].replace("Z", "+00:00")) - want).total_seconds()) > 60]
    lp = _local_plan(post_id)
    if lp:
        lp["schedule"] = {"mode": "at", "at": at, "via": "dashboard"}
        plans.save(lp, via="dashboard", make_current=False)
    append_log({"ts": int(time.time()), "event": "reschedule", "postId": post_id, "at": at, "via": "dashboard"})
    (state_dir() / "cache.json").unlink(missing_ok=True)
    hitl.add_note(f"I moved post {post_id} to {at} from the Plan tab. It's already done in Zernio.",
                  {"type": "post_moved", "postId": post_id, "at": at})
    return {"at": back.get("scheduledFor") or at, "status": back.get("status"), "notMoved": off}


def edit_caption(post_id: str, text: str, typed: str) -> dict:
    z = Zernio()
    p = _check(z, post_id, typed, "edit")
    text = (text or "").strip()
    if not text:
        raise ValueError("The caption is empty.")
    targets = p.get("platforms") or []
    body: dict = {"content": text[:5000]}
    if any(t.get("customContent") for t in targets):      # per-network captions: update each one too
        rows = []
        for t in targets:                                  # Zernio replaces the whole list: keep each network's own settings
            acc = t.get("accountId")
            e = {"platform": t["platform"], "accountId": acc.get("_id") if isinstance(acc, dict) else acc, "customContent": text[:5000]}
            if t.get("platformSpecificData"):
                e["platformSpecificData"] = t["platformSpecificData"]       # Trial Reel, cover, first comment, TikTok privacy…
            if t.get("customMedia"):
                e["customMedia"] = [{"type": m.get("type"), "url": m.get("url")} for m in t["customMedia"] if m.get("url")]
            rows.append(e)
        body["platforms"] = rows
    z.update_post(post_id, body)
    back = _post(z, post_id)
    lp = _local_plan(post_id)
    if lp:
        for pl in lp.get("platforms") or []:
            lp["captions"][pl] = text
        plans.save(lp, via="dashboard", make_current=False)
    append_log({"ts": int(time.time()), "event": "caption_edited", "postId": post_id, "via": "dashboard"})
    (state_dir() / "cache.json").unlink(missing_ok=True)
    hitl.add_note(f"I edited the caption of post {post_id} from the Plan tab. It's already saved in Zernio.",
                  {"type": "post_edited", "postId": post_id})
    return {"caption": back.get("content"), "status": back.get("status")}


# ---------------- networks on/off for one post ----------------
# What each network can show (same rule as plan.FITS; LinkedIn shows everything)
FITS = {"instagram": ("reel", "single", "carousel"), "tiktok": ("reel", "single", "carousel"),
        "snapchat": ("reel", "single"), "facebook": ("reel", "single", "carousel", "text")}
NO_UNPUBLISH = {"instagram", "tiktok", "snapchat"}


def _kind(post: dict) -> str:
    kinds = [m.get("type") for m in post.get("mediaItems") or []]
    if not kinds:
        return "text"
    if kinds == ["video"]:
        return "reel"
    if set(kinds) == {"document"}:
        return "document"
    return "single" if len(kinds) == 1 else "carousel"


def _acc_id(a) -> str:
    return a.get("_id") if isinstance(a, dict) else str(a or "")


def set_networks(post_id: str, wanted: list[dict], typed: str) -> dict:
    """Turn networks (and accounts) on or off for a post that isn't published
    yet. `wanted` is the full list to keep: [{platform, accountId}]. Entries
    already on keep their own caption, media and settings; a new one uses the
    post's media. Needs the typed word "edit"; the result is read back."""
    z = Zernio()
    p = _check(z, post_id, typed, "edit")
    want = {(str(w.get("platform")), str(w.get("accountId"))) for w in wanted or [] if w.get("platform") and w.get("accountId")}
    if not want:
        raise ValueError("Keep at least one network on. To stop the whole post, use Cancel.")
    kind = _kind(p)
    live = {(t.get("platform"), _acc_id(t.get("accountId"))) for t in p.get("platforms") or [] if t.get("status") == "published"}
    want |= live                             # already published networks always stay on the post
    for pf, _ in want - live:
        if pf in FITS and kind not in FITS[pf]:
            raise ValueError(f"{pf.capitalize()} can't show a {kind} post, so it can't be turned on for this one.")
    cur = {(t.get("platform"), _acc_id(t.get("accountId"))): t for t in p.get("platforms") or []}
    out = []
    for key in sorted(want):
        t = cur.get(key)
        e = {"platform": key[0], "accountId": key[1]}
        if t:                                    # already on: keep its own text, media and settings
            for f in ("customContent", "customMedia", "platformSpecificData"):
                if t.get(f):
                    e[f] = t[f] if f != "customMedia" else [{"type": m.get("type"), "url": m.get("url")} for m in t[f] if m.get("url")]
        out.append(e)
    z.update_post(post_id, {"platforms": out})
    back = _post(z, post_id)
    now = sorted((t.get("platform"), _acc_id(t.get("accountId"))) for t in back.get("platforms") or [])
    lp = _local_plan(post_id)
    if lp:
        lp["platforms"] = sorted({pf for pf, _ in want})
        lp["targets"] = {pf: [a for f, a in want if f == pf] for pf in lp["platforms"]}
        plans.save(lp, via="dashboard", make_current=False)
    before = sorted(cur)
    append_log({"ts": int(time.time()), "event": "networks_changed", "postId": post_id, "before": before, "after": now, "via": "dashboard"})
    (state_dir() / "cache.json").unlink(missing_ok=True)
    off = [k[0] for k in before if k not in want]
    on = [k[0] for k in want if k not in cur]
    hitl.add_note(f"I changed the networks of post {post_id} from the dashboard"
                  f"{' · off: ' + ', '.join(off) if off else ''}{' · on: ' + ', '.join(on) if on else ''}. It's already done in Zernio.",
                  {"type": "post_networks", "postId": post_id, "off": off, "on": on})
    return {"platforms": [{"platform": a, "accountId": b} for a, b in now], "status": back.get("status"),
            "matches": now == sorted(want)}


def remove_published(post_id: str, platform: str, account_id: str, typed: str) -> dict:
    """Take an already-published post off one network (where the network allows it)."""
    if (typed or "").strip().lower() != "remove":
        raise PermissionError("Type remove to confirm.")
    if platform in NO_UNPUBLISH:
        raise ValueError(f"{platform.capitalize()} doesn't let apps delete posts. Delete it in the {platform.capitalize()} app.")
    z = Zernio()
    z.unpublish_post(post_id, platform, account_id or None)
    back = _post(z, post_id)
    append_log({"ts": int(time.time()), "event": "unpublished_one", "postId": post_id, "platform": platform, "via": "dashboard"})
    (state_dir() / "cache.json").unlink(missing_ok=True)
    hitl.add_note(f"I removed post {post_id} from {platform} from the dashboard (typed remove). It's already done.",
                  {"type": "post_networks", "postId": post_id, "off": [platform], "on": [], "published": True})
    st = next((t.get("status") for t in back.get("platforms") or [] if t.get("platform") == platform), None)
    return {"platform": platform, "status": st, "post": back.get("status")}
