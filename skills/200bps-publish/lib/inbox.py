"""Inbox actions from the dashboard: reply to a comment, send the post's gift
as a private reply, hide or delete a comment, and local labels.

Replies and gifts go public, so they only run when the user presses Send on
text they can see; deleting needs the typed word "delete". Labels and the
"handled" marks stay on this computer (.bps/inbox.json).
"""
from __future__ import annotations

import time

import hitl
from store import append_log, read_json, state_dir, write_json
from zernio import Zernio, ZernioError

LABELS = ["Question", "Lead", "Thanks", "Follow up", "Spam"]


def _path():
    return state_dir() / "inbox.json"


def state() -> dict:
    s = read_json(_path(), {}) or {}
    return {"labels": s.get("labels", {}), "catalog": s.get("catalog") or LABELS, "handled": s.get("handled", {}),
            "drafts": s.get("drafts", {}), "prefs": s.get("prefs", {})}


def set_hide_gifted(on: bool) -> dict:
    """Hide (or show again) the comments whose authors already got the gift by DM.
    Local only: nothing changes on Instagram."""
    return _set_pref("hideGifted", on)


def set_hide_replied(on: bool) -> dict:
    """Hide (or show again) the comments you already replied to (here, or in the
    Instagram app: a reply, an @mention or a DM). Local only."""
    return _set_pref("hideReplied", on)


def _set_pref(key: str, on: bool) -> dict:
    s = read_json(_path(), {}) or {}
    s.setdefault("prefs", {})[key] = bool(on)
    _save(s)
    return state()


def _save(s: dict) -> None:
    write_json(_path(), s)


def ignore(comment_ids: list[str]) -> dict:
    """Ignore = no reply needed. Local only (moves it to Handled); undo with unhandle."""
    for c in comment_ids:
        if c:
            _handled(c, "ignored")
    return state()


def _handled(comment_id: str, how: str) -> None:
    s = state()
    s["handled"][comment_id] = {"how": how, "ts": int(time.time())}
    _save(s)


def _drop_cache() -> None:
    (state_dir() / "cache.json").unlink(missing_ok=True)


def reply(post_id: str, account_id: str, comment_id: str, text: str) -> dict:
    text = (text or "").strip()
    if not text:
        raise ValueError("Write the reply first.")
    Zernio().reply_comment(post_id, account_id, comment_id, text[:2200])
    _handled(comment_id, "replied")
    drop_draft(comment_id)
    append_log({"ts": int(time.time()), "event": "comment_reply", "commentId": comment_id, "via": "dashboard"})
    _drop_cache()
    return {"done": "replied"}


def gift(post_id: str, account_id: str, comment_id: str, text: str, link: str = "", button: str = "", as_button: bool = False) -> dict:
    """The post's gift as a private reply. One per comment, within 7 days; a
    refused try still uses it up, so the link goes in the text unless the user
    chose a button."""
    text = (text or "").strip()
    if not text:
        raise ValueError("Write the message first.")
    link = (link or "").strip()
    if link and not link.startswith(("https://", "http://")):
        raise ValueError("The link must start with https://")
    buttons = None
    if link and as_button:
        buttons = [{"type": "url", "title": (button or "Open")[:20], "url": link}]
    elif link and link not in text:
        text = f"{text}\n{link}"
    try:
        Zernio().private_reply(post_id, comment_id, account_id, text[:1000], buttons)
    except ZernioError as e:
        d = (e.body.get("details") or {}) if isinstance(e.body, dict) else {}
        if d.get("privateReplyConsumed"):
            _handled(comment_id, "gift-used")
            raise ValueError("This comment's one private message is already used, so nothing more can be sent to it.") from None
        if d.get("privateReplyOutcome") == "unknown":
            _handled(comment_id, "gift-unknown")
            raise ValueError("Instagram answered with an error after receiving it; it was probably delivered. Check the DMs before trying again.") from None
        append_log({"ts": int(time.time()), "event": "comment_gift_failed", "commentId": comment_id, "error": str(e)[:300], "via": "dashboard"})
        raise
    _handled(comment_id, "gift")
    append_log({"ts": int(time.time()), "event": "comment_gift", "commentId": comment_id, "button": bool(buttons), "via": "dashboard"})
    _drop_cache()
    return {"done": "gift"}


def hide(post_id: str, account_id: str, comment_id: str, on: bool = True) -> dict:
    Zernio().hide_comment(post_id, comment_id, account_id, on)
    append_log({"ts": int(time.time()), "event": "comment_hide" if on else "comment_unhide", "commentId": comment_id, "via": "dashboard"})
    _drop_cache()
    return {"done": "hidden" if on else "shown"}


def delete(post_id: str, account_id: str, comment_id: str, typed: str) -> dict:
    if (typed or "").strip().lower() != "delete":
        raise PermissionError("Type delete to confirm.")
    Zernio().delete_comment(post_id, account_id, comment_id)
    _handled(comment_id, "deleted")
    append_log({"ts": int(time.time()), "event": "comment_delete", "commentId": comment_id, "via": "dashboard"})
    hitl.add_note(f"I deleted comment {comment_id} from the Inbox. It's already done.", {"type": "comment_deleted", "commentId": comment_id})
    _drop_cache()
    return {"done": "deleted"}


def label(comment_id: str, name: str, on: bool) -> dict:
    name = (name or "").strip()[:24]
    if not name:
        raise ValueError("Empty label.")
    s = state()
    cur = set(s["labels"].get(comment_id, []))
    (cur.add if on else cur.discard)(name)
    s["labels"][comment_id] = sorted(cur)
    if on and name not in s["catalog"]:
        s["catalog"] = s["catalog"] + [name]
    _save(s)
    return s


def ask_drafts(items: list) -> dict:
    """The user pressed "Ask Claude to draft replies": hand Claude the waiting
    comments. Claude saves a draft per comment (save_draft); nothing is sent
    until the user presses Send reply on it."""
    rows = []
    for x in (items or [])[:40]:
        if isinstance(x, dict) and x.get("id"):
            rows.append({k: str(x.get(k) or "")[:600] for k in ("id", "author", "text", "postId", "platform", "post")})
    if not rows:
        raise ValueError("No waiting comments to draft.")
    n = hitl.add_note(f"Draft a reply for each of these {len(rows)} waiting comments. Save each with "
                      "`bps.py inbox draft --comment ID --text \"...\"`; the user sends them.",
                      {"type": "reply_drafts", "comments": rows})
    return {"queued": n["id"], "count": len(rows)}


def save_draft(comment_id: str, text: str) -> dict:
    text = (text or "").strip()
    if not comment_id or not text:
        raise ValueError("Pass the comment id and the draft text.")
    s = read_json(_path(), {}) or {}
    s.setdefault("drafts", {})[comment_id] = {"text": text[:2200], "ts": int(time.time())}
    _save(s)
    return {"saved": comment_id}


def drop_draft(comment_id: str) -> dict:
    s = read_json(_path(), {}) or {}
    (s.get("drafts") or {}).pop(comment_id, None)
    _save(s)
    return state()


def waiting() -> list:
    """Comments still waiting: not handled here, and not handled by an automation
    or in the app (unless PIX drafted a reply for it, which the user still has to send)."""
    c = read_json(state_dir() / "cache.json", {}) or {}
    st, auto = state(), c.get("autoLog") or {}
    posts = c.get("commentPosts") or {}
    return [{**x, "post": ((posts.get(x.get("postId")) or {}).get("caption") or "").split("\n")[0][:120],
             "draft": (st["drafts"].get(x["id"]) or {}).get("text")}
            for x in c.get("comments") or []
            if x["id"] not in st["handled"] and (x["id"] in st["drafts"] or x["id"] not in auto
                                               or auto[x["id"]].get("how") == "auto-failed")]


def unhandle(comment_id: str) -> dict:
    s = state()
    s["handled"].pop(comment_id, None)
    _save(s)
    return s
