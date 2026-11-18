"""Dashboard in a real browser (optional: needs Node, puppeteer-core and Chrome/Chromium).
Set BPS_PUPPETEER to the puppeteer-core folder if it isn't found automatically."""
import json
import os
import shutil
import subprocess
import tempfile
import time
import unittest
from pathlib import Path

from helpers import CAPTION, HERE, IG
from test_server import DashboardBase


def _pptr() -> str | None:
    for p in (os.environ.get("BPS_PUPPETEER", ""), str(Path.home() / ".local/share/200bps-create/node_modules/puppeteer-core"),
              str(HERE.parent / "node_modules/puppeteer-core")):
        if p and Path(p, "package.json").exists():
            return p
    try:
        r = subprocess.run(["node", "-e", "console.log(require.resolve('puppeteer-core'))"], capture_output=True, text=True, timeout=10)
        if r.returncode == 0:
            return str(Path(r.stdout.strip()).parents[1])
    except Exception:
        pass
    return None


def _chrome() -> str | None:
    for c in (os.environ.get("CHROME", ""), "google-chrome-stable", "google-chrome", "chromium", "chromium-browser",
              "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"):
        if c and (shutil.which(c) or Path(c).exists()):
            return shutil.which(c) or c
    return None


@unittest.skipIf(os.environ.get("BPS_SKIP_UI"), "browser check skipped (--quick)")
@unittest.skipUnless(shutil.which("node") and _pptr() and _chrome(), "browser check needs Node + puppeteer-core + Chrome")
class Browser(DashboardBase):
    def test_every_tab_no_errors(self):
        d = self.post_folder("ui", CAPTION)
        self.bps("analyze", str(d), "--platforms", "instagram,linkedin")
        self.bps("say", "--text", "رسالة تجربة من PIX")
        for i in range(25):
            self.bps("say", "--text", f"message {i} " + "طويلة " * 20)
        out = Path(os.environ.get("BPS_UI_SHOTS") or tempfile.mkdtemp(prefix="bps-ui-"))
        r = subprocess.run(["node", str(HERE / "ui_smoke.js"), self.url, str(out), _pptr(), _chrome()],
                           capture_output=True, text=True, timeout=300)
        rep = json.loads((r.stdout.strip().splitlines() or ["{}"])[-1])
        self.assertNotIn("fatal", rep, rep.get("fatal"))
        self.assertGreaterEqual(len(rep["tabs"]), 4, rep)
        self.assertEqual(rep["errors"], [], "\n".join(rep["errors"]))
        self.assertEqual(rep["overflow"], [], "\n".join(rep["overflow"]))
        self.assertIsNotNone(rep["chat"])
        self.assertLess(rep["chat"], 4, "PIX chat didn't open on the newest message")

    def seed_replies(self) -> str:
        """Put comments in the dashboard's cache as a refresh would: a top-level comment, replies inside
        its thread (one without a name, one in Arabic, one handled), one from an older cache without
        parentId / replyTo, and 45 more so the list is longer than the 40 cards drawn at a time (51 in
        all, 50 waiting). Returns the long comment one reply answers (HTML in it must show as text)."""
        self.assertEqual(self.get("/api/zernio")[0], 200)          # a real refresh (fake Zernio); then add comments to its cache
        cp = self.ws / ".bps" / "cache.json"
        cache = json.loads(cp.read_text(encoding="utf-8"))
        post, other = "post_0000000000000000001", "post_0000000000000000002"
        long_parent = ('<img src=x onerror="window.__bpsInjected=1"> <i>hi</i> ' + "a long first comment that goes on and on " * 3)[:140]

        def c(cid, author, text, parent=None, reply_to=None, pid=post, new_keys=True):
            x = {"id": cid, "postId": pid, "accountId": IG, "platform": "instagram", "author": author, "authorId": None, "text": text,
                 "createdAt": "2026-01-05T10:00:00.000Z", "url": None, "hidden": False, "likes": 0, "liked": False,
                 "can": {"reply": True, "delete": True, "hide": True}}
            return {**x, "parentId": parent, "replyTo": reply_to} if new_keys else x

        cache["comments"] = [
            c("c_top", "sara.codes", "Love this! publish"),
            c("c_reply", "sara.codes", "Got it, thank you!", "c_top", {"author": "test.account", "text": "Thanks Sara! The link is in your DMs."}),
            c("c_noname", None, "Same question here", "c_top", {"author": None, "text": long_parent}),
            *[c(f"c_fill{i:02d}", f"user{i:02d}", f"One more comment {i:02d}", pid=other) for i in range(45)],
            c("c_ar", "noura_kw", "مشكور، وصلني الرابط", "c_top", {"author": "test.account", "text": "حياج الله! الرابط وصلج بالخاص، شيّكي على الرسائل"}),
            c("c_done", "omar.dev", "Thanks again", "c_old", {"author": "sara.codes", "text": "Does it work with video too?"}, pid=other),
            c("c_old", "old.cache", "A comment from an older cache", pid=other, new_keys=False),
        ]
        cache["commentPosts"] = {post: {"permalink": None, "caption": "A busy post", "thumb": None, "count": 2000, "more": True},
                                 other: {"permalink": None, "caption": "A quiet post", "thumb": None}}
        cache["_ts"] = time.time() + 3600                          # stays fresh: the page must not refresh it away
        cp.write_text(json.dumps(cache), encoding="utf-8")
        self.assertEqual(self.post("/api/inbox", {"op": "ignore", "ids": ["c_done"]})[0], 200)                      # mark handled
        self.assertEqual(self.post("/api/inbox", {"op": "label", "commentId": "c_reply", "name": "Question", "on": True})[0], 200)
        return long_parent

    def test_inbox_reply_items(self):
        """A reply written inside a thread is an Inbox item of its own: its card says "Reply to @name"
        with the comment it answers (English and Arabic, desktop and phone), a reply without a name
        reads "Someone", a post with more comments than are read says so once, quoted text never runs
        as HTML, and labels / mark handled / the reply box work on it. A comment from an older cache
        (no parentId / replyTo) still shows as before. A list longer than 40 says "Showing 40 of N" and
        "Show … more" reaches every item (a new filter starts again at 40). "Ask PIX to draft replies"
        sends what a reply answers."""
        long_parent = self.seed_replies()
        out = Path(os.environ.get("BPS_UI_SHOTS") or tempfile.mkdtemp(prefix="bps-ui-"))
        r = subprocess.run(["node", str(HERE / "ui_smoke.js"), self.url, str(out), _pptr(), _chrome(), "replies"],
                           capture_output=True, text=True, timeout=300)
        rep = json.loads((r.stdout.strip().splitlines() or ["{}"])[-1])
        self.assertNotIn("fatal", rep, rep.get("fatal"))
        self.assertEqual(rep["errors"], [], "\n".join(rep["errors"]))
        self.assertEqual(len(rep["views"]), 4, rep)
        for v in rep["views"]:
            tag, ar = v["tag"], v["lang"] == "ar"
            cards = {x["text"]: x for x in v["cards"]}
            self.assertEqual(len(cards), 51, f"{tag}: every comment, reply or not, is a card once the whole list is shown")
            self.assertEqual(v["waiting"], "50", f"{tag}: the Waiting count includes replies, minus the handled one")
            showing, show = ("معروض {} من {}", "اعرض {} بعد") if ar else ("Showing {} of {}", "Show {} more")
            pg = v["paging"]
            self.assertEqual(pg["waiting"], {"cards": 40, "line": showing.format(40, 50), "btn": show.format(10)}, f"{tag}: 40 cards first")
            self.assertEqual(pg["waitingMore"], {"cards": 50, "line": None, "btn": None}, f"{tag}: the button shows the rest")
            self.assertEqual(pg["all"], {"cards": 40, "line": showing.format(40, 51), "btn": show.format(11)}, f"{tag}: another filter starts at 40")
            self.assertEqual(pg["waitingAgain"]["cards"], 40, f"{tag}: back on a filter starts at 40 again")
            self.assertEqual(pg["allMore"], {"cards": 51, "line": None, "btn": None}, f"{tag}: every item is reachable")
            self.assertEqual(v["spill"], [], f"{tag}: spills past the screen")
            self.assertFalse(v["html"], f"{tag}: quoted text ran as HTML")
            self.assertFalse(v["junk"], f"{tag}: the Inbox shows null/undefined")
            self.assertEqual(len(v["more"]), 1, f"{tag}: the newest-2,000 line shows once, on the post that has more")
            self.assertIn("2,000", v["more"][0])
            says = "ردّ على" if ar else "Reply to"
            reply = cards["Got it, thank you!"]
            self.assertEqual(reply["line"], f"↳{says} @test.account:Thanks Sara! The link is in your DMs.", tag)
            self.assertEqual(reply["title"], "Thanks Sara! The link is in your DMs.", tag)
            self.assertEqual(reply["who"], "@sara.codes", tag)
            self.assertEqual(reply["labels"], ["# Question"], f"{tag}: a label on a reply item")
            self.assertIsNone(cards["Love this! publish"]["line"], f"{tag}: a top-level comment has no reply line")
            self.assertIsNone(cards["A comment from an older cache"]["line"], f"{tag}: an older cache without the new fields")
            noname = cards["Same question here"]
            self.assertEqual(noname["who"], "شخص" if ar else "Someone", tag)
            self.assertIn("ردّ على تعليق" if ar else "Reply to a comment", noname["line"], tag)
            self.assertIn("<img src=x", noname["line"], f"{tag}: the quoted text shows as text")
            self.assertEqual(noname["title"], long_parent, f"{tag}: the whole comment on hover")
            self.assertTrue(noname["cut"], f"{tag}: a long comment is cut with an ellipsis")
            self.assertIn("حياج الله", cards["مشكور، وصلني الرابط"]["line"], tag)
            self.assertTrue(cards["Thanks again"]["done"], f"{tag}: a handled reply item")
            for x in v["cards"]:
                if x["line"] is not None:
                    self.assertTrue(x["oneLine"] and x["inside"] and x["beforeText"], f"{tag}: the reply line of “{x['text']}”: {x}")
            self.assertTrue(v["opens"], f"{tag}: a click opens the whole comment")
            self.assertTrue(v["replyBox"], f"{tag}: the reply box opens on a reply item")
        sent = {x["id"]: x for x in rep["views"][0]["drafts"]}     # Ask PIX to draft replies
        self.assertEqual(len(sent), 40, "drafts are asked 40 at a time (what the server keeps)")
        self.assertEqual(sent["c_reply"]["parentId"], "c_top")
        self.assertEqual(sent["c_reply"]["replyTo"], {"author": "test.account", "text": "Thanks Sara! The link is in your DMs."})
        self.assertEqual(sent["c_noname"]["replyTo"]["text"], long_parent)
        self.assertNotIn("replyTo", sent["c_top"], "a top-level comment sends no thread context")


if __name__ == "__main__":
    unittest.main()
