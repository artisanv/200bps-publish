"""Shared set-up for the self-tests: a throwaway workspace + the fake Zernio.

Every test runs the real plugin code (the CLI as a subprocess, or the dashboard
server) inside a temporary folder, pointed at tests/fake_zernio.py. Nothing
touches the user's workspace, keys or Zernio account.
"""
from __future__ import annotations

import base64
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
SKILL = HERE.parent
BPS = SKILL / "bin" / "bps.py"
sys.path.insert(0, str(SKILL / "lib"))
sys.path.insert(0, str(HERE))

from fake_zernio import ACCOUNTS, IG, LI, PROFILE, FakeZernio  # noqa: E402

# a 1×1 px JPEG
JPEG = base64.b64decode(
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/"
    "wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==")


def have(cmd: str) -> bool:
    return shutil.which(cmd) is not None


class Workspace(unittest.TestCase):
    """A fresh workspace + fake Zernio per test class."""

    @classmethod
    def setUpClass(cls):
        cls.fz = FakeZernio()
        cls.ws = Path(tempfile.mkdtemp(prefix="bps-test-"))
        (cls.ws / ".env").write_text(f"ZERNIO_API_KEY=sk_test_{'0' * 40}\nZERNIO_BASE_URL={cls.fz.base}\n")
        (cls.ws / ".bps").mkdir()
        (cls.ws / ".bps" / "config.json").write_text(json.dumps({
            "language": "en", "timezone": "Asia/Kuwait", "platforms": ["instagram", "linkedin"], "profile_id": PROFILE,
            "accounts": {"instagram": {"id": IG, "username": "test.account"}, "linkedin": {"id": LI, "username": "Test Person"}},
            "keywords": ["Claude Code"], "instagram": {"trial_reels": False, "trial_graduation": "SS_PERFORMANCE"},
        }))
        cls.env = {**os.environ, "BPS_WORKSPACE": str(cls.ws), "ZERNIO_BASE_URL": cls.fz.base,
                   "ZERNIO_API_KEY": f"sk_test_{'0' * 40}", "PYTHONDONTWRITEBYTECODE": "1"}

    @classmethod
    def tearDownClass(cls):
        cls.fz.close()
        shutil.rmtree(cls.ws, ignore_errors=True)

    # ---- helpers
    def bps(self, *args, ok: bool | None = True, timeout: int = 120) -> dict:
        """Run the real CLI. ok=True: must succeed; ok=False: must fail; None: either."""
        r = subprocess.run([sys.executable, str(BPS), *args], cwd=self.ws, env=self.env,
                           capture_output=True, text=True, timeout=timeout)
        try:
            out = json.loads(r.stdout) if r.stdout.strip().startswith("{") else {"raw": r.stdout}
        except json.JSONDecodeError:
            out = {"raw": r.stdout}
        out["_code"], out["_err"] = r.returncode, r.stderr[-2000:]
        if ok is True:
            self.assertEqual(r.returncode, 0, f"bps {' '.join(args)} failed: {r.stdout[-1500:]} {r.stderr[-1500:]}")
        elif ok is False:
            self.assertNotEqual(r.returncode, 0, f"bps {' '.join(args)} should have been refused: {r.stdout[-800:]}")
        return out

    def post_folder(self, name: str, caption: str, li_caption: str | None = None, video: bool = False) -> Path:
        d = self.ws / "my-posts" / name
        d.mkdir(parents=True, exist_ok=True)
        (d / "caption.txt").write_text(caption, encoding="utf-8")
        if li_caption:
            (d / "caption.linkedin.txt").write_text(li_caption, encoding="utf-8")
        if video:
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "color=c=black:s=1080x1920:d=3:r=30",
                            "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", "3", "-c:v", "libx264", "-pix_fmt", "yuv420p",
                            "-c:a", "aac", "-shortest", str(d / "clip.mp4")], check=True)
            (d / "cover.jpg").write_bytes(JPEG)
        else:
            (d / "photo.jpg").write_bytes(JPEG)
        return d

    def plan(self) -> dict:
        import importlib
        os.environ["BPS_WORKSPACE"] = str(self.ws)
        import plan as plans
        importlib.reload(plans)
        return plans.load(plans.current_id())


CAPTION = ("Claude Code ينشر لك على خمس منصات 🚀\n\nسطر ثاني قصير.\nوسطر ثالث.\n\n"
           "تابعنا وعلّق «publish» ويوصلك الرابط بالخاص 🎁\nشنو أول بوست بتجهزه؟ 👇\n\n#ClaudeCode #AI #Kuwait")
LI_CAPTION = ("Claude Code publishes to five networks.\n\nShort lines, a takeaway.\n\n"
              "Get it here: https://github.com/example/repo\n\nWhat would you post first?\n\n#ClaudeCode #AI")
