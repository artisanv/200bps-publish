"""What a post is on each network: Reel, Trial Reel, Story, Carousel, Photo,
Video, Document, Text, Poll, Repost, Saved story, Spotlight, Short.

The same media can be different things per network (one video = a Reel on
Instagram, a Video on LinkedIn, a Spotlight on Snapchat), so the dashboard
shows a format per network, decided from the media and the settings sent to
Zernio (platformSpecificData)."""
from __future__ import annotations

BASE = {"reel": "video", "single": "photo", "carousel": "carousel", "document": "document", "text": "text"}


def base_of(item_types: list[str]) -> str:
    """Media types of a post -> reel (one video) | single | carousel | document | text."""
    kinds = [k for k in item_types or [] if k]
    if not kinds:
        return "text"
    if kinds == ["video"]:
        return "reel"
    if "document" in kinds:
        return "document"
    return "single" if len(kinds) == 1 else "carousel"


def fmt_of(platform: str, base: str, psd: dict | None = None, trial: bool = False) -> str:
    psd = psd or {}
    ct = str(psd.get("contentType") or "").lower()
    if platform == "instagram":
        if ct == "story":
            return "story"
        if base == "reel":
            return "trial" if trial or psd.get("trialParams") else "reel"
        return {"single": "photo"}.get(base, base)
    if platform == "linkedin":
        if psd.get("poll"):
            return "poll"
        if psd.get("reshareUrl"):
            return "repost"
        return BASE.get(base, base)
    if platform == "facebook":
        if ct in ("story", "reel"):
            return ct
        return BASE.get(base, base)
    if platform == "snapchat":
        return {"saved_story": "saved_story", "spotlight": "spotlight"}.get(ct, "story")
    if platform == "tiktok":
        return "video" if base == "reel" else "photo"
    if platform == "youtube":
        return "short" if psd.get("isShort") or ct == "short" else "video"
    return BASE.get(base, base)
