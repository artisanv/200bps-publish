"""The local dashboard server: starts, serves the page, refuses other websites and
path tricks, never leaks .env, and only publishes with a typed "go"."""
import json
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
