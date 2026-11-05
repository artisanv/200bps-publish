"""Archived posts: a .zip (or .tar.gz, .7z, .rar …) holding a post folder.

The archive is unpacked into my-posts/<archive name>/ and used like any post
folder. The original archive is only read, never changed or deleted.

One archive can hold:
  * one post: media (+ caption.txt) at the top, or inside one folder
  * several posts: one sub-folder per post (each with its media)

Safety: nothing is written outside the destination folder (no absolute paths,
no "..", no links), and big or huge-ratio archives ("zip bombs") are refused.
zip and tar are read with Python itself; other formats (7z, rar, iso, cab…)
need bsdtar (libarchive) or 7z on the computer.
"""
from __future__ import annotations

import hashlib
import shutil
import subprocess
import tarfile
import time
import zipfile
from pathlib import Path

import media
from store import append_log, config, read_json, state_dir, workspace, write_json

ZIP_EXT = (".zip",)
TAR_EXT = (".tar", ".tar.gz", ".tgz", ".tar.bz2", ".tbz2", ".tbz", ".tar.xz", ".txz")
OTHER_EXT = (".7z", ".rar", ".iso", ".cab", ".xar", ".lzh", ".cpio")
ARCHIVE_EXT = ZIP_EXT + TAR_EXT + OTHER_EXT
MAX_TOTAL = 4 * 1024 ** 3        # 4 GB unpacked
MAX_FILES = 2000
MAX_RATIO = 200                  # unpacked size / archive size
SKIP = {"__MACOSX", ".DS_Store", "Thumbs.db", "desktop.ini"}


def is_archive(p: Path | str) -> bool:
    n = str(p).lower()
    return any(n.endswith(e) for e in ARCHIVE_EXT)


def _stem(p: Path) -> str:
    n = p.name
    for e in sorted(ARCHIVE_EXT, key=len, reverse=True):
        if n.lower().endswith(e):
            return n[: -len(e)] or "post"
    return p.stem


def _sha1(p: Path) -> str:
    h = hashlib.sha1()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def _safe_name(name: str) -> str | None:
    """A member path that stays inside the destination, or None to skip it."""
    parts = [x for x in name.replace("\\", "/").split("/") if x not in ("", ".")]
    if not parts or name.startswith("/") or ".." in parts or (len(parts[0]) == 2 and parts[0][1] == ":"):
        return None
    if any(x in SKIP or x.startswith("._") for x in parts):
        return None
    return "/".join(parts)


def _check_totals(total: int, count: int, packed: int) -> None:
    if count > MAX_FILES:
        raise ValueError(f"That archive holds over {MAX_FILES} files. A post archive should hold one post (or a few).")
    if total > MAX_TOTAL:
        raise ValueError("That archive unpacks to over 4 GB. Use a smaller one.")
    if packed and total > 50 * 1024 ** 2 and total / packed > MAX_RATIO:
        raise ValueError("That archive unpacks to far more than its size (a possible zip bomb), so it wasn't opened.")


def _unzip(src: Path, dest: Path) -> None:
    with zipfile.ZipFile(src) as z:
        infos = [i for i in z.infolist() if not i.is_dir()]
        _check_totals(sum(i.file_size for i in infos), len(infos), src.stat().st_size)
        for i in infos:
            if (i.external_attr >> 16) & 0o170000 == 0o120000:      # a symlink stored in the zip
                continue
            name = _safe_name(i.filename)
            if not name:
                continue
            out = dest / name
            out.parent.mkdir(parents=True, exist_ok=True)
            with z.open(i) as r, open(out, "wb") as w:
                shutil.copyfileobj(r, w, 1 << 20)


def _untar(src: Path, dest: Path) -> None:
    with tarfile.open(src) as t:
        mem = [m for m in t.getmembers() if m.isfile()]
        _check_totals(sum(m.size for m in mem), len(mem), src.stat().st_size)
        for m in mem:
            name = _safe_name(m.name)
            if not name:
                continue
            out = dest / name
            out.parent.mkdir(parents=True, exist_ok=True)
            r = t.extractfile(m)
            if r is None:
                continue
            with r, open(out, "wb") as w:
                shutil.copyfileobj(r, w, 1 << 20)


def _other(src: Path, dest: Path) -> None:
    """7z, rar … through bsdtar (refuses absolute and ../ paths) or 7z."""
    if shutil.which("bsdtar"):
        ls = subprocess.run(["bsdtar", "-tvf", str(src)], capture_output=True, text=True, timeout=120)
        if ls.returncode != 0:
            raise ValueError(f"Couldn't read that archive: {ls.stderr.strip()[:200]}")
        rows = [r.split() for r in ls.stdout.splitlines() if r and not r.startswith("d")]
        size = sum(int(r[4]) for r in rows if len(r) > 4 and r[4].isdigit())
        _check_totals(size, len(rows), src.stat().st_size)
        cmd = ["bsdtar", "-xf", str(src), "-C", str(dest), "--no-same-owner", "--no-same-permissions"]
    elif shutil.which("7z") or shutil.which("7za"):
        cmd = [shutil.which("7z") or shutil.which("7za"), "x", "-y", f"-o{dest}", str(src)]
    else:
        raise ValueError(f"To open {src.suffix} archives, install bsdtar (libarchive) or 7-Zip; .zip and .tar.gz always work.")
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
    if r.returncode != 0:
        raise ValueError(f"Couldn't unpack that archive: {r.stderr.strip()[:200]}")
    # belt and braces: drop links and anything that escaped or is junk
    root = dest.resolve()
    for f in sorted(dest.rglob("*"), key=lambda x: len(x.parts), reverse=True):
        if f.is_symlink() or root not in f.resolve().parents and f.resolve() != root:
            f.unlink(missing_ok=True)
        elif f.name in SKIP or f.name.startswith("._"):
            shutil.rmtree(f, ignore_errors=True) if f.is_dir() else f.unlink(missing_ok=True)


def _has_media(d: Path) -> bool:
    return any(f.is_file() and media.kind(f) for f in d.iterdir())


def _post_folders(root: Path) -> list[Path]:
    """The post folder(s) inside an unpacked archive."""
    d = root
    while True:                                   # unwrap single wrapper folders
        kids = [x for x in d.iterdir() if not x.name.startswith(".")]
        dirs = [x for x in kids if x.is_dir()]
        if len(dirs) == 1 and not any(x.is_file() for x in kids):
            d = dirs[0]
            continue
        break
    if _has_media(d):
        return [d]
    found = [x for x in sorted(d.rglob("*")) if x.is_dir() and _has_media(x)]
    return found


def _index() -> dict:
    return read_json(state_dir() / "archives.json", {}) or {}


def extract(path: str | Path, into: Path | None = None) -> list[Path]:
    """Unpack an archive into my-posts/<name>/ and return its post folder(s).
    The same archive added again reuses the earlier copy."""
    src = Path(path).expanduser().resolve()
    if not src.is_file():
        raise ValueError(f"Archive not found: {path}")
    if not is_archive(src):
        raise ValueError("That isn't an archive (.zip, .tar.gz, .7z, .rar …).")
    import jobs
    sha = _sha1(src)
    idx = _index()
    old = idx.get(sha)
    if old and (workspace() / old).is_dir():
        posts = _post_folders(workspace() / old)
        if posts:
            return posts
    base = into or workspace() / (config().get("posts_dir") or "my-posts")
    base.mkdir(parents=True, exist_ok=True)
    name = "".join(c if c.isalnum() or c in "-_" else "-" for c in _stem(src)).strip("-")[:60] or "post"
    dest, i = base / name, 2
    while dest.exists():
        dest, i = base / f"{name}-{i}", i + 1
    tmp = base / f".unpacking-{name}-{int(time.time())}"
    tmp.mkdir()
    with jobs.job("unpack", f"Opening {src.name}", step="Unpacking"):
        try:
            n = src.name.lower()
            if n.endswith(ZIP_EXT):
                _unzip(src, tmp)
            elif n.endswith(TAR_EXT):
                _untar(src, tmp)
            else:
                _other(src, tmp)
        except (zipfile.BadZipFile, tarfile.TarError) as e:
            shutil.rmtree(tmp, ignore_errors=True)
            raise ValueError(f"Couldn't read that archive: {e}") from None
        except Exception:
            shutil.rmtree(tmp, ignore_errors=True)
            raise
    # a zip that holds one folder (name/…): use that folder itself, not name/name/…
    kids = [k for k in tmp.iterdir() if not k.name.startswith(".")]
    if len(kids) == 1 and kids[0].is_dir():
        kids[0].rename(dest)
        shutil.rmtree(tmp, ignore_errors=True)
    else:
        tmp.rename(dest)
    posts = _post_folders(dest)
    if not posts:
        raise ValueError(f"Unpacked into {dest.relative_to(workspace())}, but it has no photos, video or PDF.")
    idx[sha] = str(dest.relative_to(workspace()))
    write_json(state_dir() / "archives.json", idx)
    append_log({"ts": int(time.time()), "event": "archive_unpacked", "from": src.name, "to": idx[sha], "posts": len(posts)})
    return posts


def archives_in(d: Path) -> list[Path]:
    """Archives sitting in a folder that has no photos, video or PDF of its own."""
    if not d.is_dir() or _has_media(d):
        return []
    return sorted(f for f in d.iterdir() if f.is_file() and is_archive(f) and not f.name.startswith("."))


def resolve(path: str | Path) -> list[Path]:
    """A post source as folder(s): an archive is unpacked; a folder that only
    holds archive(s) has them unpacked inside it; any other folder is returned as is."""
    p = Path(path).expanduser()
    if not p.is_absolute():
        p = workspace() / p
    if p.is_file() and is_archive(p):
        return extract(p)
    arcs = archives_in(p)
    if arcs:
        out = []
        for a in arcs:
            out += extract(a, into=p)
        return out
    return [p]
