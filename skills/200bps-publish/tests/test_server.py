"""The local dashboard server: starts, serves the page, refuses other websites and
path tricks, never leaks .env, and only publishes with a typed "go"."""
import json
from pathlib import Path
import re
import subprocess
import sys
import time
import unittest
import urllib.error
import urllib.request

from helpers import BPS, CAPTION, Workspace


class DashboardBase(Workspace):
    """Starts the real dashboard on a free port in the throwaway workspace (no tests here)."""
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.proc = subprocess.Popen([sys.executable, str(BPS), "dashboard", "--no-open", "--port", "47310"], cwd=cls.ws,
                                    env=cls.env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        cls.url = None
        t0 = time.time()
        while time.time() - t0 < 20 and not cls.url:
            line = cls.proc.stdout.readline()
            m = re.search(r"(http://127\.0\.0\.1:\d+/)", line or "")
            if m:
                cls.url = m.group(1)
        assert cls.url, "dashboard did not start"
        html = urllib.request.urlopen(cls.url, timeout=10).read().decode()
        cls.token = re.search(r'name="bps-token" content="([^"]+)"', html).group(1)

    @classmethod
    def tearDownClass(cls):
        cls.proc.terminate()
        try:
            cls.proc.wait(5)
        except subprocess.TimeoutExpired:
            cls.proc.kill()
        super().tearDownClass()

    def get(self, path, host=None):
        req = urllib.request.Request(self.url + path.lstrip("/"), headers={"Host": host} if host else {})
        try:
            with urllib.request.urlopen(req, timeout=15) as r:
                return r.status, r.read()
        except urllib.error.HTTPError as e:
            return e.code, e.read()

    def post(self, path, data, token=True, origin=None):
        h = {"Content-Type": "application/json"}
        if token:
            h["X-BPS-Token"] = self.token
        if origin:
            h["Origin"] = origin
        req = urllib.request.Request(self.url + path.lstrip("/"), data=json.dumps(data).encode(), headers=h, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.status, json.loads(r.read() or b"{}")
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read() or b"{}")


class Dashboard(DashboardBase):
    def test_incoming_tray(self):
        """2026-11-25: Content OS sent two posts 2 s apart; the second became the open post and nothing showed the first.
        Posts sent with --from (or from a Content OS folder) now sit in the 📥 Incoming tray, in arrival order."""
        a = self.post_folder("in-a", CAPTION)
        b = self.post_folder("in-b", CAPTION)
        pa = self.bps("analyze", str(a), "--platforms", "instagram", "--from", "Content OS")["id"]
        self.bps("schedule", "2030-03-01T19:30:00+03:00")
        pb = self.bps("analyze", str(b), "--platforms", "instagram", "--from", "Content OS")["id"]
        self.bps("schedule", "2030-03-02T19:30:00+03:00")
        inc = json.loads(self.get("/api/state")[1])["incoming"]
        self.assertEqual([x["id"] for x in inc], [pa, pb])
        self.assertEqual([x["state"] for x in inc], ["new", "open"])
        self.assertEqual(inc[0]["from"], "Content OS")
        code, _ = self.post("/api/plan", {"op": "select", "id": pa})                 # Open → the first one, the second is kept
        self.assertEqual(code, 200)
        st = json.loads(self.get("/api/state")[1])
        self.assertEqual(st["plan"]["id"], pa)
        self.assertEqual([x["state"] for x in st["incoming"]], ["open", "seen"])
        code, r = self.post("/api/batch", {"op": "run", "confirm": "go", "items": [{"plan": x["id"], "at": x["at"]} for x in st["incoming"]]})
        self.assertEqual(code, 200, r)                                              # Schedule all = the batch Go step
        for _ in range(60):
            if json.loads(self.get("/api/batch")[1]).get("state") != "running":
                break
            time.sleep(0.5)
        inc = json.loads(self.get("/api/state")[1])["incoming"]
        self.assertEqual([x["state"] for x in inc], ["scheduled", "scheduled"])
        self.assertEqual(inc[1]["at"][:16], "2030-03-02T19:30")                   # each went out at the time it came with
        self.post("/api/plan", {"op": "incoming_clear", "id": "done"})
        self.assertEqual(json.loads(self.get("/api/state")[1])["incoming"], [])
        self.bps("incoming")                                                       # the CLI view works too

    def test_zernio_account_limit_is_explained(self):
        """2026-11-26: connecting a 3rd account showed only a quick toast with Zernio's raw 402; now the
        dashboard says it's Zernio's limit (payment method), remembers it, and the CLI says the same."""
        limit = (402, {"error": "Add a payment method to connect more than 2 accounts.", "code": "PAYMENT_REQUIRED"})
        self.fz.fail_next["GET /connect/facebook"] = limit
        code, r = self.post("/api/connect", {"platform": "facebook"})
        self.assertEqual(code, 200)
        self.assertFalse(r["ok"])
        self.assertEqual((r["code"], r["max"], r["used"], r["platform"]), ("account_limit", 2, 2, "facebook"))
        self.assertIn("payment method", r["error"])
        self.assertIn("not this skill", r["error"])
        cfg = json.loads(self.get("/api/state")[1])["config"]
        self.assertEqual(cfg["accountLimit"]["max"], 2)                       # remembered for the Accounts card
        code, r = self.post("/api/connect", {"platform": "facebook"})        # Zernio says yes again (payment added)
        self.assertTrue(r["ok"], r)
        self.assertTrue(r["authUrl"].startswith("https://auth.example/facebook"))
        self.fz.fail_next["GET /connect/tiktok"] = limit
        out = self.bps("connect", "tiktok", ok=False)
        self.assertIn("2 connected accounts", out.get("error", "") + out.get("raw", "") + out["_err"])
        self.fz.fail_next["GET /connect/tiktok"] = (500, {"error": "boom"})   # other errors are not called a limit
        code, r = self.post("/api/connect", {"platform": "tiktok"})
        self.assertNotEqual(r.get("code"), "account_limit")
        js = (Path(__file__).resolve().parent.parent / "ui" / "app.js").read_text(encoding="utf-8")
        for k in ("accLimTitle", "accLimWhy", "accLimHow", "accLimOpen", "accLimRetry", "accLimUsed"):
            self.assertEqual(js.count(k + ": \""), 2, k)                                  # English + Arabic
        for k in ("accLimit", "accLimOpen", "accLimRetry"):
            self.assertEqual(js.count("      " + k + ": ["), 2, k)                        # hover tips in both
        self.assertIn('err.data = j', js)
        self.assertIn('e.data.code === "account_limit"', js)

    def test_page_and_state(self):
        code, body = self.get("/")
        self.assertEqual(code, 200)
        self.assertIn(b"bps-token", body)
        code, body = self.get("/api/state")
        self.assertEqual(code, 200)
        st = json.loads(body)
        self.assertIn("version", st)
        self.assertIn("boot", st)

    def test_ui_files_load(self):
        for f in ("app.js", "app.css", "v2.css", "pix3d.js"):
            code, _ = self.get("/" + f)
            self.assertEqual(code, 200, f)

    def test_other_hosts_refused(self):          # DNS rebinding
        code, _ = self.get("/api/state", host="evil.example")
        self.assertEqual(code, 403)

    def test_writes_need_token_and_same_origin(self):
        code, _ = self.post("/api/note", {"text": "hi"}, token=False)
        self.assertEqual(code, 403)
        code, _ = self.post("/api/note", {"text": "hi"}, origin="http://evil.example")
        self.assertEqual(code, 403)

    def test_no_path_tricks(self):
        secret = self.env["ZERNIO_API_KEY"].encode()
        for p in ("/../.env", "/%2e%2e/.env", "/..%2f..%2f.env", "/upl?p=../.env", "/upl?p=" + str(self.ws / ".env"),
                  "/img?p=../.env", "/img?p=" + str(self.ws / ".env"), "/media?key=../../.env", "/fmedia?f=../.env",
                  "/fmedia?path=" + str(self.ws / ".env")):
            code, body = self.get(p)
            self.assertNotIn(secret, body, f"{p} leaked the key")
            self.assertNotIn(b"ZERNIO_API_KEY", body, f"{p} leaked .env")

    def test_publish_needs_typed_go(self):
        d = self.post_folder("srv", CAPTION)
        subprocess.run([sys.executable, str(BPS), "analyze", str(d), "--platforms", "instagram"], cwd=self.ws, env=self.env,
                       capture_output=True, check=True)
        n0 = len(self.fz.sent("POST", "/posts"))
        for word in ("", "yes", "ok", "publish"):
            code, out = self.post("/api/publish", {"confirm": word})
            self.assertFalse(out.get("ok"), word)
        self.assertEqual(len(self.fz.sent("POST", "/posts")), n0)
        code, out = self.post("/api/publish", {"confirm": "go"})
        self.assertTrue(out.get("ok"), out)
        self.assertEqual(len(self.fz.sent("POST", "/posts")), n0 + 1)
        code, out = self.post("/api/publish", {"confirm": "go"})     # twice → refused
        self.assertFalse(out.get("ok"))
        self.assertEqual(len(self.fz.sent("POST", "/posts")), n0 + 1)


class SelfReload(unittest.TestCase):
    """The dashboard restarts itself when the plugin's code changes. Checked on a copy, so the real
    dashboard (watching the real files) is never disturbed by the test."""

    def test_code_stamp_moves_with_code(self):
        import os
        import shutil
        import tempfile
        from pathlib import Path
        import server
        tmp = Path(tempfile.mkdtemp(prefix="bps-stamp-"))
        try:
            for sub in server.CODE_DIRS:
                (tmp / sub).mkdir()
                (tmp / sub / "x.py").write_text("x = 1\n")
            real, server.SKILL_DIR = server.SKILL_DIR, tmp
            try:
                before = server.code_stamp()
                f = tmp / "lib" / "x.py"
                os.utime(f, (before + 60, before + 60))
                self.assertGreater(server.code_stamp(), before)
                (tmp / "lib" / "notes.txt").write_text("not code")
                os.utime(tmp / "lib" / "notes.txt", (before + 999, before + 999))
                self.assertEqual(server.code_stamp(), before + 60)      # only .py files count
            finally:
                server.SKILL_DIR = real
        finally:
            shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
