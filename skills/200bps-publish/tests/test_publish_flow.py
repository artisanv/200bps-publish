"""End to end: a post folder → checks → schedule → publish → DM gift → edit → trial → cancel,
against the fake Zernio. Checks what Zernio would receive, and that nothing goes out twice."""
import json
import threading
import unittest

from helpers import CAPTION, IG, LI, LI_CAPTION, Workspace, have


class PublishFlow(Workspace):
    def test_1_photo_post_end_to_end(self):
        d = self.post_folder("photo-post", CAPTION, LI_CAPTION)
        out = self.bps("analyze", str(d), "--platforms", "instagram,linkedin")
        self.assertEqual(out.get("type"), "single")
        self.assertIn("instagram", out["score"])
        self.bps("schedule", "2030-01-04T19:00:00+03:00")
        # nothing reached Zernio's write endpoints yet
        self.assertEqual(self.fz.sent("POST", "/posts"), [])
        self.bps("publish", ok=False)                                   # no --confirm → refused
        self.bps("publish", "--confirm", ok=False)                      # not marked ready → refused
        self.assertEqual(self.fz.sent("POST", "/posts"), [])
        self.bps("ready")
        self.bps("publish", "--confirm")
        posts = self.fz.sent("POST", "/posts")
        self.assertEqual(len(posts), 1)
        body = posts[0]["body"]
        self.assertEqual(body["scheduledFor"][:16], "2030-01-04T19:00")
        self.assertEqual({p["platform"] for p in body["platforms"]}, {"instagram", "linkedin"})
        li = next(p for p in body["platforms"] if p["platform"] == "linkedin")
        self.assertIn("github.com/example/repo", li.get("customContent", body["content"]))
        self.assertTrue(posts[0]["auth"].startswith("Bearer sk_test_"))
        # a second publish of the same post is refused and sends nothing
        self.bps("publish", "--confirm", ok=False)
        self.assertEqual(len(self.fz.sent("POST", "/posts")), 1)

    def test_2_dm_gift_any_case_and_follow_gate(self):
        import plan as plans
        p = self.plan()
        p["dm"] = {"enabled": True, "asked": True, "keyword": "publish", "matchMode": "word", "message": "هديتك 🎁",
                   "link": "https://github.com/example/repo", "buttonTitle": "افتح GitHub", "followGate": True,
                   "commentReply": "وصلك بالخاص 🎁"}
        plans.save(p, via="chat")
        self.bps("dm", ok=False)                                        # no --confirm
        self.assertEqual(self.fz.sent("POST", "/comment-automations"), [])
        self.bps("dm", "--confirm")
        a = self.fz.sent("POST", "/comment-automations")[-1]["body"]
        self.assertEqual(a["keywords"], ["publish", "Publish", "PUBLISH"])
        self.assertEqual(a["matchMode"], "word")
        self.assertTrue(a["typoTolerance"])
        self.assertIn("followGate", a)
        self.assertEqual(a["buttons"][0]["url"], "https://github.com/example/repo")
        self.assertEqual(a["postId"], p["result"]["postId"])

    def test_3_edit_caption_then_trial_needs_typed_words(self):
        import zedit
        pid = self.plan()["result"]["postId"]
        with self.assertRaises(PermissionError):
            zedit.edit_caption(pid, "new text", "yes")                  # must type edit
        self.assertEqual(self.fz.sent("PUT", f"/posts/{pid}"), [])
        zedit.edit_caption(pid, "نص جديد #ClaudeCode", "edit")
        self.assertEqual(self.fz.posts[pid]["content"], "نص جديد #ClaudeCode")
        with self.assertRaises(PermissionError):
            zedit.move(pid, "2030-01-05T11:00", "ok")
        with self.assertRaises(ValueError):
            zedit.move(pid, "2001-01-01T11:00", "move")                 # in the past

    def test_4_cancel_needs_confirm(self):
        pid = self.plan()["result"]["postId"]
        self.bps("cancel", "--post", pid, ok=False)
        self.assertIn(pid, self.fz.posts)
        self.bps("cancel", "--post", pid, "--confirm")
        self.assertNotIn(pid, self.fz.posts)


@unittest.skipUnless(have("ffmpeg") and have("ffprobe"), "needs ffmpeg/ffprobe for a test Reel")
class ReelFlow(Workspace):
    def test_trial_reel_and_cover(self):
        d = self.post_folder("reel-post", CAPTION, video=True)
        out = self.bps("analyze", str(d), "--platforms", "instagram")
        self.assertEqual(out.get("type"), "reel")
        self.bps("set", "instagram.trial", "true")
        self.bps("set", "instagram.graduation", "SS_PERFORMANCE")
        self.bps("schedule", "2030-01-04T13:30:00+03:00")
        self.bps("ready")
        self.bps("publish", "--confirm")
        body = self.fz.sent("POST", "/posts")[-1]["body"]
        ig = next(p for p in body["platforms"] if p["platform"] == "instagram")
        psd = ig.get("platformSpecificData") or {}
        self.assertEqual((psd.get("trialParams") or {}).get("graduationStrategy"), "SS_PERFORMANCE")
        self.assertTrue(psd.get("instagramThumbnail") or ig.get("instagramThumbnail") or body.get("mediaItems"),
                        "the cover should be sent as the Reel thumbnail")


class ConcurrentPublish(Workspace):
    """The dashboard's Publish button and the chat at the same moment: Zernio gets one post."""

    def test_two_at_once_make_one_post(self):
        d = self.post_folder("race", CAPTION)
        self.bps("analyze", str(d), "--platforms", "instagram")
        self.bps("schedule", "2030-01-06T11:00:00+03:00")
        self.bps("ready")
        results = []
        def go():
            results.append(self.bps("publish", "--confirm", ok=None)["_code"])
        ts = [threading.Thread(target=go) for _ in range(3)]
        [t.start() for t in ts]
        [t.join() for t in ts]
        self.assertEqual(len(self.fz.sent("POST", "/posts")), 1, f"exit codes {results}")
        self.assertEqual(results.count(0), 1)


if __name__ == "__main__":
    unittest.main()
