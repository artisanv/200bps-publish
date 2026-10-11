"""Workspace state: where config, plans, logs and snapshots live.

Everything user-specific is stored in the *workspace* (the folder the user
runs the skill from), never inside the skill folder. That keeps the skill
shareable and keeps secrets out of it.

    <workspace>/.env                 ZERNIO_API_KEY=...   (user writes this)
    <workspace>/.bps/config.json     answers from the setup wizard
    <workspace>/.bps/plans/*.json    one plan per post folder analysed
    <workspace>/.bps/log.jsonl       every publish + report, append-only
    <workspace>/.bps/snapshot.json   last-visit numbers for "since last visit"
    <workspace>/.bps/ideas.json      idea bank written by the agent
"""
from __future__ import annotations

import json
import os
import time
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
VERSION = (SKILL_DIR / "VERSION").read_text().strip() if (SKILL_DIR / "VERSION").exists() else "0.0.0"


def workspace() -> Path:
    return Path(os.environ.get("BPS_WORKSPACE", os.getcwd())).resolve()


def state_dir() -> Path:
    d = workspace() / ".bps"
    (d / "plans").mkdir(parents=True, exist_ok=True)
    return d


def load_env() -> dict:
    """Read KEY=VALUE lines from <workspace>/.env without printing them."""
    env = {}
    p = workspace() / ".env"
    if p.exists():
        for line in p.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    for k in ("ZERNIO_API_KEY", "ZERNIO_BASE_URL"):
        if os.environ.get(k):
            env[k] = os.environ[k]
    return env


def read_json(path: Path, default=None):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return default


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(path)


def config() -> dict:
    return read_json(state_dir() / "config.json", {}) or {}


def save_config(cfg: dict) -> None:
    write_json(state_dir() / "config.json", cfg)


def append_log(entry: dict) -> None:
    entry = {"ts": int(time.time()), **entry}
    with open(state_dir() / "log.jsonl", "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def read_log() -> list[dict]:
    p = state_dir() / "log.jsonl"
    if not p.exists():
        return []
    out = []
    for line in p.read_text(encoding="utf-8").splitlines():
        try:
            out.append(json.loads(line))
        except json.JSONDecodeError:
            pass
    return out
