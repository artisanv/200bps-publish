"""Read-only media inspection. This module never edits a file.

Images: dimensions come from the file header (stdlib only).
Video:  dimensions, duration, codec come from ffprobe when it is installed;
        without ffprobe the video is reported as "unverified", never guessed.
"""
from __future__ import annotations

import json
import shutil
import struct
import subprocess
from pathlib import Path

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp"}
VIDEO_EXT = {".mp4", ".mov", ".m4v"}
DOC_EXT = {".pdf"}
CAPTION_NAMES = ("caption", "post", "text")


def kind(path: Path) -> str | None:
    ext = path.suffix.lower()
    if ext in IMAGE_EXT:
        return "image"
    if ext in VIDEO_EXT:
        return "video"
    if ext in DOC_EXT:
        return "document"
    return None


def _image_size(path: Path) -> tuple[int, int] | None:
    with open(path, "rb") as f:
        head = f.read(64 * 1024)
    if head[:8] == b"\x89PNG\r\n\x1a\n":
        w, h = struct.unpack(">II", head[16:24])
        return w, h
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        chunk = head[12:16]
        if chunk == b"VP8X":
            w = 1 + int.from_bytes(head[24:27], "little")
            h = 1 + int.from_bytes(head[27:30], "little")
            return w, h
        if chunk == b"VP8 ":
            w, h = struct.unpack("<HH", head[26:30])
            return w & 0x3FFF, h & 0x3FFF
        if chunk == b"VP8L":
            b = head[21:25]
            w = 1 + (((b[1] & 0x3F) << 8) | b[0])
            h = 1 + (((b[3] & 0x0F) << 10) | (b[2] << 2) | ((b[1] & 0xC0) >> 6))
            return w, h
    if head[:2] == b"\xff\xd8":
        i = 2
        with open(path, "rb") as f:
            data = f.read()
        while i < len(data) - 9:
            if data[i] != 0xFF:
                i += 1
                continue
            marker = data[i + 1]
            if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                h, w = struct.unpack(">HH", data[i + 5:i + 9])
                return w, h
            seg = struct.unpack(">H", data[i + 2:i + 4])[0]
            i += 2 + seg
    return None


def _probe_video(path: Path) -> dict:
    if not shutil.which("ffprobe"):
        return {"verified": False, "note": "ffprobe not installed; video specs unverified"}
    try:
        out = subprocess.run(
            ["ffprobe", "-v", "error", "-print_format", "json", "-show_streams", "-show_format", str(path)],
            capture_output=True, text=True, timeout=60, check=True,
        ).stdout
        info = json.loads(out)
    except (subprocess.SubprocessError, json.JSONDecodeError) as e:
        return {"verified": False, "note": f"ffprobe failed: {e}"}
    v = next((s for s in info.get("streams", []) if s.get("codec_type") == "video"), {})
    a = next((s for s in info.get("streams", []) if s.get("codec_type") == "audio"), None)
    w, h = int(v.get("width", 0)), int(v.get("height", 0))
    rot = 0
    for sd in v.get("side_data_list", []) or []:
        if "rotation" in sd:
            rot = abs(int(sd["rotation"]))
    if rot in (90, 270):
        w, h = h, w
    fps = 0.0
    if v.get("avg_frame_rate") and "/" in v["avg_frame_rate"]:
        n, d = v["avg_frame_rate"].split("/")
        fps = float(n) / float(d) if float(d) else 0.0
    return {
        "verified": True,
        "width": w,
        "height": h,
        "duration": round(float(info.get("format", {}).get("duration", 0) or 0), 2),
        "codec": v.get("codec_name"),
        "fps": round(fps, 2),
        "audio": bool(a),
        "audio_codec": a.get("codec_name") if a else None,
    }


def inspect(path: Path) -> dict:
    k = kind(path)
    info = {"file": path.name, "path": str(path), "kind": k, "bytes": path.stat().st_size}
    if k == "image":
        size = _image_size(path)
        if size:
            info.update(width=size[0], height=size[1], verified=True)
        else:
            info.update(verified=False, note="could not read image header")
    elif k == "video":
        info.update(_probe_video(path))
    elif k == "document":
        info.update(verified=True)
    if info.get("width") and info.get("height"):
        info["aspect"] = round(info["width"] / info["height"], 4)
    return info


def scan_folder(folder: Path) -> dict:
    """Find the caption(s), media, and optional cover in a post folder.

    Conventions (documented in README):
      caption.txt | caption.md             main caption (required)
      caption.<platform>.txt               per-platform override, e.g. caption.linkedin.txt
      cover.jpg|png                        Reel cover (optional)
      everything else that is media        posted in filename order
    """
    folder = folder.resolve()
    captions, media, cover, ignored = {}, [], None, []
    for p in sorted(folder.iterdir(), key=lambda x: x.name.lower()):
        if p.is_dir() or p.name.startswith("."):
            continue
        stem = p.stem.lower()
        if p.suffix.lower() in (".txt", ".md"):
            parts = stem.split(".")
            if parts[0] in CAPTION_NAMES:
                key = parts[1] if len(parts) > 1 else "default"
                captions[key] = p.read_text(encoding="utf-8").strip()
                continue
        if stem in ("cover", "thumbnail", "thumb") and kind(p) == "image":
            cover = {**inspect(p), "source": "folder"}
            continue
        if kind(p):
            media.append(inspect(p))
        else:
            ignored.append(p.name)
    return {"folder": str(folder), "captions": captions, "media": media, "cover": cover, "ignored": ignored}
