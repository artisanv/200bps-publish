"""Post plans: analyse a folder -> plan.json -> (approval) -> publish.

A plan is the single source of truth the agent edits and the dashboard
shows. Publishing refuses to run unless the plan status is
"awaiting_approval" AND the caller passes confirm=True, which the agent
does only after the user says yes in chat.
"""
from __future__ import annotations

import hashlib
import re
import time
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import checks
import media
from store import append_log, config, read_json, state_dir, write_json
from zernio import Zernio, ZernioError

# Platforms this release publishes to. Facebook and Threads support is kept in
# the code (RULES, settings, build_body) but switched off; add them back here.
PLATFORMS = ("instagram", "linkedin", "tiktok", "snapchat", "facebook")
# which post types each network takes; a post skips a network that can't show it
FITS = {"instagram": ("reel", "single", "carousel"), "tiktok": ("reel", "single", "carousel"), "snapchat": ("reel", "single"), "facebook": ("reel", "single", "carousel", "text")}
LI_KINDS = ("post", "poll", "repost")
POLL_DURATIONS = ("ONE_DAY", "THREE_DAYS", "SEVEN_DAYS", "FOURTEEN_DAYS")
TIKTOK_PRIVACY = ("PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "FOLLOWER_OF_CREATOR", "SELF_ONLY")


def plan_path(plan_id: str) -> Path:
    return state_dir() / "plans" / f"{plan_id}.json"


def current_id() -> str | None:
    p = state_dir() / "current.txt"
    return p.read_text().strip() if p.exists() else None


def load(plan_id: str | None = None) -> dict | None:
    pid = plan_id or current_id()
    return read_json(plan_path(pid)) if pid else None


TRACKED = {
    "captions": "Caption", "schedule": "Time", "cover": "Cover", "dm": "Gift",
    "settings": "Settings", "platforms": "Platforms", "media": "Media", "targets": "Accounts",
}


def _label(field: str, v) -> str:
    if v in (None, {}, [], ""):
        return "none"
    if field == "schedule":
        return v.get("at") or v.get("mode") or "none"
    if field == "cover":
        return str(v.get("source") or v.get("file"))
    if field == "dm":
        return f"on · {v.get('keyword')}" if v.get("enabled") else ("off" if v.get("asked") else "not set")
    if field == "platforms":
        return ", ".join(v)
    if field == "targets":
        return ", ".join(f"{k} ×{len(x)}" for k, x in v.items())
    if field == "captions":
        return "edited"
    if field == "media":
        return f"{len(v)} file" + ("" if len(v) == 1 else "s")
    return "changed"


def save(plan: dict, via: str = "", record: bool = True, make_current: bool = True) -> None:
    """Save the plan. Changes to tracked fields are recorded in plan["history"]
    (newest last) so any single choice can be reverted before publishing."""
    old = read_json(plan_path(plan["id"])) or {}
    if record and old:
        hist = plan.setdefault("history", old.get("history", []))
        for f in TRACKED:
            if f in plan and old.get(f) != plan.get(f):
                hist.append({"id": hashlib.sha1(f"{f}{time.time()}{len(hist)}".encode()).hexdigest()[:8],
                             "ts": int(time.time()), "field": f, "title": TRACKED[f],
                             "before": old.get(f), "after": plan.get(f),
                             "from": _label(f, old.get(f)), "to": _label(f, plan.get(f)), "via": via or "claude"})
        plan["history"] = hist[-60:]
    plan["updated"] = int(time.time())
    write_json(plan_path(plan["id"]), plan)
    if make_current:
        (state_dir() / "current.txt").write_text(plan["id"])


def clear_current() -> str | None:
    """Start fresh: the dashboard stops showing the current post. Nothing is
    deleted: the plan file stays and appears under Posts → Not uploaded."""
    import hitl
    cur = current_id()
    (state_dir() / "current.txt").unlink(missing_ok=True)
    q = hitl.pending()
    if q:
        hitl.cancel(q["id"])       # questions belonged to the post being set aside
    return cur


def publish_from_dashboard(typed: str) -> dict:
    """The dashboard's Publish button. The user typed the confirm word ("go")
    in their own local dashboard; that is their explicit approval, so this runs
    the same checks and publish path as `bps.py ready` + `publish --confirm`,
    then reads the post back from Zernio as proof it is there."""
    import accounts as acct
    import hitl
    if (typed or "").strip().lower() != "go":
        raise PermissionError("Type go to publish.")
    plan = load()
    if not plan:
        raise ValueError("No post open.")
    if not editable(plan):
        raise ValueError("This post is already " + plan.get("status", "sent") + ". See the Posts tab.")
    z = Zernio()
    rec = acct.reconcile(acct.live(z))
    missing = [p for p in plan["platforms"] if p not in rec["connected"]]
    if missing:
        raise ValueError("Not connected in Zernio: " + ", ".join(missing) + ".")
    recheck(plan)
    if plan["blocking"]:
        raise ValueError("Fix first: " + "; ".join(c["msg"] for c in plan["blocking"]))
    plan["status"] = "awaiting_approval"
    save(plan, record=False)
    plan = publish(plan, confirm=True)
    out = {"postId": plan["result"]["postId"], "status": plan["status"], "platforms": plan["result"].get("platforms")}
    # proof: read it back from Zernio
    import jobs
    jobs.here(step="Checking it in Zernio", pct=88)
    try:
        zp = z.post(out["postId"])
        zp = zp.get("post", zp)
        out["verified"] = {"status": zp.get("status"), "scheduledFor": zp.get("scheduledFor"),
                           "platforms": [{"platform": t.get("platform"), "status": t.get("status"),
                                          "url": t.get("platformPostUrl"), "error": t.get("errorMessage")} for t in zp.get("platforms") or []]}
    except ZernioError as e:
        out["verified"] = {"error": str(e)}
    # the gift the user switched on is part of what they approved
    if (plan.get("dm") or {}).get("enabled"):
        try:
            create_dm(plan, confirm=True)
            out["dm"] = {"ok": True, "keyword": plan["dm"]["keyword"]}
        except Exception as e:  # the post is live either way; report the gift separately
            out["dm"] = {"ok": False, "error": str(e)}
    q = hitl.pending()
    if q and q.get("kind") == "publish":
        hitl.cancel(q["id"])                      # Claude's own "Publish?" question is now moot
    hitl.add_note(f"Published from the dashboard: Zernio post {out['postId']} ({out['status']}).",
                  {"type": "published", "postId": out["postId"], "status": out["status"]})
    append_log({"event": "publish_via_dashboard", "plan": plan["id"], "postId": out["postId"]})
    return out


def list_plans() -> list[dict]:
    """Every local post plan, newest first (for the Posts tab)."""
    out = []
    for f in (state_dir() / "plans").glob("*.json"):
        p = read_json(f) or {}
        if not p.get("id"):
            continue
        cap = next(iter((p.get("captions") or {}).values()), "")
        out.append({"id": p["id"], "folder": p.get("folder"), "type": p.get("type"), "platforms": p.get("platforms"),
                    "status": p.get("status"), "at": (p.get("schedule") or {}).get("at"), "caption": cap,
                    "postId": (p.get("result") or {}).get("postId"), "remote": p.get("remote"),
                    "score": {k: v.get("value") for k, v in (p.get("score") or {}).items()}, "updated": p.get("updated"),
                    "firstMedia": ({"file": p["media"][0]["file"], "kind": p["media"][0]["kind"]} if p.get("media") else None),
                    "hasCover": bool(p.get("cover")), "mediaCount": len(p.get("media") or []),
                    "mediaList": [{"file": m["file"], "kind": m["kind"]} for m in p.get("media") or []], "captions": p.get("captions"),
                    "kind": {"reel": "reel", "carousel": "carousel", "single": "post", "document": "document", "text": "text"}.get(p.get("type"), "post")})
    return sorted(out, key=lambda x: -(x.get("updated") or 0))


SETTABLE = {
    "instagram": {"firstComment": str, "collaborators": list, "trial": bool, "graduation": str, "locationId": str, "locationName": str},
    "linkedin": {"firstComment": str, "documentTitle": str, "organizationUrn": str, "kind": str, "poll": dict, "reshareUrl": str},
    "tiktok": {"privacyLevel": str, "allowComment": bool, "allowDuet": bool, "allowStitch": bool, "commercialContentType": str,
               "videoMadeWithAi": bool, "draft": bool, "consent": bool},
    "snapchat": {"contentType": str},
    "facebook": {"format": str, "title": str, "firstComment": str, "draft": bool, "pageId": str},
}


def accounts_for(plan: dict, platform: str) -> list[str]:
    """The accounts a post goes to on one network: the user's pick for this
    post (plan["targets"]), else the account chosen in setup."""
    picked = [a for a in ((plan.get("targets") or {}).get(platform) or []) if a]
    if picked:
        return picked
    acc = ((config().get("accounts") or {}).get(platform) or {}).get("id")
    return [acc] if acc else []


def set_targets(plan: dict, targets: dict, known: list[dict], via: str = "dashboard") -> dict:
    """Pick the accounts per network for this post. Every id must be a
    connected account of that network; each network keeps at least one."""
    ok = {}
    for pf, ids in (targets or {}).items():
        if pf not in plan["platforms"]:
            continue
        valid = [a["id"] for a in known if a.get("platform") == pf]
        ids = [str(i) for i in ids if str(i) in valid]
        if not ids:
            raise ValueError(f"Pick at least one {pf} account.")
        ok[pf] = list(dict.fromkeys(ids))
    plan["targets"] = {**(plan.get("targets") or {}), **ok}
    if plan.get("status") == "awaiting_approval":
        plan["status"] = "draft"
    recheck(plan)
    save(plan, via=via)                      # recorded in history, so it can be reverted
    return plan


def set_networks(plan: dict, wanted: list[dict], known: list[dict], via: str = "dashboard") -> dict:
    """A local draft: turn networks / accounts on or off. wanted = [{platform, accountId}]."""
    by = {}
    for w in wanted or []:
        pf, acc = str(w.get("platform") or ""), str(w.get("accountId") or "")
        if pf in PLATFORMS and any(a.get("id") == acc and a.get("platform") == pf for a in known):
            by.setdefault(pf, []).append(acc)
    if not by:
        raise ValueError("Keep at least one network on.")
    for pf in by:
        t = type_for(plan, pf)
        if pf in FITS and t not in FITS[pf]:
            raise ValueError(f"{pf.capitalize()} can't show a {t} post.")
    first = plan["captions"].get((plan.get("platforms") or [None])[0], "") if plan.get("platforms") else ""
    plan["platforms"] = [pf for pf in PLATFORMS if pf in by]
    for pf in plan["platforms"]:
        plan["captions"].setdefault(pf, first)
    plan["targets"] = by
    plan["skipped_platforms"] = [pf for pf in plan.get("skipped_platforms", []) if pf not in by]
    if plan.get("status") == "awaiting_approval":
        plan["status"] = "draft"
    recheck(plan)
    save(plan, via=via, make_current=False)
    return plan


def media_for(plan: dict, platform: str) -> list[dict]:
    """The media one network gets. A folder with a PDF *and* photos/video is
    split: LinkedIn gets the PDF (a document post), the others get the rest.
    Otherwise every network gets the same media."""
    allm = plan.get("media") or []
    docs = [m for m in allm if m.get("kind") == "document"]
    rest = [m for m in allm if m.get("kind") != "document"]
    if docs and rest:
        return docs[:1] if platform == "linkedin" else rest
    return allm


def type_for(plan: dict, platform: str) -> str:
    return checks.post_type(media_for(plan, platform))


def is_split(plan: dict) -> bool:
    kinds = {m.get("kind") for m in plan.get("media") or []}
    return "document" in kinds and len(kinds) > 1


def content_hash(plan: dict, platform: str) -> str:
    """What the user previewed: caption + media. TikTok's consent is for exactly this."""
    raw = plan["captions"].get(platform, "") + "|" + "|".join(f"{m['file']}:{m.get('bytes')}" for m in media_for(plan, platform))
    return hashlib.sha1(raw.encode()).hexdigest()[:12]


def _coerce(kind, raw: str):
    import json as _j
    if kind is bool:
        v = raw.strip().lower()
        if v in ("true", "yes", "on", "1"):
            return True
        if v in ("false", "no", "off", "0"):
            return False
        raise ValueError("Use true or false.")
    if kind is dict:
        v = _j.loads(raw) if raw.strip() not in ("", "null", "none", "off") else None
        if v is not None and not isinstance(v, dict):
            raise ValueError("Give a JSON object, e.g. {\"question\": \"...\", \"options\": [\"A\", \"B\"]}.")
        return v
    if kind is list:
        try:
            v = _j.loads(raw)
            if isinstance(v, list):
                return [str(x).lstrip("@").strip() for x in v if str(x).strip()]
        except ValueError:
            pass
        return [x.strip().lstrip("@") for x in raw.split(",") if x.strip()]
    return raw


def set_setting(plan: dict, path: str, raw: str, via: str = "chat") -> dict:
    """Set one plan setting, e.g. instagram.firstComment. Records history and re-checks."""
    if not editable(plan):
        raise PermissionError("This post is already scheduled or live.")
    try:
        plat, key = path.split(".", 1)
    except ValueError:
        raise ValueError("Use platform.setting, e.g. instagram.firstComment") from None
    if plat not in SETTABLE or key not in SETTABLE[plat]:
        opts = "; ".join(f"{p}.{k}" for p, ks in SETTABLE.items() for k in ks)
        raise ValueError(f"Unknown setting '{path}'. Settable: {opts}")
    if plat not in plan["platforms"]:
        raise ValueError(f"{plat} is not in this post.")
    val = _coerce(SETTABLE[plat][key], raw)
    if key == "collaborators" and len(val) > 3:
        raise ValueError("Instagram allows up to 3 collaborators.")
    if key == "graduation" and val not in ("MANUAL", "SS_PERFORMANCE"):
        raise ValueError("graduation is MANUAL or SS_PERFORMANCE.")
    if key == "privacyLevel" and val not in TIKTOK_PRIVACY:
        raise ValueError("privacyLevel is one of " + ", ".join(TIKTOK_PRIVACY))
    if key == "commercialContentType" and val not in ("none", "brand_organic", "brand_content"):
        raise ValueError("commercialContentType is none, brand_organic or brand_content.")
    if plat == "facebook" and key == "format" and val not in ("feed", "reel", "story"):
        raise ValueError("format is feed, reel or story.")
    if plat == "snapchat" and key == "contentType" and val not in ("story", "saved_story", "spotlight"):
        raise ValueError("contentType is story, saved_story or spotlight.")
    if plat == "linkedin" and key == "kind" and val not in LI_KINDS:
        raise ValueError("kind is post, poll or repost.")
    if plat == "linkedin" and key == "poll" and val is not None:     # kept while typing; checks flag what's missing
        opts = val.get("options") or []
        if not isinstance(opts, list) or len(opts) > 4:
            raise ValueError("A LinkedIn poll has 2 to 4 choices.")
        dur = str(val.get("duration") or "SEVEN_DAYS")
        if dur not in POLL_DURATIONS:
            raise ValueError("duration is " + ", ".join(POLL_DURATIONS))
        val = {"question": str(val.get("question") or "").strip(), "options": [str(o).strip() for o in opts], "duration": dur}
    if plat == "linkedin" and key == "reshareUrl":
        val = val.strip()
    if plat == "tiktok" and key == "consent":           # stored as the exact content it was given for
        key, val = "consentFor", (content_hash(plan, "tiktok") if val else "")
    settings = {k: dict(v) for k, v in plan["settings"].items()}
    settings.setdefault(plat, {})[key] = val
    if plat == "linkedin" and key == "kind" and val == "poll" and not settings["linkedin"].get("poll"):
        settings["linkedin"]["poll"] = {"question": "", "options": ["", ""], "duration": "SEVEN_DAYS"}
    plan["settings"] = settings
    if plan.get("status") == "awaiting_approval":
        plan["status"] = "draft"
    recheck(plan)
    save(plan, via=via)
    return plan


def editable(plan: dict) -> bool:
    return plan.get("status") not in ("published", "scheduled")


def revert(plan: dict, entry_id: str, via: str = "dashboard") -> dict:
    """Put one field back to its value before a given change."""
    if not editable(plan):
        raise PermissionError("This post is already scheduled or live; ask Claude to change it on the platform.")
    e = next((h for h in plan.get("history", []) if h["id"] == entry_id), None)
    if not e:
        raise ValueError("Unknown change.")
    plan[e["field"]] = e["before"] if e["before"] is not None else ({} if e["field"] in ("dm", "schedule") else None)
    if e["field"] == "dm" and not plan["dm"]:
        plan["dm"] = {"enabled": False, "asked": False}
    if e["field"] == "schedule" and not plan["schedule"]:
        plan["schedule"] = {"mode": "ask"}
    if plan.get("status") == "awaiting_approval":
        plan["status"] = "draft"               # re-confirm before publishing
    recheck(plan)
    save(plan, via=via)
    return plan


def undo_step(plan: dict, step: str, via: str = "dashboard") -> dict:
    """Undo the latest change behind a journey step (cover, time, gift, check)."""
    field = {"cover": "cover", "time": "schedule", "gift": "dm", "check": "captions"}.get(step)
    if not field:
        raise ValueError("Nothing to undo for this step.")
    e = next((h for h in reversed(plan.get("history", [])) if h["field"] == field), None)
    if not e:
        raise ValueError("Nothing to undo yet.")
    return revert(plan, e["id"], via)


def _slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:40] or "post"


def analyze(folder: str, platforms: list[str] | None = None, connected: list[str] | None = None,
            make_current: bool = True) -> dict:
    cfg = config()
    scan = media.scan_folder(Path(folder))
    connected = connected if connected is not None else [p for p in PLATFORMS if (cfg.get("accounts", {}).get(p) or {}).get("id")]
    wanted = [p for p in (platforms or cfg.get("platforms") or list(PLATFORMS)) if p in PLATFORMS]
    plats = [p for p in wanted if p in connected]
    if not plats:
        raise ValueError("None of " + ", ".join(wanted) + " is connected in Zernio. Connect an account at zernio.com, then run doctor.")
    tmp = {"media": scan["media"]}
    rest = [m for m in scan["media"] if m["kind"] != "document"]
    ptype = checks.post_type(rest) if is_split(tmp) else checks.post_type(scan["media"])   # split: the photo/video side
    unfit = {p: type_for(tmp, p) for p in plats if p in FITS and type_for(tmp, p) not in FITS[p]}      # e.g. a PDF on TikTok
    plats = [p for p in plats if p not in unfit] or plats
    pid = _slug(Path(folder).name) + "-" + hashlib.sha1(scan["folder"].encode()).hexdigest()[:6]
    old = load(pid) or {}
    captions = {p: scan["captions"].get(p, scan["captions"].get("default", "")) for p in plats}
    ig_defaults = cfg.get("instagram", {})
    plan = {
        "id": pid,
        "folder": scan["folder"],
        "created": old.get("created", int(time.time())),
        "type": ptype,
        "platforms": plats,
        "captions": captions,
        "original_captions": dict(captions),
        "media": scan["media"],
        "cover": scan["cover"] or old.get("cover"),
        "coverCandidates": old.get("coverCandidates", []),
        "ignored": scan["ignored"],
        "schedule": old.get("schedule", {"mode": "ask"}),
        "settings": old.get("settings", {
            "instagram": {
                "trial": bool(ig_defaults.get("trial_reels", True)) and ptype == "reel",
                "locationId": ig_defaults.get("location_id"),
                "locationName": ig_defaults.get("location_name"),
                "firstComment": "",
                "collaborators": list(ig_defaults.get("collaborators", [])),
            },
            "facebook": {"firstComment": "", "format": "reel" if ptype == "reel" else "feed", "title": "", "draft": False,
                         "pageId": cfg.get("facebook", {}).get("page_id", "")},
            "threads": {"topic_tag": cfg.get("threads", {}).get("topic_tag", "")},
            "linkedin": {"firstComment": "", "documentTitle": "", "organizationUrn": cfg.get("linkedin", {}).get("organization_urn")},
            "tiktok": {"privacyLevel": cfg.get("tiktok", {}).get("privacy_level", ""), "allowComment": True, "allowDuet": True, "allowStitch": True,
                       "commercialContentType": "none", "videoMadeWithAi": bool(cfg.get("label_ai_generated")), "draft": False, "consentFor": ""},
            "snapchat": {"contentType": cfg.get("snapchat", {}).get("content_type", "story")},
        }),
        "dm": old.get("dm", {"enabled": False, "asked": False}),
        "history": old.get("history", []),
        "fixRequests": old.get("fixRequests", {}),
        "skipped_platforms": [p for p in wanted if p not in plats],
        "skipped_reasons": {p: f"{p} can't show a {t} post" for p, t in unfit.items()},
        "status": "draft",
    }
    recheck(plan)
    save(plan, record=False, make_current=make_current)
    return plan


def recheck(plan: dict) -> dict:
    """Recompute checks + score from the plan's current captions/settings."""
    cfg = config()
    all_checks = []
    scan = {"media": plan["media"], "cover": plan.get("cover")}
    bt = (read_json(state_dir() / "cache.json") or {}).get("besttime") or {}
    plan["bestTime"] = {k: bt.get(k) for k in ("basis", "sample", "slots", "note", "next_at", "tz", "byDay", "average")}
    sched = plan.get("schedule", {})
    timing_ok = None
    if bt.get("basis") == "data":
        timing_ok = bool(sched.get("mode") == "best" or (sched.get("at") and _matches_slot(sched["at"], bt)))
    plan["score"] = {}
    plan["types"] = {p: type_for(plan, p) for p in plan["platforms"]}
    for p in plan["platforms"]:
        cc = checks.check_caption(plan["captions"].get(p, ""), p, cfg) + checks.check_media({**scan, "media": media_for(plan, p)}, p)
        cc += _extra_checks(plan, p)
        kind = (plan["settings"].get("linkedin") or {}).get("kind") or "post"
        if p == "linkedin" and kind != "post":     # no media is exactly right for a poll or repost
            cc = [{**c, "status": "pass", "msg": f"No media: right for a LinkedIn {kind}."} if c["id"] == "media.none" else c for c in cc]
        all_checks += cc
        plan["score"][p] = checks.score(cc, plan["types"][p], timing_ok, bool(cfg.get("keywords")))
    plan["checks"] = all_checks
    plan["blocking"] = [c for c in all_checks if c["status"] == "fail"]
    return plan


def _matches_slot(at_iso: str, bt: dict) -> bool:
    try:
        dt = datetime.fromisoformat(at_iso).astimezone(ZoneInfo(bt.get("tz") or "UTC"))
    except ValueError:
        return False
    d = (dt.weekday() + 1) % 7
    return any(s["day"] == d and s["hour"] == dt.hour for s in (bt.get("slots") or [])[:3])


def _extra_checks(plan: dict, p: str) -> list[dict]:
    out = []
    pm, pt = media_for(plan, p), type_for(plan, p)
    kinds = {m["kind"] for m in pm}
    if is_split(plan):
        doc = next(m["file"] for m in plan["media"] if m["kind"] == "document")
        n = len([m for m in plan["media"] if m["kind"] != "document"])
        out.append({"id": "media.split", "platform": p, "status": "pass",
                    "msg": f"LinkedIn gets the PDF ({doc}) as a document post; the other networks get the {n} photo/video item{'s' if n != 1 else ''}."
                    if p == "linkedin" else f"Gets the {n} photo/video item{'s' if n != 1 else ''}; the PDF ({doc}) goes to LinkedIn only."})
    if p == "linkedin" and len(kinds) > 1:
        out.append({"id": "media.mixed", "platform": p, "status": "fail", "msg": "LinkedIn cannot mix images, video and documents in one post."})
    if p == "linkedin" and pt == "document" and not plan["settings"]["linkedin"].get("documentTitle"):
        out.append({"id": "linkedin.document_title", "platform": p, "status": "warn", "msg": "Set a document title for the LinkedIn PDF carousel."})
    if p == "linkedin":
        out += _linkedin_kind_checks(plan, pm)
    if p == "instagram" and pt == "carousel":
        ars = [m.get("aspect") for m in pm if m.get("aspect")]
        if ars and any(abs(a - ars[0]) > 0.02 for a in ars):
            out.append({"id": "media.carousel_aspect", "platform": p, "status": "warn", "msg": "Carousel items have different shapes; Instagram crops all to the first item's ratio."})
    if p == "threads":
        tags = checks.hashtags(plan["captions"].get(p, ""))
        if tags and not plan["settings"]["threads"].get("topic_tag"):
            out.append({"id": "threads.topic", "platform": p, "status": "info", "msg": f"Threads uses one topic tag; suggest topic_tag = {tags[0]}."})
    if p == "tiktok":
        s = plan["settings"].get("tiktok") or {}
        if not s.get("privacyLevel"):
            out.append({"id": "tiktok.privacy", "platform": p, "status": "fail", "msg": "Choose who can see it on TikTok."})
        if s.get("consentFor") != content_hash(plan, "tiktok"):
            out.append({"id": "tiktok.consent", "platform": p, "status": "fail",
                        "msg": "TikTok needs your OK: confirm you previewed this post and agree to post it (asked again after any change)."})
        if s.get("commercialContentType") == "brand_content" and s.get("privacyLevel") == "SELF_ONLY":
            out.append({"id": "tiktok.branded_private", "platform": p, "status": "fail", "msg": "Branded content can't be posted as Only me on TikTok."})
        if pt in ("single", "carousel") and len(plan["captions"].get(p, "")) > checks.RULES["tiktok"]["photo_title_max"]:
            out.append({"id": "tiktok.photo_title", "platform": p, "status": "info",
                        "msg": "Photo posts show the first 90 characters as the title; the full caption is sent as the description."})
    if p == "snapchat":
        ct = (plan["settings"].get("snapchat") or {}).get("contentType", "story")
        cap = plan["captions"].get(p, "")
        if ct == "spotlight" and pt != "reel":
            out.append({"id": "snapchat.spotlight_video", "platform": p, "status": "fail", "msg": "Snapchat Spotlight takes a video only."})
        if ct == "saved_story" and len(cap) > checks.RULES["snapchat"]["saved_story_max"]:
            out.append({"id": "snapchat.title", "platform": p, "status": "fail", "msg": f"Saved story titles are up to 45 characters ({len(cap)} now)."})
        if ct == "story" and cap.strip():
            out.append({"id": "snapchat.story_caption", "platform": p, "status": "info", "msg": "Snapchat Stories show no caption text; only the photo or video."})
    if p == "facebook":
        fs = plan["settings"].get("facebook") or {}
        fmt = fs.get("format") or ("reel" if pt == "reel" else "feed")
        if fmt == "feed" and len(kinds) > 1:
            out.append({"id": "facebook.mixed", "platform": p, "status": "fail", "msg": "A Facebook feed post can't mix photos and video."})
        if fmt == "reel" and pt != "reel":
            out.append({"id": "facebook.reel_video", "platform": p, "status": "fail", "msg": "A Facebook Reel is one vertical video."})
        if fmt == "reel" and pt == "reel":
            v = pm[0]
            lo, hi = checks.RULES["facebook"]["reel_duration"]
            if v.get("duration") and not lo <= v["duration"] <= hi:
                out.append({"id": "facebook.reel_duration", "platform": p, "status": "warn", "msg": f"Reel is {v['duration']}s; Meta's guide says {lo}-{hi}s."})
            if v.get("aspect") and abs(v["aspect"] - 9 / 16) > 0.02:
                out.append({"id": "facebook.reel_vertical", "platform": p, "status": "warn", "msg": "Facebook Reels should be vertical 9:16."})
        if fmt == "story":
            if len(pm) != 1:
                out.append({"id": "facebook.story_one", "platform": p, "status": "fail", "msg": "A Facebook Story is one photo or one video."})
            if plan["captions"].get(p, "").strip():
                out.append({"id": "facebook.story_caption", "platform": p, "status": "info", "msg": "Facebook Stories show no caption; only the photo or video."})
            if fs.get("draft"):
                out.append({"id": "facebook.story_draft", "platform": p, "status": "fail", "msg": "Stories can't be saved as Facebook drafts."})
    if p == "instagram" and not plan["settings"]["instagram"].get("firstComment"):
        out.append({"id": "engage.first_comment", "platform": p, "status": "info", "msg": "No first comment set. A pinned question invites replies."})
    return out


LI_URL = re.compile(r"^(https://(www\.)?linkedin\.com/\S+|urn:li:(share|ugcPost|groupPost):\S+)$")
DURATION_WORDS = {"ONE_DAY": "1 day", "THREE_DAYS": "3 days", "SEVEN_DAYS": "1 week", "FOURTEEN_DAYS": "2 weeks"}


def _linkedin_kind_checks(plan: dict, pm: list[dict]) -> list[dict]:
    """A LinkedIn poll or repost: Zernio takes either one, and never with media."""
    s = plan["settings"].get("linkedin") or {}
    kind = s.get("kind") or "post"
    if kind == "post":
        return []
    out = []

    def add(id_, status, msg):
        out.append({"id": id_, "platform": "linkedin", "status": status, "msg": msg})

    what = "poll" if kind == "poll" else "repost"
    if pm:
        add("linkedin.kind_media", "fail", f"A LinkedIn {what} can't carry photos, video or a PDF. Remove the media, or switch LinkedIn back to a normal post.")
    if kind == "poll":
        poll = s.get("poll") or {}
        q, opts = (poll.get("question") or "").strip(), [o.strip() for o in poll.get("options") or []]
        filled = [o for o in opts if o]
        bad = False
        if not 1 <= len(q) <= 140:
            add("linkedin.poll_question", "fail", "Write the poll question (up to 140 characters)." if not q else f"Poll question is {len(q)} characters; LinkedIn allows 140.")
            bad = True
        if len(filled) < 2:
            add("linkedin.poll_options", "fail", "A poll needs at least 2 choices.")
            bad = True
        elif len(filled) != len(opts):
            add("linkedin.poll_options", "fail", "Fill in or remove the empty choice.")
            bad = True
        long_ = [o for o in filled if len(o) > 30]
        if long_:
            add("linkedin.poll_option_len", "fail", f"Choices are up to 30 characters: “{long_[0][:34]}…” is {len(long_[0])}.")
            bad = True
        if len({o.lower() for o in filled}) != len(filled):
            add("linkedin.poll_dupe", "fail", "Two choices are the same.")
            bad = True
        if not bad:
            add("linkedin.poll", "pass", f"Poll: {len(filled)} choices, open for {DURATION_WORDS.get(poll.get('duration') or 'SEVEN_DAYS')}.")
    else:
        url = (s.get("reshareUrl") or "").strip()
        if not url:
            add("linkedin.reshare_url", "fail", "Paste the link of the LinkedIn post to repost.")
        elif not LI_URL.match(url):
            add("linkedin.reshare_url", "fail", "That isn't a LinkedIn post link. Copy it from the post's ··· menu → Copy link to post.")
        else:
            add("linkedin.reshare", "pass", "Repost: your caption shows as your comment above the original post.")
    return out


# ---------------------------------------------------------------- publish
def build_body(plan: dict, z: Zernio, dry: bool = False, make_current: bool = True) -> dict:
    cfg = config()
    accts = cfg.get("accounts", {})
    uploads = plan.setdefault("uploads", {})
    folder = Path(plan["folder"])

    def url_for(name: str, path: str | None = None) -> str:
        key = path or name
        if dry:
            return f"https://example.invalid/{name}"
        if key not in uploads:
            import jobs
            jobs.here(step=f"Uploading {name}")
            uploads[key] = z.upload(Path(path) if path else folder / name)
            save(plan, make_current=make_current)
        return uploads[key]

    def items_of(ms: list[dict]) -> list[dict]:
        return [{"type": m["kind"], "url": url_for(m["file"])} for m in ms]

    # one upload per file; a split post (PDF + photos) gives LinkedIn the PDF via customMedia
    base_media = [m for m in plan["media"] if m["kind"] != "document"] if is_split(plan) else plan["media"]
    items = items_of(base_media)

    default = plan["captions"].get(plan["platforms"][0], "")
    platforms = []
    for p in plan["platforms"]:
        accs = accounts_for(plan, p)
        if not accs:
            raise ValueError(f"No {p} account selected in setup.")
        s = plan["settings"].get(p, {})
        psd = {}
        pt = type_for(plan, p)
        if p == "instagram":
            if pt == "reel" and s.get("trial"):
                psd["trialParams"] = {"graduationStrategy": s.get("graduation", "SS_PERFORMANCE")}
            if pt == "reel" and plan.get("cover"):
                psd["instagramThumbnail"] = url_for(plan["cover"]["file"], plan["cover"].get("path"))
            if s.get("locationId"):
                psd["locationId"] = str(s["locationId"])
            if s.get("firstComment"):
                psd["firstComment"] = s["firstComment"]
            if s.get("collaborators"):
                psd["collaborators"] = s["collaborators"][:3]
            if cfg.get("label_ai_generated"):
                psd["isAiGenerated"] = True
        elif p == "facebook":
            fmt = s.get("format") or ("reel" if pt == "reel" else "feed")
            if fmt in ("reel", "story"):
                psd["contentType"] = fmt
            if fmt == "reel" and s.get("title"):
                psd["title"] = s["title"]
            if fmt != "story" and s.get("firstComment"):
                psd["firstComment"] = s["firstComment"]
            if s.get("pageId"):
                psd["pageId"] = s["pageId"]
            if s.get("draft") and fmt != "story":
                psd["facebookSettings"] = {"draft": True}
        elif p == "threads":
            if s.get("topic_tag"):
                psd["topic_tag"] = s["topic_tag"].lstrip("#")[:50]
        elif p == "tiktok":
            ok = s.get("consentFor") == content_hash(plan, "tiktok")
            psd.update({"privacyLevel": s.get("privacyLevel"), "allowComment": bool(s.get("allowComment", True)),
                        "contentPreviewConfirmed": ok, "expressConsentGiven": ok,
                        "commercialContentType": s.get("commercialContentType") or "none"})
            if pt == "reel":
                psd.update({"allowDuet": bool(s.get("allowDuet", True)), "allowStitch": bool(s.get("allowStitch", True))})
                if plan.get("cover"):
                    psd["videoCoverImageUrl"] = url_for(plan["cover"]["file"], plan["cover"].get("path"))
            else:
                psd["description"] = plan["captions"].get(p, default)[:4000]
            if s.get("videoMadeWithAi"):
                psd["videoMadeWithAi"] = True
            if s.get("draft"):
                psd["draft"] = True
        elif p == "snapchat":
            psd["contentType"] = s.get("contentType") or "story"
        elif p == "linkedin":
            if s.get("firstComment"):
                psd["firstComment"] = s["firstComment"]
            if s.get("documentTitle"):
                psd["documentTitle"] = s["documentTitle"]
            if s.get("organizationUrn"):
                psd["organizationUrn"] = s["organizationUrn"]
            kind = s.get("kind") or "post"
            if kind == "poll" and s.get("poll"):
                pl = s["poll"]
                psd["poll"] = {"question": pl["question"].strip(), "options": [o.strip() for o in pl["options"] if o.strip()],
                               "duration": pl.get("duration") or "SEVEN_DAYS"}
                psd.pop("documentTitle", None)
            elif kind == "repost" and s.get("reshareUrl"):
                psd["reshareUrl"] = s["reshareUrl"].strip()
                psd.pop("documentTitle", None)
        entry = {"platform": p}
        if media_for(plan, p) is not plan["media"] and [m["file"] for m in media_for(plan, p)] != [m["file"] for m in base_media]:
            entry["customMedia"] = items_of(media_for(plan, p))
        if plan["captions"].get(p, default) != default:
            entry["customContent"] = plan["captions"][p]
        if psd:
            entry["platformSpecificData"] = psd
        for acc in accs:                     # one entry per chosen account on this network
            platforms.append({**entry, "accountId": acc})

    body = {"content": default, "mediaItems": items, "platforms": platforms}
    sched = plan.get("schedule", {})
    if sched.get("at"):
        body["scheduledFor"] = sched["at"]
        body["timezone"] = cfg.get("timezone", "UTC")
    else:
        body["publishNow"] = True
    return body


def publish(plan: dict, confirm: bool, make_current: bool = True) -> dict:
    if not confirm:
        raise PermissionError("Publishing needs confirm=True, given only after the user approves in chat.")
    if plan.get("status") != "awaiting_approval":
        raise PermissionError(f"Plan status is '{plan.get('status')}', not 'awaiting_approval'. Show the plan and get approval first.")
    recheck(plan)
    if plan["blocking"]:
        raise ValueError("Blocking checks failed: " + "; ".join(c["msg"] for c in plan["blocking"]))
    z = Zernio()
    body = build_body(plan, z, make_current=make_current)
    try:
        v = z.validate_post(body)
        plan["validation"] = v
        if isinstance(v, dict) and (v.get("valid") is False or v.get("errors")):
            save(plan, make_current=make_current)
            raise ValueError(f"Zernio validation rejected the post: {v.get('errors') or v}")
    except ZernioError as e:
        plan["validation"] = {"error": str(e)}
        save(plan, make_current=make_current)
        raise
    import jobs
    jobs.here(step="Creating the post in Zernio", pct=70)
    res = z.create_post(body, idempotency_key=f"bps-{plan['id']}-{plan.get('updated', 0)}")
    post = res.get("post", res)
    plan["result"] = {"postId": post.get("_id"), "status": post.get("status"), "platforms": post.get("platforms"),
                      "warnings": res.get("warnings"), "at": int(time.time())}
    plan["status"] = "scheduled" if post.get("status") == "scheduled" else "published"
    save(plan, make_current=make_current)
    append_log({"event": "publish", "plan": plan["id"], "postId": post.get("_id"), "platforms": plan["platforms"],
                "type": plan["type"], "score": {k: v["value"] for k, v in plan["score"].items()},
                "status": plan["status"], "scheduledFor": plan.get("schedule", {}).get("at")})
    return plan


# ---------------------------------------------------------------- DM gift
def dm_body(plan: dict) -> dict:
    cfg = config()
    dm = plan["dm"]
    ig = (cfg.get("accounts", {}).get("instagram") or {}).get("id")
    body = {
        "profileId": cfg.get("profile_id"),
        "accountId": ig,
        "trigger": "comment",
        "postId": (plan.get("result") or {}).get("postId"),
        "name": f"{plan['id']} · {dm['keyword']}",
        "keywords": [dm["keyword"]],
        "matchMode": dm.get("matchMode", "word"),
        "typoTolerance": True,
        "dmMessage": dm["message"],
        "commentReply": dm.get("commentReply") or None,
    }
    if dm.get("link"):
        body["buttons"] = [{"type": "url", "title": (dm.get("buttonTitle") or "Open")[:20], "url": dm["link"]}]
    audience = {}
    if dm.get("followGate"):
        audience.update(followerStatus="follower", whenUnknown="verify")
        body["followGate"] = {
            "message": dm.get("followGateMessage") or "Follow the account first, then tap the button.",
            "buttonLabel": (dm.get("followGateButton") or "I'm following")[:20],
            "notFollowingMessage": dm.get("notFollowingMessage") or "Looks like you're not following yet. Follow, then tap again.",
        }
    if dm.get("minFollowerCount"):
        audience["minFollowerCount"] = int(dm["minFollowerCount"])
    if audience:
        audience.setdefault("followerStatus", "any")
        body["audience"] = audience
    return {k: v for k, v in body.items() if v is not None}


def create_dm(plan: dict, confirm: bool) -> dict:
    if not confirm:
        raise PermissionError("DM automations need the user's explicit yes in chat.")
    dm = plan.get("dm") or {}
    if not dm.get("enabled") or not dm.get("keyword") or not dm.get("message"):
        raise ValueError("DM gift is not fully configured (enabled, keyword, message).")
    if not (plan.get("result") or {}).get("postId"):
        raise ValueError("Publish or schedule the post first; the automation attaches to its post id.")
    res = Zernio().create_automation(dm_body(plan))
    made = res.get("automation") or res
    plan["dm"]["automationId"] = made.get("_id") or made.get("id")   # Zernio returns "id" here
    save(plan)
    append_log({"event": "dm_automation", "plan": plan["id"], "keyword": dm["keyword"], "automationId": plan["dm"]["automationId"]})
    return res
