"""Cancel anything, anywhere: a scheduled post, a published one (where the
network allows it), or a local draft.

- Not published yet (scheduled, draft, failed, partial, publishing): deleted
  from Zernio, so it never goes out. The local draft is kept so it can be
  scheduled again.
- Published: removed from each network that allows it (LinkedIn, Facebook,
  Threads, X…). Instagram doesn't allow apps to delete posts; the user deletes
  those in the Instagram app (we return the link).
- Local draft (never uploaded): moved to .bps/trash, never the user's files.

Every remote action needs the typed word "cancel" (the user's explicit yes).
"""
from __future__ import annotations

import time
from pathlib import Path

import plan as plans
from store import append_log, read_json, state_dir
from zernio import Zernio, ZernioError

NO_UNPUBLISH = {"instagram", "tiktok", "snapchat"}


def _plan_for(post_id: str) -> dict | None:
    for f in (state_dir() / "plans").glob("*.json"):
        p = read_json(f) or {}
        if (p.get("result") or {}).get("postId") == post_id:
            return p
    return None


def cancel_post(post_id: str, typed: str, via: str = "dashboard") -> dict:
    import hitl
    if (typed or "").strip().lower() != "cancel":
        raise PermissionError("Type cancel to confirm.")
    if not post_id:
        raise ValueError("No post.")
    z = Zernio()
    zp = z.post(post_id)
    zp = zp.get("post", zp)
    status = zp.get("status")
    out = {"postId": post_id, "before": status, "removed": [], "manual": [], "failed": []}
    if status != "published":
        z.delete_post(post_id)
        out["deleted"] = True
    else:
        for t in zp.get("platforms") or []:
            plat, acc = t.get("platform"), t.get("accountId")
            acc = acc.get("_id") if isinstance(acc, dict) else acc
            if t.get("status") != "published":
                continue
            if plat in NO_UNPUBLISH:
                out["manual"].append({"platform": plat, "url": t.get("platformPostUrl")})
                continue
            try:
                z.unpublish_post(post_id, plat, acc)
                out["removed"].append(plat)
            except ZernioError as e:
                out["failed"].append({"platform": plat, "error": str(e)[:300]})
    # keep the user's draft, so the same post can be scheduled again
    p = _plan_for(post_id)
    if p and (out.get("deleted") or out["removed"]):
        p.setdefault("cancelled", []).append({"postId": post_id, "ts": int(time.time()), "was": status, "via": via})
        p.pop("result", None)
        p["schedule"] = {"mode": "ask"}
        p["status"] = "draft"
        plans.save(p, via=via, make_current=False)
        out["plan"] = p["id"]
    (state_dir() / "cache.json").unlink(missing_ok=True)
    append_log({"event": "cancel", "postId": post_id, "was": status, "via": via,
                "removed": out["removed"], "manual": [m["platform"] for m in out["manual"]]})
    hitl.add_note(f"Cancelled from the {via}: Zernio post {post_id} (was {status}). "
                  + ("Deleted from Zernio; it won't go out." if out.get("deleted") else
                     f"Removed from {', '.join(out['removed']) or 'no network'}; delete by hand on {', '.join(m['platform'] for m in out['manual']) or '-'}."),
                  {"type": "post_cancelled", "postId": post_id, "was": status})
    return out


def delete_draft(plan_id: str, via: str = "dashboard") -> dict:
    """Set a never-uploaded draft aside in .bps/trash (the post folder is untouched)."""
    p = plans.load(plan_id) if plan_id else None
    if not p:
        raise ValueError("Draft not found.")
    if (p.get("result") or {}).get("postId") or p.get("status") in ("scheduled", "published"):
        raise ValueError("This post is in Zernio. Cancel it instead.")
    trash = state_dir() / "trash"
    trash.mkdir(exist_ok=True)
    src = plans.plan_path(plan_id)
    dst = trash / f"{plan_id}-{int(time.time())}.json"
    src.replace(dst)
    if plans.current_id() == plan_id:
        (state_dir() / "current.txt").unlink(missing_ok=True)
    append_log({"event": "delete_draft", "plan": plan_id, "trash": str(dst.name), "via": via})
    return {"ok": True, "plan": plan_id, "folder": p.get("folder"), "trash": dst.name}
