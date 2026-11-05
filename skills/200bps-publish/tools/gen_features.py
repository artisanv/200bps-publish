#!/usr/bin/env python3
"""Write reference/features.md (English + Arabic) from the dashboard's own Guide
(ui/app.js → GUIDE), so PIX always knows every feature exactly as the app explains
it. Run after changing the Guide:  python3 tools/gen_features.py"""
import html
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
src = (ROOT / "ui" / "app.js").read_text(encoding="utf-8")
a = src.index("const GUIDE = {")
depth, i = 0, src.index("{", a)
for j in range(i, len(src)):
    depth += {"{": 1, "}": -1}.get(src[j], 0)
    if depth == 0:
        break
literal = src[i:j + 1]
guide = json.loads(subprocess.run(["node", "-e", f"process.stdout.write(JSON.stringify({literal}))"], capture_output=True, text=True, check=True).stdout)

def plain(s: str) -> str:
    s = re.sub(r"<code>(.*?)</code>", r"`\1`", s)
    s = re.sub(r"<b>(.*?)</b>", r"**\1**", s)
    return html.unescape(re.sub(r"<[^>]+>", "", s)).strip()

out = ["# 200BPS.ai | Publish: every feature (for PIX)", "",
       "Generated from the dashboard's Guide by `tools/gen_features.py`. Answer users from this, in their language.", ""]
for lang, title in (("en", "English"), ("ar", "العربية")):
    out += [f"## {title}", ""]
    for sec, items in guide[lang]:
        out += [f"### {plain(sec)}", ""] + [f"- {plain(x)}" for x in items] + [""]
(ROOT / "reference" / "features.md").write_text("\n".join(out), encoding="utf-8")
print(f"reference/features.md: {sum(len(x[1]) for x in guide['en'])} English + {sum(len(x[1]) for x in guide['ar'])} Arabic items")
