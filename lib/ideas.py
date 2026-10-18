"""Idea bank: .bps/ideas.json, written by the agent and managed from the dashboard.

Every idea gets a stable id (kept once set; ideas the agent wrote without one
get an id from their title). Deleting moves ideas to .bps/trash/ideas.json and
keeps the last deletion for Undo. Export writes a readable Markdown document
or a JSON backup that Import can load back.
"""
from __future__ import annotations

import hashlib
import json
import time
from pathlib import Path

from store import read_json, state_dir, write_json

FIELDS = ("title", "why", "format", "basedOn", "hook", "cta", "bestTime", "basis", "status")
LISTS = ("outline", "hashtags")
STATUSES = ("new", "drafted", "posted")
MAX_IDEAS = 200


def _path() -> Path:
    return state_dir() / "ideas.json"


def _trash() -> Path:
    return state_dir() / "trash" / "ideas.json"


def _undo() -> Path:
    return state_dir() / "trash" / "ideas-undo.json"


def _id(i: dict) -> str:
    return i.get("id") or hashlib.sha1((i.get("title") or "").encode()).hexdigest()[:10]


def load() -> list[dict]:
    rows = read_json(_path(), []) or []
    return [{**i, "id": _id(i)} for i in rows if isinstance(i, dict)]


def _save(rows: list[dict]) -> None:
    write_json(_path(), rows)


def _clean(d: dict) -> dict:
    """Only known fields, as plain text / lists of text."""
    out = {}
    for k in FIELDS:
        if d.get(k) not in (None, ""):
            out[k] = str(d[k]).strip()[:2000]
    for k in LISTS:
        v = d.get(k)
        if isinstance(v, str):
            v = [x for x in v.splitlines()] if k == "outline" else v.replace(",", " ").split()
        if isinstance(v, list):
            items = [str(x).strip()[:500] for x in v if str(x).strip()][:30]
            if k == "hashtags":
                items = ["#" + x.lstrip("#") for x in items]
            out[k] = items
    if out.get("status") not in STATUSES:
        out["status"] = "new"
    return out


def _find(rows: list[dict], iid: str) -> dict:
    hit = next((i for i in rows if i["id"] == iid), None)
    if not hit:
        raise ValueError("That idea isn't in the bank any more.")
    return hit


def mark(iid: str, status: str) -> None:
    if status not in STATUSES:
        raise ValueError("Bad status.")
    rows = load()
    _find(rows, iid)["status"] = status
    _save(rows)


def edit(iid: str, fields: dict) -> dict:
    rows = load()
    hit = _find(rows, iid)
    new = _clean({**hit, **fields})
    if not new.get("title"):
        raise ValueError("An idea needs a title.")
    for k in list(hit):
        if k != "id":
            hit.pop(k)
    hit.update(new)                       # the id stays, even if the title changes
    _save(rows)
    return hit


def add(fields: dict) -> dict:
    new = _clean({"basis": "mine", **fields})
    if not new.get("title"):
        raise ValueError("An idea needs a title.")
    rows = load()
    if len(rows) >= MAX_IDEAS:
        raise ValueError(f"The bank holds up to {MAX_IDEAS} ideas. Delete some first.")
    new["id"] = hashlib.sha1(f"{new['title']}{time.time()}".encode()).hexdigest()[:10]
    rows.insert(0, new)
    _save(rows)
    return new


def delete(ids: list[str]) -> int:
    """Remove ideas (recoverable: kept in the trash, last batch can be undone)."""
    rows = load()
    want = set(ids)
    gone = [i for i in rows if i["id"] in want]
    if not gone:
        return 0
    _save([i for i in rows if i["id"] not in want])
    trash = read_json(_trash(), []) or []
    write_json(_trash(), (trash + [{**i, "deleted": int(time.time())} for i in gone])[-500:])
    write_json(_undo(), {"ts": int(time.time()), "ideas": gone, "order": [i["id"] for i in rows]})
    return len(gone)


def undo() -> int:
    u = read_json(_undo(), None)
    if not u or not u.get("ideas"):
        raise ValueError("Nothing to undo.")
    rows = load()
    have = {i["id"] for i in rows}
    back = [i for i in u["ideas"] if i["id"] not in have]
    pos = {iid: n for n, iid in enumerate(u.get("order") or [])}
    merged = sorted(rows + back, key=lambda i: pos.get(i["id"], -1))
    _save(merged)
    trash = read_json(_trash(), []) or []
    ids = {i["id"] for i in back}
    write_json(_trash(), [i for i in trash if i.get("id") not in ids])
    _undo().unlink(missing_ok=True)
    return len(back)


def undo_info() -> dict | None:
    u = read_json(_undo(), None)
    return {"n": len(u["ideas"]), "ts": u["ts"]} if u and u.get("ideas") else None


# ---------------- export / import ----------------
def to_markdown(rows: list[dict]) -> str:
    out = [f"# Idea bank", "", f"Exported {time.strftime('%Y-%m-%d %H:%M')} · {len(rows)} idea{'s' if len(rows) != 1 else ''}", ""]
    for n, i in enumerate(rows, 1):
        out += [f"## {n}. {i.get('title', '')}", ""]
        meta = " · ".join(x for x in (i.get("format"), i.get("status"), i.get("basis")) if x)
        if meta:
            out += [f"*{meta}*", ""]
        for k, label in (("hook", "Hook"), ("why", "Why it should work")):
            if i.get(k):
                out += [f"**{label}:** {i[k]}", ""]
        if i.get("outline"):
            out += ["**Outline:**", ""] + [f"{k}. {x}" for k, x in enumerate(i["outline"], 1)] + [""]
        for k, label in (("cta", "Call to action"), ("bestTime", "Suggested time"), ("basedOn", "Inspired by")):
            if i.get(k):
                out += [f"**{label}:** {i[k]}", ""]
        if i.get("hashtags"):
            out += ["**Hashtags:** " + " ".join(i["hashtags"]), ""]
    return "\n".join(out).rstrip() + "\n"


def to_json(rows: list[dict]) -> str:
    return json.dumps({"kind": "200bps-ideas", "version": 1, "exported": int(time.time()), "ideas": rows},
                      ensure_ascii=False, indent=2) + "\n"


def export(ids: list[str], fmt: str) -> dict:
    """Save the chosen ideas with the file manager's own Save window."""
    import images
    rows = load()
    pick = [i for i in rows if i["id"] in set(ids)] if ids else rows
    if not pick:
        raise ValueError("Select at least one idea.")
    ext = ".json" if fmt == "json" else ".md"
    text = to_json(pick) if ext == ".json" else to_markdown(pick)
    name = f"ideas-{time.strftime('%Y-%m-%d')}{ext}"
    home = Path.home()
    start = home / "Documents" if (home / "Documents").is_dir() else home
    got = images._native(str(start), "--save", name, "Save ideas as")
    if not got.get("ok"):
        if got.get("error") == "no-native-picker":
            return {"download": True, "name": name, "content": text}      # the browser saves it instead
        raise ValueError(got.get("error") or "The save window failed.")
    if not got.get("files"):
        return {"cancelled": True}
    dest = Path(got["files"][0]).expanduser()
    if dest.suffix.lower() != ext:
        dest = dest.with_name(dest.name + ext)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(text, encoding="utf-8")
    return {"path": str(dest), "n": len(pick)}


def import_(data) -> dict:
    """Load ideas from an exported JSON backup (or a plain list). Ideas whose
    title is already in the bank are skipped."""
    items = data.get("ideas") if isinstance(data, dict) else data
    if not isinstance(items, list):
        raise ValueError("That file isn't an idea backup (.json from Save backup).")
    rows = load()
    titles = {i.get("title") for i in rows}
    added = 0
    for d in items[:MAX_IDEAS]:
        if not isinstance(d, dict):
            continue
        new = _clean(d)
        if not new.get("title") or new["title"] in titles or len(rows) >= MAX_IDEAS:
            continue
        new["id"] = d.get("id") if isinstance(d.get("id"), str) and d["id"] not in {i["id"] for i in rows} else \
            hashlib.sha1(f"{new['title']}{time.time()}{added}".encode()).hexdigest()[:10]
        rows.append(new)
        titles.add(new["title"])
        added += 1
    _save(rows)
    return {"added": added, "skipped": len(items) - added}
