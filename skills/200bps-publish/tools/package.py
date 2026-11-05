#!/usr/bin/env python3
"""Build dist/200bps-publish-v<version>.zip after a clean secret scan."""
from __future__ import annotations

import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from secret_scan import SKIP_DIRS, scan  # noqa: E402

EXCLUDE_NAMES = {".env", ".DS_Store"}


def main() -> None:
    problems = scan(ROOT)
    if problems:
        print("\n".join(problems))
        sys.exit("Secret scan failed; nothing was packaged.")
    version = (ROOT / "VERSION").read_text().strip()
    out = ROOT / "dist" / f"200bps-publish-v{version}.zip"
    out.parent.mkdir(exist_ok=True)
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for p in sorted(ROOT.rglob("*")):
            rel = p.relative_to(ROOT)
            if p.is_dir() or any(part in SKIP_DIRS for part in rel.parts) or p.name in EXCLUDE_NAMES or p.suffix == ".pyc":
                continue
            z.write(p, Path("200bps-publish") / rel)
    print(out)


if __name__ == "__main__":
    main()
