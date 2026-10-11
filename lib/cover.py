"""Reel covers (the still image shown in the profile grid, not during playback).

Three sources, all ending as a 1080x1920 JPEG:
  * frames  - pick representative frames from the post video (or another video)
  * image   - fit a user photo / reference image, never stretched
  * design  - render an HTML template (headline + optional background) with a
              headless Chrome/Chromium/Edge; the agent may also write its own HTML

Grid safety: Instagram shows the centre 3:4 area (1080x1440, y 240-1680) of a
9:16 cover in the profile grid. The built-in template keeps all text inside it.
"""
from __future__ import annotations

import html
import json
import os
import shutil
import subprocess
import time
from pathlib import Path

from store import SKILL_DIR, config, state_dir

W, H = 1080, 1920
GRID = (0, 240, 1080, 1680)          # x0, y0, x1, y1 of the 3:4 grid crop

BROWSERS = [
    "google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "microsoft-edge", "msedge", "chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
]

DEFAULT_BRAND = {
    "bg": "#08090A", "accent": "#CCFF33", "text": "#F4F5F2", "muted": "#8A949B",
    "font_display": "Space Grotesk", "font_ar": "Cairo", "font_mono": "JetBrains Mono",
    "logo": None, "handle": "",
}


def browser() -> str | None:
    env = os.environ.get("BPS_BROWSER")
    if env and (shutil.which(env) or Path(env).exists()):
        return env
    for b in BROWSERS:
        if shutil.which(b) or (os.sep in b and Path(b).exists()):
            return shutil.which(b) or b
    return None


def cover_dir(plan_id: str) -> Path:
    d = state_dir() / "covers" / plan_id
    d.mkdir(parents=True, exist_ok=True)
    return d


def _ff(*args: str) -> None:
    if not shutil.which("ffmpeg"):
        raise RuntimeError("ffmpeg is not installed; it's needed for frames and fitting images.")
    r = subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *args], capture_output=True, text=True, timeout=180)
    if r.returncode != 0:
        raise RuntimeError("ffmpeg failed: " + r.stderr.strip()[-400:])


def _duration(video: Path) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(video)],
                         capture_output=True, text=True, timeout=60).stdout
    return float(json.loads(out or "{}").get("format", {}).get("duration") or 0)


def frames(video: Path, plan_id: str, n: int = 6) -> list[dict]:
    """Pick n representative frames spread across the video (ffmpeg 'thumbnail' filter)."""
    d = cover_dir(plan_id)
    for old in d.glob("frame_*.jpg"):
        old.unlink()
    dur = _duration(video)
    if dur <= 0:
        raise RuntimeError("Could not read the video duration.")
    out = []
    for i in range(n):
        t = dur * (0.04 + 0.92 * i / max(n - 1, 1))
        span = max(min(dur / n, 3.0), 0.3)
        f = d / f"frame_{i + 1}.jpg"
        _ff("-ss", f"{max(t - span / 2, 0):.2f}", "-t", f"{span:.2f}", "-i", str(video),
            "-vf", "thumbnail", "-frames:v", "1", "-q:v", "2", str(f))
        if f.exists():
            out.append({"n": i + 1, "file": f.name, "path": str(f), "at": round(t, 2)})
    return out


def fit(src: Path, out: Path, at: float | None = None) -> Path:
    """Scale + centre-crop any image (or a video frame at `at` seconds) to 1080x1920."""
    pre = ["-ss", f"{at:.2f}"] if at is not None else []
    _ff(*pre, "-i", str(src), "-frames:v", "1",
        "-vf", f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}", "-q:v", "2", str(out))
    return out


def brand() -> dict:
    return {**DEFAULT_BRAND, **(config().get("cover_brand") or {})}


def _is_ar(s: str) -> bool:
    return any("\u0600" <= ch <= "\u06FF" for ch in s)


def template_html(headline: str, kicker: str = "", bg: Path | None = None, handle: str | None = None) -> str:
    b = brand()
    tpl = (SKILL_DIR / "templates" / "cover.html").read_text(encoding="utf-8")
    ar = _is_ar(headline)
    logo = b.get("logo")
    logo_tag = f'<img class="logo" src="{Path(logo).resolve().as_uri()}" alt="">' if logo and Path(logo).exists() else ""
    n = len(headline)
    size = 132 if n <= 28 else 112 if n <= 48 else 96 if n <= 70 else 82
    if ar:
        size = int(size * 1.08)
    repl = {
        "{{BG}}": b["bg"], "{{ACCENT}}": b["accent"], "{{TEXT}}": b["text"], "{{MUTED}}": b["muted"],
        "{{FONT_DISPLAY}}": b["font_display"], "{{FONT_AR}}": b["font_ar"], "{{FONT_MONO}}": b["font_mono"],
        "{{FONTS_URL}}": "https://fonts.googleapis.com/css2?family=" + "&family=".join(
            f.replace(" ", "+") + ":wght@500;700;900" for f in {b["font_display"], b["font_ar"], b["font_mono"]}) + "&display=block",
        "{{DIR}}": "rtl" if ar else "ltr",
        "{{HEADLINE}}": html.escape(headline).replace("\n", "<br>"),
        "{{KICKER}}": html.escape(kicker),
        "{{HANDLE}}": html.escape(handle if handle is not None else b.get("handle") or ""),
        "{{SIZE}}": str(size),
        "{{BG_IMAGE}}": f'<img class="bgimg" src="{bg.resolve().as_uri()}" alt="">' if bg else "",
        "{{HAS_BG}}": "has-bg" if bg else "no-bg",
        "{{LOGO}}": logo_tag,
    }
    for k, v in repl.items():
        tpl = tpl.replace(k, v)
    return tpl


def render(html_path: Path, out_jpg: Path) -> Path:
    exe = browser()
    if not exe:
        raise RuntimeError("No Chrome/Chromium/Edge found to render the design. Install one, or set BPS_BROWSER.")
    png = out_jpg.with_suffix(".png")
    profile = state_dir() / "browser"           # the browser's own files stay in the project too
    profile.mkdir(parents=True, exist_ok=True)
    cmd = [exe, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", "--no-default-browser-check",
           f"--user-data-dir={profile}",
           "--force-device-scale-factor=1", f"--window-size={W},{H}", "--virtual-time-budget=6000",
           "--allow-file-access-from-files", f"--screenshot={png}", html_path.resolve().as_uri()]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if not png.exists():
        raise RuntimeError("Browser render failed: " + (r.stderr or r.stdout).strip()[-400:])
    fit(png, out_jpg)
    png.unlink(missing_ok=True)
    return out_jpg


def design(plan_id: str, headline: str, kicker: str = "", bg: Path | None = None, handle: str | None = None,
           custom_html: Path | None = None) -> dict:
    d = cover_dir(plan_id)
    import re
    k = 1 + max([int(m.group(1)) for f in d.glob("design_*.jpg") if (m := re.fullmatch(r"design_(\d+)\.jpg", f.name))] or [0])
    html_p = custom_html or (d / f"design_{k}.html")
    if not custom_html:
        bg_fit = None
        if bg:
            bg_fit = fit(bg, d / f"design_{k}_bg.jpg")
        html_p.write_text(template_html(headline, kicker, bg_fit, handle), encoding="utf-8")
    out = render(html_p, d / f"design_{k}.jpg")
    return {"n": k, "file": out.name, "path": str(out), "html": str(html_p)}


def stamp() -> int:
    return int(time.time())
