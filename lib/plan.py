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
PLATFORMS = ("instagram", "linkedin")


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
    "settings": "Settings", "platforms": "Platforms", "media": "Media",
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
                    "hasCover": bool(p.get("cover")), "mediaCount": len(p.get("media") or []), "captions": p.get("captions"),
                    "kind": {"reel": "reel", "carousel": "carousel", "single": "post", "document": "document", "text": "text"}.get(p.get("type"), "post")})
    return sorted(out, key=lambda x: -(x.get("updated") or 0))


SETTABLE = {
    "instagram": {"firstComment": str, "collaborators": list, "trial": bool, "graduation": str, "locationId": str, "locationName": str},
    "linkedin": {"firstComment": str, "documentTitle": str, "organizationUrn": str},
}


def _coerce(kind, raw: str):
    import json as _j
    if kind is bool:
        v = raw.strip().lower()
        if v in ("true", "yes", "on", "1"):
            return True
        if v in ("false", "no", "off", "0"):
            return False
        raise ValueError("Use true or false.")
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
    settings = {k: dict(v) for k, v in plan["settings"].items()}
    settings.setdefault(plat, {})[key] = val
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
    ptype = checks.post_type(scan["media"])
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
            "facebook": {"firstComment": ""},
            "threads": {"topic_tag": cfg.get("threads", {}).get("topic_tag", "")},
            "linkedin": {"firstComment": "", "documentTitle": "", "organizationUrn": cfg.get("linkedin", {}).get("organization_urn")},
        }),
        "dm": old.get("dm", {"enabled": False, "asked": False}),
        "history": old.get("history", []),
        "fixRequests": old.get("fixRequests", {}),
        "skipped_platforms": [p for p in wanted if p not in plats],
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
    for p in plan["platforms"]:
        cc = checks.check_caption(plan["captions"].get(p, ""), p, cfg) + checks.check_media(scan, p)
        cc += _extra_checks(plan, p)
        all_checks += cc
        plan["score"][p] = checks.score(cc, plan["type"], timing_ok, bool(cfg.get("keywords")))
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
    kinds = {m["kind"] for m in plan["media"]}
    if p == "linkedin" and len(kinds) > 1:
        out.append({"id": "media.mixed", "platform": p, "status": "fail", "msg": "LinkedIn cannot mix images, video and documents in one post."})
    if p == "linkedin" and plan["type"] == "document" and not plan["settings"]["linkedin"].get("documentTitle"):
        out.append({"id": "linkedin.document_title", "platform": p, "status": "warn", "msg": "Set a document title for the LinkedIn PDF carousel."})
    if p == "instagram" and plan["type"] == "carousel":
        ars = [m.get("aspect") for m in plan["media"] if m.get("aspect")]
        if ars and any(abs(a - ars[0]) > 0.02 for a in ars):
            out.append({"id": "media.carousel_aspect", "platform": p, "status": "warn", "msg": "Carousel items have different shapes; Instagram crops all to the first item's ratio."})
    if p == "threads":
        tags = checks.hashtags(plan["captions"].get(p, ""))
        if tags and not plan["settings"]["threads"].get("topic_tag"):
            out.append({"id": "threads.topic", "platform": p, "status": "info", "msg": f"Threads uses one topic tag; suggest topic_tag = {tags[0]}."})
    if p == "instagram" and not plan["settings"]["instagram"].get("firstComment"):
        out.append({"id": "engage.first_comment", "platform": p, "status": "info", "msg": "No first comment set. A pinned question invites replies."})
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

    items = []
    for m in plan["media"]:
        items.append({"type": m["kind"], "url": url_for(m["file"])})

    default = plan["captions"].get(plan["platforms"][0], "")
    platforms = []
    for p in plan["platforms"]:
        acc = (accts.get(p) or {}).get("id")
        if not acc:
            raise ValueError(f"No {p} account selected in setup.")
        s = plan["settings"].get(p, {})
        psd = {}
        if p == "instagram":
            if plan["type"] == "reel" and s.get("trial"):
                psd["trialParams"] = {"graduationStrategy": s.get("graduation", "SS_PERFORMANCE")}
            if plan["type"] == "reel" and plan.get("cover"):
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
            if plan["type"] == "reel":
                psd["contentType"] = "reel"
            if s.get("firstComment"):
                psd["firstComment"] = s["firstComment"]
        elif p == "threads":
            if s.get("topic_tag"):
                psd["topic_tag"] = s["topic_tag"].lstrip("#")[:50]
        elif p == "linkedin":
            if s.get("firstComment"):
                psd["firstComment"] = s["firstComment"]
            if s.get("documentTitle"):
                psd["documentTitle"] = s["documentTitle"]
            if s.get("organizationUrn"):
                psd["organizationUrn"] = s["organizationUrn"]
        entry = {"platform": p, "accountId": acc}
        if plan["captions"].get(p, default) != default:
            entry["customContent"] = plan["captions"][p]
        if psd:
            entry["platformSpecificData"] = psd
        platforms.append(entry)

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
