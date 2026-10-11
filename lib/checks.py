"""Caption + media checks and the 0-100 post score.

Every rule is data in RULES so it can be updated in one place when a
platform changes its limits. Each rule carries a `source` so the agent can
tell the user where a number comes from instead of asserting it.
"""
from __future__ import annotations

import re
import unicodedata

RULES_VERIFIED = "2026-09-27"

RULES = {
    "instagram": {
        "caption_max": 2200,
        "hashtags_max": 5,
        "hook_chars": 125,
        "carousel_max": 10,                    # API limit (the app allows more)
        "image_aspect": (0.5625, 1.91),
        "reel_aspect": 9 / 16,
        "reel_duration": (3, 90),              # API limit for Reels
        "links_clickable": False,
        "source": "docs.zernio.com/platforms/instagram; 5-hashtag cap: Instagram announcement, Dec 2025",
    },
    "facebook": {
        "caption_max": 63206,
        "hashtags_max": 5,
        "hook_chars": 480,
        "carousel_max": 10,
        "links_clickable": True,
        "source": "docs.zernio.com/platforms/facebook",
    },
    "threads": {
        "caption_max": 500,
        "hashtags_max": 1,                     # one topic tag per post (topic_tag)
        "hook_chars": 500,
        "carousel_max": 10,
        "links_clickable": True,
        "source": "docs.zernio.com/platforms/threads",
    },
    "linkedin": {
        "caption_max": 3000,
        "hashtags_max": 5,
        "hook_chars": 210,                     # text shown before "...see more"
        "carousel_max": 20,
        "links_clickable": True,
        "source": "docs.zernio.com/platforms/linkedin",
    },
}

HASHTAG_RE = re.compile(r"(?<![\w&])#([\w؀-ۿ_]+)", re.UNICODE)
MENTION_RE = re.compile(r"(?<![\w])@([A-Za-z0-9._]{2,30})")
URL_RE = re.compile(r"https?://\S+")
QUESTION_MARKS = ("?", "؟")

DEFAULT_CTA_WORDS = [
    "comment", "save", "share", "follow", "dm", "tell me", "link in bio",
    "اكتب", "احفظ", "شارك", "تابع", "راسل", "قول", "علق", "علّق",
]


def hashtags(text: str) -> list[str]:
    return [h for h in HASHTAG_RE.findall(text)]


def strip_hashtag_block(text: str) -> str:
    lines = [l for l in text.splitlines()]
    while lines and (not lines[-1].strip() or all(w.startswith("#") for w in lines[-1].split())):
        lines.pop()
    return "\n".join(lines).strip()


def first_line(text: str) -> str:
    for line in text.splitlines():
        if line.strip():
            return line.strip()
    return ""


def last_line(text: str) -> str:
    body = strip_hashtag_block(text)
    for line in reversed(body.splitlines()):
        if line.strip() and not URL_RE.fullmatch(line.strip()):
            return line.strip()
    return ""


def _norm(s: str) -> str:
    return unicodedata.normalize("NFKC", s).lower()


def check_caption(text: str, platform: str, cfg: dict) -> list[dict]:
    r = RULES[platform]
    out = []

    def add(id_, status, msg, **kw):
        out.append({"id": id_, "platform": platform, "status": status, "msg": msg, **kw})

    if not text.strip():
        add("caption.missing", "fail", "No caption found.")
        return out

    n = len(text)
    add("caption.length", "pass" if n <= r["caption_max"] else "fail",
        f"{n} / {r['caption_max']} characters.", value=n, limit=r["caption_max"])

    tags = hashtags(text)
    lowered = [_norm(t) for t in tags]
    dupes = sorted({t for t in lowered if lowered.count(t) > 1})
    add("hashtags.count", "pass" if len(tags) <= r["hashtags_max"] else "fail",
        f"{len(tags)} hashtags (max {r['hashtags_max']}).", value=tags, limit=r["hashtags_max"],
        fix=None if len(tags) <= r["hashtags_max"] else
        (f"Keep {r['hashtags_max']}: remove the rest, or add caption.{platform}.txt with a {platform} version."))
    if dupes:
        add("hashtags.duplicate", "warn", "Duplicate hashtags: " + ", ".join("#" + d for d in dupes))
    banned = {_norm(b.lstrip("#")) for b in cfg.get("banned_hashtags", [])}
    hit = [t for t in tags if _norm(t) in banned]
    if hit:
        add("hashtags.banned", "fail", "Hashtags on your blocked list: " + ", ".join("#" + t for t in hit))
    if not tags:
        add("hashtags.none", "warn", "No hashtags. 1-5 specific tags help discovery.")

    hook = first_line(text)
    if hook.startswith("#") or hook.startswith("@"):
        add("hook.start", "warn", "Caption opens with a tag. Open with the hook instead.")
    add("hook.length", "pass" if len(hook) <= r["hook_chars"] else "warn",
        f"First line is {len(hook)} chars; people see about {r['hook_chars']} before 'more'.",
        value=len(hook), limit=r["hook_chars"])

    kws = [k for k in cfg.get("keywords", []) if k.strip()]
    if kws:
        found = [k for k in kws if _norm(k) in _norm(hook)]
        add("seo.keyword", "pass" if found else "warn",
            ("Search keyword in first line: " + ", ".join(found)) if found
            else "No search keyword in the first line (" + ", ".join(kws[:5]) + ").")

    end = last_line(text)
    cta_words = cfg.get("cta_words") or DEFAULT_CTA_WORDS
    has_q = any(q in end for q in QUESTION_MARKS)
    has_cta = any(_norm(w) in _norm(end) for w in cta_words)
    add("engage.ending", "pass" if (has_q or has_cta) else "warn",
        "Ends with a question or call to action." if (has_q or has_cta)
        else "Ending has no question or call to action.")

    if not r["links_clickable"] and URL_RE.search(text):
        add("links.not_clickable", "info", f"Links in {platform} captions are not clickable.")

    safety = cfg.get("safety_terms", [])
    if safety:
        hits = sorted({t for t in safety if t.strip() and _norm(t) in _norm(text)})
        add("safety.terms", "pass" if not hits else "fail",
            "No restricted wording." if not hits else "Restricted wording found: " + ", ".join(hits),
            value=hits)
    return out


def post_type(media: list[dict]) -> str:
    kinds = [m["kind"] for m in media]
    if not kinds:
        return "text"
    if kinds == ["video"]:
        return "reel"
    if kinds == ["document"]:
        return "document"
    if len(kinds) == 1:
        return "single"
    return "carousel"


def check_media(scan: dict, platform: str) -> list[dict]:
    r = RULES[platform]
    media = scan["media"]
    ptype = post_type(media)
    out = []

    def add(id_, status, msg, **kw):
        out.append({"id": id_, "platform": platform, "status": status, "msg": msg, **kw})

    if ptype == "text":
        add("media.none", "info", "Text-only post." if platform != "instagram" else "Instagram needs at least one image or video.")
        if platform == "instagram":
            out[-1]["status"] = "fail"
        return out
    if ptype == "document" and platform != "linkedin":
        add("media.document", "fail", "PDF documents are a LinkedIn-only format.")
    if ptype == "carousel" and len(media) > r["carousel_max"]:
        add("media.carousel", "fail", f"{len(media)} items; {platform} allows {r['carousel_max']}.")
    elif ptype == "carousel":
        add("media.carousel", "pass", f"{len(media)} carousel items.")

    for m in media:
        if not m.get("verified"):
            add("media.unverified", "warn", f"{m['file']}: {m.get('note', 'could not verify')}")
            continue
        if platform == "instagram" and m["kind"] == "image" and m.get("aspect"):
            lo, hi = r["image_aspect"]
            ok = lo - 0.01 <= m["aspect"] <= hi + 0.01
            add("media.aspect", "pass" if ok else "fail",
                f"{m['file']}: {m['width']}x{m['height']}" + ("" if ok else " is outside 9:16 to 1.91:1 (4:5 recommended)."))
        if platform == "instagram" and m["kind"] == "video":
            ok_ar = abs(m.get("aspect", 0) - r["reel_aspect"]) < 0.02
            add("media.reel_aspect", "pass" if ok_ar else "warn",
                f"{m['file']}: {m['width']}x{m['height']}" + ("" if ok_ar else " is not 9:16; Reels will crop or letterbox."))
            lo, hi = r["reel_duration"]
            d = m.get("duration", 0)
            add("media.reel_duration", "pass" if lo <= d <= hi else "fail", f"{m['file']}: {d}s (allowed {lo}-{hi}s).")
    if ptype == "reel":
        add("media.cover", "pass" if scan.get("cover") else "warn",
            "Custom cover found." if scan.get("cover") else "No cover.jpg. Reels show a random frame in your grid.")
    return out


WEIGHTS = {
    "hook": 15, "seo": 10, "ending": 15, "hashtags": 15, "length": 10,
    "media": 15, "cover": 10, "timing": 10,
}


def score(checks: list[dict], ptype: str, timing_ok: bool | None, has_keywords: bool) -> dict:
    by = {}
    for c in checks:
        by.setdefault(c["id"], []).append(c["status"])

    def ok(id_):
        s = by.get(id_)
        return bool(s) and all(x in ("pass", "info") for x in s)

    parts = {
        "hook": ok("hook.length") and "hook.start" not in by,
        "seo": ok("seo.keyword") if has_keywords else None,
        "ending": ok("engage.ending"),
        "hashtags": ok("hashtags.count") and "hashtags.banned" not in by and "hashtags.none" not in by,
        "length": ok("caption.length"),
        "media": not any(c["status"] == "fail" for c in checks if c["id"].startswith("media.")),
        "cover": ok("media.cover") if ptype == "reel" else None,
        "timing": timing_ok,
    }
    earned = possible = 0
    tips = []
    tip_text = {
        "hook": "Tighten the first line so the hook shows before 'more'.",
        "seo": "Put one search keyword in the first line.",
        "ending": "End with a specific question or call to action.",
        "hashtags": "Use 1-5 specific hashtags.",
        "length": "Shorten the caption to the platform limit.",
        "media": "Fix the media issues listed below.",
        "cover": "Add cover.jpg (1080x1920) so the Reel looks right in your grid.",
        "timing": "Schedule for your best time slot.",
    }
    for k, v in parts.items():
        if v is None:
            continue
        possible += WEIGHTS[k]
        if v:
            earned += WEIGHTS[k]
        else:
            tips.append({"part": k, "points": WEIGHTS[k], "tip": tip_text[k]})
    value = round(100 * earned / possible) if possible else 0
    tips.sort(key=lambda t: -t["points"])
    return {"value": value, "parts": parts, "tips": tips}
