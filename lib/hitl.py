"""Human-in-the-loop: questions the agent asks, answered in the dashboard
pop-up OR in the chat (first answer wins), plus free notes from the user.

    .bps/questions/<id>.json   {id, kind, question, options, input, confirm_word,
                                status: pending|answered|cancelled, answer, note, via}
    .bps/notes.jsonl           free notes typed in the dashboard ("Note to Claude")
    .bps/messages.jsonl        Claude's messages back to the user (`bps.py say`), shown in
                               the dashboard as a pop-up the user can answer, and in the chat

A question of kind "publish" can only be answered from the dashboard by typing
the confirm word exactly (default "go"); the server enforces it.
"""
from __future__ import annotations

import json
import re
import time
import uuid

from store import read_json, state_dir, write_json

KINDS = ("choice", "text", "frames", "publish", "fix")


def qdir():
    d = state_dir() / "questions"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _slug(s: str) -> str:
    return re.sub(r"[^a-z0-9-]+", "-", s.lower()).strip("-")[:40]


def create(question: str, kind: str = "choice", options: list | None = None, allow_text: bool = True,
           placeholder: str = "", confirm_word: str = "go", qid: str | None = None, context: str = "",
           extra: dict | None = None) -> dict:
    if kind not in KINDS:
        raise ValueError(f"kind must be one of {KINDS}")
    q = {
        "id": _slug(qid) if qid else uuid.uuid4().hex[:8],
        "kind": kind,
        "question": question,
        "context": context,
        "options": options or [],
        "allow_text": allow_text or kind == "text",
        "placeholder": placeholder,
        "confirm_word": confirm_word if kind == "publish" else None,
        "status": "pending",
        "created": int(time.time()),
        **(extra or {}),
    }
    # only one pending question at a time: cancel older ones
    for p in qdir().glob("*.json"):
        old = read_json(p) or {}
        if old.get("status") == "pending":
            old["status"] = "cancelled"
            write_json(p, old)
    write_json(qdir() / f"{q['id']}.json", q)
    return q


def get(qid: str) -> dict | None:
    return read_json(qdir() / f"{_slug(qid)}.json")


def pending() -> dict | None:
    qs = [read_json(p) or {} for p in qdir().glob("*.json")]
    qs = [q for q in qs if q.get("status") == "pending"]
    return max(qs, key=lambda q: q.get("created", 0)) if qs else None


def answer(qid: str, value: str, note: str = "", via: str = "chat", edited: str = "") -> dict:
    q = get(qid)
    if not q:
        raise ValueError("Unknown question.")
    if q["status"] != "pending":
        return q                                   # first answer wins
    value = (value or "").strip()
    if q["kind"] == "publish" and via == "ui" and value.lower() != (q.get("confirm_word") or "go").lower():
        raise PermissionError(f"Type '{q.get('confirm_word') or 'go'}' to confirm.")
    if q["kind"] == "fix" and value.lower() not in ("approve", "reject", "edit"):
        # a free-text chat reply to a fix counts as an edited version only if it says so
        value, edited = ("edit", value) if value else (value, edited)
    if q["kind"] == "fix" and value.lower() == "edit" and not (edited or "").strip():
        raise ValueError("Edited text is empty.")
    if not value and not note:
        raise ValueError("Empty answer.")
    q.update(status="answered", answer=value, note=(note or "").strip(), via=via, answered=int(time.time()))
    if edited:
        q["edited"] = edited.strip()
    write_json(qdir() / f"{q['id']}.json", q)
    return q


def cancel(qid: str) -> dict | None:
    q = get(qid)
    if q and q["status"] == "pending":
        q["status"] = "cancelled"
        write_json(qdir() / f"{q['id']}.json", q)
    return q


def wait(qid: str, timeout: int = 900, poll: float = 1.0) -> dict:
    end = time.time() + timeout
    while time.time() < end:
        heartbeat()
        q = get(qid)
        if q and q["status"] != "pending":
            return q
        time.sleep(poll)
    return {**(get(qid) or {}), "status": "timeout"}


# ---------------------------------------------------------------- notes
def add_note(text: str, action: dict | None = None) -> dict:
    """A note from the user. `action` makes it a structured request the agent
    must act on (e.g. {"type": "reschedule", "postId": ..., "at": ...})."""
    text = (text or "").strip()
    if not text and not action:
        raise ValueError("Empty note.")
    n = {"id": uuid.uuid4().hex[:8], "ts": int(time.time()), "text": text[:4000], "read": False}
    if action:
        n["action"] = action
    with open(state_dir() / "notes.jsonl", "a", encoding="utf-8") as f:
        f.write(json.dumps(n, ensure_ascii=False) + "\n")
    return n


def notes(unread_only: bool = True, mark_read: bool = False) -> list[dict]:
    p = state_dir() / "notes.jsonl"
    if not p.exists():
        return []
    rows = [json.loads(l) for l in p.read_text(encoding="utf-8").splitlines() if l.strip()]
    out = [r for r in rows if not (unread_only and r.get("read"))]
    if mark_read and out:
        ids = {r["id"] for r in out}
        for r in rows:
            if r["id"] in ids:
                r["read"] = True
        p.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows), encoding="utf-8")
    return out


# ---------------------------------------------------------------- Claude's messages
def _mpath():
    return state_dir() / "messages.jsonl"


def _messages() -> list[dict]:
    p = _mpath()
    if not p.exists():
        return []
    return [json.loads(l) for l in p.read_text(encoding="utf-8").splitlines() if l.strip()]


def say(text: str, to: str = "", options: list | None = None, expect: bool = False) -> dict:
    """A message from Claude to the user (a reply to a note, a status, or a question that
    needs an answer). The dashboard pops it up; the user's reply comes back as a note."""
    text = (text or "").strip()
    if not text:
        raise ValueError("Empty message.")
    m = {"id": uuid.uuid4().hex[:8], "ts": int(time.time()), "text": text[:4000], "to": to or "",
         "options": [str(o)[:80] for o in (options or []) if str(o).strip()][:6],
         "expect": bool(expect or options), "seen": False, "answered": False}
    with open(_mpath(), "a", encoding="utf-8") as f:
        f.write(json.dumps(m, ensure_ascii=False) + "\n")
    return m


def _update_message(mid: str, **fields) -> dict:
    rows = _messages()
    hit = None
    for r in rows:
        if r["id"] == mid:
            r.update(fields)
            hit = r
    if not hit:
        raise ValueError("Unknown message.")
    _mpath().write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows), encoding="utf-8")
    return hit


def seen(mid: str) -> dict:
    return _update_message(mid, seen=True)


def reply(mid: str, text: str) -> dict:
    """The user answers one of Claude's messages: it becomes a note Claude acts on."""
    text = (text or "").strip()
    if not text:
        raise ValueError("Write an answer first.")
    m = next((r for r in _messages() if r["id"] == mid), None)
    if not m:
        raise ValueError("Unknown message.")
    _update_message(mid, seen=True, answered=True)
    return add_note(text, {"type": "reply", "to": mid, "claudeSaid": m["text"][:1000]})


def thread(limit: int = 40) -> list[dict]:
    """The conversation, oldest first: your notes and Claude's messages."""
    mine = [{"id": n["id"], "ts": n["ts"], "from": "you", "text": n.get("text") or _describe(n.get("action") or {}),
             "read": n.get("read", False)} for n in notes(unread_only=False)]
    theirs = [{**m, "from": "claude"} for m in _messages()]
    return sorted(mine + theirs, key=lambda r: r["ts"])[-limit:]


def _describe(action: dict) -> str:
    return "(" + str(action.get("type") or "request").replace("_", " ") + ")"


def unseen() -> dict | None:
    """The newest message from Claude the user hasn't seen yet."""
    rows = [m for m in _messages() if not m.get("seen")]
    return rows[-1] if rows else None


# ---------------------------------------------------------------- listening
def heartbeat() -> None:
    write_json(state_dir() / "watch.json", {"ts": time.time()})


def active() -> None:
    """Any bps.py command run by Claude: Claude Code is open and working."""
    write_json(state_dir() / "active.json", {"ts": time.time()})


def listening(grace: float = 15.0) -> bool:
    hb = read_json(state_dir() / "watch.json") or {}
    return time.time() - hb.get("ts", 0) < grace


def presence() -> str:
    """listening: the watch loop is waiting for your clicks.
    working:   Claude Code is open and busy (handling a request between two watches).
    closed:    no sign of Claude Code for 10 minutes; requests wait until it's opened."""
    if listening():
        return "listening"
    now = time.time()
    last = max((read_json(state_dir() / f) or {}).get("ts", 0) for f in ("watch.json", "active.json"))
    return "working" if now - last < 600 else "closed"


def watch(timeout: int = 3600, poll: float = 1.0) -> list[dict]:
    """Block until the user sends something from the dashboard (a note or a
    structured request), then return the unread items. The agent runs this in
    the background so dashboard clicks wake it up."""
    end = time.time() + timeout
    while time.time() < end:
        heartbeat()
        items = notes(unread_only=True)
        if items:
            return items
        time.sleep(poll)
    return []
