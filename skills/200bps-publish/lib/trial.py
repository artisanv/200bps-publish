"""Trial Reels for Instagram Reels that aren't published yet.

Lists every Instagram Reel still waiting to go out (scheduled, draft or failed
in Zernio, plus local drafts), shows advice built only from the user's own
results and Instagram's own help pages, and switches Trial on or off for each.

A post that is already in Zernio changes something that goes public, so the
change needs the typed word "edit" (like moving or editing a post) and is read
back from Zernio afterwards. Local drafts change only on this computer.
"""
from __future__ import annotations

import time

import hitl
import plan as plans
from store import append_log, config, read_json, state_dir
from zernio import Zernio

EDITABLE = ("scheduled", "draft", "failed", "partial", "cancelled")
GRADS = ("SS_PERFORMANCE", "MANUAL")

# What Instagram itself says (help.instagram.com/1013292530224018 and
# creators.instagram.com/blog/instagram-trial-reels, checked 2026-11-07).
FACTS = [
    {"en": "Trial Reels go to people who don't follow you; your followers don't see them in Feed or Reels.",
     "ar": "الـTrial Reels تنعرض لناس ما يتابعونك؛ متابعينك ما يشوفونها بالفيد ولا الريلز."},
    {"en": "Instagram shows views, likes, comments and shares about 24 hours after posting.",
     "ar": "انستقرام يعطيك المشاهدات واللايكات والتعليقات والمشاركات بعد تقريباً 24 ساعة."},
    {"en": "Automatic shares it with your followers if it does well on views in its first 72 hours.",
     "ar": "التلقائي ينشره لمتابعينك إذا أدّى زين بالمشاهدات أول 72 ساعة."},
    {"en": "Use a new Reel: Instagram may limit a trial's reach if you've shared the same content before.",
     "ar": "استخدم ريل جديد: انستقرام ممكن يقلل وصول التجربة إذا نشرت نفس المحتوى قبل."},
    {"en": "Trial Reels are ranked on their own and don't affect your normal Reels.",
     "ar": "الـTrial Reels تنقيّم لحالها وما تأثر على ريلزك العادية."},
]
SOURCE = "https://help.instagram.com/1013292530224018"


def _first(text: str) -> str:
    return " ".join((text or "").strip().split("\n")[0].split()).lower()


def _ig(zp: dict) -> dict | None:
    return next((x for x in zp.get("platforms") or [] if x.get("platform") == "instagram"), None)


def candidates(cache: dict | None = None) -> list[dict]:
    """Every Instagram Reel not published yet: Zernio posts and local drafts."""
    cache = cache if cache is not None else (read_json(state_dir() / "cache.json") or {})
    out = []
    for zp in cache.get("zposts") or []:
        ig = _ig(zp)
        if zp.get("kind") != "reel" or not ig or zp.get("status") not in EDITABLE or ig.get("status") == "published":
            continue
        out.append({"id": zp["id"], "where": "zernio", "status": zp.get("status"), "caption": zp.get("caption") or "",
                    "at": zp.get("scheduledFor"), "thumb": (zp.get("thumbs") or [None])[0], "video": zp.get("video"),
                    "trial": bool(ig.get("trial")), "graduation": ig.get("graduation") or ("SS_PERFORMANCE" if ig.get("trial") else None),
                    "account": ig.get("account")})
    for f in sorted((state_dir() / "plans").glob("*.json")):
        p = plans.load(f.stem)
        if not p or (p.get("result") or {}).get("postId") or "instagram" not in (p.get("platforms") or []):
            continue
        if plans.type_for(p, "instagram") != "reel" or not plans.editable(p):
            continue
        s = (p.get("settings") or {}).get("instagram") or {}
        out.append({"id": p["id"], "where": "local", "status": "local", "caption": (p.get("captions") or {}).get("instagram", ""),
                    "at": (p.get("schedule") or {}).get("at"), "thumb": None, "video": None, "folder": p.get("folder"),
                    "trial": bool(s.get("trial")), "graduation": s.get("graduation") or "SS_PERFORMANCE", "account": None})
    return sorted(out, key=lambda c: c.get("at") or "9999")


def _avg(rows: list[dict], k: str):
    v = [r["metrics"].get(k) for r in rows if r["metrics"].get(k) is not None]
    return round(sum(v) / len(v)) if v else None


def stats(cache: dict | None = None) -> dict:
    """The user's own published Instagram Reels: trial vs normal. No guessing:
    a comparison is only drawn with at least 3 of each."""
    cache = cache if cache is not None else (read_json(state_dir() / "cache.json") or {})
    reels = {}
    for zp in cache.get("zposts") or []:
        ig = _ig(zp)
        if zp.get("kind") == "reel" and ig and ig.get("status") == "published":
            reels[zp["id"]] = bool(ig.get("trial"))
    rows = [p for p in cache.get("posts") or [] if p.get("platform") == "instagram" and p.get("zid") in reels]
    trial = [p for p in rows if reels[p["zid"]]]
    normal = [p for p in rows if not reels[p["zid"]]]
    keys = ("views", "reach", "shares", "saves", "follows")
    res = {"trial": {"n": len(trial), **{k: _avg(trial, k) for k in keys}},
           "normal": {"n": len(normal), **{k: _avg(normal, k) for k in keys}}, "verdict": "few"}
    t, n = res["trial"], res["normal"]
    if t["n"] >= 3 and n["n"] >= 3 and t["views"] is not None and n["views"]:
        lift = round(100 * (t["views"] - n["views"]) / n["views"])
        res["viewsLift"] = lift
        res["verdict"] = "trial" if lift >= 10 else "normal" if lift <= -10 else "same"
        low = min(t["n"], n["n"])
        res["confidence"] = "high" if low >= 10 else "medium" if low >= 5 else "low"
    return res


def advice(cache: dict | None = None) -> dict:
    """Per post: warnings and the recommended choice, each with its reason."""
    cache = cache if cache is not None else (read_json(state_dir() / "cache.json") or {})
    st = stats(cache)
    cands = candidates(cache)
    published: dict[str, set] = {}               # first line -> Zernio ids already live on Instagram
    for zp in cache.get("zposts") or []:
        ig = _ig(zp)
        if ig and ig.get("status") == "published" and _first(zp.get("caption")):
            published.setdefault(_first(zp.get("caption")), set()).add(zp["id"])
    seen: dict[str, int] = {}
    for c in cands:
        seen[_first(c["caption"])] = seen.get(_first(c["caption"]), 0) + 1
    default = ((config().get("instagram") or {}).get("trial_graduation")) or "SS_PERFORMANCE"
    items = []
    for c in cands:
        notes = []
        fl = _first(c["caption"])
        if fl and published.get(fl, set()) - {c["id"]}:
            notes.append({"kind": "warn", "key": "trDupPub"})          # Instagram limits trials of content shared before
        elif fl and seen.get(fl, 0) > 1:
            notes.append({"kind": "warn", "key": "trDupSched", "n": seen[fl]})
        if c.get("at"):
            try:
                from datetime import datetime
                mins = (datetime.fromisoformat(str(c["at"]).replace("Z", "+00:00")).timestamp() - time.time()) / 60
                if 0 < mins < 30:
                    notes.append({"kind": "warn", "key": "trSoon", "n": round(mins)})
            except ValueError:
                pass
        rec_trial = st["verdict"] == "trial"
        items.append({**c, "notes": notes, "recTrial": rec_trial, "recGraduation": default})
    return {"stats": st, "items": items, "facts": FACTS, "source": SOURCE, "default": default}


def _set_zernio(z: Zernio, post_id: str, on: bool, grad: str) -> dict:
    p = z.post(post_id)
    p = p.get("post", p)
    if p.get("status") not in EDITABLE:
        raise ValueError(f"This post is {p.get('status')}; Zernio can't change it any more.")
    kinds = [m.get("type") for m in p.get("mediaItems") or []]
    if kinds != ["video"]:
        raise ValueError("Only a Reel (one video) can be a Trial Reel.")
    out, changed = [], False
    for t in p.get("platforms") or []:
        acc = t.get("accountId")
        e = {"platform": t["platform"], "accountId": acc.get("_id") if isinstance(acc, dict) else acc}
        for f in ("customContent", "customMedia", "platformSpecificData"):      # keep everything else as it is
            if t.get(f):
                e[f] = t[f] if f != "customMedia" else [{"type": m.get("type"), "url": m.get("url")} for m in t[f] if m.get("url")]
        if t["platform"] == "instagram" and t.get("status") != "published":
            psd = dict(e.get("platformSpecificData") or {})
            if on:
                psd["trialParams"] = {"graduationStrategy": grad}
            else:
                psd.pop("trialParams", None)
            e["platformSpecificData"] = psd
            changed = True
        out.append(e)
    if not changed:
        raise ValueError("This post has no Instagram Reel waiting to go out.")
    z.update_post(post_id, {"platforms": out})
    back = z.post(post_id)
    back = back.get("post", back)
    ig = next((t for t in back.get("platforms") or [] if t.get("platform") == "instagram"), {})
    tp = (ig.get("platformSpecificData") or {}).get("trialParams") or {}
    now_on = bool(tp) or bool(ig.get("isTrialReel"))
    now_grad = tp.get("graduationStrategy") or ig.get("trialGraduationStrategy")
    return {"trial": now_on, "graduation": now_grad, "matches": now_on == on and (not on or now_grad == grad)}


def apply(changes: list[dict], typed: str = "", via: str = "dashboard") -> dict:
    """changes: [{id, where: zernio|local, trial: bool, graduation}]. Zernio posts
    need the typed word "edit"; each one is read back."""
    changes = [c for c in changes or [] if c.get("id")]
    if not changes:
        raise ValueError("Nothing to change.")
    for c in changes:
        c["graduation"] = c.get("graduation") or "SS_PERFORMANCE"
        if c["graduation"] not in GRADS:
            raise ValueError("After the trial is SS_PERFORMANCE (automatic) or MANUAL.")
    if any(c.get("where") != "local" for c in changes) and (typed or "").strip().lower() != "edit":
        raise PermissionError("Type edit to confirm.")
    z, results = None, []
    for c in changes:
        try:
            if c.get("where") == "local":
                p = plans.load(c["id"])
                if not p:
                    raise ValueError("Draft not found.")
                plans.set_setting(p, "instagram.trial", "on" if c.get("trial") else "off", via=via, make_current=False)
                if c.get("trial"):
                    plans.set_setting(p, "instagram.graduation", c["graduation"], via=via, make_current=False)
                r = {"trial": bool(c.get("trial")), "graduation": c["graduation"] if c.get("trial") else None, "matches": True}
            else:
                z = z or Zernio()
                r = _set_zernio(z, c["id"], bool(c.get("trial")), c["graduation"])
            results.append({"id": c["id"], "ok": True, **r})
        except Exception as e:                  # one bad post doesn't stop the others
            results.append({"id": c["id"], "ok": False, "error": str(e)[:300]})
    done = [r for r in results if r["ok"]]
    if any(c.get("where") != "local" for c in changes):
        (state_dir() / "cache.json").unlink(missing_ok=True)
    append_log({"ts": int(time.time()), "event": "trial_changed", "via": via,
                "changes": [{k: c.get(k) for k in ("id", "where", "trial", "graduation")} for c in changes], "ok": len(done)})
    if via == "dashboard" and done:
        on = sum(1 for r in done if r["trial"])
        hitl.add_note(f"I changed Trial Reel on {len(done)} Instagram Reel(s) from the dashboard ({on} now trial). It's already done.",
                      {"type": "trial_changed", "ids": [r["id"] for r in done]})
    return {"results": results, "done": len(done), "failed": len(results) - len(done)}
