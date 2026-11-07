"""One post, every network: Claude rewrites the caption to fit each network.

The user presses one button; Claude gets the post, the networks and each
network's own rules (length, hashtags, how much shows before "more") and
writes one version per network in the user's voice. The dashboard shows each
version next to the current one with its score change; the user uses all,
some, edits them, or says no thanks. Every applied change is backed up in
caption_history, so it can be undone.
"""
from __future__ import annotations

import time

import checks
import hitl
import plan as plans
import suggest

TIPS = {
    "instagram": "Hook in the first ~125 characters (before 'more'), short lines, a question to comment on, up to 5 hashtags at the end.",
    "linkedin": "Professional, first 2 lines carry the hook (~210 characters before 'see more'), short paragraphs, a concrete takeaway, a question, up to 5 hashtags.",
    "facebook": "Conversational, the point in the first line, a question to invite comments, 0-3 hashtags.",
    "tiktok": "Short and punchy (the video does the talking), a hook line, 3-5 relevant hashtags.",
    "snapchat": "Very short: a Saved story title is up to 45 characters, Spotlight up to 160. Stories show no caption.",
}


def gift_info(plan: dict) -> dict | None:
    dm = plan.get("dm") or {}
    if not dm.get("enabled") or not dm.get("keyword"):
        return None
    return {"network": "instagram", "keyword": dm["keyword"], "followGate": bool(dm.get("followGate")), "link": bool(dm.get("link"))}


def _gift_tip(plan: dict, p: str) -> str:
    g = gift_info(plan)
    if not g:
        return ""
    if p == "instagram":
        return (f" GIFT (Instagram only): end with a clear call to action: {'follow us first, then ' if g['followGate'] else ''}"
                f"comment '{g['keyword']}' and the link comes in your DM{' (the follow is checked inside the DM)' if g['followGate'] else ''}.")
    return (f" NO DM GIFT on this network: don't ask people to comment '{g['keyword']}' or promise a DM. Use a call to action that "
            f"works here (e.g. 'the link is in the first comment', or point to the Instagram post).")


def _rules(p: str, plan: dict | None = None) -> dict:
    r = checks.RULES.get(p, {})
    return {"max": r.get("caption_max"), "hashtags": r.get("hashtags_max"), "hook": r.get("hook_chars"),
            "tip": TIPS.get(p, "") + (_gift_tip(plan, p) if plan else "")}


def eligible(plan: dict) -> list[str]:
    return [p for p in plan["platforms"] if not (p == "snapchat" and (plan["settings"].get("snapchat") or {}).get("contentType", "story") == "story")]


def ask(plan: dict) -> dict:
    if not plans.editable(plan):
        raise ValueError("This post is already scheduled or live.")
    plats = eligible(plan)
    if len(plats) < 2:
        raise ValueError("This post goes to one network. Add another network first (⇆ Networks).")
    base = plan["captions"].get(plan["platforms"][0], "")
    n = hitl.add_note(
        f"Rewrite the caption of '{plan['id']}' for each network ({', '.join(plats)}): same message, my voice and language, "
        f"each fitted to that network's rules. Save them as a JSON object {{network: caption}} and run: "
        f"bps.py rewrite --file <json> --note \"<one line what changed>\".",
        {"type": "rewrite_all", "plan": plan["id"], "platforms": plats, "caption": base[:5000],
         "current": {p: plan["captions"].get(p, "")[:5000] for p in plats}, "rules": {p: _rules(p, plan) for p in plats},
         "gift": gift_info(plan)})
    plan["rewrite"] = {"status": "asked", "note": n["id"], "ts": int(time.time())}
    plans.save(plan, record=False)
    return {"note": n["id"]}


def save(plan: dict, versions: dict, note: str = "", via: str = "claude", checks_fixed: list[str] | None = None) -> dict:
    """Store one version per network for review (nothing changes yet)."""
    if not plans.editable(plan):
        raise ValueError("This post is already scheduled or live.")
    rows = []
    for p, text in versions.items():
        if p not in plan["platforms"]:
            raise ValueError(f"{p} is not in this post.")
        text = str(text).strip()
        if not text:
            continue
        before = plan["captions"].get(p, "")
        b, a = suggest._score(plan, p, before), suggest._score(plan, p, text)
        rows.append({"platform": p, "before": before, "after": text[:5000], "scoreBefore": b["value"], "scoreAfter": a["value"],
                     "fixed": sorted(set(b["failing"]) - set(a["failing"])), "newIssues": sorted(set(a["failing"]) - set(b["failing"])),
                     "chars": len(text), "max": checks.RULES.get(p, {}).get("caption_max"), "applied": False})
    if not rows:
        raise ValueError("No versions given.")
    plan["rewrite"] = {"status": "ready", "rows": rows, "note": note[:300], "via": via, "ts": int(time.time()), "checks": checks_fixed or []}
    # a caption fix asked from a check: its Fix button now opens these versions
    fr = plan.setdefault("fixRequests", {})
    for k in list(fr):
        if k.split(":")[0] in (checks_fixed or []):
            fr[k] = {"status": "rewrite", "ts": int(time.time())}
    plans.save(plan, record=False)
    return plan["rewrite"]


def apply(plan: dict, platforms: list[str] | None = None, edited: dict | None = None, via: str = "dashboard") -> dict:
    """Use the versions for the chosen networks (all when none given)."""
    rw = plan.get("rewrite") or {}
    if rw.get("status") not in ("ready", "partial"):
        raise ValueError("No versions waiting.")
    if not plans.editable(plan):
        raise ValueError("This post is already scheduled or live.")
    edited = edited or {}
    done = []
    for r in rw["rows"]:
        p = r["platform"]
        if platforms and p not in platforms:
            continue
        text = str(edited.get(p) or r["after"]).strip()[:5000]
        if not text or p not in plan["platforms"]:
            continue
        if plan["captions"].get(p, "") != text:
            plan.setdefault("caption_history", []).append(
                {"ts": int(time.time()), "platform": p, "before": plan["captions"].get(p, ""), "after": text,
                 "via": via, "rewrite": True, "edited": p in edited})
            plan["captions"][p] = text
        r["applied"] = True
        r["after"] = text
        done.append(p)
    rw["status"] = "applied" if all(r["applied"] for r in rw["rows"]) else "partial"
    if plan.get("status") == "awaiting_approval":
        plan["status"] = "draft"
    plans.recheck(plan)
    plans.save(plan, via=via)
    return {"applied": done, "score": {p: plan["score"][p]["value"] for p in plan["platforms"]}, "rewrite": rw}


def drop(plan: dict) -> dict:
    rw = plan.get("rewrite") or {}
    rw["status"] = "dropped"
    plan["rewrite"] = rw
    plans.save(plan, record=False)
    return rw
