"""API keys entered in the dashboard, stored only in <workspace>/.env.

* Values never leave the machine: the browser sends them to the local server
  (127.0.0.1, per-session token), which writes .env with 0600 permissions.
* Values are never returned to the page, logged or printed; only a masked
  form (first 3 + last 4 characters) is shown.
* Known keys have format checks; any other key needs an UPPER_SNAKE name.
"""
from __future__ import annotations

import os
import re
import tempfile

from store import workspace

KNOWN = {
    "ZERNIO_API_KEY": {"label": "Zernio API key", "required": True, "pattern": r"^sk_[0-9a-fA-F]{64}$",
                       "help": "zernio.com → Settings → API keys", "url": "https://zernio.com"},
    "OPENAI_API_KEY": {"label": "OpenAI API key", "required": False, "pattern": r"^sk-[A-Za-z0-9_\-]{20,}$",
                       "help": "platform.openai.com → API keys", "url": "https://platform.openai.com/api-keys",
                       "use": "Image generation (gpt-image)"},
    "ANTHROPIC_API_KEY": {"label": "Anthropic API key", "required": False, "pattern": r"^sk-ant-[A-Za-z0-9_\-]{20,}$",
                          "help": "console.anthropic.com → API keys", "url": "https://console.anthropic.com/settings/keys",
                          "use": "Claude models through the API (a Pro/Max subscription has no API key)"},
}
NAME_RE = re.compile(r"^[A-Z][A-Z0-9_]{2,63}$")
RESERVED = {"ZERNIO_BASE_URL", "PATH", "HOME"}


def _env_path():
    return workspace() / ".env"


def _read_lines() -> list[str]:
    p = _env_path()
    return p.read_text(encoding="utf-8").splitlines() if p.exists() else []


def _parse(lines: list[str]) -> dict:
    out = {}
    for line in lines:
        t = line.strip()
        if t and not t.startswith("#") and "=" in t:
            k, v = t.split("=", 1)
            out[k.strip()] = v.strip().strip('"').strip("'")
    return out


def mask(v: str) -> str:
    if not v:
        return ""
    return (v[:3] + "…" + v[-4:]) if len(v) > 10 else "•" * len(v)


def _last(name: str, tests: dict) -> dict | None:
    t = tests.get(name)
    if not t:
        return None
    return {k: t.get(k) for k in ("ok", "supported", "provider", "what", "count", "error", "ts", "ms")}


def listing() -> list[dict]:
    from providers import PROVIDERS, last_tests
    env, tests = _parse(_read_lines()), last_tests()
    rows = []
    for name, meta in KNOWN.items():
        v = env.get(name, "")
        rows.append({"name": name, "label": meta["label"], "required": meta["required"], "set": bool(v),
                     "masked": mask(v), "valid": bool(v) and bool(re.match(meta["pattern"], v)),
                     "help": meta["help"], "url": meta["url"], "use": meta.get("use"),
                     "testable": name in PROVIDERS, "lastTest": _last(name, tests) if v else None})
    for name, v in env.items():
        if name in KNOWN or name in RESERVED or not NAME_RE.match(name):
            continue
        rows.append({"name": name, "label": name, "required": False, "set": bool(v), "masked": mask(v), "valid": bool(v),
                     "custom": True, "testable": name in PROVIDERS, "lastTest": _last(name, tests) if v else None})
    return rows


def guess_name(value: str) -> str:
    """Name a key from its shape when the user left the name empty."""
    v = (value or "").strip()
    if v.startswith("sk-ant-"):
        return "ANTHROPIC_API_KEY"
    if re.match(KNOWN["ZERNIO_API_KEY"]["pattern"], v):
        return "ZERNIO_API_KEY"
    if v.startswith("sk-"):
        return "OPENAI_API_KEY"
    return ""


def _write(env_updates: dict, remove: set = frozenset()) -> None:
    lines = _read_lines()
    seen, out = set(), []
    for line in lines:
        t = line.strip()
        k = t.split("=", 1)[0].strip() if ("=" in t and not t.startswith("#")) else None
        if k in remove:
            continue
        if k in env_updates:
            out.append(f"{k}={env_updates[k]}"); seen.add(k)
        else:
            out.append(line)
    for k, v in env_updates.items():
        if k not in seen:
            out.append(f"{k}={v}")
    p = _env_path()
    fd, tmp = tempfile.mkstemp(dir=str(p.parent), prefix=".env.")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write("\n".join(out).rstrip("\n") + "\n")
        os.chmod(tmp, 0o600)
        os.replace(tmp, p)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)
    _ensure_gitignored()


def _ensure_gitignored() -> None:
    gi = workspace() / ".gitignore"
    lines = gi.read_text().splitlines() if gi.exists() else []
    if ".env" not in lines:
        gi.write_text("\n".join(lines + [".env"]) + "\n")


def set_key(name: str, value: str) -> dict:
    name = (name or "").strip().upper().replace(" ", "_").replace("-", "_")
    value = (value or "").strip()
    if not value:
        raise ValueError("Paste the key in the value box first.")
    if not name:
        name = guess_name(value)
        if not name:
            raise ValueError("Type a name for this key, e.g. OPENAI_API_KEY.")
    if not NAME_RE.match(name) or name in RESERVED:
        raise ValueError("Key names use CAPITALS, digits and _ (e.g. OPENAI_API_KEY).")
    if not value or any(c in value for c in "\n\r ") or len(value) > 4096:
        raise ValueError("That value doesn't look like a key (no spaces or line breaks).")
    meta = KNOWN.get(name)
    if meta and not re.match(meta["pattern"], value):
        shape = {"ZERNIO_API_KEY": "sk_ followed by 64 characters", "OPENAI_API_KEY": "sk-…", "ANTHROPIC_API_KEY": "sk-ant-…"}[name]
        raise ValueError(f"{meta['label']} should look like {shape}. Copy it again from {meta['help']}.")
    _write({name: value})
    return {"name": name, "masked": mask(value)}


def remove_key(name: str) -> None:
    name = (name or "").strip().upper()
    if name not in _parse(_read_lines()):
        raise ValueError("No such key.")
    _write({}, remove={name})
    from providers import forget
    forget(name)
