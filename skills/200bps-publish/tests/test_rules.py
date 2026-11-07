"""Pure rules: caption checks, gift keyword forms, best-time honesty. No network."""
import os
import tempfile
import unittest

import helpers  # noqa: F401  (puts lib/ on the path)

os.environ.setdefault("BPS_WORKSPACE", tempfile.mkdtemp(prefix="bps-rules-"))
import checks  # noqa: E402
import plan as plans  # noqa: E402


def ids(res, status=("fail", "warn")):
    return {c.get("id") for c in res if c.get("status") in status}


class CaptionChecks(unittest.TestCase):
    cfg = {"keywords": ["Claude Code"], "safety_terms": [], "banned_hashtags": []}

    def test_instagram_hashtag_cap(self):
        many = "Claude Code tip\n\nWhat do you think?\n\n" + " ".join(f"#tag{i}" for i in range(8))
        self.assertTrue(any("hashtag" in (i or "") for i in ids(checks.check_caption(many, "instagram", self.cfg))))

    def test_good_caption_passes_core_checks(self):
        ok = "Claude Code يجهز بوستك 🚀\n\nسطر قصير.\n\nشنو رايك؟\n\n#ClaudeCode #AI"
        bad = ids(checks.check_caption(ok, "instagram", self.cfg), ("fail",))
        self.assertEqual(bad, set(), bad)

    def test_snapchat_length(self):
        long = "x" * 400
        self.assertTrue(ids(checks.check_caption(long, "snapchat", self.cfg), ("fail", "warn")))

    def test_arabic_and_emoji_dont_crash(self):
        for net in ("instagram", "linkedin", "facebook", "tiktok", "snapchat"):
            checks.check_caption("‏مرحبا 👋🏽 «publish» ‎#الكويت\n\n؟", net, self.cfg)
            checks.check_caption("", net, self.cfg)


class GiftKeyword(unittest.TestCase):
    def test_every_case(self):
        self.assertEqual(plans.keyword_forms("publish"), ["publish", "Publish", "PUBLISH"])
        self.assertEqual(plans.keyword_forms("  Skill "), ["Skill", "skill", "SKILL"])
        self.assertEqual(plans.keyword_forms("نشر"), ["نشر"])
        self.assertEqual(plans.keyword_forms("claude code"), ["claude code", "Claude code", "CLAUDE CODE", "Claude Code"])


class BestTime(unittest.TestCase):
    """Rule 4: best time only from the user's own data, never invented; Zernio's UTC hours shown in local time."""

    def test_no_data_no_recommendation(self):
        import besttime
        out = besttime.compute({"slots": []}, "Asia/Kuwait")
        self.assertEqual(out["basis"], "insufficient")
        self.assertEqual(out["slots"], [])

    def test_utc_to_local_and_next_time(self):
        from datetime import datetime, timezone
        import besttime
        # Zernio day_of_week 0 = Monday (UTC). Thursday 08:00 UTC = Thursday 11:00 in Kuwait (UTC+3).
        slots = [{"day_of_week": 3, "hour": 8, "avg_engagement": 400, "post_count": 6},
                 {"day_of_week": 1, "hour": 15, "avg_engagement": 20, "post_count": 6},
                 {"day_of_week": 5, "hour": 18, "avg_engagement": 25, "post_count": 6}]
        out = besttime.compute({"slots": slots}, "Asia/Kuwait", now=datetime(2030, 1, 1, 9, tzinfo=timezone.utc))
        self.assertEqual(out["basis"], "data")
        best = out["slots"][0]
        self.assertEqual((best["day"], best["hour"]), (4, 11))          # Sun=0 … Thu=4, local hour
        nxt = datetime.fromisoformat(out["next_at"])
        self.assertEqual((nxt.isoweekday(), nxt.hour), (4, 11))        # a Thursday, 11:00 local
        self.assertGreater(nxt, datetime(2030, 1, 1, 9, tzinfo=timezone.utc))

    def test_one_lucky_post_does_not_win(self):
        import besttime
        slots = [{"day_of_week": 0, "hour": 9, "avg_engagement": 5000, "post_count": 1},
                 {"day_of_week": 2, "hour": 9, "avg_engagement": 300, "post_count": 8},
                 {"day_of_week": 4, "hour": 9, "avg_engagement": 50, "post_count": 8}]
        out = besttime.compute({"slots": slots}, "UTC")
        if out["basis"] == "data":
            self.assertNotEqual(out["slots"][0]["posts"], 1)


if __name__ == "__main__":
    unittest.main()
