#!/usr/bin/env python3
"""Write RELEASE.json before every push: the version (from VERSION), a new build time (UTC) and a one-line
note. Installed copies compare their own RELEASE.json with the one on GitHub to show "a new version is out".

    python3 tools/stamp.py "What's new in one line" ["سطر بالعربي"]
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main() -> None:
    version = (ROOT / "VERSION").read_text().strip()
    old = json.loads((ROOT / "RELEASE.json").read_text()) if (ROOT / "RELEASE.json").exists() else {}
    now = datetime.now(timezone.utc)
    data = {
        "version": version,
        "build": now.strftime("%Y-%m-%dT%H:%MZ"),
        "date": now.strftime("%Y-%m-%d"),
        "notes": sys.argv[1] if len(sys.argv) > 1 else old.get("notes", ""),
        "notes_ar": sys.argv[2] if len(sys.argv) > 2 else old.get("notes_ar", ""),
        "release": f"https://github.com/artisanv/200bps-publish/releases/tag/v{version}",
    }
    (ROOT / "RELEASE.json").write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n")
    print(json.dumps(data, ensure_ascii=False))


if __name__ == "__main__":
    main()
