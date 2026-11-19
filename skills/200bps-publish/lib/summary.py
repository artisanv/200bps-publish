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


def lday(stamp) -> str:
    """The user's own calendar day (YYYY-MM-DD) of a Zernio time. Zernio sends UTC ("…Z"); a post at
    01:00 in Kuwait belongs to that Kuwait day, not the UTC day before."""
    s = str(stamp or "")
    if len(s) <= 10 or "T" not in s:
        return s[:10]
    try:
        from zoneinfo import ZoneInfo
        d = datetime.fromisoformat(s.replace("Z", "+00:00"))
        if d.tzinfo is None:
            return s[:10]
        return d.astimezone(ZoneInfo(config().get("timezone") or "UTC")).date().isoformat()
    except (ValueError, KeyError):
        return s[:10]
from zernio import Zernio, ZernioError

CACHE_SECONDS = 300


def _media_items(mi) -> list[dict]:
    """Every slide / video / document of a post, in order, for the post viewer."""
    out = []
    for m in mi or []:
        if isinstance(m, dict) and m.get("url"):
            out.append({"type": m.get("type") or "image", "url": m["url"],
                        "thumb": m.get("thumbnail") or m.get("instagramThumbnail")})
    return out


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
    ent = next((x for x in p.get("platforms") or [] if x.get("platform") == (p.get("platform") or pa.get("platform"))), None) or {}
    return {
        "accountId": ent.get("accountId") or p.get("accountId"), "account": ent.get("accountUsername") or p.get("accountUsername"),
        "id": p.get("_id") or p.get("postId") or p.get("id"),
        "zid": p.get("latePostId"),                  # the Zernio post behind it (recycling needs it)
        "thumb": p.get("thumbnailUrl") or "",
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


def _auto_log(z, section, automations: list[dict], post_ids: set) -> dict:
    """What Zernio's DM automations already did with each comment, so the Inbox
    doesn't list them as waiting: {commentId: {how, error, at, consumed}}.
    how: auto-sent (gift delivered), auto-gated (follow-first message sent;
    the gift follows when they follow), auto-skipped (the automation chose not
    to send), auto-failed (it tried and failed; stays waiting)."""
    res: dict = {}
    for a in automations:
        if not a.get("id") or a.get("postId") not in post_ids:
            continue
        r = section("automation log", lambda aid=a["id"]: z.get(f"/comment-automations/{aid}/logs")) or {}
        for lg in r.get("logs") or []:
            cid, st = lg.get("commentId"), (lg.get("status") or "").lower()
            if not cid or cid in res:
                continue      # newest first: keep the latest outcome
            how = {"sent": "auto-sent", "gated": "auto-gated", "failed": "auto-failed", "error": "auto-failed"}.get(st, "auto-skipped")
            res[cid] = {"how": how, "status": st, "error": lg.get("platformError") or (lg.get("error") if how == "auto-failed" else None),
                        "at": lg.get("createdAt"), "consumed": bool(lg.get("privateReplyConsumed")) or how in ("auto-sent", "auto-gated"),
                        "clicked": bool(lg.get("clickCount"))}
    return res


def _conv_index(convs: list[dict]) -> tuple[dict, dict]:
    """DM threads by the person's Instagram id and by username. Instagram often
    sends a thread with no participantUsername: the username is then in
    participantName, or the thread is just "Instagram User" (id only)."""
    by_id, by_user = {}, {}
    for cv in convs:
        if cv.get("participantId"):
            by_id.setdefault(str(cv["participantId"]), cv)
        name = cv.get("participantUsername") or cv.get("participantName") or ""
        if name and name != "Instagram User":
            by_user.setdefault(name.lower(), cv)
    return by_id, by_user


def _conv_for(c: dict, by_id: dict, by_user: dict):
    """The commenter's DM thread: by id first (a comment's from.id is the thread's
    participantId), else by username. A name match with a different id is someone else."""
    aid_ = str(c.get("authorId") or "")
    if aid_ and aid_ in by_id:
        return by_id[aid_]
    cv = by_user.get((c.get("author") or "").lower())
    if cv and aid_ and cv.get("participantId") and str(cv["participantId"]) != aid_:
        return None
    return cv


FOLLOW_TTL = 6 * 3600
FOLLOW_ASKS = 5             # new follow checks in one refresh (Instagram takes seconds for each); the rest wait for the next


def _follows(z, section, account_id: str, user_id: str, memo: dict):
    """Does this person follow the account? True / False, or None when Instagram
    won't say (it answers only for people who have messaged the account).
    Kept 6 h in .bps/follow_cache.json so a refresh doesn't ask again."""
    if not user_id:
        return None
    key = f"{account_id}:{user_id}"
    if key in memo:
        return memo[key]
    path = state_dir() / "follow_cache.json"
    cache = read_json(path, {}) or {}
    hit = cache.get(key)
    if hit and time.time() - (hit.get("ts") or 0) < FOLLOW_TTL:
        memo[key] = hit.get("follows")
        return memo[key]
    if memo.get("_asked", 0) >= FOLLOW_ASKS:
        # over this refresh's budget: the last answer stands until it is asked again (forgetting it
        # put comments already handled back in Waiting every 6 hours)
        return hit.get("follows") if hit else None
    memo["_asked"] = memo.get("_asked", 0) + 1
    r = section("follow status", lambda: z.get(f"/accounts/{account_id}/follow-status/{user_id}"))
    if not isinstance(r, dict):
        return None                               # the call failed: don't remember it
    memo[key] = r.get("isFollower") if isinstance(r.get("isFollower"), bool) else None
    cache[key] = {"follows": memo[key], "ts": int(time.time())}
    write_json(path, {k: v for k, v in cache.items() if time.time() - (v.get("ts") or 0) < 30 * 86400})
    return memo[key]


def _gift_needles(automations: list[dict]) -> dict:
    """Per post: how its gift message starts, to recognise that gift in a DM thread."""
    out: dict = {}
    for a in automations or []:
        head = " ".join(re.split(r"\{\{", a.get("message") or "")[0].split())[:40]
        if a.get("postId") and len(head) >= 12:
            out.setdefault(a["postId"], []).append((head, bool(a.get("followGate"))))
    return out


def _dm_answers(z, section, comments: list[dict], log: dict, automations: list[dict] | None = None) -> dict:
    """What happened in DMs after each comment still waiting.
    - You wrote to them yourself (not an automation): the comment is answered (ig-dm).
    - The post's gift reached them by DM (the automation sent it for another of their
      comments) and they follow you: handled (dm-gift).
    - The gift reached them but the follow isn't confirmed: the comment stays waiting;
      the returned {commentId: {at, follows}} lets the Inbox say so."""
    left = [c for c in comments if c["id"] not in log and c.get("platform") in ("instagram", "facebook") and (c.get("author") or c.get("authorId"))]
    needles, gifts, msgs, follow_memo = _gift_needles(automations or []), {}, {}, {}
    if not left:
        return gifts
    # Your messages in each DM thread, kept until the thread changes (.bps/dm_cache.json):
    # a busy post has hundreds of commenters, and reading every thread again on each refresh took minutes.
    kept_p = state_dir() / "dm_cache.json"
    kept, kept_new = read_json(kept_p, {}) or {}, False
    for aid in {c["accountId"] for c in left}:
        mine = [c for c in left if c["accountId"] == aid]
        oldest = min(_iso(c.get("createdAt")) for c in mine)
        convs, cursor = [], None
        for _page in range(20):
            q = {"accountId": aid, "limit": 50, **({"cursor": cursor} if cursor else {})}
            r = section("DM conversations", lambda q=q: z.get("/inbox/conversations", **q)) or {}
            page = r.get("data") or []
            convs += page
            pg = r.get("pagination") or {}
            cursor = pg.get("nextCursor") or pg.get("cursor")
            # newest first: a page with nothing touched since the oldest waiting comment ends the search
            if not pg.get("hasMore") or not cursor or (page and all((cv.get("updatedTime") or "") < oldest for cv in page)):
                break
        by_id, by_user = _conv_index(convs)
        for c in mine:
            cv = _conv_for(c, by_id, by_user)
            if not cv or (cv.get("updatedTime") or "") < _iso(c.get("createdAt")):
                continue
            if cv["id"] not in msgs:              # two comments by one person: read the thread once
                hit = kept.get(cv["id"]) or {}
                if hit.get("u") and hit.get("u") == cv.get("updatedTime"):
                    msgs[cv["id"]] = hit.get("out") or []
                else:
                    # the newest 20: Zernio's default order is oldest first, which hid the answer in a long thread
                    m = section("DM messages", lambda cv=cv: z.get(f"/inbox/conversations/{cv['id']}/messages", accountId=aid, limit=20, sortOrder="desc"))
                    got = (m or {}).get("data") or (m or {}).get("messages") or []
                    msgs[cv["id"]] = sorted(({"direction": "outgoing", "createdAt": x.get("createdAt"), "message": (x.get("message") or "")[:400],
                                              "metadata": {"sentVia": (x.get("metadata") or {}).get("sentVia")}}
                                             for x in got if x.get("direction") == "outgoing"), key=lambda x: x.get("createdAt") or "")
                    newest = max((_iso(x.get("createdAt")) for x in got), default="")
                    # keep it only when what came back is as new as the thread's stamp (Zernio may serve an older copy)
                    if m is not None and cv.get("updatedTime") and newest >= _iso(cv["updatedTime"]):
                        kept[cv["id"]] = {"u": cv["updatedTime"], "ts": int(time.time()), "out": msgs[cv["id"]]}
                        kept_new = True
            after = [x for x in msgs[cv["id"]] if x.get("direction") == "outgoing" and (x.get("createdAt") or "") >= _iso(c.get("createdAt"))]
            own = next((x for x in after if ((x.get("metadata") or {}).get("sentVia") or "") != "comment_automation"), None)
            if own:
                log[c["id"]] = {"how": "ig-dm", "at": own.get("createdAt"), "text": (own.get("message") or "")[:200]}
                continue
            for x in after:
                text = " ".join((x.get("message") or "").split())
                hit = next((gated for head, gated in needles.get(c.get("postId"), []) if text.startswith(head)), None)
                if hit is None:
                    continue
                follows = _follows(z, section, aid, str(cv.get("participantId") or c.get("authorId") or ""), follow_memo) if c.get("platform") == "instagram" else None
                if follows is None and hit:
                    follows = True                # a follow-first gift only goes out after Zernio saw the follow
                if follows:
                    log[c["id"]] = {"how": "dm-gift", "at": x.get("createdAt"), "follows": True, "text": (x.get("message") or "")[:200]}
                else:
                    gifts[c["id"]] = {"at": x.get("createdAt"), "follows": follows}
                break
    if kept_new:
        write_json(kept_p, {k: v for k, v in kept.items() if time.time() - (v.get("ts") or 0) < 30 * 86400})
    return gifts


def _iso(t) -> str:
    """Instagram times look like 2026-11-01T11:50:14+0000; messages use ...Z. Compare as UTC ISO."""
    try:
        return datetime.fromisoformat(str(t).replace("Z", "+00:00").replace("+0000", "+00:00")).astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
    except Exception:
        return str(t or "")


COMMENT_PAGE = 100          # Zernio's maximum. It counts comments and replies together: about 55 rows a page
COMMENT_ROWS_MAX = 2000     # safety cap per post; a cut read is marked commentPosts[pid]["more"]


def _comment_posts_to_read(posts: list[dict], newest: int = 10, busiest: int = 5) -> list[dict]:
    """Which posts' comments a refresh reads: the newest ones, plus the busiest of the
    older ones. Newest only, a post people still comment on drops out as soon as ten
    newer posts have a comment each."""
    posts = sorted(posts, key=lambda cp: cp.get("createdTime") or "", reverse=True)
    rest = sorted(posts[newest:], key=lambda cp: _num(cp.get("commentCount")) or 0, reverse=True)   # stable: newer first on a tie
    return posts[:newest] + rest[:busiest]


def _read_comments(z, section, pid: str, aid: str) -> tuple[list, dict, bool]:
    """Every page of one post's comments, newest first: (rows, post, more).
    more is True when the read stopped before the last page (the safety cap, or a
    page that failed), so the Inbox can say that older comments are missing."""
    rows, seen, cursors, cursor, po = [], set(), set(), None, {}
    for _page in range(200):
        q = {"limit": COMMENT_PAGE, **({"cursor": cursor} if cursor else {})}
        cs = section("comments on post", lambda q=q: z.comments(pid, aid, **q))
        if cs is None:
            return rows, po, True
        po = po or cs.get("post") or {}
        for c in cs.get("comments") or []:
            if c.get("id") not in seen:           # a comment written while paging shifts the pages
                seen.add(c.get("id"))
                rows.append(c)
        pg = cs.get("pagination") or {}
        cursor = pg.get("nextCursor") or pg.get("cursor")
        if not pg.get("hasMore") or not cursor or cursor in cursors:
            return rows, po, False
        cursors.add(cursor)
        if len(rows) >= COMMENT_ROWS_MAX:
            break
    return rows, po, True


AUTHOR_ASKS = 40            # authorless replies asked about in one refresh (under a second each); the rest wait for the next
AUTHOR_TRIES = 3            # answers without an author before the reply is shown as "Someone" rather than held back


def _named(c: dict) -> bool:
    f = c.get("from") or {}
    return bool(f.get("username") or f.get("id") or f.get("name"))


def _name_replies(z, pid: str, aid: str, rows: list[dict]) -> None:
    """Give the replies Zernio sends without an author their author.

    Inside a thread some replies come as from = {"isOwner": false} with no name, your own
    replies included, and which ones changes from one read to the next. Asking for the reply
    by its id returns the author, so each one is asked once and remembered
    (.bps/comment_authors.json). A reply nobody could name yet is marked `_unknown` and stays
    out of the Inbox until it is named: most of them are your own replies, and listing them
    filled Waiting with your own words."""
    have = {r.get("id") for r in rows if _named(r)}
    stubs = [rp for r in rows for rp in r.get("replies") or []
             if rp.get("id") and rp["id"] not in have and not _named(rp) and not (rp.get("from") or {}).get("isOwner")]
    if not stubs:
        return
    path = state_dir() / "comment_authors.json"
    kept, asked, changed, now = read_json(path, {}) or {}, 0, False, int(time.time())
    for rp in stubs:
        hit = kept.get(rp["id"]) or {}
        if not hit.get("from") and hit.get("tries", 0) < AUTHOR_TRIES and asked < AUTHOR_ASKS:
            asked += 1
            try:
                r = z.comments(pid, aid, commentId=rp["id"])
            except Exception:                     # not worth a warning: the next refresh asks again
                r = None
            if isinstance(r, dict):
                c = r.get("comment") if isinstance(r.get("comment"), dict) else {}
                f = (c.get("from") or {}) if c.get("id") == rp["id"] else {}
                if f.get("username") or f.get("id") or f.get("name"):
                    hit = {"from": {k: f.get(k) for k in ("id", "name", "username")} | {"isOwner": bool(f.get("isOwner"))}, "ts": now}
                else:
                    hit = {"tries": hit.get("tries", 0) + 1, "ts": now}
                kept[rp["id"]], changed = hit, True
        if hit.get("from"):
            rp["from"] = dict(hit["from"])
        elif hit.get("tries", 0) < AUTHOR_TRIES:
            rp["_unknown"] = True                 # held back until it has a name
    if changed:
        write_json(path, {k: v for k, v in kept.items() if now - (v.get("ts") or 0) < 60 * 86400})


def _comment_items(rows: list[dict], pid: str, aid: str, platform) -> tuple[list, dict]:
    """One Inbox item per comment or reply that isn't yours, newest first, and which
    of them you already answered in the app: (items, {id: {how, at, text}}).

    Zernio sends a thread's replies inside the comment's `replies`. Some replies are
    also rows of their own: the same id twice, and the copy inside the thread is then
    often a stub (from = {"isOwner": false}, even on your own reply), so the row is
    the one to believe. A reply's parentId is the thread's top comment."""
    by_id, nested, parent = {}, {}, {}
    for r in rows:
        if r.get("id") is not None:
            by_id.setdefault(r["id"], r)

    def walk(node):
        for rp in node.get("replies") or []:
            if rp.get("id") is None or rp["id"] == node.get("id") or rp["id"] in parent:
                continue
            if rp.get("_unknown") and rp["id"] not in by_id:
                continue                          # nobody could name it yet (_name_replies): not an item, not your reply
            parent[rp["id"]] = node.get("id")
            nested[rp["id"]] = rp
            walk(rp)
    for r in list(by_id.values()):
        walk(r)

    def top(cid):
        hops = 0
        while cid in parent and hops < 20:
            cid, hops = parent[cid], hops + 1
        return cid

    def whole(cid) -> dict:
        row, nst = by_id.get(cid) or {}, nested.get(cid) or {}
        rf, nf = row.get("from") or {}, nst.get("from") or {}
        frm = {**nf, **{k: v for k, v in rf.items() if v not in (None, "")}}
        frm["isOwner"] = bool(rf.get("isOwner") or nf.get("isOwner"))
        return {**nst, **row, "from": frm}

    ids = list(by_id) + [i for i in nested if i not in by_id]
    full = {i: whole(i) for i in ids}
    when = {i: _iso(full[i].get("createdTime")) for i in ids}
    mine = [i for i in ids if full[i]["from"]["isOwner"]]
    threads: dict = {}                              # top comment -> your replies in its thread
    for i in mine:
        if i in parent:
            threads.setdefault(top(i), []).append(i)
    # your own comments and replies on the post that @mention someone count as an answer to them
    own = [(str(full[i].get("message") or "").lower(), when[i]) for i in mine]
    members: dict = {}                              # top comment -> every reply in its thread
    for i in ids:
        if i in parent:
            members.setdefault(top(i), []).append(i)
    name = lambda j: (full[j]["from"].get("username") or "").lower()

    def answered(i, root) -> dict:
        """The message a reply answers. Instagram doesn't say which, so: the latest earlier
        message of the person it @mentions; in the person's own thread, your last reply before
        it (they answer you, not themselves) or someone else's; else the comment on top."""
        me = name(i)
        earlier = sorted((j for j in [root] + members.get(root, []) if j != i and j in full and when[j] < when[i]),
                         key=lambda j: when[j], reverse=True)
        for m in re.findall(r"@([\w.]+)", str(full[i].get("message") or "").lower()):
            m = m.rstrip(".")
            hit = next((j for j in earlier if m and m != me and name(j) == m), None)
            if hit:
                return full[hit]
        if me and root in full and name(root) == me:
            hit = (next((j for j in earlier if full[j]["from"]["isOwner"]), None)          # your last reply there, if any
                   or next((j for j in earlier if name(j) and name(j) != me), None))
            if hit:
                return full[hit]
        return full.get(root) or {}
    items, done = [], {}
    for i in sorted(ids, key=lambda i: when[i], reverse=True):
        c = full[i]
        frm = c["from"]
        if frm["isOwner"]:
            continue
        user = (frm.get("username") or "").lower()
        root = top(i) if i in parent else None
        # a comment: any reply of yours under it. A reply: a reply of yours in the thread at or after it,
        # so what they wrote after your last answer is waiting again.
        answers = sorted((a for a in threads.get(root or i, []) if not root or when[a] >= when[i]), key=lambda a: when[a])
        if answers:
            a = full[answers[0]]
            done[i] = {"how": "ig-replied", "at": a.get("createdTime"), "text": (a.get("message") or "")[:200]}
        elif user and any(("@" + user) in t and at >= when[i] for t, at in own):
            done[i] = {"how": "ig-mentioned"}
        up = answered(i, root) if root else None
        items.append({"id": i, "postId": pid, "accountId": aid, "platform": platform,
                      "author": frm.get("username") or frm.get("name"),
                      "authorId": str(frm.get("id") or "") or None,   # matches a DM thread's participantId
                      "text": c.get("message") or "", "createdAt": c.get("createdTime"), "url": c.get("url"),
                      "hidden": bool(c.get("isHidden")), "likes": c.get("likeCount") or 0, "liked": bool(c.get("isLiked")),
                      "can": {k: bool(c.get("can" + k.capitalize(), True)) for k in ("reply", "delete", "hide")},
                      "parentId": root,
                      "replyTo": {"author": (up.get("from") or {}).get("username") or (up.get("from") or {}).get("name"),
                                  "text": (up.get("message") or "")[:140]} if up else None})
    return items, done


def _eng(m: dict) -> float:
    return sum((m.get(k) or 0) for k in ("likes", "comments", "shares", "saves"))


# Where each account's followers are. Zernio has it for Instagram (age, gender,
# city, country; 100+ followers), Facebook Pages (country, city) and LinkedIn
# company pages (country, region, industry, job function, seniority). Personal
# LinkedIn profiles, TikTok and Snapchat have none. Cached 6 h per account:
# Meta and LinkedIn refresh it at most daily.
AUDIENCE_TTL = 6 * 3600
_DEMO_KEYS = {"country": "countries", "city": "cities", "age": "ages", "gender": "gender", "region": "regions",
              "industry": "industries", "function": "functions", "seniority": "seniority", "company_size": "sizes"}


def _demo_rows(raw: dict) -> dict:
    demo = {}
    for b, key in _DEMO_KEYS.items():
        rows = [{"name": str(x.get("dimension")), "value": _num(x.get("value"))}
                for x in raw.get(b) or [] if x.get("dimension") is not None and _num(x.get("value")) is not None]
        if not rows:
            continue
        if b == "age":
            rows.sort(key=lambda x: int(re.match(r"\d+", x["name"]).group()) if re.match(r"\d+", x["name"]) else 999)
        else:
            rows.sort(key=lambda x: -x["value"])
        demo[key] = rows
    return demo


def _account_audience(z, a: dict, tz: str) -> dict:
    """{status: ok | empty | personal | unsupported | error, demo, zones} for one account."""
    pf, aid = a["platform"], a["id"]
    cache_p = state_dir() / "audience_cache.json"
    cache = read_json(cache_p) or {}
    hit = cache.get(aid)
    if hit and time.time() - hit.get("ts", 0) < AUDIENCE_TTL:
        return hit["audience"]
    try:
        if pf == "instagram":
            raw = z.ig_demographics(aid, metric="follower_demographics", breakdown="age,gender,city,country", timeframe="this_month")
        elif pf == "facebook":
            raw = z.get("/analytics/facebook/demographics", accountId=aid, breakdown="country,city")
        elif pf == "linkedin":
            raw = z.get("/analytics/linkedin/demographics", accountId=aid, breakdown="country,region,industry,function,seniority")
        else:
            return {"status": "unsupported"}
        demo = _demo_rows((raw or {}).get("demographics") or {})
        res = {"status": "ok" if demo else "empty", "demo": demo}
        if demo.get("countries"):
            res["zones"] = audience.zones(demo["countries"], tz)
    except ZernioError as e:
        msg = str(e)
        if "personal_account_not_supported" in msg:
            res = {"status": "personal"}
        else:
            return {"status": "error", "error": msg[:200]}       # not cached: try again next refresh
    except Exception as e:
        return {"status": "error", "error": f"{type(e).__name__}: {e}"[:200]}
    cache[aid] = {"ts": time.time(), "audience": res}
    write_json(cache_p, cache)
    return res


def _networks(z, section, out: dict, tz: str, today, cfg: dict, bt_done: str) -> list[dict]:
    """One dashboard per connected account: followers (now, 7/30-day change,
    90-day series), its goal, the last 30 days vs the 30 before from its own
    posts, best times, top posts and the weekly posting rhythm."""
    # every connected account (several per network are fine), not only the ones chosen for posting
    accs = [a for a in out.get("accounts") or [] if a.get("id") and a.get("active") is not False]
    if not accs:
        return []
    d90 = today - timedelta(days=89)
    st = section("follower stats (all)", lambda: z.follower_stats([a["id"] for a in accs], fromDate=d90.isoformat(),
                                                                    toDate=today.isoformat(), granularity="daily")) or {}
    stats = st.get("stats") or {}
    meta = {a.get("_id"): a for a in st.get("accounts") or []}
    res = []
    for a in accs:
        pf = a["platform"]
        series = sorted(({"date": (pt.get("date") or "")[:10], "value": _num(pt.get("followers"))} for pt in stats.get(a["id"], [])
                         if _num(pt.get("followers")) is not None and pt.get("date")), key=lambda r: r["date"])
        if pf == "instagram" and len((out.get("followers") or {}).get("series") or []) > len(series):
            series = out["followers"]["series"]
        by = {r["date"]: r["value"] for r in series}

        def at(day, by=by):
            ks = [k for k in by if k <= day.isoformat()]
            return by[max(ks)] if ks else None
        m = meta.get(a["id"]) or {}
        now = _num(m.get("currentFollowers")) or a.get("followers") or (series[-1]["value"] if series else None)
        c7 = (now - at(today - timedelta(days=7))) if now is not None and at(today - timedelta(days=7)) is not None else None
        c30 = (now - at(today - timedelta(days=30))) if now is not None and at(today - timedelta(days=30)) is not None else None

        same_pf = sum(1 for x in accs if x["platform"] == pf)
        posts = [p for p in out.get("posts") or [] if p.get("platform") == pf and p.get("publishedAt")
                 and (p.get("accountId") == a["id"] or (not p.get("accountId") and same_pf == 1))]

        def window(lo, hi, posts=posts):
            ps = [p for p in posts if lo.isoformat() <= lday(p["publishedAt"]) <= hi.isoformat()]
            tot = lambda k: sum((p["metrics"].get(k) or 0) for p in ps)
            ers = [p["metrics"]["engagementRate"] for p in ps if p["metrics"].get("engagementRate") is not None]
            return {"posts": len(ps), "impressions": tot("impressions"), "reach": tot("reach"), "views": tot("views"),
                    "engagements": sum(_eng(p["metrics"]) for p in ps), "comments": tot("comments"), "shares": tot("shares"), "saves": tot("saves"),
                    "er": round(sum(ers) / len(ers), 2) if ers else None}
        k30 = window(today - timedelta(days=29), today)
        k30p = window(today - timedelta(days=59), today - timedelta(days=30))
        k30["followers"], k30p["followers"] = (c30 if c30 is not None else ((now - series[0]["value"]) if series and now is not None else None)), ((at(today - timedelta(days=30)) - at(today - timedelta(days=60)))
                                                   if at(today - timedelta(days=30)) is not None and at(today - timedelta(days=60)) is not None else None)
        top = sorted(posts, key=lambda p: (_eng(p["metrics"]), p["metrics"].get("impressions") or 0), reverse=True)[:5]
        weeks = []
        for w in range(7, -1, -1):
            lo, hi = today - timedelta(days=7 * w + 6), today - timedelta(days=7 * w)
            ps = [p for p in posts if lo.isoformat() <= lday(p["publishedAt"]) <= hi.isoformat()]
            weeks.append({"from": lo.isoformat(), "posts": len(ps), "engagements": sum(_eng(p["metrics"]) for p in ps)})
        if pf == bt_done:
            bt = out.get("besttime") or {}
        else:
            r = section(f"best time ({pf})", lambda pf=pf, aid=a["id"]: z.best_time(platform=pf, accountId=aid))
            bt = besttime.compute(r or {}, tz) if r is not None else {"basis": "insufficient"}
        res.append({"platform": pf, "accountId": a["id"], "username": a.get("username"), "name": m.get("displayName"),
                    "picture": m.get("profilePicture"), "followers": now, "followersUpdated": a.get("followersUpdated"),
                    "change7": c7, "change30": c30, "series": series, "selected": bool(a.get("selected")),
                    "since": series[0]["date"] if series and c30 is None else None,
                    "changeSince": (now - series[0]["value"]) if series and c30 is None and now is not None else None, "goal": None,
                    "kpis": k30, "kpisPrev": k30p, "postsTotal": len(posts), "top": top, "weeks": weeks,
                    "audience": _account_audience(z, a, tz),
                    "bestTime": {"basis": bt.get("basis"), "slots": (bt.get("slots") or [])[:3], "note": bt.get("note"), "average": bt.get("average")}})
    return _apply_goals(res, cfg)


def _apply_goals(nets: list[dict], cfg: dict) -> list[dict]:
    """Each network dashboard's goal, read from the settings every time (not
    frozen in the cache), so a goal the user just changed shows at once."""
    goals = ((cfg.get("goal") or {}).get("by") or {})
    main = (cfg.get("goal") or {}).get("followers")
    for n in nets or []:
        pf = n.get("platform")
        same_pf = sum(1 for x in nets if x.get("platform") == pf)
        n["goal"] = (goals.get(n.get("accountId")) or (goals.get(pf) if same_pf == 1 else None)
                     or (main if pf == "instagram" and n.get("selected") else None))
    return nets


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


import threading
_BUILD_LOCK = threading.Lock()


def build(force: bool = False) -> dict:
    cache_p = state_dir() / "cache.json"
    cached = read_json(cache_p)
    if cached and not force and time.time() - cached.get("_ts", 0) < CACHE_SECONDS and cached.get("_v") == VERSION:
        _apply_goals(cached.get("networks"), config())     # goals change between syncs
        return cached

    # one refresh at a time: other tabs or requests asking meanwhile wait for it and share its result
    if not _BUILD_LOCK.acquire(blocking=False):
        with _BUILD_LOCK:
            fresh = read_json(cache_p)
        if fresh:
            _apply_goals(fresh.get("networks"), config())
            return fresh
        _BUILD_LOCK.acquire()
    try:
        import jobs
        with jobs.job("sync", "Refreshing from Zernio", estimate=40, step="Posts, followers, best time…"):
            for _ in range(3):
                out = _build()
                if not out.get("_stale"):      # nothing changed in Zernio while it was reading
                    break
            return out
    finally:
        _BUILD_LOCK.release()


def _changed_since(ts: float) -> bool:
    """Did store.drop_cache() run (a post made, moved, cancelled…) after this refresh started?"""
    try:
        return float((state_dir() / "cache.dirty").read_text(encoding="utf-8")) >= ts
    except (OSError, ValueError):
        return False


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
    try:
        from zoneinfo import ZoneInfo
        today = datetime.now(ZoneInfo(config().get("timezone") or "UTC")).date()   # the user's today, not the computer's
    except Exception:
        today = date.today()
    d7, d14, d30, d89 = (today - timedelta(days=n) for n in (7, 14, 30, 87))   # Zernio caps history at 88 days

    import jobs
    seen = [0]

    def section(name, fn):
        seen[0] += 1
        jobs.here(step=f"Reading {name}", pct=min(97, 100 * seen[0] / 24))
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
         "followers": a.get("followersCount"), "followersUpdated": a.get("followersLastUpdated") or a.get("updatedAt"), "active": a.get("isActive"),
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
        # Zernio often leaves follows_and_unfollows empty; fall back to the change in the
        # follower count (net new followers) from the daily series we already have.
        if out["kpis"]["follows"] is None:
            by_day = {p["date"]: p["value"] for p in fol.get("series") or [] if p.get("value") is not None}

            def _at(day):
                # the last known value on or before `day`
                ks = [k for k in by_day if k <= day.isoformat()]
                return by_day[max(ks)] if ks else None

            now, wk, two = _at(today), _at(d7), _at(d14)
            if now is not None and wk is not None:
                out["kpis"]["follows"] = now - wk
                out["kpis"]["follows_prev"] = (wk - two) if two is not None else None
                out["kpis"]["follows_basis"] = "follower_count"

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

    # LinkedIn polls/reposts made here: Zernio doesn't echo platformSpecificData, so take them from our plans
    li_local = {}
    for f in (state_dir() / "plans").glob("*.json"):
        pl = read_json(f) or {}
        pid, ls = (pl.get("result") or {}).get("postId"), (pl.get("settings") or {}).get("linkedin") or {}
        if pid and ls.get("kind") in ("poll", "repost"):
            li_local[pid] = {"kind": ls["kind"], "poll": ls.get("poll") if ls["kind"] == "poll" else None,
                             "reshareUrl": ls.get("reshareUrl") if ls["kind"] == "repost" else None}
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
                          "trial": t.get("isTrialReel") or bool(((t.get("platformSpecificData") or {}).get("trialParams"))),
                          "graduation": t.get("trialGraduationStrategy") or (((t.get("platformSpecificData") or {}).get("trialParams") or {}).get("graduationStrategy"))})
        import formats
        base = formats.base_of([x.get("type") for x in mi])
        li_kind = (li_local.get(p.get("_id")) or {}).get("kind")
        for t, pl in zip(p.get("platforms") or [], plats):
            psd_t = dict(t.get("platformSpecificData") or {})
            if pl["platform"] == "linkedin" and li_kind in ("poll", "repost"):
                psd_t.setdefault("poll" if li_kind == "poll" else "reshareUrl", True)
            pl["fmt"] = formats.fmt_of(pl["platform"], base, psd_t, bool(pl.get("trial")))
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
            "media": len(mi), "items": _media_items(mi) or _media_items(a.get("mediaItems")),
            "platforms": plats, "fromSkill": p.get("_id") in mine,
            "li": li_local.get(p.get("_id")),
            "liStats": {k: _num((a.get("analytics") or {}).get(k)) for k in ("impressions", "likes", "comments", "shares")}
                       if a.get("platform") == "linkedin" and a.get("analytics") else None})
        if li_local.get(p.get("_id"), {}).get("kind") == "poll":
            out["zposts"][-1]["kind"] = "poll"
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
            "count": n, "createdAt": a.get("publishedAt"), "items": _media_items(a.get("mediaItems")),
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
    days_with = {lday(p["publishedAt"]) for p in out["posts"] if p.get("publishedAt")}
    pub = section("published posts", lambda: z.posts(status="published", fromDate=d30.isoformat(), limit=100))
    days_with |= {lday(p.get("publishedAt") or p.get("scheduledFor")) for p in _items(pub)}
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

    out["networks"] = _networks(z, section, out, tz, today, cfg, bt_platform)

    # demographics: the main Instagram account's, already read for its network dashboard
    main_aud = next((n.get("audience") for n in out["networks"] if n.get("accountId") == ig), None) if ig else None
    if main_aud and main_aud.get("status") in ("ok", "empty"):
        demo = {k: v for k, v in (main_aud.get("demo") or {}).items() if k in ("cities", "countries", "ages", "gender")}
        if not any(demo.values()):
            demo["note"] = "Demographics appear after 100 followers and need the Analytics add-on."
        out["demographics"] = demo
        out["audience"] = audience.zones(demo.get("countries") or [], tz)
    # fallback: one call -> {demographics: {age|gender|city|country: [{dimension, value}]}}
    elif ig:
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
    # list: {data: [{id (post id), accountId, platform, commentCount, createdTime}]}
    # per post: {comments: [{id, message, createdTime, from{username, isOwner}, replies[{parentId, from{isOwner}}]}]}
    # The 10 newest posts with comments plus the 5 busiest older ones (a post that
    # keeps getting comments must not leave the Inbox because newer posts came),
    # every page of their comments, and the replies inside each thread. Zernio lists
    # posts without comments too, so filter before cutting, or busy posts get skipped.
    # since= is the post's publish date, not the comment's: 30 days back, or a post
    # people still comment on leaves the Inbox the day it turns a week old.
    cps = section("comments", lambda: z.comment_posts(since=d30.isoformat(), limit=50)) or {}
    comments, cposts, done_on = [], {}, {}
    with_comments = [cp for cp in (cps.get("data") or []) if cp.get("commentCount")]
    for cp in _comment_posts_to_read(with_comments):
        pid, aid = cp.get("id"), cp.get("accountId") or ig
        if not (pid and aid):
            continue
        rows, po, more = _read_comments(z, section, pid, aid)
        jobs.here(step="Reading who wrote the replies")
        _name_replies(z, pid, aid, rows)
        cposts[pid] = {"permalink": po.get("permalink") or cp.get("permalink"), "caption": (po.get("text") or cp.get("content") or "")[:600],
                       "thumb": po.get("thumbnailUrl") or po.get("mediaUrl") or cp.get("picture"), "count": len(rows)}
        if more:
            cposts[pid]["more"] = True              # the read stopped early: older comments are not in the Inbox
        items, done = _comment_items(rows, pid, aid, cp.get("platform"))
        comments += items
        done_on.update(done)
    out["comments"] = comments
    out["commentPosts"] = cposts

    au = section("automations", lambda: z.automations(cfg.get("profile_id")))
    out["automations"] = [
        {"id": a.get("id") or a.get("_id"), "name": a.get("name"), "keywords": a.get("keywords", []), "active": a.get("isActive", True),
         "followGate": bool(a.get("followGate")), "postId": a.get("platformPostId") or a.get("postId"),
         "message": a.get("dmMessage") or "", "buttons": a.get("buttons") or [], "stats": a.get("stats") or {}, "zPostId": a.get("postId") if a.get("platformPostId") else None}
        for a in _items(au)
    ]
    out["autoLog"] = _auto_log(z, section, out["automations"], {c["postId"] for c in comments})
    # What you did yourself in Instagram (or Facebook): replied under the comment,
    # @mentioned them in your own comment, or wrote to them in DMs afterwards.
    for cid, v in done_on.items():
        out["autoLog"].setdefault(cid, v)
    # ... or the gift reached them by DM for another comment of theirs: handled when they
    # follow (dm-gift); otherwise it stays waiting and giftLog says the gift arrived.
    # Comments you already dealt with here (replied, gift, ignored) need no DM check: with them in,
    # the DM list was read back to the oldest of them on every refresh (half a minute on a busy account).
    done_here = (read_json(state_dir() / "inbox.json", {}) or {}).get("handled") or {}
    out["giftLog"] = _dm_answers(z, section, [c for c in comments if c["id"] not in done_here], out["autoLog"], out["automations"])
    if ig:
        ib = section("ice breakers", lambda: z.ice_breakers(ig))
        out["iceBreakers"] = (ib or {}).get("ice_breakers", []) if isinstance(ib, dict) else []

    # A change made while this was reading (it may have listed the posts before it): never keep
    # this older picture as the fresh one. build() reads again.
    if _changed_since(out["_ts"]):
        out["_stale"] = True
        return out
    write_json(cache_p, out)
    if _changed_since(out["_ts"]):
        cache_p.unlink(missing_ok=True)
        out["_stale"] = True
    return out
