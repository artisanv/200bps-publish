"""Builds the dashboard's mirror of the user's Zernio account.

Each section is fetched independently; if one fails (for example the
Analytics or Inbox add-on is not active) the rest still render and the
failure is listed in `warnings`.
"""
from __future__ import annotations

import re
import time
from datetime import date, datetime, timedelta, timezone

import audience
import besttime
from store import VERSION, config, read_json, read_log, state_dir, write_json
from zernio import Zernio, ZernioError

CACHE_SECONDS = 300


def _items(resp) -> list:
    if isinstance(resp, list):
        return resp
    if isinstance(resp, dict):
        for k in ("posts", "data", "items", "results", "analytics", "comments", "automations", "values", "series"):
            if isinstance(resp.get(k), list):
                return resp[k]
    return []


def _num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _metric_total(resp, name: str):
    """Pull a total out of an insights response without assuming one exact shape."""
    if not isinstance(resp, dict):
        return None
    for key in ("metrics", "data", "insights"):
        block = resp.get(key)
        if isinstance(block, dict) and name in block:
            v = block[name]
            if isinstance(v, dict):
                return _num(v.get("total") or v.get("value") or v.get("total_value"))
            return _num(v)
        if isinstance(block, list):
            for m in block:
                if isinstance(m, dict) and m.get("name") == name:
                    tv = m.get("total_value") or m.get("totalValue") or {}
                    if isinstance(tv, dict) and "value" in tv:
                        return _num(tv["value"])
                    vals = m.get("values") or []
                    if vals:
                        return sum(_num(x.get("value")) or 0 for x in vals)
    if name in resp:
        return _num(resp[name])
    return None


def _post_row(p: dict) -> dict:
    # GET /v1/analytics list: posts[{_id, content, publishedAt, analytics{...}, platformAnalytics[{platform, platformPostUrl}]}]
    m = p.get("analytics") or p.get("metrics") or p
    pa = (p.get("platformAnalytics") or [{}])[0] or {}
    return {
        "id": p.get("_id") or p.get("postId") or p.get("id"),
        "platform": p.get("platform") or pa.get("platform"),
        "caption": p.get("content") or p.get("caption") or "",
        "publishedAt": p.get("publishedAt") or p.get("published_at") or p.get("createdAt"),
        "url": p.get("platformPostUrl") or pa.get("platformPostUrl") or p.get("url"),
        "metrics": {k: _num(m.get(k)) for k in ("reach", "impressions", "views", "likes", "comments", "shares", "saves", "follows", "engagementRate")},
    }


def post_kind(platform, media_type, product, count, item_types, url="") -> str:
    """One label for what a post is: carousel, reel, video, story, document, text or post."""
    product = (product or "").upper()
    media_type = (media_type or "").lower()
    if product == "STORY" or media_type == "story":
        return "story"
    if media_type in ("carousel", "carousel_album") or (count or 0) > 1:
        return "carousel"
    if media_type == "document" or "document" in (item_types or []):
        return "document"
    if media_type == "video" or "video" in (item_types or []):
        if product == "REELS" or "/reel/" in (url or "") or platform == "instagram":
            return "reel"
        return "short" if platform in ("youtube",) and "/shorts/" in (url or "") else "video"
    if not count and not item_types:
        return "article" if platform == "linkedin" and "/pulse/" in (url or "") else "text"
    return "post"


def _sync_plans(zposts: list[dict]) -> None:
    """Update local plans with their real status in Zernio (published, failed...)."""
    import plan as plans
    byid = {p["id"]: p for p in zposts}
    for f in (state_dir() / "plans").glob("*.json"):
        pl = read_json(f) or {}
        pid = (pl.get("result") or {}).get("postId")
        if not pid or pid not in byid:
            continue
        zp = byid[pid]
        remote = {"status": zp["status"], "platforms": zp["platforms"], "checked": int(time.time())}
        if pl.get("remote") != remote:
            pl["remote"] = remote
            if zp["status"] in ("published", "scheduled", "failed", "partial", "cancelled", "publishing"):
                pl["status"] = {"publishing": "scheduled", "partial": "published"}.get(zp["status"], zp["status"])
            plans.save(pl, record=False, make_current=False)


def build(force: bool = False) -> dict:
    cache_p = state_dir() / "cache.json"
    cached = read_json(cache_p)
    if cached and not force and time.time() - cached.get("_ts", 0) < CACHE_SECONDS and cached.get("_v") == VERSION:
        return cached

    import jobs
    with jobs.job("sync", "Refreshing from Zernio", estimate=12, step="Posts, followers, best time…"):
        return _build()


def _build() -> dict:
    cache_p = state_dir() / "cache.json"
    z = Zernio()
    cfg = config()
    out = {"ok": False, "warnings": [], "_ts": time.time(), "_v": VERSION}
    if not z.configured:
        out["error"] = "ZERNIO_API_KEY missing. Add it to .env (see .env.example)."
        return out

    tz = cfg.get("timezone", "UTC")
    accts = cfg.get("accounts", {})
    ig = (accts.get("instagram") or {}).get("id")
    today = date.today()
    d7, d14, d30, d89 = (today - timedelta(days=n) for n in (7, 14, 30, 87))   # Zernio caps history at 88 days

    import jobs
    seen = [0]

    def section(name, fn):
        seen[0] += 1
        jobs.here(step=f"Reading {name}", pct=100 * seen[0] / 18)
        try:
            return fn()
        except ZernioError as e:
            out["warnings"].append(f"{name}: {e}")
        except Exception as e:  # keep the dashboard alive
            out["warnings"].append(f"{name}: {type(e).__name__}: {e}")
        return None

    accounts = section("accounts", z.accounts)
    if accounts is None:
        out["error"] = out["warnings"][-1]
        return out
    out["ok"] = True
    selected_ids = {a.get("id") for a in accts.values() if isinstance(a, dict)}
    out["accounts"] = [
        {"id": a.get("_id"), "platform": a.get("platform"), "username": a.get("username"),
         "followers": a.get("followersCount"), "active": a.get("isActive"),
         "needsReconnection": a.get("needsReconnection"), "selected": a.get("_id") in selected_ids}
        for a in accounts
    ]

    # followers
    # follower-history: {metrics: {follower_count: {total, values: [{date, value}]}}}
    fol = {"series": [], "current": None}
    if ig:
        hist = section("follower history", lambda: z.ig_follower_history(ig, metrics="follower_count", fromDate=d89.isoformat(), toDate=today.isoformat(), metricType="time_series"))
        fc = ((hist or {}).get("metrics") or {}).get("follower_count") or {}
        for row in fc.get("values") or []:
            v, d = _num(row.get("value")), (row.get("date") or "")[:10]
            if v is not None and d:
                fol["series"].append({"date": d, "value": v})
    # follower-stats: {accounts: [{_id, currentFollowers}], stats: {<id>: [{date, followers}]}}
    if not fol["series"] and selected_ids:
        ids = [i for i in selected_ids if i]
        st = section("follower stats", lambda: z.follower_stats(ids, fromDate=d89.isoformat(), toDate=today.isoformat(), granularity="daily")) or {}
        key = ig if ig in (st.get("stats") or {}) else next(iter(st.get("stats") or {}), None)
        for pt in (st.get("stats") or {}).get(key, []) if key else []:
            v, d = _num(pt.get("followers")), (pt.get("date") or "")[:10]
            if v is not None and d:
                fol["series"].append({"date": d, "value": v})
        acc = next((a for a in st.get("accounts") or [] if a.get("_id") == key), None)
        if acc:
            fol["current"] = _num(acc.get("currentFollowers"))
    fol["series"].sort(key=lambda r: r["date"])
    if fol["series"]:
        fol["current"] = fol["series"][-1]["value"]
    if fol["current"] is None:
        ig_acct = next((a for a in out["accounts"] if a["id"] == ig), None)
        fol["current"] = ig_acct and ig_acct["followers"]
    out["followers"] = fol

    # KPIs: last 7 days vs the 7 before
    if ig:
        metrics = "reach,views,total_interactions,follows_and_unfollows"
        cur = section("insights", lambda: z.ig_insights(ig, metrics=metrics, fromDate=d7.isoformat(), toDate=today.isoformat(), metricType="total_value"))
        prev = section("insights (previous)", lambda: z.ig_insights(ig, metrics=metrics, fromDate=d14.isoformat(), toDate=d7.isoformat(), metricType="total_value"))
        out["kpis"] = {
            "reach": _metric_total(cur, "reach"), "reach_prev": _metric_total(prev, "reach"),
            "views": _metric_total(cur, "views"), "views_prev": _metric_total(prev, "views"),
            "engagement": _metric_total(cur, "total_interactions"), "engagement_prev": _metric_total(prev, "total_interactions"),
            "follows": _metric_total(cur, "follows_and_unfollows"), "follows_prev": _metric_total(prev, "follows_and_unfollows"),
        }

    # posts + analytics
    an = section("post analytics", lambda: z.analytics(fromDate=(today - timedelta(days=90)).isoformat(), toDate=today.isoformat(), limit=100, source="all"))
    out["posts"] = [_post_row(p) for p in _items(an)]

    # every post in the Zernio account, any status, with per-platform results
    allp = section("all posts", lambda: z.posts(limit=100, sortBy="createdAt"))
    mine = {e.get("postId") for e in read_log() if e.get("event") == "publish"}

    def acc_name(a):
        return (a.get("username") or a.get("displayName")) if isinstance(a, dict) else None

    # Analytics carries what Zernio's own dashboard shows: the platform thumbnail
    # (thumbnailUrl), the real type (carousel / REELS / FEED / STORY) and slide
    # count. It is linked to a Zernio post by latePostId; posts made outside
    # Zernio have no latePostId and are added as "outside" posts.
    ana_by_late, outside = {}, []
    for a in _items(an):
        (ana_by_late.__setitem__(a["latePostId"], a) if a.get("latePostId") else outside.append(a))
    acc_by_id = {a.get("_id"): a for a in (accounts or [])}

    out["zposts"] = []
    for p in _items(allp):
        mi = p.get("mediaItems") or []
        first = mi[0] if mi else {}
        psd = next((t.get("platformSpecificData") or {} for t in p.get("platforms") or [] if t.get("platform") == "instagram"), {})
        a = ana_by_late.get(p.get("_id")) or {}
        plats = []
        for t in p.get("platforms") or []:
            acc = t.get("accountId")
            acc = acc if isinstance(acc, dict) else acc_by_id.get(acc, {})
            plats.append({"platform": t.get("platform"), "status": t.get("status"), "url": t.get("platformPostUrl"),
                          "publishedAt": t.get("publishedAt"), "error": t.get("errorMessage"), "errorCategory": t.get("errorCategory"),
                          "account": acc_name(acc), "accountId": acc.get("_id") if isinstance(acc, dict) else None,
                          "trial": t.get("isTrialReel")})
        n = len(a.get("mediaItems") or []) or len(mi)
        url0 = next((x["url"] for x in plats if x.get("url")), "") or a.get("platformPostUrl") or ""
        out["zposts"].append({
            "id": p.get("_id"), "status": p.get("status"), "caption": p.get("content") or p.get("title") or "",
            "thumbs": [u for u in (a.get("thumbnailUrl"), first.get("instagramThumbnail"), psd.get("instagramThumbnail"),
                                   first.get("thumbnail"), first.get("url") if first.get("type") not in ("video", "document") else None) if u],
            "video": first.get("url") if first.get("type") == "video" else None,
            "kind": post_kind(p.get("platforms", [{}])[0].get("platform") if p.get("platforms") else a.get("platform"),
                              a.get("mediaType") or (first.get("type") if len(mi) <= 1 else "carousel"), a.get("mediaProductType"), n,
                              [x.get("type") for x in mi], url0),
            "count": n, "scheduledFor": p.get("scheduledFor"), "createdAt": p.get("createdAt"), "updatedAt": p.get("updatedAt"),
            "media": len(mi), "platforms": plats, "fromSkill": p.get("_id") in mine})
    only = {}                                           # platform -> its only connected account
    for x in accounts or []:
        only.setdefault(x.get("platform"), []).append(x)
    for a in outside:                                   # posted directly on the platform
        acc = acc_by_id.get(a.get("accountId")) or {}
        if not acc and len(only.get(a.get("platform"), [])) == 1:
            acc = only[a.get("platform")][0]            # analytics doesn't name the account; one candidate
        n = len(a.get("mediaItems") or [])
        out["zposts"].append({
            "id": a.get("_id"), "status": "published", "caption": a.get("content") or "", "outside": True,
            "thumbs": [u for u in (a.get("thumbnailUrl"), ((a.get("mediaItems") or [{}])[0] or {}).get("thumbnail")) if u],
            "kind": post_kind(a.get("platform"), a.get("mediaType"), a.get("mediaProductType"), n,
                              [x.get("type") for x in a.get("mediaItems") or []], a.get("platformPostUrl") or ""),
            "count": n, "createdAt": a.get("publishedAt"),
            "platforms": [{"platform": a.get("platform"), "status": "published", "url": a.get("platformPostUrl"),
                           "publishedAt": a.get("publishedAt"), "account": acc.get("username") or a.get("accountUsername"),
                           "accountId": a.get("accountId") or acc.get("_id")}],
            "fromSkill": False})
    counts = {}
    for p in out["zposts"]:
        counts[p["status"]] = counts.get(p["status"], 0) + 1
    out["zcounts"] = counts
    out["synced_at"] = time.time()
    _sync_plans(out["zposts"])

    sched = section("scheduled posts", lambda: z.posts(status="scheduled", limit=50))
    out["scheduled"] = [
        {"id": p.get("_id"), "caption": p.get("content", ""), "scheduledFor": p.get("scheduledFor"),
         "platforms": [x.get("platform") for x in p.get("platforms", [])]}
        for p in _items(sched)
    ]

    # streak: consecutive days with a published post, ending today or yesterday
    days_with = {(p["publishedAt"] or "")[:10] for p in out["posts"] if p.get("publishedAt")}
    pub = section("published posts", lambda: z.posts(status="published", fromDate=d30.isoformat(), limit=100))
    days_with |= {(p.get("publishedAt") or p.get("scheduledFor") or "")[:10] for p in _items(pub)}
    last14 = [(today - timedelta(days=13 - i)).isoformat() in days_with for i in range(14)]
    streak, i = 0, 0 if today.isoformat() in days_with else 1
    while (today - timedelta(days=i)).isoformat() in days_with:
        streak += 1
        i += 1
    out["streak"] = {"current": streak, "days": last14}

    # best time
    bt_platform = cfg.get("primary_platform", "instagram")
    bt_acct = (accts.get(bt_platform) or {}).get("id")
    bt = section("best time", lambda: z.best_time(platform=bt_platform, accountId=bt_acct))
    out["besttime"] = besttime.compute(bt or {}, tz) if bt is not None else {"basis": "insufficient", "note": "Best-time data unavailable (needs the Zernio Analytics add-on)."}

    # demographics: one call -> {demographics: {age|gender|city|country: [{dimension, value}]}}
    if ig:
        r = section("demographics", lambda: z.ig_demographics(ig, metric="follower_demographics", breakdown="age,gender,city,country", timeframe="this_month")) or {}
        raw = r.get("demographics") or {}
        demo = {}
        for b, key in (("city", "cities"), ("country", "countries"), ("age", "ages"), ("gender", "gender")):
            rows = [{"name": str(x.get("dimension")), "value": _num(x.get("value"))}
                    for x in raw.get(b) or [] if x.get("dimension") is not None and _num(x.get("value")) is not None]
            if b == "age":
                rows.sort(key=lambda x: int(re.match(r"\d+", x["name"]).group()) if re.match(r"\d+", x["name"]) else 999)
            else:
                rows.sort(key=lambda x: -x["value"])
            demo[key] = rows
        if not any(demo.values()):
            demo["note"] = "Demographics appear after 100 followers and need the Analytics add-on."
        out["demographics"] = demo
        out["audience"] = audience.zones(demo.get("countries") or [], tz)

    # comments waiting
    # list: {data: [{id (post id), accountId, platform, commentCount}]}
    # per post: {comments: [{id, message, createdTime, from{username, isOwner}, replies[{from{isOwner}}]}]}
    cps = section("comments", lambda: z.comment_posts(since=d7.isoformat(), limit=10)) or {}
    comments = []
    for cp in (cps.get("data") or [])[:5]:
        pid, aid = cp.get("id"), cp.get("accountId") or ig
        if not (pid and aid) or not cp.get("commentCount"):
            continue
        cs = section("comments on post", lambda pid=pid, aid=aid: z.comments(pid, aid, limit=10)) or {}
        for c in cs.get("comments") or []:
            frm = c.get("from") or {}
            if frm.get("isOwner"):
                continue
            if any((rp.get("from") or {}).get("isOwner") for rp in c.get("replies") or []):
                continue          # already answered
            comments.append({"id": c.get("id"), "postId": pid, "platform": cp.get("platform"),
                             "author": frm.get("username") or frm.get("name"),
                             "text": c.get("message") or "", "createdAt": c.get("createdTime")})
    out["comments"] = comments

    au = section("automations", lambda: z.automations(cfg.get("profile_id")))
    out["automations"] = [
        {"id": a.get("id") or a.get("_id"), "name": a.get("name"), "keywords": a.get("keywords", []), "active": a.get("isActive", True),
         "followGate": bool(a.get("followGate")), "postId": a.get("platformPostId") or a.get("postId")}
        for a in _items(au)
    ]
    if ig:
        ib = section("ice breakers", lambda: z.ice_breakers(ig))
        out["iceBreakers"] = (ib or {}).get("ice_breakers", []) if isinstance(ib, dict) else []

    write_json(cache_p, out)
    return out
