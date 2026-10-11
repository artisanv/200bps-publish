"""Start a new post from the dashboard without typing paths.

Three ways in, one way out:
* pick photos / a video on the computer → uploaded to .bps/uploads, then copied
  into a new post folder
* pick an image made in "Create an image"
* pick an existing post folder (one outside the project is copied into my-posts/ first)

With a caption the post opens in the dashboard right away (plan.analyze) and
Claude is told to review it. Without one, Claude is asked to write the caption
first. The user's own files are only read, never moved or changed.
"""
from __future__ import annotations

import re
import shutil
import time
from pathlib import Path

import batch
import hitl
import media
from store import config, state_dir, workspace

MEDIA_EXT = media.IMAGE_EXT | media.VIDEO_EXT | media.DOC_EXT
MAX_UPLOAD = 1024 * 1024 * 1024          # 1 GB per file (Reels)
MAX_FILES = 20                            # Instagram carousels take 20


def posts_dir() -> Path:
    return workspace() / (config().get("posts_dir") or "my-posts")


def _rel(p: Path) -> str:
    try:
        return str(p.resolve().relative_to(workspace()))
    except ValueError:
        return str(p.resolve())


def _slug(s: str) -> str:
    s = re.sub(r"[^\w\-]+", "-", (s or "").strip(), flags=re.UNICODE).strip("-_").lower()
    return s[:60]


# ---------------- uploads ----------------
def upload_dir() -> Path:
    d = state_dir() / "uploads"
    d.mkdir(parents=True, exist_ok=True)
    return d


def save_upload(name: str, stream, length: int) -> dict:
    """Stream one file from the browser into .bps/uploads (no base64)."""
    ext = Path(name or "").suffix.lower()
    if ext not in MEDIA_EXT:
        raise ValueError("Use photos (JPG, PNG, WEBP), a video (MP4, MOV) or a PDF.")
    if length <= 0 or length > MAX_UPLOAD:
        raise ValueError("Files must be under 1 GB.")
    stem = _slug(Path(name).stem) or "file"
    f = upload_dir() / f"{time.strftime('%Y%m%d-%H%M%S')}-{int(time.time() * 1000) % 1000:03d}-{stem}{ext}"
    import jobs
    jid = jobs.start("upload", f"Adding {name}", step=f"{length // (1 << 20)} MB") if length > 8 << 20 else None
    left, last = length, 0.0
    with open(f, "wb") as out:
        while left:
            chunk = stream.read(min(1 << 20, left))
            if not chunk:
                break
            out.write(chunk)
            left -= len(chunk)
            if jid and time.time() - last > 0.5:
                last = time.time()
                jobs.progress(jid, pct=100 * (length - left) / length,
                              step=f"{(length - left) // (1 << 20)} of {length // (1 << 20)} MB")
    if left:
        f.unlink(missing_ok=True)
        jobs.finish(jid, ok=False, error="The upload was cut off.")
        raise ValueError("The upload was cut off. Try again.")
    jobs.finish(jid, step=f"{length // (1 << 20)} MB added")
    return {"path": _rel(f), "name": name, "kind": media.kind(f), "size": length}


def _source(item: str) -> Path:
    """An uploaded file, a made image (.bps/images) or any media file inside the workspace."""
    if item.startswith("image:"):
        import images
        return images.path_of(item[6:])
    p = (workspace() / item).resolve()
    if workspace() not in p.parents or not p.is_file() or p.suffix.lower() not in MEDIA_EXT:
        raise ValueError(f"File not found: {item}")
    return p


def default_name() -> str:
    return "post-" + time.strftime("%Y-%m-%d")


def _free_folder(name: str) -> Path:
    base = posts_dir()
    slug = _slug(name) or default_name()
    d, i = base / slug, 2
    while d.exists():
        d, i = base / f"{slug}-{i}", i + 1
    return d


# ---------------- start ----------------
def _open(folder: Path, caption: str, hint: str, via: str) -> dict:
    """Open the post now if it has a caption, else ask Claude to write one."""
    import plan as plans
    rel = _rel(folder)
    has_caption = batch._has_caption(folder)
    if has_caption:
        try:
            p = plans.analyze(str(folder))
        except ValueError as e:
            raise ValueError(str(e))
        n = hitl.add_note(f"I started a new post from the dashboard: '{rel}'. It's open now. Review it with me "
                          f"(step 2 of /200bps-publish: findings, caption fixes, time, gift).",
                          {"type": "new_post", "folder": rel, "opened": True})
        return {"folder": rel, "opened": True, "plan": p["id"], "note": n["id"]}
    n = hitl.add_note(f"Write a caption for my new post in '{rel}'{(' (' + hint + ')') if hint else ''}. "
                      f"Look at the media, write it in my voice, save it as caption.txt in that folder, "
                      f"then run /200bps-publish {rel}.",
                      {"type": "new_post", "folder": rel, "opened": False, "needsCaption": True, "hint": hint[:500]})
    return {"folder": rel, "opened": False, "note": n["id"]}


def create(files: list[str], name: str = "", caption: str = "", via: str = "dashboard") -> dict:
    """A new post folder from uploaded files and/or made images, in the order given."""
    if not files:
        raise ValueError("Pick at least one photo, video or PDF.")
    if len(files) > MAX_FILES:
        raise ValueError(f"Up to {MAX_FILES} files per post.")
    srcs = [_source(f) for f in files]
    d = _free_folder(name)
    d.mkdir(parents=True)
    hints = []
    import jobs
    jid = jobs.start("newpost", f"Making post folder {d.name}", total=len(srcs))
    for i, s in enumerate(srcs, 1):
        jobs.progress(jid, done=i - 1, step=f"Copying {i} of {len(srcs)}")
        stem = re.sub(r"^\d{8}-\d{6}(-\d{3})?-", "", s.stem)       # drop our upload/image time stamp
        dest = d / f"{i:02d}-{_slug(stem)[:40] or 'media'}{s.suffix.lower()}"
        shutil.copy2(s, dest)
        if files[i - 1].startswith("image:"):
            import images
            try:
                hints.append("image prompt: " + images.get(files[i - 1][6:])["prompt"][:300])
            except ValueError:
                pass
    for f in files:                            # staging copies are no longer needed
        if not f.startswith("image:"):
            p = (workspace() / f).resolve()
            if upload_dir().resolve() in p.parents:
                p.unlink(missing_ok=True)
    caption = (caption or "").strip()
    if caption:
        (d / "caption.txt").write_text(caption + "\n", encoding="utf-8")
    try:
        out = _open(d, caption, "; ".join(hints), via)
    except Exception as e:
        jobs.finish(jid, ok=False, error=str(e))
        raise
    jobs.finish(jid, step="Opened" if out.get("opened") else "Handed to Claude for the caption")
    return out


def from_folder(path: str, via: str = "dashboard") -> dict:
    """An existing folder picked with Browse… or the built-in browser."""
    p = Path(path).expanduser().resolve()
    if not p.is_dir():
        raise ValueError(f"Folder not found: {path}")
    if not any(f.suffix.lower() in MEDIA_EXT for f in p.iterdir() if f.is_file()):
        raise ValueError("That folder has no photos, video or PDF. A post folder holds the media (and caption.txt).")
    p = batch.import_folder(p)      # outside the project → copied into my-posts/ (everything stays local)
    return _open(p, "", "", via)
