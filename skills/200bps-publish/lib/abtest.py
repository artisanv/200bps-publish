"""Hook A/B test with Instagram Trial Reels.

One Reel, two hooks: version A (the post's caption and cover) and version B
(a different first line, and optionally a different cover). Both go out as
Trial Reels at the same time, so Instagram shows them only to non-followers
and neither touches the user's followers. After a few days we compare them
with the user's own numbers from Zernio: skip rate (the hook's job), average
watch time, then reach. The user then shares the winner to followers in the
Instagram app (Instagram has no API for that).

Nothing goes out without a typed "go". No invented numbers: with too few
views, or too small a gap, it says so.
"""
from __future__ import annotations

import copy
import time
import uuid
from datetime import datetime, timezone

import hitl
import plan as plans
from store import append_log, read_json, state_dir, write_json
from zernio import Zernio, ZernioError

MIN_VIEWS = 100          # each version, before we call a winner
MIN_HOURS = 48           # Instagram needs time to show trials to enough people
SKIP_GAP = 0.05          # 5 points of skip rate
WATCH_GAP = 0.10         # 10% more average watch time


def _path():
    return state_dir() / "abtests.json"


def _db() -> dict:
    return read_json(_path()) or {"tests": []}


def _save(db: dict) -> None:
    write_json(_path(), db)


def eligible(plan: dict) -> str:
    """Empty when this plan can run a hook test, else the reason."""
    if not plan:
        return "Open a post first."
    if "instagram" not in plan.get("platforms", []):
        return "Hook tests run on Instagram: add Instagram to this post."
    if plans.type_for(plan, "instagram") != "reel":
        return "Hook tests need a Reel (one video)."
    if not plans.editable(plan):
        return "This post is already scheduled or live."
    return ""


def setup(plan: dict, caption_b: str | None = None, cover_b: str | None = None, via: str = "dashboard") -> dict:
    """Save version B on the plan (nothing goes out)."""
    why = eligible(plan)
    if why:
        raise ValueError(why)
    ab = dict(plan.get("abtest") or {})
    if caption_b is not None:
        ab["captionB"] = caption_b.strip()
    if cover_b is not None:
        keys = {f"{c['kind']}:{c['n']}": c for c in plan.get("coverCandidates", [])}
        if cover_b and cover_b not in keys:
            raise ValueError("Pick one of this post's cover options.")
        ab["coverB"] = cover_b or ""
    ab["via"] = via
    plan["abtest"] = ab
    plans.save(plan, record=False)
    return ab


def ask_hook(plan: dict) -> dict:
    why = eligible(plan)
    if why:
        raise ValueError(why)
    cap = plan["captions"].get("instagram", "")
    n = hitl.add_note(
        f"Write hook B for my Reel '{plan['id']}': the same caption with a different first line (a different angle, "
        f"not a rewording), my voice and language. Save it with: bps.py abtest hook --file <caption.txt> --note \"<why>\".",
        {"type": "ab_hook", "plan": plan["id"], "caption": cap[:2200]})
    return {"note": n["id"]}


def _ig_only(body: dict, plan: dict) -> dict:
    b = copy.deepcopy(body)
    b["platforms"] = [p for p in b["platforms"] if p["platform"] == "instagram"]
    for p in b["platforms"]:
        psd = p.setdefault("platformSpecificData", {})
        psd["trialParams"] = {"graduationStrategy": "MANUAL"}       # the user picks the winner
        p.pop("customContent", None)
    b["content"] = plan["captions"].get("instagram", b.get("content", ""))
    return b


def start(plan: dict, confirm: str, via: str = "dashboard") -> dict:
    """Create both Trial Reels in Zernio (typed go)."""
    if (confirm or "").strip().lower() != "go":
        raise PermissionError("Type go to start the test.")
    why = eligible(plan)
    if why:
        raise ValueError(why)
    ab = plan.get("abtest") or {}
    cap_b = (ab.get("captionB") or "").strip()
    cap_a = plan["captions"].get("instagram", "").strip()
    if not cap_b:
        raise ValueError("Write hook B first.")
    if cap_b == cap_a and not ab.get("coverB"):
        raise ValueError("Version B is the same as A. Change the first line (or the cover).")
    import checks
    lim = checks.RULES["instagram"]["caption_max"]
    if len(cap_b) > lim:
        raise ValueError(f"Hook B's caption is {len(cap_b)} characters; Instagram allows {lim}.")
    plans.recheck(plan)
    ig_block = [c for c in plan["blocking"] if c.get("platform") in (None, "instagram")]
    if ig_block:
        raise ValueError("Fix first: " + "; ".join(c["msg"] for c in ig_block))
    z = Zernio()
    import jobs
    jobs.here(step="Uploading the Reel", pct=10)
    body_a = _ig_only(plans.build_body(plan, z), plan)
    body_b = copy.deepcopy(body_a)
    body_b["content"] = cap_b
    if ab.get("coverB"):
        c = next(c for c in plan.get("coverCandidates", []) if f"{c['kind']}:{c['n']}" == ab["coverB"])
        from pathlib import Path
        url = plan.setdefault("uploads", {}).get(c["path"]) or z.upload(Path(c["path"]))
        plan["uploads"][c["path"]] = url
        for p in body_b["platforms"]:
            p["platformSpecificData"]["instagramThumbnail"] = url
    for b in (body_a, body_b):
        v = z.validate_post(b)
        if isinstance(v, dict) and (v.get("valid") is False or v.get("errors")):
            raise ValueError(f"Zernio validation rejected the post: {v.get('errors') or v}")
    tid = "ab-" + uuid.uuid4().hex[:8]
    ids = []
    for label, b in (("A", body_a), ("B", body_b)):
        jobs.here(step=f"Creating version {label}", pct=55 if label == "A" else 75)
        try:
            res = z.create_post(b, idempotency_key=f"bps-{tid}-{label}")
        except Exception:
            if ids:                                   # A is already out: record it, so a retry can't post it twice
                plan["result"] = {"postId": ids[0], "status": "scheduled" if body_a.get("scheduledFor") else "published",
                                  "abtest": tid, "at": int(time.time()), "note": "version B failed"}
                plan["status"] = plan["result"]["status"]
                plans.save(plan, record=False)
                append_log({"event": "abtest_partial", "test": tid, "plan": plan["id"], "posts": ids, "via": via})
            raise
        post = res.get("post", res)
        ids.append(post.get("_id"))
    test = {"id": tid, "plan": plan["id"], "created": int(time.time()), "at": body_a.get("scheduledFor") or "",
            "status": "running", "via": via,
            "variants": [{"label": "A", "postId": ids[0], "caption": cap_a, "cover": (plan.get("cover") or {}).get("file", "")},
                         {"label": "B", "postId": ids[1], "caption": cap_b, "cover": ab.get("coverB", "")}]}
    db = _db()
    db["tests"].insert(0, test)
    _save(db)
    plan["abtest"] = {**ab, "test": tid}
    plan["result"] = {"postId": ids[0], "status": "scheduled" if body_a.get("scheduledFor") else "published",
                      "abtest": tid, "at": int(time.time())}
    plan["status"] = plan["result"]["status"]
    plans.save(plan, record=False)
    append_log({"event": "abtest_start", "test": tid, "plan": plan["id"], "posts": ids, "via": via})
    hitl.add_note(f"Started hook test {tid}: two Instagram Trial Reels ({ids[0]} / {ids[1]}).",
                  {"type": "abtest_started", "test": tid, "posts": ids})
    return test


def _metrics(z: Zernio, post_id: str) -> dict:
    try:
        r = z.analytics(postId=post_id)
    except ZernioError as e:
        return {"error": str(e)}
    a = r.get("post", r) if isinstance(r, dict) else {}
    m = a.get("analytics") or {}
    if not m:
        ent = next((p for p in a.get("platforms") or [] if p.get("platform") == "instagram"), {})
        m = ent.get("analytics") or {}
    pub = a.get("publishedAt")
    url = a.get("platformPostUrl") or next((p.get("platformPostUrl") for p in a.get("platforms") or [] if p.get("platformPostUrl")), "")
    keys = ("views", "reach", "likes", "comments", "shares", "saves", "follows", "igReelsAvgWatchTime", "reelsSkipRate")
    return {**{k: m.get(k) for k in keys}, "publishedAt": pub, "url": url}


def verdict(a: dict, b: dict, hours: float) -> dict:
    """Pick a winner only when the evidence is there; say why either way."""
    va, vb = a.get("views") or 0, b.get("views") or 0
    if hours < MIN_HOURS:
        return {"winner": None, "why": f"Too early: {int(hours)} hours in. Check after {MIN_HOURS} hours."}
    if va < MIN_VIEWS or vb < MIN_VIEWS:
        return {"winner": None, "why": f"Not enough views yet (A {va}, B {vb}; {MIN_VIEWS} each needed)."}
    sa, sb = a.get("reelsSkipRate"), b.get("reelsSkipRate")
    if sa is not None and sb is not None and abs(sa - sb) >= SKIP_GAP:
        w = "A" if sa < sb else "B"
        return {"winner": w, "by": "skip", "why": f"Version {w} lost fewer viewers in the first seconds: skip rate {round(min(sa, sb) * 100)}% vs {round(max(sa, sb) * 100)}%."}
    wa, wb = a.get("igReelsAvgWatchTime") or 0, b.get("igReelsAvgWatchTime") or 0
    if wa and wb and abs(wa - wb) / max(wa, wb) >= WATCH_GAP:
        w = "A" if wa > wb else "B"
        return {"winner": w, "by": "watch", "why": f"Version {w} kept people watching longer: {max(wa, wb) / 1000:.1f}s vs {min(wa, wb) / 1000:.1f}s on average."}
    return {"winner": None, "why": "Too close to call: skip rate and watch time are within the margin. Either hook works."}


def results(test_id: str) -> dict:
    db = _db()
    test = next((t for t in db["tests"] if t["id"] == test_id), None)
    if not test:
        raise ValueError("Unknown test.")
    z = Zernio()
    ms = [_metrics(z, v["postId"]) for v in test["variants"]]
    pubs = [m.get("publishedAt") for m in ms if m.get("publishedAt")]
    hours = 0.0
    if pubs:
        try:
            first = min(datetime.fromisoformat(p.replace("Z", "+00:00")) for p in pubs)
            hours = (datetime.now(timezone.utc) - first).total_seconds() / 3600
        except ValueError:
            pass
    v = verdict(ms[0], ms[1], hours) if len(pubs) == 2 else {"winner": None, "why": "Not live yet."}
    test.update({"metrics": ms, "verdict": v, "checked": int(time.time()), "hours": round(hours, 1)})
    if v.get("winner"):
        test["status"] = "decided"
    _save(db)
    return test


def tests() -> list[dict]:
    return _db()["tests"]
