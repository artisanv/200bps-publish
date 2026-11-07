"""Dashboard in a real browser (optional: needs Node, puppeteer-core and Chrome/Chromium).
Set BPS_PUPPETEER to the puppeteer-core folder if it isn't found automatically."""
import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

from helpers import CAPTION, HERE
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


if __name__ == "__main__":
    unittest.main()
