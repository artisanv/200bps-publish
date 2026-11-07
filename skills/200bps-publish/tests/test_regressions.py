"""One test per bug fixed on 2026-11-07, so none of them comes back."""
import json
import os
import unittest

from helpers import CAPTION, IG, JPEG, LI_CAPTION, Workspace


def fresh(mod):
    import importlib
    return importlib.reload(__import__(mod))


class Regressions(Workspace):
    def _scheduled(self, name, li=None):
        d = self.post_folder(name, CAPTION, li)
        self.bps("analyze", str(d), "--platforms", "instagram,linkedin" if li else "instagram")
        self.bps("schedule", "2030-02-01T19:00:00+03:00")
        self.bps("ready")
        self.bps("publish", "--confirm")
        return d, self.plan()

    def test_01_reanalyse_keeps_sent_post_sent(self):
        d, p = self._scheduled("re1")
        n = len(self.fz.sent("POST", "/posts"))
        self.bps("analyze", str(d), "--platforms", "instagram")       # e.g. Batch → prepare on the same folder
        p2 = self.plan()
        self.assertEqual(p2["result"]["postId"], p["result"]["postId"])
        self.assertNotIn(p2["status"], ("draft", "awaiting_approval"))
        self.bps("ready", ok=None)
        self.bps("publish", "--confirm", ok=False)
        self.assertEqual(len(self.fz.sent("POST", "/posts")), n)

    def test_02_edit_caption_keeps_network_settings(self):
        import plan as plans
        d = self.post_folder("re2", CAPTION, LI_CAPTION)                 # two captions → per-network customContent
        self.bps("analyze", str(d), "--platforms", "instagram,linkedin")
        self.bps("set", "instagram.firstComment", "أول تعليق")
        self.bps("schedule", "2030-02-02T19:00:00+03:00")
        self.bps("ready")
        self.bps("publish", "--confirm")
        pid = self.plan()["result"]["postId"]
        zedit = fresh("zedit")
        zedit.edit_caption(pid, "كابشن جديد", "edit")
        ig = next(t for t in self.fz.posts[pid]["platforms"] if t["platform"] == "instagram")
        self.assertEqual(ig.get("customContent"), "كابشن جديد")
        self.assertEqual((ig.get("platformSpecificData") or {}).get("firstComment"), "أول تعليق")

    def test_03_answer_has_edited(self):
        out = self.bps("answer", "nope", "approve", ok=None)
        self.assertNotIn("Traceback", out["_err"])
        self.assertNotIn("AttributeError", out["_err"])

    def test_04_cancel_partly_live_post_keeps_record(self):
        d, p = self._scheduled("re4", LI_CAPTION)
        pid = p["result"]["postId"]
        post = self.fz.posts[pid]
        post["status"] = "partial"
        for t in post["platforms"]:
            t["status"] = "published" if t["platform"] == "instagram" else "failed"
        out = self.bps("cancel", "--post", pid, "--confirm")
        self.assertIn(pid, self.fz.posts, "a partly-live post must not be deleted as if nothing were live")
        self.assertTrue(out.get("manual"), out)                        # Instagram can't be unpublished by API
        self.assertEqual(self.plan()["result"]["postId"], pid)          # draft not reset: can't post it twice

    def test_06_batch_creates_the_gift(self):
        import plan as plans
        d = self.post_folder("re6", CAPTION)
        out = self.bps("batch", "prepare", str(d))
        rows = json.loads(out["raw"]) if "raw" in out else out.get("items") or []
        pl = plans.load(rows[0]["plan"]) if rows else None
        self.assertIsNotNone(pl, out)
        pl["dm"] = {"enabled": True, "asked": True, "keyword": "skill", "matchMode": "word", "message": "هدية",
                    "followGate": True}
        plans.save(pl, make_current=False)
        f = self.ws / "b.json"
        f.write_text(json.dumps([{"plan": pl["id"], "at": "2030-03-01T19:00:00+03:00"}]))
        before = len(self.fz.sent("POST", "/comment-automations"))
        self.bps("batch", "run", "--file", str(f), "--confirm", timeout=180)
        import time
        for _ in range(60):
            if len(self.fz.sent("POST", "/comment-automations")) > before:
                break
            time.sleep(0.5)
        made = self.fz.sent("POST", "/comment-automations")[before:]
        self.assertEqual(len(made), 1, "a batch-scheduled post must get its DM gift")
        self.assertEqual(made[0]["body"]["keywords"], ["skill", "Skill", "SKILL"])

    def test_07_carousel_natural_order(self):
        import media
        d = self.ws / "carousel"
        d.mkdir()
        for n in (1, 2, 10, 3):
            (d / f"{n}.jpg").write_bytes(JPEG)
        names = [os.path.basename(m["path"]) for m in media.scan_folder(d)["media"]]
        self.assertEqual(names, ["1.jpg", "2.jpg", "3.jpg", "10.jpg"])

    def test_08_past_time_blocks(self):
        d = self.post_folder("re8", CAPTION)
        self.bps("analyze", str(d), "--platforms", "instagram")
        self.bps("schedule", "2001-01-01T10:00:00+03:00", ok=None)
        self.assertIn("time.past", {c["id"] for c in self.plan()["blocking"]})
        self.bps("ready", ok=None)
        n = len(self.fz.sent("POST", "/posts"))
        self.bps("publish", "--confirm", ok=False)
        self.assertEqual(len(self.fz.sent("POST", "/posts")), n)

    def test_10_gift_goes_to_the_posts_own_account(self):
        import plan as plans
        p = self.plan()
        p["targets"] = {"instagram": ["acc_ig_other"]}
        p["dm"] = {"enabled": True, "keyword": "x", "message": "m"}
        self.assertEqual(plans.dm_body(p)["accountId"], "acc_ig_other")

    def test_11_trial_on_a_draft_keeps_the_open_post(self):
        import plan as plans
        import trial
        a = self.post_folder("re11a", CAPTION)
        b = self.post_folder("re11b", CAPTION)
        pb = self.bps("analyze", str(b), "--platforms", "instagram")["id"]
        pa = self.bps("analyze", str(a), "--platforms", "instagram")["id"]       # a is the open post
        try:
            trial.apply([{"id": pb, "where": "local", "trial": True, "graduation": "SS_PERFORMANCE"}], "edit", via="chat")
        except Exception:
            pass                                       # photos can't be trials; what matters is the open post
        self.assertEqual(fresh("plan").current_id(), pa)

    def test_12_retry_uses_same_idempotency_key(self):
        d = self.post_folder("re12", CAPTION)
        self.bps("analyze", str(d), "--platforms", "instagram")
        self.bps("schedule", "2030-02-03T19:00:00+03:00")
        self.bps("ready")
        self.fz.fail_next["POST /posts"] = (503, {"error": "busy"})
        self.bps("publish", "--confirm", ok=False)
        self.bps("ready", ok=None)
        self.bps("publish", "--confirm", ok=None)
        keys = [c["idem"] for c in self.fz.sent("POST", "/posts")[-2:]]
        self.assertEqual(keys[0], keys[1], "a retry must reuse the key, so a lost response can't create a second post")

    def test_13_failed_post_can_be_sent_again(self):
        import plan as plans
        d, p = self._scheduled("re13")
        pid = p["result"]["postId"]
        p = self.plan()
        p["status"] = "failed"
        p["remote"] = {"status": "failed", "platforms": [], "checked": 0}     # what the Zernio refresh records
        self.fz.posts[pid]["status"] = "failed"
        plans.save(p)
        self.bps("schedule", "2030-02-04T19:00:00+03:00", ok=None)
        self.bps("ready", ok=None)
        n = len(self.fz.sent("POST", "/posts"))
        self.bps("publish", "--confirm")
        self.assertEqual(len(self.fz.sent("POST", "/posts")), n + 1)
        self.assertEqual(self.plan()["previous"][-1]["postId"], pid)
        self.bps("publish", "--confirm", ok=False)                     # …and only once
        self.assertEqual(len(self.fz.sent("POST", "/posts")), n + 1)

    def test_14_days_are_the_users_days(self):
        summary = fresh("summary")
        self.assertEqual(summary.lday("2026-11-07T22:30:00.000Z"), "2026-11-08")    # 01:30 in Kuwait
        self.assertEqual(summary.lday("2026-11-07T20:30:00.000Z"), "2026-11-07")
        self.assertEqual(summary.lday("2026-11-07"), "2026-11-07")


class SnapchatStory(unittest.TestCase):
    def test_09_story_caption_length_doesnt_block(self):
        import checks
        long = "ك" * 400
        cc = checks.check_caption(long, "snapchat", {})
        self.assertIn("caption.length", {c["id"] for c in cc if c["status"] == "fail"})   # the raw rule still exists…
        import plan as plans
        src = open(plans.__file__, encoding="utf-8").read()
        self.assertIn('"caption.length", "caption.missing")]   # Stories show no caption', src)   # …and recheck drops it


if __name__ == "__main__":
    unittest.main()
