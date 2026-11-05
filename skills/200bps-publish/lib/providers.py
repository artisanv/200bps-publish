"""Test an API key and list the models it can use (stdlib only).

The key is read from <workspace>/.env and sent only to its own provider.
Results are cached in .bps/keytests.json without the key, so the dashboard
can show "tested 2 min ago · 92 models" after a reload.
"""
from __future__ import annotations

import json
import time
import urllib.error
import urllib.request

from store import load_env, read_json, state_dir, write_json

TIMEOUT = 20


def _get(url: str, headers: dict) -> dict:
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "200bps-publish", **headers})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            return json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read() or b"{}")
            err = body.get("error")
            msg = (err.get("message") if isinstance(err, dict) else err) or body.get("message") or ""
        except Exception:
            msg = ""
        hint = " (the key is wrong or revoked)" if e.code in (401, 403) else ""
        raise RuntimeError(f"HTTP {e.code}{hint}" + (f": {str(msg)[:200]}" if msg else ""))
    except urllib.error.URLError as e:
        raise RuntimeError(f"Can't reach the provider: {e.reason}")


def _openai_kind(mid: str) -> str:
    m = mid.lower()
    if m.startswith(("gpt-image", "dall-e", "chatgpt-image")):
        return "image"
    if "embedding" in m:
        return "embedding"
    if any(x in m for x in ("whisper", "tts", "transcribe", "audio", "realtime")):
        return "audio"
    if "moderation" in m:
        return "moderation"
    if m.startswith("sora"):
        return "video"
    return "text"


def _openai(key: str) -> list[dict]:
    d = _get("https://api.openai.com/v1/models", {"Authorization": f"Bearer {key}"})
    rows = [{"id": m["id"], "kind": _openai_kind(m["id"]), "created": m.get("created")} for m in d.get("data", [])]
    return sorted(rows, key=lambda r: (r["kind"] != "image", r["kind"], -(r["created"] or 0)))


def _anthropic(key: str) -> list[dict]:
    d = _get("https://api.anthropic.com/v1/models?limit=1000", {"x-api-key": key, "anthropic-version": "2023-06-01"})
    return [{"id": m["id"], "name": m.get("display_name"), "kind": "text", "created": m.get("created_at")}
            for m in d.get("data", [])]


def _zernio(key: str) -> list[dict]:
    from zernio import Zernio, ZernioError
    try:
        accts = Zernio(api_key=key).accounts()
    except ZernioError as e:
        raise RuntimeError(f"Zernio said: {e.code or e.status}" + (" (check the key)" if e.status in (401, 403) else ""))
    return [{"id": f"{a.get('platform')} @{a.get('username')}", "kind": "account"} for a in accts]


PROVIDERS = {
    "OPENAI_API_KEY": {"label": "OpenAI", "fn": _openai, "what": "models"},
    "ANTHROPIC_API_KEY": {"label": "Anthropic", "fn": _anthropic, "what": "models"},
    "ZERNIO_API_KEY": {"label": "Zernio", "fn": _zernio, "what": "accounts"},
}


def _cache_path():
    return state_dir() / "keytests.json"


def last_tests() -> dict:
    return read_json(_cache_path(), {}) or {}


def test(name: str) -> dict:
    """Check one key. Never returns or logs the key itself."""
    name = (name or "").strip().upper()
    key = load_env().get(name, "")
    if not key:
        raise ValueError(f"{name or 'That key'} isn't saved yet.")
    p = PROVIDERS.get(name)
    if not p:
        out = {"name": name, "ok": None, "supported": False, "ts": int(time.time()),
               "error": "No automatic test for this key yet. It's saved and ready for tools that use it."}
    else:
        import jobs
        t0 = time.time()
        jid = jobs.start("keytest", f"Testing the {p['label']} key", estimate=3, step=f"Asking {p['label']} for its {p['what']}")
        try:
            items = p["fn"](key)
            out = {"name": name, "ok": True, "supported": True, "provider": p["label"], "what": p["what"],
                   "count": len(items), "items": items}
            jobs.finish(jid, step=f"Works · {len(items)} {p['what']}")
        except RuntimeError as e:
            out = {"name": name, "ok": False, "supported": True, "provider": p["label"], "what": p["what"], "error": str(e)}
            jobs.finish(jid, ok=False, error=str(e))
        out["ms"] = int((time.time() - t0) * 1000)
        out["ts"] = int(time.time())
    cache = last_tests()
    cache[name] = out
    write_json(_cache_path(), cache)
    return out


def forget(name: str) -> None:
    cache = last_tests()
    if cache.pop(name, None) is not None:
        write_json(_cache_path(), cache)
