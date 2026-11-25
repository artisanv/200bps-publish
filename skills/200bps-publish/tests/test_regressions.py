"""One test per bug fixed on 2026-11-07, so none of them comes back."""
import json
import os
import unittest
from pathlib import Path

from helpers import CAPTION, IG, JPEG, LI_CAPTION, Workspace, ig_comment


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


class HideGiftReceived(Workspace):
    def test_25_hide_comments_that_got_the_gift(self):
        """2026-11-14: the user asked to remove from the Inbox everyone who already got the gift (local only)."""
        os.environ["BPS_WORKSPACE"] = str(self.ws)
        inbox = fresh("inbox")
        self.assertFalse(inbox.state()["prefs"].get("hideGifted", False))     # off by default
        self.assertTrue(inbox.set_hide_gifted(True)["prefs"]["hideGifted"])
        self.assertFalse(fresh("inbox").set_hide_gifted(False)["prefs"]["hideGifted"])
        js = (Path(inbox.__file__).parent.parent / "ui" / "app.js").read_text(encoding="utf-8")
        self.assertIn('const hidden = (x) => !!handled(x) && ((hideG && gifted(x))', js)   # only handled ones hide; a PIX draft keeps it waiting
        self.assertIn('auto[x.id].how === "auto-sent"', js)
        for k in ("ibxHideGifted:", "ibxShowGifted:", "hideGifted: ["):
            self.assertGreaterEqual(js.count(k), 2, k)                          # English + Arabic
        srv = (Path(inbox.__file__).parent / "server.py").read_text(encoding="utf-8")
        self.assertIn('op == "hide_gifted"', srv)


class HideReplied(Workspace):
    def test_26_hide_comments_already_replied(self):
        """2026-11-14: the user asked to hide the comments they already replied to (local only)."""
        os.environ["BPS_WORKSPACE"] = str(self.ws)
        inbox = fresh("inbox")
        self.assertTrue(inbox.set_hide_replied(True)["prefs"]["hideReplied"])
        self.assertTrue(inbox.set_hide_gifted(True)["prefs"]["hideReplied"])      # the two switches are independent
        self.assertFalse(inbox.set_hide_replied(False)["prefs"]["hideReplied"])
        js = (Path(inbox.__file__).parent.parent / "ui" / "app.js").read_text(encoding="utf-8")
        self.assertIn('["ig-replied", "ig-mentioned", "ig-dm"].includes', js)       # replied in the Instagram app counts too
        self.assertIn("const hidden = (x) => !!handled(x) &&", js)                  # never hides what still waits
        for k in ("ibxHideReplied:", "ibxShowReplied:", "hideReplied: ["):
            self.assertGreaterEqual(js.count(k), 2, k)


class TrialThreeDayReminder(Workspace):
    def test_27_trial_reel_three_day_reminder(self):
        """2026-11-14: no app can share a live Trial Reel with followers, so PIX reminds the user after 3 days."""
        os.environ["BPS_WORKSPACE"] = str(self.ws)
        import time as _t
        from datetime import datetime, timezone
        from store import config, save_config
        trial = fresh("trial")
        now = _t.time()
        iso = lambda h: datetime.fromtimestamp(now - h * 3600, timezone.utc).isoformat().replace("+00:00", "Z")
        zp = lambda i, h, tr=True: {"id": i, "caption": "Hook " + i + "\nmore", "thumbs": [], "platforms": [
            {"platform": "instagram", "status": "published", "trial": tr, "graduation": "SS_PERFORMANCE", "publishedAt": iso(h), "url": "https://x/" + i}]}
        cache = {"zposts": [zp("old", 80), zp("young", 60), zp("ancient", 40 * 24), zp("normal", 90, tr=False)]}
        self.assertEqual([x["id"] for x in trial.due(cache, now)], ["old"])          # 72 h+, under 30 days, trials only
        self.assertEqual(trial.due(cache, now)[0]["firstLine"], "Hook old")
        from store import write_json, state_dir
        write_json(state_dir() / "cache.json", cache)
        self.assertEqual(trial.remind_done("old", "shared")["due"], [])               # answered: never shown again
        with self.assertRaises(ValueError):
            trial.remind_done("old", "graduate")
        cfg = config(); cfg.setdefault("instagram", {})["trial_remind"] = False; save_config(cfg)
        self.assertEqual(trial.due({"zposts": [zp("x", 100)]}, now), [])               # switched off in Settings
        js = (Path(trial.__file__).parent.parent / "ui" / "app.js").read_text(encoding="utf-8")
        for k in ("tdTitle:", "tdShared:", "tdKeep:", "trialRemindPref:", "trialDue: ["):
            self.assertGreaterEqual(js.count(k), 2, k)                                  # English + Arabic


class DmThreadMatching(Workspace):
    def test_28_dm_answer_found_without_a_username(self):
        """2026-11-15: Instagram often sends a DM thread with no participantUsername (the username is in
        participantName, or the thread is just "Instagram User"). A comment answered by DM stayed in Waiting."""
        os.environ["BPS_WORKSPACE"] = str(self.ws)                      # DM threads are remembered in .bps: never the real one
        import summary

        class Z:
            def __init__(self):
                self.pages = 0

            def get(self, path, **q):
                if path == "/inbox/conversations":
                    self.pages += 1
                    if q.get("cursor") == "p2":
                        return {"data": [{"id": "old", "participantId": "9", "participantUsername": "old.one", "updatedTime": "2026-10-01T00:00:00.000Z"}],
                                "pagination": {"hasMore": True, "nextCursor": "p3"}}
                    if q.get("cursor") == "p3":
                        raise AssertionError("kept paging past threads older than every waiting comment")
                    return {"data": [
                        {"id": "c-name", "participantId": "101", "participantName": "name.only", "updatedTime": "2026-11-14T12:00:00.000Z"},
                        {"id": "c-anon", "participantId": "102", "participantName": "Instagram User", "updatedTime": "2026-11-14T12:00:00.000Z"},
                        {"id": "c-user", "participantId": "103", "participantUsername": "has.user", "participantName": "Display Name", "updatedTime": "2026-11-14T12:00:00.000Z"},
                        {"id": "c-other", "participantId": "777", "participantName": "same.name", "updatedTime": "2026-11-14T12:00:00.000Z"},
                        {"id": "c-auto", "participantId": "105", "participantName": "auto.only", "updatedTime": "2026-11-14T12:00:00.000Z"},
                    ], "pagination": {"hasMore": True, "nextCursor": "p2"}}
                via = "comment_automation" if path.endswith("/c-auto/messages") else None
                return {"data": [{"direction": "outgoing", "createdAt": "2026-11-14T11:00:00.000Z", "message": "here you go", "metadata": {"sentVia": via}}]}

        cm = lambda i, author, aid: {"id": i, "accountId": "acc", "platform": "instagram", "author": author, "authorId": aid,
                                     "createdAt": "2026-11-14T10:00:00+0000"}
        comments = [cm("1", "name.only", "101"),        # username only in participantName
                    cm("2", "renamed.since", "102"),    # "Instagram User": found by id alone
                    cm("3", "Has.User", None),          # old cache without ids: username still works
                    cm("4", "same.name", "104"),        # same name, another person's id: not theirs
                    cm("5", "auto.only", "105"),        # only an automation wrote: not the user's own answer
                    cm("6", "nobody", "106")]
        log, z = {}, Z()
        summary._dm_answers(z, lambda name, fn: fn(), comments, log)
        self.assertEqual(sorted(log), ["1", "2", "3"])
        self.assertTrue(all(v["how"] == "ig-dm" for v in log.values()))
        self.assertEqual(z.pages, 2)                    # stopped at the page older than the comments
        src = Path(summary.__file__).read_text(encoding="utf-8")
        self.assertIn('"authorId": str(frm.get("id") or "") or None', src)   # the cache keeps who wrote each comment


class GiftReachedThemByDm(Workspace):
    def test_29_second_comment_of_someone_who_got_the_gift(self):
        """2026-11-15: people comment twice (a nice word or a misspelled keyword, then the keyword). The automation
        sends the gift once; the other comment stayed waiting. The user asked: got the gift AND follows → hide it."""
        os.environ["BPS_WORKSPACE"] = str(self.ws)
        summary = fresh("summary")
        GIFT = "Hello! Here is your free Python course, sign up here https://example.com/form"
        asked = []

        class Z:
            def get(self, path, **q):
                if path == "/inbox/conversations":
                    return {"data": [{"id": "t" + i, "participantId": i, "participantName": "Instagram User", "updatedTime": "2026-11-14T12:00:00.000Z"}
                                     for i in ("1", "2", "3", "4", "5")], "pagination": {"hasMore": False}}
                if "/follow-status/" in path:
                    uid = path.rsplit("/", 1)[1]
                    asked.append(uid)
                    return {"userId": uid, "isFollower": {"1": True, "2": None, "3": False}.get(uid), "unavailableReason": "consent_required" if uid == "2" else None}
                tid = path.split("/")[3]
                if tid == "t4":       # the follow-first message, then the gift: Zernio saw the follow
                    return {"data": [{"direction": "outgoing", "createdAt": "2026-11-14T11:00:00.000Z", "message": "Follow us first, then press the button",
                                      "metadata": {"sentVia": "comment_automation"}},
                                     {"direction": "outgoing", "createdAt": "2026-11-14T11:01:00.000Z", "message": "Gated gift: the plugin link is below",
                                      "metadata": {"sentVia": "comment_automation"}}]}
                at = "2026-11-14T09:00:00.000Z" if tid == "t5" else "2026-11-14T11:00:00.000Z"
                return {"data": [{"direction": "outgoing", "createdAt": at, "message": GIFT, "metadata": {"sentVia": "comment_automation", "automationId": "a1"}}]}

        autos = [{"id": "a1", "postId": "P", "message": GIFT, "followGate": False},
                 {"id": "a2", "postId": "G", "message": "Gated gift: the plugin link is below", "followGate": True}]
        cm = lambda i, uid, post="P": {"id": i, "postId": post, "accountId": "acc", "platform": "instagram", "author": "u" + uid, "authorId": uid,
                                       "createdAt": "2026-11-14T10:00:00+0000"}
        comments = [cm("c1", "1"), cm("c1b", "1"),     # follows: both comments handled, one follow check
                    cm("c2", "2"),                     # Instagram won't say: stays waiting, marked
                    cm("c3", "3"),                     # doesn't follow: stays waiting, marked
                    cm("c4", "4", post="G"),           # follow-first gift: the follow was checked by Zernio
                    cm("c5", "5"),                     # commented after the gift went out: stays for the user
                    cm("c6", "1", post="other")]       # a post with no gift of its own
        log = {}
        gifts = summary._dm_answers(Z(), lambda name, fn: fn(), comments, log, autos)
        self.assertEqual({k: v["how"] for k, v in log.items()}, {"c1": "dm-gift", "c1b": "dm-gift", "c4": "dm-gift"})
        self.assertEqual({k: v["follows"] for k, v in gifts.items()}, {"c2": None, "c3": False})
        self.assertEqual(asked.count("1"), 1)                                     # asked once per person
        n = len(asked)
        summary._dm_answers(Z(), lambda name, fn: fn(), comments, {}, autos)
        self.assertEqual(len(asked), n)                                           # remembered for 6 hours
        os.environ["BPS_WORKSPACE"] = str(self.ws)
        from store import state_dir, write_json
        write_json(state_dir() / "cache.json", {"comments": [cm("c2", "2")], "giftLog": gifts, "autoLog": log})
        self.assertEqual(fresh("inbox").waiting()[0]["gift"], {"at": "2026-11-14T11:00:00.000Z", "follows": None})   # PIX sees it too
        js = (Path(summary.__file__).parent.parent / "ui" / "app.js").read_text(encoding="utf-8")
        self.assertIn('auto[x.id].how === "dm-gift"', js)                         # hides with 🎁 Hide gift received
        self.assertIn("gi && !done", js)                                          # the waiting ones say the gift arrived
        for k in ('"ibxSt_dm-gift":', "ibxGotGift:", "ibxFollowUnknown:", "ibxNoFollow:", "ibxFollowTip:", "gotGift: [", "followQ: ["):
            self.assertGreaterEqual(js.count(k), 2, k)                            # English + Arabic


class ChangeDuringARefresh(Workspace):
    def test_30_post_made_during_a_refresh_shows_in_plan(self):
        """2026-11-16: a post copied to another day didn't show in Plan. A refresh from Zernio was already running
        (it had read the posts before the copy) and saved its older list over the cleared cache for 5 more minutes."""
        os.environ["BPS_WORKSPACE"] = str(self.ws)
        fresh("store")
        import zernio
        from store import drop_cache, read_json, state_dir
        summary = fresh("summary")
        real, made = zernio.Zernio.best_time, []

        def best_time(z, **q):                       # runs after the refresh has read the posts
            if not made:                             # ... and right then the user pastes a copy on another day
                r = z.create_post({"content": "copied while refreshing", "scheduledFor": "2030-03-01T10:30:00+00:00",
                                   "platforms": [{"platform": "instagram", "accountId": IG}]})
                made.append((r.get("post") or r).get("_id"))
                drop_cache()
            return real(z, **q)
        zernio.Zernio.best_time = best_time
        try:
            out = summary.build(force=True)
        finally:
            zernio.Zernio.best_time = real
        self.assertTrue(made, "the refresh never reached best time")
        self.assertIn(made[0], [p["id"] for p in out["scheduled"]], "the new post is missing from Plan")
        cached = read_json(state_dir() / "cache.json") or {}
        self.assertIn(made[0], [p["id"] for p in cached.get("zposts") or []], "the saved cache is older than the change")
        # every change in Zernio clears the cache through the one helper that leaves the stamp
        lib = Path(summary.__file__).parent
        for f in lib.glob("*.py"):
            if f.name != "store.py":
                self.assertNotIn('"cache.json").unlink', f.read_text(encoding="utf-8"), f.name)


class CarouselZipIsOnePost(Workspace):
    """2026-11-16: a folder with caption.md + a zip exported by a design tool (caption at the top, the slides in
    slides/, a logo in assets/, fonts/, the HTML source) was read as 2 posts ("assets" and "slides"), and picking
    it with the computer's folder window copied it into my-posts twice."""
    def setUp(self):
        self._old = os.environ.get("BPS_WORKSPACE")
        os.environ["BPS_WORKSPACE"] = str(self.ws)

    def tearDown(self):
        os.environ.pop("BPS_WORKSPACE", None) if self._old is None else os.environ.__setitem__("BPS_WORKSPACE", self._old)

    def _picked(self):
        import tempfile, zipfile
        outer = Path(tempfile.mkdtemp(prefix="bps-zip-")) / "mobile_ai_factory"
        outer.mkdir()
        (outer / "caption.md").write_text(CAPTION, encoding="utf-8")
        with zipfile.ZipFile(outer / "mobile-ai-factory.zip", "w") as z:
            z.writestr("mobile-ai-factory/caption.md", CAPTION)
            z.writestr("mobile-ai-factory/slides.html", "<html></html>")
            z.writestr("mobile-ai-factory/assets/mark.webp", JPEG)
            z.writestr("mobile-ai-factory/fonts/cairo.woff2", b"x")
            for k in range(1, 10):
                z.writestr(f"mobile-ai-factory/slides/{k:02d}.png", JPEG)
        return outer

    def test_31_caption_on_top_slides_one_folder_down(self):
        fresh("archive"); fresh("batch")
        newpost = fresh("newpost")
        outer = self._picked()
        out = newpost.from_folder(str(outer))
        self.assertNotIn("posts", out, "one carousel was split into several posts")
        self.assertTrue(out["opened"])
        post = self.ws / out["folder"]
        self.assertEqual(post.name, "mobile-ai-factory")
        self.assertEqual(sorted(f.name for f in post.glob("*.png")), [f"{k:02d}.png" for k in range(1, 10)])
        self.assertTrue((post / "assets" / "mark.webp").is_file())           # the design files stay where they were
        p = self.plan()
        self.assertEqual(len(p["media"]), 9)
        self.assertEqual(newpost.from_folder(str(outer)).get("posts"), None)  # picked again: still one post

    def test_32_picked_folder_is_copied_once(self):
        import subprocess
        batch = fresh("batch")
        outer = self._picked()
        copies = lambda: sorted(d.name for d in (self.ws / "my-posts").glob("mobile_ai_factory*"))
        before = copies()
        real = subprocess.run
        subprocess.run = lambda *a, **k: type("R", (), {"stdout": json.dumps({"ok": True, "folders": [str(outer)]}), "returncode": 0})()
        try:
            pk = batch.pick(add=False)                 # what New post → A post folder asks the server for
        finally:
            subprocess.run = real
        self.assertEqual(pk["folders"], [str(outer)])
        self.assertEqual(copies(), before, "the folder window already copied the folder; opening it copies it again")
        src = (Path(batch.__file__).parent / "server.py").read_text(encoding="utf-8")
        self.assertIn("batch.pick(add=False)", src)


class JobsNeverLoop(Workspace):
    """2026-11-16: jobs kept spinning in the dashboard until the user went to Claude Code. Dead jobs never left the
    list, a listener started from a folder inside the project watched the wrong place, a note nobody was listening
    for spun for ever, and a Fix request that ended without a suggestion couldn't be pressed again for 6 hours."""
    def setUp(self):
        self._old = os.environ.get("BPS_WORKSPACE")
        os.environ["BPS_WORKSPACE"] = str(self.ws)
        for f in ("jobs.json", "notes.jsonl", "watch.json", "active.json"):
            (self.ws / ".bps" / f).unlink(missing_ok=True)

    def tearDown(self):
        os.environ.pop("BPS_WORKSPACE", None) if self._old is None else os.environ.__setitem__("BPS_WORKSPACE", self._old)

    def test_33_dead_jobs_leave_the_list(self):
        import time as _t
        from store import state_dir, write_json
        jobs = fresh("jobs")
        now = _t.time()
        row = lambda **k: {"kind": "sync", "label": "Refreshing from Zernio", "state": "running", "step": "", "done": 0, "pct": 0,
                           "started": now - 5, "updated": now - 5, **k}
        write_json(state_dir() / "jobs.json", {
            "dead": row(id="dead", pid=2 ** 22 + 12345),                                  # its process is gone
            "old": row(id="old", pid=os.getpid(), boot="an-earlier-run"),                  # this dashboard, before it restarted itself
            "live": row(id="live", pid=os.getpid(), boot=jobs.BOOT)})
        states = {j["id"]: j["state"] for j in jobs.active()}
        self.assertEqual(states, {"dead": "lost", "old": "lost", "live": "running"})
        self.assertTrue(jobs.mine_running())
        saved = jobs._load()
        self.assertEqual(saved["dead"]["state"], "lost")                                  # written down, so it can expire
        for k in ("dead", "old"):
            saved[k]["finished"] = now - jobs.KEEP_DONE - 5
        jobs._save(saved)
        self.assertEqual([j["id"] for j in jobs.active()], ["live"])                      # gone, not "Stopped" for weeks
        jobs.finish("live")
        self.assertFalse(jobs.mine_running())                                             # nothing keeps the dashboard from restarting

    def test_34_listener_finds_the_project_from_a_folder_inside_it(self):
        import subprocess, sys
        from helpers import BPS
        hitl = fresh("hitl")
        n = hitl.add_note("from the dashboard")
        inside = self.ws / "my-posts" / "a-post"
        inside.mkdir(parents=True, exist_ok=True)
        env = {k: v for k, v in self.env.items() if k != "BPS_WORKSPACE"}
        r = subprocess.run([sys.executable, str(BPS), "watch", "--timeout", "5"], cwd=inside, env=env, capture_output=True, text=True, timeout=60)
        self.assertIn(n["id"], r.stdout, "watch run from inside the project didn't see the project's notes")
        self.assertFalse((inside / ".bps").exists(), "a second state folder was made inside the project")

    def test_35_a_note_nobody_listens_for_waits_and_a_stalled_one_closes(self):
        import time as _t
        hitl = fresh("hitl"); jobs = fresh("jobs")
        a = hitl.add_note("please shorten the caption")                    # Claude Code closed: no watch, no command
        b = hitl.add_note("make a cover")
        hitl.note_status(b["id"], "working", "Designing")
        hitl.notes(mark_read=True, ids=[b["id"]])
        s = jobs.summary()
        st = {j["id"]: j["state"] for j in s["items"]}
        self.assertEqual(st["n-" + a["id"]], "waiting")                    # shown as waiting, with what to do: no endless spinner
        self.assertEqual((s["running"], s["waiting"]), (1, 1))
        rows, raw = hitl._read_rows(self.ws / ".bps" / "notes.jsonl")      # Claude took b long ago and never finished it
        for r in rows:
            if r and r["id"] == b["id"]:
                r["statusTs"] = r["ts"] = int(_t.time()) - jobs.NOTE_STALL - 60
        hitl._write_rows(self.ws / ".bps" / "notes.jsonl", rows, raw)
        self.assertNotIn("n-" + b["id"], [j["id"] for j in jobs.summary()["items"]])
        done = next(r for r in hitl.notes(unread_only=False) if r["id"] == b["id"])
        self.assertEqual(done["status"], "failed")
        hitl.heartbeat()                                                   # Claude Code listens again: a normal running note
        self.assertEqual({j["id"]: j["state"] for j in jobs.summary()["items"]}["n-" + a["id"]], "running")
        js = (Path(jobs.__file__).parent.parent / "ui" / "app.js").read_text(encoding="utf-8")
        for k in ('wait = j.state === "waiting"', "jobsWaitStep", "(run || wait) && j.stoppable"):
            self.assertIn(k, js)

    def test_36_fix_can_be_pressed_again_after_its_note_ended(self):
        hitl = fresh("hitl")
        n = hitl.add_note("Fix 'hook.length'", {"type": "fix_request", "check": "hook.length"})
        req = {"status": "requested", "ts": 1, "note": n["id"]}
        self.assertFalse(hitl.note_over(req))                              # PIX is still on it
        hitl.cancel_note(n["id"])                                          # stopped (or finished) without a suggestion
        self.assertTrue(hitl.note_over(req))
        self.assertFalse(hitl.note_over({"status": "suggested", "questionId": "q1", "note": n["id"]}))
        src = (Path(hitl.__file__).parent / "server.py").read_text(encoding="utf-8")
        self.assertIn("not hitl.note_over(open_)", src)


class InboxThreads(Workspace):
    """2026-11-18: the Inbox read only the comment rows of a post, and only its newest 100."""

    def _sync(self, posts: dict, days_old: dict | None = None):
        """Serve these posts' comments from the fake Zernio, refresh, and return (cache, summary, inbox)."""
        from datetime import datetime, timedelta, timezone
        os.environ["BPS_WORKSPACE"] = str(self.ws)
        fresh("store")
        import zernio
        from store import read_json, state_dir
        summary, inbox = fresh("summary"), fresh("inbox")
        self.assertEqual(zernio.Zernio().base, self.fz.base)            # the fake, never the real Zernio
        made = lambda pid: (datetime.now(timezone.utc) - timedelta(days=(days_old or {}).get(pid, 1))).strftime("%Y-%m-%dT%H:%M:%S.000Z")
        self.fz.comments = posts
        self.fz.comment_posts = [{"id": pid, "accountId": IG, "platform": "instagram", "commentCount": len(rows), "createdTime": made(pid),
                                  "content": "Caption of " + pid} for pid, rows in posts.items()]
        self.fz.calls.clear()
        out = summary.build(force=True)
        self.assertEqual(out.get("warnings"), [])
        return read_json(state_dir() / "cache.json") or {}, summary, inbox

    def test_37_reply_inside_a_thread_reaches_the_inbox(self):
        """2026-11-18: someone answered inside a comment's thread (after the user's own reply) and the Inbox never
        showed it: replies that Zernio sends only inside `replies` were dropped."""
        rows = [
            ig_comment("own1", "test.account", "@noura_h thank you!", 50, owner=True),
            ig_comment("t1", "sara.k", "Where is the link?", 40),
            ig_comment("t2", "omar.dev", "Does it work on Windows? " + "x" * 200, 10, replies=[
                ig_comment("r2", "lina.codes", "I have the same question", 30, parent="t2"),
                ig_comment("r1", "test.account", "@omar.dev yes it does", 20, owner=True, parent="t2")]),
            ig_comment("t3", "noura_h", "Great post", 5),
        ]
        cache, summary, inbox = self._sync({"P37": rows})
        items = {x["id"]: x for x in cache["comments"]}
        self.assertEqual(sorted(items), ["r2", "t1", "t2", "t3"])                 # your own comment and reply are never items
        for x in items.values():
            self.assertEqual(set(x), {"id", "postId", "accountId", "platform", "author", "authorId", "text", "createdAt", "url",
                                      "hidden", "likes", "liked", "can", "parentId", "replyTo"})
        self.assertEqual((items["r2"]["parentId"], items["r2"]["author"], items["r2"]["postId"]), ("t2", "lina.codes", "P37"))
        self.assertEqual(items["r2"]["replyTo"], {"author": "omar.dev", "text": ("Does it work on Windows? " + "x" * 200)[:140]})
        self.assertEqual([(items[i]["parentId"], items[i]["replyTo"]) for i in ("t1", "t2", "t3")], [(None, None)] * 3)
        # top comments as before: your reply under it, or your @mention at or after it, answers it
        self.assertEqual({k: v["how"] for k, v in cache["autoLog"].items()}, {"t2": "ig-replied", "t3": "ig-mentioned"})
        self.assertEqual(cache["autoLog"]["t2"]["text"], "@omar.dev yes it does")
        waiting = {x["id"]: x for x in inbox.waiting()}
        self.assertEqual(sorted(waiting), ["r2", "t1"])                           # the reply written after yours is waiting
        self.assertEqual(waiting["r2"]["replyTo"]["author"], "omar.dev")
        self.assertEqual(waiting["r2"]["post"], "Fake post caption")
        self.assertEqual(cache["commentPosts"]["P37"]["count"], 4)
        self.assertNotIn("more", cache["commentPosts"]["P37"])
        # a draft, a label and "ignore" work on a reply like on any comment; Claude is told what the reply answers
        inbox.save_draft("r2", "Yes, on Windows too")
        self.assertEqual({x["id"]: x["draft"] for x in inbox.waiting()}["r2"], "Yes, on Windows too")
        self.assertEqual(inbox.label("r2", "Question", True)["labels"]["r2"], ["Question"])
        inbox.ask_drafts(list(waiting.values()))
        from store import state_dir
        note = [json.loads(line) for line in (state_dir() / "notes.jsonl").read_text(encoding="utf-8").splitlines()][-1]
        asked = {c["id"]: c for c in note["action"]["comments"]}
        self.assertEqual((asked["r2"]["parentId"], asked["r2"]["replyTo"]["author"]), ("t2", "omar.dev"))
        self.assertNotIn("replyTo", asked["t1"])
        inbox.drop_draft("r2")
        inbox.ignore(["r2"])
        self.assertEqual([x["id"] for x in inbox.waiting()], ["t1"])

    def test_38_your_later_reply_answers_a_reply_an_earlier_one_does_not(self):
        """2026-11-18: in a thread, what a person wrote before your reply is answered; what they wrote after
        your last reply is waiting again (the comment on top stays answered)."""
        import summary
        rows = [
            ig_comment("t1", "omar.dev", "First question", 0, replies=[
                ig_comment("r4", "omar.dev", "And one more thing?", 40, parent="t1"),
                ig_comment("r3", "test.account", "@omar.dev here you go", 30, owner=True, parent="t1"),
                ig_comment("r2", "lina.codes", "Same for me", 20, parent="t1"),
                ig_comment("r1", "test.account", "@omar.dev welcome", 10, owner=True, parent="t1")]),
            ig_comment("t2", "sara.k", "Nice", 5, replies=[
                ig_comment("r5", "khalid_77", "Agree", 6, parent="t2"),
                ig_comment("r6", "hessa.a", "Me too", 50, parent="t2")]),
            ig_comment("t3", "test.account", "Thank you all", 1, owner=True, replies=[
                ig_comment("r7", "khalid_77", "Thanks for this", 2, parent="t3"),
                ig_comment("r8", "test.account", "@hessa.a noted", 55, owner=True, parent="t3")]),
        ]
        items, done = summary._comment_items(rows, "P38", IG, "instagram")
        self.assertEqual([x["id"] for x in items], ["r6", "r4", "r2", "r5", "t2", "r7", "t1"])     # newest first, none of yours
        self.assertEqual({k: v["how"] for k, v in done.items()}, {
            "t1": "ig-replied",       # the comment on top: any reply of yours under it, as before
            "r2": "ig-replied",       # written before your second reply in the thread
            "r6": "ig-mentioned",     # your reply in another thread @mentions them afterwards
            "r7": "ig-replied",       # under your own comment, and you wrote in that thread later
        })                            # r4 came after your last reply, r5 and t2 got no answer: waiting
        self.assertEqual(done["r7"]["at"], "2026-11-18T06:55:00+0000")
        self.assertEqual((done["t1"]["at"], done["t1"]["text"]), ("2026-11-18T06:10:00+0000", "@omar.dev welcome"))
        self.assertEqual((done["r2"]["at"], done["r2"]["text"]), ("2026-11-18T06:30:00+0000", "@omar.dev here you go"))
        by = {x["id"]: x for x in items}
        self.assertEqual(by["r7"]["replyTo"], {"author": "test.account", "text": "Thank you all"})   # a reply under your own comment
        self.assertEqual({by[i]["parentId"] for i in ("r2", "r4")}, {"t1"})
        # in their own thread a person answers you, not their own first comment
        self.assertEqual(by["r4"]["replyTo"], {"author": "test.account", "text": "@omar.dev here you go"})
        self.assertEqual(by["r2"]["replyTo"], {"author": "omar.dev", "text": "First question"})      # someone else: the comment on top

    def test_39_reply_listed_twice_shows_once_with_its_author(self):
        """2026-11-18: Zernio lists some replies twice: as a row of their own and inside the thread, where the copy
        has no author and says isOwner false even on the user's own reply. Each shows once, with its author."""
        import summary
        rows = [
            ig_comment("y2", "lina.codes", "Thanks, got it", 30),                                # also inside s1's thread below
            ig_comment("y1", "test.account", "@omar.dev sent it", 20, owner=True),               # your own reply, also a row
            ig_comment("s1", "omar.dev", "Please send it", 10, replies=[
                ig_comment("y2", None, "Thanks, got it", 30, parent="s1", stub=True),
                ig_comment("y1", None, "@omar.dev sent it", 20, parent="s1", stub=True)]),
            ig_comment("s2", "sara.k", "Hello", 5, replies=[
                ig_comment("y3", None, "No name on this one", 6, parent="s2", stub=True)]),          # only inside, no author at all
            ig_comment("s1", "omar.dev", "Please send it", 10),                                  # a row repeated by a shifted page
        ]
        items, done = summary._comment_items(rows, "P39", IG, "instagram")
        self.assertEqual(sorted(x["id"] for x in items), ["s1", "s2", "y2", "y3"])                # once each; your reply is not an item
        by = {x["id"]: x for x in items}
        self.assertEqual((by["y2"]["author"], by["y2"]["authorId"], by["y2"]["parentId"]), ("lina.codes", "9y2", "s1"))
        self.assertEqual(by["y2"]["replyTo"], {"author": "omar.dev", "text": "Please send it"})
        self.assertEqual((by["y3"]["author"], by["y3"]["authorId"], by["y3"]["parentId"]), (None, None, "s2"))
        self.assertEqual({k: v["how"] for k, v in done.items()}, {"s1": "ig-replied"})            # the stub hid your reply before
        # the same through a real refresh: no id twice in the cache, and the DM check skips the one without an author
        cache, _, inbox = self._sync({"P39": rows})
        ids = [x["id"] for x in cache["comments"]]
        self.assertEqual(sorted(ids), ["s1", "s2", "y2"])                 # y3 has no name yet: held back (test 45)
        self.assertEqual(sorted(x["id"] for x in inbox.waiting()), ["s2", "y2"])

    def test_40_busy_post_is_read_to_the_last_page(self):
        """2026-11-18: a post with 547 comments showed its newest 100 only. Every page is read now, up to a
        safety cap that the Inbox is told about."""
        rows = [ig_comment(f"c{i}", f"person_{i}", f"Comment {i}", 300 - i) for i in range(230)]
        rows[-1]["replies"] = [ig_comment("deep", "lina.codes", "A reply under the oldest comment", 400, parent="c229")]
        cache, summary, inbox = self._sync({"P40": rows})
        self.assertEqual(len(cache["comments"]), 231)
        self.assertEqual(len({x["id"] for x in cache["comments"]}), 231)
        self.assertEqual(cache["comments"][0]["id"], "deep")                                    # newest first
        self.assertEqual(cache["commentPosts"]["P40"]["count"], 230)
        self.assertNotIn("more", cache["commentPosts"]["P40"])
        self.assertEqual(len(inbox.waiting()), 231)
        pages = self.fz.sent("GET", "/inbox/comments/P40")
        self.assertEqual([c["query"].get("cursor") for c in pages], [None, ["50"], ["100"], ["150"], ["200"]])   # stops at hasMore false
        self.assertEqual({c["query"]["limit"][0] for c in pages}, {"100"})                      # Zernio's largest page
        # the safety cap: the read stops and says so
        import zernio
        cap, summary.COMMENT_ROWS_MAX = summary.COMMENT_ROWS_MAX, 100
        try:
            got, _post, more = summary._read_comments(zernio.Zernio(), lambda name, fn: fn(), "P40", IG)
        finally:
            summary.COMMENT_ROWS_MAX = cap
        self.assertEqual((len(got), more), (100, True))
        self.assertEqual(cap, 2000)
        src = Path(summary.__file__).read_text(encoding="utf-8")
        self.assertIn('cposts[pid]["more"] = True', src)

    def test_41_post_older_than_a_week_keeps_its_comments(self):
        """2026-11-18: `since` on Zernio's comment list is the post's publish date. With 7 days, a post people
        still comment on left the Inbox the day it turned a week old. It is 30 days now."""
        from datetime import date, timedelta
        one = lambda cid: [ig_comment(cid, "sara.k", "Still here", 10)]
        cache, _, inbox = self._sync({"PNEW": one("n1"), "PWEEK": one("w1"), "POLD": one("o1")}, {"PNEW": 2, "PWEEK": 12, "POLD": 45})
        self.assertEqual(sorted(cache["commentPosts"]), ["PNEW", "PWEEK"])
        self.assertEqual(sorted(x["id"] for x in inbox.waiting()), ["n1", "w1"])
        since = date.fromisoformat(self.fz.sent("GET", "/inbox/comments")[0]["query"]["since"][0])
        self.assertTrue(timedelta(days=29) <= date.today() - since <= timedelta(days=31), since)

    def test_43_busy_older_post_stays_when_newer_posts_get_comments(self):
        """2026-11-18: only the 10 newest posts with comments were read, so a post people kept commenting on
        left the Inbox once ten newer posts had a comment each. The 5 busiest older posts are read too."""
        one = lambda cid: [ig_comment(cid, "sara.k", "Nice", 10)]
        posts = {f"P{n:02d}": one(f"c{n:02d}") for n in range(1, 18)}                  # P01 newest … P17 oldest
        posts["P17"] = [ig_comment(f"b{i}", "omar.dev", f"Question {i}", 10 + i) for i in range(6)]
        cache, _, inbox = self._sync(posts, {f"P{n:02d}": n for n in range(1, 18)})
        read = sorted(cache["commentPosts"])
        self.assertEqual(read, [f"P{n:02d}" for n in range(1, 15)] + ["P17"])       # 10 newest + P17 (busiest) + the 4 next newest
        self.assertEqual(sum(1 for x in inbox.waiting() if x["postId"] == "P17"), 6)

    def test_44_reply_line_names_the_message_it_answers(self):
        """2026-11-18: every reply said "Reply to" the comment on top, so a person answering the user's reply in
        their own thread read "Reply to @themselves". It names the message of whoever they @mention, or the
        user's last reply in their own thread; otherwise the comment on top."""
        import summary
        rows = [ig_comment("t1", "sara.k", "Where is it?", 0, replies=[
            ig_comment("r5", "sara.k", "Still nothing", 50, parent="t1"),
            ig_comment("r4", "hessa.a", "Nice post", 40, parent="t1"),
            ig_comment("r3", "lina.codes", "@khalid_77 same here", 30, parent="t1"),
            ig_comment("r2", "khalid_77", "@test.account I did not get it", 20, parent="t1"),
            ig_comment("r1", "test.account", "@sara.k sent", 10, owner=True, parent="t1")])]
        items, _done = summary._comment_items(rows, "P44", IG, "instagram")
        to = {x["id"]: x["replyTo"] for x in items}
        self.assertEqual(to["r2"], {"author": "test.account", "text": "@sara.k sent"})                 # @mentions you
        self.assertEqual(to["r3"], {"author": "khalid_77", "text": "@test.account I did not get it"})  # @mentions another person
        self.assertEqual(to["r4"], {"author": "sara.k", "text": "Where is it?"})                       # no mention: the comment on top
        self.assertEqual(to["r5"], {"author": "test.account", "text": "@sara.k sent"})                 # own thread: your last reply there
        self.assertEqual({x["parentId"] for x in items if x["id"] != "t1"}, {"t1"})

    def test_45_replies_without_a_name_are_looked_up_not_listed_as_waiting(self):
        """2026-11-19: the day after 1.20.1 the Inbox showed 69 waiting; 56 were the user's own replies. Zernio
        sends some replies inside a thread with no author (isOwner false, even on your own reply), and they were
        listed as someone else's. Each is now asked for by its id, once, and remembered; one nobody can name is
        held back, then shown as "Someone" after three tries, so a real reply is never lost."""
        from store import read_json, state_dir
        rows = [
            ig_comment("k1", "sara.k", "Where is the link?", 10, replies=[
                ig_comment("q2", None, "@test.account nothing arrived", 30, parent="k1", stub=True),      # hers, no author in the thread
                ig_comment("q1", None, "Sent it to your DMs", 20, parent="k1", stub=True)]),               # yours, no author either
            ig_comment("k2", "omar.dev", "Nice", 5, replies=[
                ig_comment("q3", None, "Thanks", 6, parent="k2", stub=True)]),                             # nobody can name this one
        ]
        self.fz.authors = {"q1": {"id": "900", "name": "test.account", "username": "test.account", "isOwner": True},
                           "q2": {"id": "9q2", "name": "sara.k", "username": "sara.k", "isOwner": False}}
        asked = lambda: sorted(c["query"]["commentId"][0] for c in self.fz.sent("GET", "/inbox/comments/P45") if c["query"].get("commentId"))
        cache, _, inbox = self._sync({"P45": rows})
        self.assertEqual(asked(), ["q1", "q2", "q3"])
        by = {x["id"]: x for x in cache["comments"]}
        self.assertEqual(sorted(by), ["k1", "k2", "q2"])                          # your reply is not an item; q3 waits for a name
        self.assertEqual((by["q2"]["author"], by["q2"]["parentId"]), ("sara.k", "k1"))
        self.assertEqual(by["q2"]["replyTo"], {"author": "test.account", "text": "Sent it to your DMs"})
        self.assertEqual(cache["autoLog"]["k1"]["how"], "ig-replied")             # your nameless reply answers her comment
        self.assertEqual(sorted(x["id"] for x in inbox.waiting()), ["k2", "q2"])
        cache, _, inbox = self._sync({"P45": rows})
        self.assertEqual(asked(), ["q3"])                                         # the named ones are remembered
        self.assertNotIn("q3", [x["id"] for x in cache["comments"]])
        cache, _, inbox = self._sync({"P45": rows})
        self.assertEqual(asked(), ["q3"])                                         # third try without a name…
        by = {x["id"]: x for x in cache["comments"]}
        self.assertEqual((by["q3"]["author"], by["q3"]["parentId"]), (None, "k2"))   # …so it shows as "Someone", not lost
        cache, _, inbox = self._sync({"P45": rows})
        self.assertEqual(asked(), [])                                             # and is not asked for again
        kept = read_json(state_dir() / "comment_authors.json")
        self.assertEqual((kept["q1"]["from"]["isOwner"], kept["q2"]["from"]["username"], kept["q3"]["tries"]), (True, "sara.k", 3))

    def test_46_follow_answer_stays_when_a_refresh_is_over_its_budget(self):
        """2026-11-19: a refresh asks Instagram about 5 followers at most. For the rest it forgot the answer it
        had, so comments already handled ("got the gift and follows you") came back to Waiting every 6 hours."""
        import time
        os.environ["BPS_WORKSPACE"] = str(self.ws)
        fresh("store")
        summary = fresh("summary")
        from store import state_dir, write_json
        old = int(time.time()) - summary.FOLLOW_TTL - 60
        write_json(state_dir() / "follow_cache.json", {f"A:{i}": {"follows": True, "ts": old} for i in range(8)})
        asked = []

        class Z:
            def get(self, path, **q):
                asked.append(path)
                return {"isFollower": True}
        memo = {}
        got = [summary._follows(Z(), lambda name, fn: fn(), "A", str(i), memo) for i in range(8)]
        self.assertEqual(got, [True] * 8)                                         # the 3 not asked keep their last answer
        self.assertEqual(len(asked), summary.FOLLOW_ASKS)

    def test_47_comments_handled_here_are_not_checked_in_dms_again(self):
        """2026-11-19: comments already replied to or ignored in the dashboard were still looked up in the DM
        list on every refresh, back to the oldest of them: about 27 of a 64-second refresh."""
        rows = [ig_comment("h1", "sara.k", "First", 10), ig_comment("h2", "omar.dev", "Second", 20)]
        _cache, _, inbox = self._sync({"P47": rows})
        self.assertTrue(self.fz.sent("GET", "/inbox/conversations"))             # both wait: their DM threads are checked
        inbox.ignore(["h1", "h2"])
        _cache, _, inbox = self._sync({"P47": rows})
        self.assertEqual(self.fz.sent("GET", "/inbox/conversations"), [])        # nothing waits: no DM read
        self.assertEqual(inbox.waiting(), [])

    def test_49_content_os_posts_land_in_incoming(self):
        """2026-11-25: a post from a Content OS job folder is marked incoming (no --from needed) and stays on the tray
        after a re-check; a post the user opens here is not."""
        import shutil, tempfile
        root = Path(tempfile.mkdtemp(prefix="bps-cf-")) / "Content_Factory" / "data" / "jobs" / "j1" / "output"
        root.mkdir(parents=True)
        src = root / "instagram"
        shutil.copytree(self.post_folder("re49src", CAPTION), src)
        out = self.bps("analyze", str(src), "--platforms", "instagram")
        self.assertEqual(out["incoming"]["from"], "Content OS")
        self.bps("recheck")
        self.assertEqual(self.plan()["incoming"]["from"], "Content OS")
        self.bps("analyze", str(self.post_folder("re49own", CAPTION)), "--platforms", "instagram")
        self.assertNotIn("incoming", self.plan())
        ids = [x["id"] for x in self.bps("incoming")["incoming"]]
        self.assertIn(out["id"], ids)
        self.assertEqual(self.bps("incoming", "--clear", out["id"])["cleared"], 1)
        shutil.rmtree(root.parents[3], ignore_errors=True)

    def test_50_plan_flag_never_switches_the_open_post(self):
        """2026-11-25: the user opened another post from the 📥 tray between two of PIX's commands, so `schedule` and
        `ready` (which work on the open post) changed the wrong carousel. `--plan ID` pins the post; a caption fix
        approved after the user switched posts lands on the post it was made for."""
        a = self.bps("analyze", str(self.post_folder("re50a", CAPTION)), "--platforms", "instagram")["id"]
        b = self.bps("analyze", str(self.post_folder("re50b", CAPTION)), "--platforms", "instagram")["id"]
        cur = self.ws / ".bps" / "current.txt"
        self.assertEqual(cur.read_text().strip(), b)
        self.bps("schedule", "2030-04-01T19:00:00+03:00", "--plan", a)
        self.bps("set", "instagram.firstComment", "سؤال؟", "--plan", a)
        self.bps("ready", "--plan", a)
        self.assertEqual(cur.read_text().strip(), b)                               # the open post never moved
        pa = json.loads((self.ws / ".bps" / "plans" / f"{a}.json").read_text())
        pb = json.loads((self.ws / ".bps" / "plans" / f"{b}.json").read_text())
        self.assertEqual(pa["schedule"]["at"], "2030-04-01T19:00:00+03:00")
        self.assertEqual(pa["settings"]["instagram"]["firstComment"], "سؤال؟")
        self.assertEqual(pa["status"], "awaiting_approval")
        self.assertEqual(pb["schedule"].get("mode"), "ask")
        self.assertEqual(pb["status"], "draft")
        self.bps("schedule", "2030-04-01T19:00:00+03:00", "--plan", "nope-000000", ok=False)
        os.environ["BPS_WORKSPACE"] = str(self.ws)
        fresh("store"); plans = fresh("plan"); sug = fresh("suggest")
        cur.write_text(a)
        res = sug.propose(["instagram"], CAPTION + "\nسطر جديد؟", ["test"])
        cur.write_text(b)                                                          # the user opens another post meanwhile
        out = sug.resolve(res["suggestion"]["id"], {"status": "answered", "answer": "approve"}, res["suggestion"]["plan"])
        self.assertTrue(out["applied"])
        self.assertIn("سطر جديد", plans.load(a)["captions"]["instagram"])
        self.assertNotIn("سطر جديد", plans.load(b)["captions"]["instagram"])
        self.assertEqual(cur.read_text().strip(), b)

    def test_48_post_folder_outside_the_project_is_copied_in(self):
        """2026-11-20: `analyze` on a folder outside the project kept the outside path in the plan, so the image
        window (/api/images) crashed on every open (ValueError: not in the subpath of the workspace)."""
        import shutil, tempfile
        out = Path(tempfile.mkdtemp(prefix="bps-outside-")) / "cf-carousel"
        shutil.copytree(self.post_folder("re48src", CAPTION), out)
        self.bps("analyze", str(out), "--platforms", "instagram")
        p = self.plan()
        self.assertTrue(Path(p["folder"]).resolve().is_relative_to(self.ws.resolve()))
        self.assertTrue((Path(p["folder"]) / "caption.txt").exists())
        p["folder"] = str(out)                                       # an older plan that still points outside
        (self.ws / ".bps" / "plans" / f"{p['id']}.json").write_text(json.dumps(p))
        os.environ["BPS_WORKSPACE"] = str(self.ws)
        fresh("store"); images = fresh("images")
        st = images.state()                                         # must not raise
        self.assertEqual(st["post"]["media"], [])                    # outside images aren't offered as guides
        shutil.rmtree(out.parent, ignore_errors=True)

    def test_42_dm_threads_are_not_read_again_on_every_refresh(self):
        """2026-11-18: with every comment of a busy post read, each refresh opened dozens of DM threads and asked
        Instagram who follows (seconds each): 32 s became 136 s. A thread is read again only after it changes, its
        newest messages are the ones read, and a refresh asks about a few followers at a time."""
        os.environ["BPS_WORKSPACE"] = str(self.ws)
        fresh("store")
        summary = fresh("summary")
        GIFT = "Hello! Here is your free course, sign up here https://example.com/form"
        seen = {"messages": [], "follow": []}
        stamp = {"t1": "2026-11-18T07:00:00.000Z"}

        class Z:
            def get(self, path, **q):
                if path == "/inbox/conversations":
                    return {"data": [{"id": "t" + i, "participantId": i, "participantName": "Instagram User",
                                      "updatedTime": stamp.get("t" + i, "2026-11-18T07:00:00.000Z")} for i in map(str, range(1, 10))],
                            "pagination": {"hasMore": False}}
                if "/follow-status/" in path:
                    seen["follow"].append(path.rsplit("/", 1)[1])
                    return {"isFollower": False}
                tid = path.split("/")[3]
                seen["messages"].append((tid, q.get("sortOrder"), q.get("limit")))
                if tid == "t1":       # you answered them yourself
                    return {"messages": [{"direction": "incoming", "createdAt": stamp["t1"][:19] + ".400Z", "message": "hi"},
                                         {"direction": "outgoing", "createdAt": "2026-11-18T06:50:00.000Z", "message": "Sent you the details"}]}
                return {"messages": [{"direction": "outgoing", "createdAt": "2026-11-18T07:00:00.300Z", "message": GIFT,
                                      "metadata": {"sentVia": "comment_automation"}}]}

        autos = [{"id": "a1", "postId": "P", "message": GIFT, "followGate": False}]
        comments = [{"id": "c" + i, "postId": "P", "accountId": "acc", "platform": "instagram", "author": "u" + i, "authorId": i,
                     "createdAt": "2026-11-18T06:00:00+0000", "parentId": None, "replyTo": None} for i in map(str, range(1, 10))]
        run = lambda: (lambda log: (summary._dm_answers(Z(), lambda name, fn: fn(), comments, log, autos), log))({})
        gifts, log = run()
        self.assertEqual(len(seen["messages"]), 9)
        self.assertEqual({(order, limit) for _t, order, limit in seen["messages"]}, {("desc", 20)})     # the newest messages
        self.assertEqual({k: v["how"] for k, v in log.items()}, {"c1": "ig-dm"})
        self.assertEqual(len(seen["follow"]), summary.FOLLOW_ASKS)                                # a few now…
        self.assertEqual(sorted(str(v["follows"]) for v in gifts.values()), ["False"] * 5 + ["None"] * 3)
        gifts, log = run()
        self.assertEqual(len(seen["messages"]), 9)                                                # nothing changed: no thread read again
        self.assertEqual(len(seen["follow"]), 8)                                                  # …the rest on the next refresh
        self.assertEqual({k: v["how"] for k, v in log.items()}, {"c1": "ig-dm"})
        self.assertEqual([v["follows"] for v in gifts.values()], [False] * 8)
        stamp["t1"] = "2026-11-18T09:00:00.000Z"                                                  # a new message in one thread
        run()
        self.assertEqual([t for t, _o, _l in seen["messages"][9:]], ["t1"])                       # only that one is read again


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
