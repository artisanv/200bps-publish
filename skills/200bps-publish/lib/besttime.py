"""Best time to post, from the user's own data only.

Source: Zernio GET /v1/analytics/best-time, which returns historical
engagement per (weekday, hour) slot computed from the account's own posts:
    {slots: [{day_of_week: 0=Mon, hour: 0-23 UTC, avg_engagement, post_count}]}

Rules (no guessing):
  * Slots are converted to the user's timezone.
  * A recommendation is made only when there are at least MIN_POSTS posts
    in total and the best slot has at least MIN_SLOT_POSTS posts behind it.
  * Slots are ranked by a shrunk average ((sum + mean*3) / (n + 3)) so small
    samples can't win on luck.
  * Every slot carries its evidence: posts behind it, average engagement,
    lift vs the account average, and a confidence label (high >= 5 posts,
    medium 3-4, low < 3).
  * Otherwise basis = "insufficient" and the note says so plainly. The
    agent must then ask the user when to post, or post now; it must not
    present a generic "industry" time as if it were research on this account.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

MIN_POSTS = 12
MIN_SLOT_POSTS = 2
PRIOR_POSTS = 3      # strength of the pull toward the account average


def _items(resp) -> list:
    if isinstance(resp, list):
        return resp
    if isinstance(resp, dict):
        for k in ("slots", "data", "items", "results"):
            if isinstance(resp.get(k), list):
                return resp[k]
    return []


def compute(resp, tz_name: str, now: datetime | None = None) -> dict:
    tz = ZoneInfo(tz_name)
    slots = _items(resp)
    grid = [[0.0] * 24 for _ in range(7)]      # [day 0=Sun][hour local]
    counts = [[0] * 24 for _ in range(7)]
    total = 0
    for s in slots:
        try:
            d = int(s.get("day_of_week", s.get("dayOfWeek")))
            h = int(s.get("hour"))
            eng = float(s.get("avg_engagement", s.get("avgEngagement", 0)) or 0)
            n = int(s.get("post_count", s.get("postCount", 0)) or 0)
        except (TypeError, ValueError):
            continue
        ref = datetime(2024, 1, 1 + d, h, tzinfo=timezone.utc).astimezone(tz)   # 2024-01-01 is a Monday
        ld, lh = (ref.weekday() + 1) % 7, ref.hour
        grid[ld][lh] = eng
        counts[ld][lh] = n
        total += n

    # Rank by a shrunk (Bayesian) average: slots with few posts are pulled
    # toward the account average, so one lucky post can't outrank a slot with
    # steady results. Displayed numbers stay the raw averages.
    tot_e0 = sum(grid[d][h] * counts[d][h] for d in range(7) for h in range(24))
    tot_n0 = sum(counts[d][h] for d in range(7) for h in range(24)) or 1
    mean0 = tot_e0 / tot_n0

    def shrunk(e, n):
        return (e * n + mean0 * PRIOR_POSTS) / (n + PRIOR_POSTS)

    ranked = sorted(
        ((grid[d][h], counts[d][h], d, h) for d in range(7) for h in range(24) if counts[d][h] >= MIN_SLOT_POSTS),
        key=lambda x: shrunk(x[0], x[1]), reverse=True,
    )
    top = max((x[0] for x in ranked), default=0)
    out = {"tz": tz_name, "grid": grid, "counts": counts, "sample": total, "slots": [], "basis": "insufficient"}

    if total < MIN_POSTS or not ranked or top <= 0:
        out["note"] = (
            f"Only {total} analysed posts so far (need {MIN_POSTS}+ with at least {MIN_SLOT_POSTS} per slot). "
            "No recommendation yet. Choose a time yourself or post now; every post you publish improves this."
        )
        return out

    out["basis"] = "data"
    # account average engagement per post (weighted by posts in each slot)
    tot_e = sum(grid[d][h] * counts[d][h] for d in range(7) for h in range(24))
    tot_n = sum(counts[d][h] for d in range(7) for h in range(24)) or 1
    avg = tot_e / tot_n
    out["average"] = round(avg, 2)

    def ev(e, n, d, h):
        return {"day": d, "hour": h, "avg": round(e, 2), "posts": n, "relative": round(e / top, 3),
                "lift": round((e / avg - 1) * 100) if avg else None, "confidence": confidence(n)}

    out["slots"] = [ev(e, n, d, h) for e, n, d, h in ranked[:5]]
    # each weekday's own peaks (top 2), with evidence; low-evidence slots are kept but labelled
    out["byDay"] = []
    for d in range(7):
        day = sorted(((grid[d][h], counts[d][h], d, h) for h in range(24) if counts[d][h] >= 1),
                     key=lambda x: shrunk(x[0], x[1]), reverse=True)[:2]
        out["byDay"].append({"day": d, "peaks": [ev(*x) for x in day], "posts": sum(counts[d])})
    out["next_at"] = next_occurrence(out["slots"][0], tz, now).isoformat()
    out["note"] = (
        f"Based on {total} of your own posts. Best slot averages "
        f"{ranked[0][0]:.2f} engagement over {ranked[0][1]} posts."
    )
    return out


def confidence(n: int) -> str:
    """How much to trust a slot: by how many of the user's posts it rests on."""
    return "high" if n >= 5 else "medium" if n >= 3 else "low"


def next_occurrence(slot: dict, tz: ZoneInfo, now: datetime | None = None, lead_minutes: int = 15) -> datetime:
    now = (now or datetime.now(timezone.utc)).astimezone(tz)
    for add in range(0, 8):
        cand = (now + timedelta(days=add)).replace(hour=slot["hour"], minute=0, second=0, microsecond=0)
        if (cand.weekday() + 1) % 7 == slot["day"] and cand >= now + timedelta(minutes=lead_minutes):
            return cand
    return now + timedelta(minutes=lead_minutes)
