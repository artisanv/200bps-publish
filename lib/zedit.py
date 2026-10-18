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
        body["platforms"] = [{"platform": t["platform"],
                              "accountId": t["accountId"]["_id"] if isinstance(t.get("accountId"), dict) else t.get("accountId"),
                              "customContent": text[:5000]} for t in targets]
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
