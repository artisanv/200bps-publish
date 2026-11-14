"""One test per bug fixed on 2026-11-07, so none of them comes back."""
import json
import os
import unittest
from pathlib import Path

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


class ImageCountAndCarousel(Workspace):
    """2026-11-08: How many was stuck at 1/2/4 and there was no carousel."""
    def setUp(self):
        self._old = {k: os.environ.get(k) for k in ("BPS_WORKSPACE", "OPENAI_API_KEY")}
        os.environ["BPS_WORKSPACE"] = str(self.ws)
        os.environ["OPENAI_API_KEY"] = "sk-test"

    def tearDown(self):
        for k, v in self._old.items():
            os.environ.pop(k, None) if v is None else os.environ.__setitem__(k, v)

    def test_15_any_count_and_slides_in_order(self):
        import base64 as b64
        import time as _t
        images = fresh("images")
        self.assertGreaterEqual(images.MAX_N, 20)
        self.assertEqual(images.save_settings(n=9, nMode="auto", kind="carousel")["n"], 9)
        self.assertEqual(images.settings()["kind"], "carousel")
        brief, own = images.split_slides("Black and lime.\nSlide 1: the hook\nSlide 2: the point\nشريحة ٣: الخلاصة")
        self.assertEqual((brief, own), ("Black and lime.", ["the hook", "the point", "الخلاصة"]))
        seen = []
        png = b64.b64encode(b"\x89PNG\r\n\x1a\n" + b"0" * 20).decode()

        def fake_one(key, prompt, *a, **k):            # later slides finish first: order must still hold
            k_ = int(prompt.rsplit("Slide ", 1)[1].split(" of")[0]) if " of " in prompt else 4
            _t.sleep(0.05 * (4 - k_) if k_ < 4 else 0)
            seen.append(prompt)
            return {"data": [{"b64_json": png}], "size": "1024x1024"}
        images.load_env = lambda: {"OPENAI_API_KEY": "sk-test"}
        images._one = fake_one
        out = images.generate("Black and lime.\nSlide 1: hook\nSlide 2: point\nSlide 3: close", kind="carousel", via="test")
        self.assertEqual([r["slide"] for r in out["images"]], [1, 2, 3])
        self.assertEqual(len({r["set"] for r in out["images"]}), 1)
        self.assertTrue(all("of 3" in p for p in seen) and len(seen) == 3)
        self.assertTrue(any(p.endswith("Slide 2 of 3: point") for p in seen))
        seen.clear()
        out = images.generate("a cat", n=7, kind="single", via="test")
        self.assertEqual(len(out["images"]), 7)
        self.assertNotIn("set", out["images"][0])

    def test_16_pix_decides_how_many(self):
        images, hitl = fresh("images"), fresh("hitl")
        q = images.ask_claude("a carousel about weights", shape="square", n=0, kind="carousel")
        note = [x for x in hitl.notes() if x["id"] == q["queued"]][0] if hasattr(hitl, "notes") else None
        st = images.claude_state()
        self.assertEqual((st["n"], st["kind"], st["auto"]), (0, "carousel", True))
        long = "x" * 7000                                  # a long brief (4 news items) reached PIX cut at 4000
        images.ask_claude(long, shape="square", n=3, kind="carousel")
        self.assertEqual(len(images.claude_state()["prompt"]), 7000)
        if note:
            self.assertTrue(note["action"]["auto"])
            self.assertIn("you decide how many slides", note["text"])


    def test_17_save_images_as_a_project(self):
        images = fresh("images")
        d = images.img_dir(); d.mkdir(parents=True, exist_ok=True)
        rows = images.gallery()
        for k in range(3):
            f = f"p{k}.png"; (d / f).write_bytes(b"\x89PNG\r\n\x1a\n" + bytes([k]) * 10)
            rows.append({"id": f"pid{k}", "file": f, "prompt": f"slide {k}", "model": "m", "shape": "square", "quality": "draft", "ts": 1})
        images._save_index(rows)
        r = images.save_project(["pid2", "pid0"], "أخبار AI · week 45", "new")
        folder = self.ws / r["folder"]
        self.assertTrue(r["folder"].startswith("my-projects/"))
        self.assertEqual(sorted(x.name for x in folder.iterdir() if x.suffix == ".png"), r["files"])
        self.assertTrue(r["files"][0].startswith("01-") and r["files"][1].startswith("02-"))
        self.assertEqual((folder / r["files"][0]).read_bytes()[-1], 2)          # click order kept
        again = images.save_project(["pid0"], "أخبار AI · week 45", "new")       # same name -> a new folder, nothing overwritten
        self.assertNotEqual(again["folder"], r["folder"])
        more = images.save_project(["pid1"], "", "existing", r["folder"])      # numbering continues
        self.assertTrue(more["files"][0].startswith("03-"))
        meta = json.loads((folder / "project.json").read_text())
        self.assertEqual([m["id"] for m in meta["images"]], ["pid2", "pid0", "pid1"])
        self.assertEqual(len(images.projects()), 2)
        with self.assertRaises(ValueError):
            images.save_project(["pid0"], "", "existing", "../../etc")
        with self.assertRaises(ValueError):
            images.save_project(["nope"], "x", "new")


class ProjectFolderToPost(Workspace):
    """2026-11-08: a carousel saved as a project in a folder the user picked went into a hidden subfolder,
    and New post → A post folder on the picked folder said it had no photos."""
    def setUp(self):
        self._old = os.environ.get("BPS_WORKSPACE")
        os.environ["BPS_WORKSPACE"] = str(self.ws)

    def tearDown(self):
        os.environ.pop("BPS_WORKSPACE", None) if self._old is None else os.environ.__setitem__("BPS_WORKSPACE", self._old)

    def _gallery(self, images):
        d = images.img_dir(); d.mkdir(parents=True, exist_ok=True)
        rows = images.gallery()
        for k in range(2):
            (d / f"q{k}.png").write_bytes(JPEG)
            rows.append({"id": f"qid{k}", "file": f"q{k}.png", "prompt": "p", "model": "m", "shape": "square", "quality": "draft", "ts": 1})
        images._save_index(rows)

    def test_19_empty_picked_folder_is_the_project(self):
        import tempfile
        images = fresh("images"); self._gallery(images)
        picked = Path(tempfile.mkdtemp(prefix="bps-pick-"))
        images._native = lambda *a, **k: {"ok": True, "folders": [str(picked)]}
        r = images.save_project(["qid0", "qid1"], "carousel-2026-11-08", "pick")
        self.assertEqual(Path(r["folder"]), picked)                       # straight into it, no subfolder
        self.assertEqual(sorted(x.name for x in picked.glob("*.png")), r["files"])
        (picked / "notes.txt").write_text("x")
        r2 = images.save_project(["qid0"], "second", "pick")              # a folder with files gets a project inside
        self.assertEqual(Path(r2["folder"]).parent, picked)

    def test_20_post_folder_one_level_down(self):
        import tempfile
        newpost = fresh("newpost")
        outer = Path(tempfile.mkdtemp(prefix="bps-outer-"))
        inner = outer / "Task-create-one-Instagram"; inner.mkdir()
        for k in range(3):
            (inner / f"0{k + 1}-slide.jpg").write_bytes(JPEG)
        out = newpost.from_folder(str(outer))
        self.assertIn("Task-create-one-Instagram", out["folder"])
        self.assertNotIn("posts", out)


class InboxDrafts(Workspace):
    def test_21_drafted_comment_stays_waiting(self):
        """2026-11-12: a PIX draft on a comment the automation already answered was hidden in Handled."""
        os.environ["BPS_WORKSPACE"] = str(self.ws)                      # never the skill folder
        from store import state_dir, write_json
        inbox = fresh("inbox")
        write_json(state_dir() / "cache.json", {
            "comments": [{"id": "c1", "postId": "p", "text": "Python thanks"}, {"id": "c2", "postId": "p", "text": "Python"}],
            "autoLog": {"c1": {"how": "auto-sent"}, "c2": {"how": "auto-sent"}}})
        self.assertEqual(inbox.waiting(), [])
        inbox.save_draft("c1", "Thank you!")
        self.assertEqual([x["id"] for x in inbox.waiting()], ["c1"])
        inbox.ignore(["c1"])                                              # the user's own mark still wins
        self.assertEqual(inbox.waiting(), [])
        js = (Path(inbox.__file__).parent.parent / "ui" / "app.js").read_text(encoding="utf-8")
        self.assertIn("!(ib.drafts || {})[x.id] && auto[x.id]", js)

    def test_22_pix_opens_inbox_on_a_label(self):
        """2026-11-12: PIX could only open the Paste window; it can now open the Inbox filtered to a label."""
        os.environ["BPS_WORKSPACE"] = str(self.ws)
        hitl = fresh("hitl")
        m = hitl.say("Who needs a gift", None, [], False, None, {"kind": "inbox", "filter": "all", "label": "🎁 Send gift", "x": 1})
        self.assertEqual(m["open"], {"kind": "inbox", "filter": "all", "label": "🎁 Send gift"})
        js = (Path(hitl.__file__).parent.parent / "ui" / "app.js").read_text(encoding="utf-8")
        self.assertIn('o.kind === "inbox"', js)


class GoalShowsAtOnce(Workspace):
    def test_23_new_goal_shows_without_a_sync(self):
        """2026-11-14: a new goal picked in a network dashboard didn't show until the next Zernio sync (cached)."""
        os.environ["BPS_WORKSPACE"] = str(self.ws)
        import time as _t
        from store import VERSION, config, save_config, state_dir, write_json
        summary = fresh("summary")
        write_json(state_dir() / "cache.json", {"_ts": _t.time(), "_v": VERSION, "ok": True, "networks": [
            {"platform": "instagram", "accountId": "ig1", "selected": True, "followers": 120, "goal": 500},
            {"platform": "linkedin", "accountId": "li1", "followers": 80, "goal": None}]})
        cfg = config()
        cfg.setdefault("goal", {})["followers"] = 1000
        cfg["goal"].setdefault("by", {})["li1"] = 250
        save_config(cfg)
        nets = {n["accountId"]: n["goal"] for n in summary.build()["networks"]}
        self.assertEqual(nets, {"ig1": 1000, "li1": 250})
        js = (Path(summary.__file__).parent.parent / "ui" / "app.js").read_text(encoding="utf-8")
        self.assertIn('toast(t("goalSaved")); lastSig = ""; load(false); lastZSig = ""; loadZernio();', js)


class FollowersPerPeriod(unittest.TestCase):
    def test_24_followers_daily_weekly_monthly(self):
        """2026-11-14: Growth's Followers chart shows the followers gained per day, week or month."""
        import json, shutil, subprocess
        from helpers import SKILL
        js = (SKILL / "ui" / "app.js").read_text(encoding="utf-8")
        a = js.index("  function folGains("); b = js.index("  function gainChart(")
        if not shutil.which("node"):
            self.skipTest("node not found")
        # 1 Oct .. 14 Nov: +2 a day, and a loss of 5 on 20 Oct
        days, v, series = [], 100, []
        import datetime as dt
        d = dt.date(2026, 10, 1)
        while d <= dt.date(2026, 11, 14):
            series.append({"date": d.isoformat(), "value": v})
            v += -5 if d == dt.date(2026, 10, 19) else 2
            d += dt.timedelta(days=1)
        code = js[a:b] + "\nconst s = " + json.dumps(series) + ";\nprocess.stdout.write(JSON.stringify({day: folGains(s, 'day'), week: folGains(s, 'week'), month: folGains(s, 'month')}));"
        out = json.loads(subprocess.run(["node", "-e", code], capture_output=True, text=True, check=True).stdout)
        self.assertEqual(len(out["day"]), 30)                               # last 30 days
        self.assertEqual(out["day"][-1]["gain"], 2)
        self.assertIn(-5, [x["gain"] for x in out["day"]])                  # a loss shows as a loss
        self.assertEqual(out["week"][-1]["gain"], 14)                       # the last 7 days
        self.assertTrue(out["week"][0]["partial"])                          # history starts mid-week
        self.assertEqual([x["gain"] for x in out["month"]], [29 * 2 - 5, 28])   # Oct (from its first day), Nov so far
        self.assertTrue(out["month"][1]["soFar"])
        self.assertEqual(series[-1]["value"] - series[0]["value"], sum(x["gain"] for x in out["month"]))
        for k in ("folV_day", "folV_week", "folV_month", "folSeg:"):
            self.assertGreaterEqual(js.count(k), 2, k)                       # English + Arabic


class ImageViewerInApp(unittest.TestCase):
    def test_18_images_open_inside_publish(self):
        """2026-11-08: clicking an image opened it in a new browser tab; it opens in the in-app viewer now."""
        from helpers import SKILL
        js = (SKILL / "ui" / "app.js").read_text(encoding="utf-8")
        self.assertNotIn('el("a", { href: imgUrl(g), target: "_blank"', js)
        self.assertIn("openImgViewer(L,", js)
        for k in ("ivOpen", "ivKeys", "imgView"):
            self.assertGreaterEqual(js.count(k + ":"), 2, k)          # English + Arabic


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
