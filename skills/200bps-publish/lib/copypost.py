"""Copy a post to another day (Posts / Plan: Copy, then Paste on a day).

The copy keeps the media, the networks, the accounts and each network's
settings; the user picks the new day and time and may change the caption.

* A post in Zernio (any status, published too): a new Zernio post is created
  with the same media. Scheduling it goes public later, so it needs the typed
  word "go"; "save as a draft in Zernio" never publishes and needs no word.
* A local draft (not uploaded): its folder is copied into my-posts/ and a new
  local draft is made for the new time. Nothing reaches Zernio.
"""
from __future__ import annotations

import hashlib
import shutil
import time
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

import hitl
import plan as plans
from store import append_log, config, state_dir, workspace
from zernio import Zernio


def _when(at_local: str, need_future: bool) -> datetime:
    tz = ZoneInfo(config().get("timezone", "UTC"))
    try:
        when = datetime.fromisoformat(str(at_local)[:16]).replace(tzinfo=tz)
    except ValueError:
        raise ValueError("Pick a day and a time.") from None
    if need_future and when < datetime.now(tz) + timedelta(minutes=15):
        raise ValueError("Pick a time at least 15 minutes from now.")
    return when


def _acc(a) -> str:
    return a.get("_id") if isinstance(a, dict) else str(a or "")


GIFT_KEYS = ("platform", "trigger", "accountId", "keywords", "matchMode", "commentReply", "repeatPolicy", "linkTracking",
             "dmMessage", "publicReplyPolicy", "audience", "alsoMatchInDms", "buttons", "followGate", "typoTolerance")


def _copy_gifts(z: Zernio, src: dict, new_id: str, when: datetime) -> list[str]:
    """The source post's DM gift(s), recreated on the copy (only when the user ticked it)."""
    ids = {src.get("_id")} | {p.get("platformPostId") for p in src.get("platforms") or [] if p.get("platformPostId")}
    r = z.automations(config().get("profile_id")) or {}
    made = []
    for a in (r.get("automations") or r.get("data") or []):
        if a.get("postId") not in ids and a.get("platformPostId") not in ids:
            continue
        full = z.get(f"/comment-automations/{a.get('id') or a.get('_id')}")
        full = full.get("automation", full)
        body = {k: full[k] for k in GIFT_KEYS if full.get(k) is not None}
        body.update({"profileId": config().get("profile_id"), "postId": new_id,
                     "name": f"{(full.get('name') or 'Gift')[:60]} (copy, {when.strftime('%d %b')})"})
        res = z.create_automation(body)
        m = res.get("automation") or res
        made.append(m.get("id") or m.get("_id"))
        append_log({"ts": int(time.time()), "event": "dm_automation", "postId": new_id, "automationId": made[-1],
                    "copiedFrom": full.get("id"), "via": "dashboard"})
    return made


def copy_zernio(post_id: str, at_local: str, text: str | None, platforms: list[str] | None, draft: bool, typed: str,
                with_gift: bool = False) -> dict:
    if not draft and (typed or "").strip().lower() != "go":
        raise PermissionError("Type go to schedule the copy.")
    z = Zernio()
    src = z.post(post_id)
    src = src.get("post", src)
    when = _when(at_local, need_future=not draft)
    targets = [p for p in src.get("platforms") or [] if not platforms or p.get("platform") in platforms]
    if not targets:
        raise ValueError("Pick at least one network.")
    content = (text if text is not None else src.get("content") or "").strip()
    changed = text is not None and content != (src.get("content") or "").strip()
    entries = []
    for p in targets:
        e = {"platform": p["platform"], "accountId": _acc(p.get("accountId"))}
        if p.get("customContent") and not changed:          # an edited caption replaces every network's text
            e["customContent"] = p["customContent"]
        if p.get("customMedia"):
            e["customMedia"] = [{"type": m.get("type"), "url": m.get("url")} for m in p["customMedia"] if m.get("url")]
        if p.get("platformSpecificData"):
            e["platformSpecificData"] = p["platformSpecificData"]
        entries.append(e)
    body = {"content": content, "mediaItems": [{"type": m.get("type"), "url": m.get("url")} for m in src.get("mediaItems") or [] if m.get("url")],
            "platforms": entries, "scheduledFor": when.isoformat(), "timezone": str(when.tzinfo)}
    if draft:
        body["isDraft"] = True
    key = "bps-copy-" + hashlib.sha1(f"{post_id}|{when.isoformat()}|{content}|{draft}|{','.join(e['platform'] + e['accountId'] for e in entries)}".encode()).hexdigest()[:16]
    res = z.create_post(body, idempotency_key=key)
    new = res.get("post", res)
    new_id = new.get("_id") or new.get("id")
    gifts = _copy_gifts(z, src, new_id, when) if with_gift and new_id else []
    append_log({"ts": int(time.time()), "event": "post_copied", "from": post_id, "postId": new_id, "at": when.isoformat(),
                "draft": draft, "via": "dashboard"})
    (state_dir() / "cache.json").unlink(missing_ok=True)
    hitl.add_note(f"I copied post {post_id} to {when.isoformat()} from the dashboard"
                  f"{' as a draft in Zernio' if draft else ' and scheduled it (typed go)'}"
                  f"{', with its DM gift copied too' if gifts else ''}. It's already done.",
                  {"type": "post_copied", "from": post_id, "postId": new_id, "at": when.isoformat(), "draft": draft, "gifts": gifts})
    return {"postId": new_id, "status": new.get("status"), "at": new.get("scheduledFor") or when.isoformat(), "gifts": len(gifts)}


def copy_local(plan_id: str, at_local: str, text: str | None, platforms: list[str] | None, with_gift: bool = False) -> dict:
    src = plans.load(plan_id)
    if not src:
        raise ValueError("That draft wasn't found.")
    when = _when(at_local, need_future=True)
    folder = Path(src["folder"])
    if not folder.is_dir():
        raise ValueError("The draft's folder is gone, so it can't be copied.")
    base = workspace() / (config().get("posts_dir") or "my-posts")
    base.mkdir(parents=True, exist_ok=True)
    dest, i = base / f"{folder.name}-copy", 2
    while dest.exists():
        dest, i = base / f"{folder.name}-copy-{i}", i + 1
    shutil.copytree(folder, dest, ignore=shutil.ignore_patterns(".*"))
    p = plans.analyze(str(dest), platforms or src.get("platforms"), make_current=False)
    for pl in p["platforms"]:
        p["captions"][pl] = text if text is not None else (src.get("captions") or {}).get(pl, p["captions"].get(pl, ""))
    for k in ("settings", "cover", "targets"):
        if src.get(k):
            p[k] = src[k]
    if with_gift and (src.get("dm") or {}).get("enabled"):     # still made only after publishing, with a yes
        p["dm"] = {**src["dm"], "automationId": None}
    p["schedule"] = {"mode": "at", "at": when.isoformat(), "via": "dashboard"}
    plans.recheck(p)
    plans.save(p, via="dashboard", make_current=False)
    append_log({"ts": int(time.time()), "event": "draft_copied", "from": plan_id, "plan": p["id"], "at": when.isoformat(), "via": "dashboard"})
    return {"plan": p["id"], "folder": str(dest.relative_to(workspace())), "at": when.isoformat(), "status": p["status"], "local": True}


def copy(data: dict) -> dict:
    text = data.get("text")
    text = str(text)[:5000] if text is not None else None
    plats = [str(x) for x in (data.get("platforms") or [])] or None
    if data.get("planId") and not data.get("postId"):
        return copy_local(str(data["planId"]), str(data.get("at", "")), text, plats, bool(data.get("copyGift")))
    return copy_zernio(str(data.get("postId", "")), str(data.get("at", "")), text, plats, bool(data.get("draft")),
                       str(data.get("confirm", "")), bool(data.get("copyGift")))
