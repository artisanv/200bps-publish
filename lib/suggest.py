"""Caption fix suggestions: propose -> user approves / edits / rejects -> apply.

The agent writes an improved caption aimed at the failing checks. This module
scores the current and proposed text with the same checks, shows the user a
before/after (dashboard pop-up or chat), and applies it only on approval.
Every applied change is backed up in plan["caption_history"], and the
original caption files in the post folder are never modified.
"""
from __future__ import annotations

import time
import uuid

import checks
import hitl
import plan as plans
from store import config


def _score(plan: dict, platform: str, text: str) -> dict:
    cfg = config()
    tmp = {**plan, "captions": {**plan["captions"], platform: text}}
    scan = {"media": plan["media"], "cover": plan.get("cover")}
    cc = checks.check_caption(text, platform, cfg) + checks.check_media(scan, platform) + plans._extra_checks(tmp, platform)
    timing = None
    if (plan.get("bestTime") or {}).get("basis") == "data":
        timing = (plan.get("score") or {}).get(platform, {}).get("parts", {}).get("timing")
    sc = checks.score(cc, plan["type"], timing, bool(cfg.get("keywords")))
    return {"value": sc["value"], "failing": sorted({c["id"] for c in cc if c["status"] in ("fail", "warn")})}


def propose(platforms: list[str], text: str, reasons: list[str], checks_fixed: list[str] | None = None) -> dict:
    plan = plans.load()
    if not plan:
        raise ValueError("No current plan.")
    bad = [p for p in platforms if p not in plan["platforms"]]
    if bad:
        raise ValueError(f"Not in this post: {', '.join(bad)}")
    rows = []
    for p in platforms:
        before = plan["captions"].get(p, "")
        b, a = _score(plan, p, before), _score(plan, p, text)
        rows.append({"platform": p, "before": before, "scoreBefore": b["value"], "scoreAfter": a["value"],
                     "fixed": sorted(set(b["failing"]) - set(a["failing"])),
                     "stillFailing": a["failing"], "newIssues": sorted(set(a["failing"]) - set(b["failing"]))})
    sid = "fix-" + uuid.uuid4().hex[:6]
    s = {"id": sid, "platforms": platforms, "after": text, "reasons": reasons, "rows": rows, "status": "pending",
         "created": int(time.time())}
    plan.setdefault("suggestions", []).append(s)
    # link open dashboard fix requests to this suggestion (stops duplicate requests)
    fr = plan.setdefault("fixRequests", {})
    for p in platforms:
        for cid in (checks_fixed or []) + [c for r in rows if r["platform"] == p for c in r["fixed"]]:
            fr[f"{cid}:{p}"] = {"status": "suggested", "questionId": sid, "ts": int(time.time())}
    plans.save(plan)
    q = hitl.create(
        f"Apply this caption fix to {', '.join(platforms)}?", kind="fix",
        options=["approve", "edit", "reject"], qid=sid,
        context="; ".join(reasons), extra={"suggestion": s},
    )
    return {"suggestion": s, "question": q["id"]}


def resolve(sid: str, q: dict) -> dict:
    plan = plans.load()
    s = next((x for x in plan.get("suggestions", []) if x["id"] == sid), None)
    if not s:
        raise ValueError("Unknown suggestion.")
    plan["fixRequests"] = {k: v for k, v in plan.get("fixRequests", {}).items() if v.get("questionId") != sid}
    ans = (q.get("answer") or "").lower()
    if q.get("status") != "answered" or ans == "reject":
        s["status"] = "rejected" if ans == "reject" else q.get("status", "timeout")
        plans.save(plan)
        return {"applied": False, "status": s["status"], "note": q.get("note")}
    text = q.get("edited") if ans == "edit" else s["after"]
    for p in s["platforms"]:
        plan.setdefault("caption_history", []).append(
            {"ts": int(time.time()), "platform": p, "before": plan["captions"].get(p, ""), "after": text,
             "suggestion": sid, "via": q.get("via"), "edited": ans == "edit"})
        plan["captions"][p] = text
    s["status"] = "edited" if ans == "edit" else "approved"
    plan["status"] = "draft" if plan.get("status") == "awaiting_approval" else plan.get("status")
    plans.recheck(plan)
    plans.save(plan)
    return {"applied": True, "status": s["status"], "note": q.get("note"),
            "score": {p: plan["score"][p]["value"] for p in s["platforms"]},
            "blocking": [c["msg"] for c in plan["blocking"]]}


def undo(platform: str) -> dict:
    plan = plans.load()
    hist = [h for h in plan.get("caption_history", []) if h["platform"] == platform]
    if not hist:
        raise ValueError(f"No earlier caption for {platform}.")
    last = hist[-1]
    plan["captions"][platform] = last["before"]
    plan["caption_history"].remove(last)
    plans.recheck(plan)
    plans.save(plan)
    return {"restored": platform, "score": plan["score"][platform]["value"]}
