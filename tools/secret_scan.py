#!/usr/bin/env python3
"""Fail if anything that looks like a secret is inside the skill folder.

Run before every release (tools/package.py runs it automatically):
    python3 tools/secret_scan.py [folder]
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

PATTERNS = {
    "zernio key": re.compile(r"sk_[0-9a-fA-F]{32,}"),
    "bearer token": re.compile(r"Bearer\s+[A-Za-z0-9._\-]{20,}"),
    "private key": re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
    "aws key": re.compile(r"AKIA[0-9A-Z]{16}"),
    "github token": re.compile(r"gh[pousr]_[A-Za-z0-9]{30,}"),
    "slack token": re.compile(r"xox[baprs]-[A-Za-z0-9-]{10,}"),
    "generic secret": re.compile(r"(?i)(api[_-]?key|secret|password|token)\s*[:=]\s*['\"]?[A-Za-z0-9_\-]{16,}"),
    "email address": re.compile(r"[A-Za-z0-9._%+-]+@(?!example\.)[A-Za-z0-9.-]+\.[a-z]{2,}"),
}
FORBIDDEN_FILES = {".env", "config.json", "log.jsonl", "cache.json", "snapshot.json"}
SKIP_DIRS = {".git", "__pycache__", "dist", ".bps"}
TEXT_EXT = {".py", ".md", ".txt", ".json", ".js", ".css", ".html", ".example", ".yml", ".yaml", ""}


def scan(root: Path) -> list[str]:
    problems = []
    for p in root.rglob("*"):
        if any(part in SKIP_DIRS for part in p.relative_to(root).parts):
            continue
        if p.is_dir():
            continue
        if p.name in FORBIDDEN_FILES:
            problems.append(f"{p.relative_to(root)}: file must not ship")
            continue
        if p.suffix.lower() not in TEXT_EXT and not p.name.startswith(".env"):
            continue
        text = p.read_text(encoding="utf-8", errors="ignore")
        for name, rx in PATTERNS.items():
            for m in rx.finditer(text):
                if p.name == "secret_scan.py":
                    continue
                problems.append(f"{p.relative_to(root)}: {name}: {m.group(0)[:12]}…")
    return problems


if __name__ == "__main__":
    root = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent)
    found = scan(root)
    for f in found:
        print("SECRET?", f)
    print("clean" if not found else f"{len(found)} problem(s)")
    sys.exit(1 if found else 0)
