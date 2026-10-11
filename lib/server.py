"""Local dashboard server. Binds to 127.0.0.1 only.

It serves the UI, the current plan, and a cached mirror of the Zernio
account. It never calls Zernio write endpoints itself. The only things the
page can write are local: answers to the agent's pop-up questions and free
notes. Writes require the per-session token injected into the page, a local
Host header, a same-origin Origin header and a JSON body, so other websites
cannot answer on the user's behalf.
"""
from __future__ import annotations

import json
import mimetypes
import secrets
import threading
import time
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import batch
import cancel
import besttime
from zernio import ZernioError
import doctor
import hitl
import keys
import plan as plans
import summary
from store import SKILL_DIR, VERSION, config, read_json, save_config, state_dir, write_json

UI_DIR = SKILL_DIR / "ui"
ALLOWED_HOSTS = {"127.0.0.1", "localhost"}
_doctor_cache = {"t": 0, "v": None}
TOKEN = secrets.token_urlsafe(24)
BOOT = secrets.token_hex(6)          # changes on every restart: the page reloads itself


def esc_html(s: str) -> str:
    import html
    return html.escape(s or "", quote=True)


def ws_id() -> str:
    """Identifies this workspace, so a dashboard from another folder is never reused."""
    import hashlib
    from store import workspace
    return hashlib.sha1(str(workspace()).encode()).hexdigest()[:12]
MAX_BODY = 16 * 1024
MAX_UPLOAD = 28 * 1024 * 1024        # one reference image, base64


def _doctor():
    if time.time() - _doctor_cache["t"] > 60:
        _doctor_cache.update(t=time.time(), v=doctor.run(online=True))
    return _doctor_cache["v"]


def _public_config(cfg: dict) -> dict:
    keep = ("language", "timezone", "platforms", "goal", "keywords", "primary_platform")
    out = {k: cfg.get(k) for k in keep if k in cfg}
    out["accounts"] = {p: {"username": (a or {}).get("username")} for p, a in (cfg.get("accounts") or {}).items()}
    import accounts as acct
    out["connectable"] = list(acct.CONNECTABLE)
    out["comingSoon"] = list(acct.COMING_SOON)
    return out


class Handler(BaseHTTPRequestHandler):
    server_version = "200bps-publish"

    def log_message(self, *a):
        pass

    def _host_ok(self) -> bool:
        host = (self.headers.get("Host") or "").split(":")[0]
        return host in ALLOWED_HOSTS          # blocks DNS-rebinding

    def _send(self, code: int, body: bytes, ctype: str):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.end_headers()
        self.wfile.write(body)

    def _json(self, data, code=200):
        self._send(code, json.dumps(data, ensure_ascii=False, default=str).encode(), "application/json; charset=utf-8")

    def do_GET(self):
        if not self._host_ok():
            return self._send(403, b"forbidden", "text/plain")
        u = urlparse(self.path)
        q = parse_qs(u.query)
        if u.path == "/api/state":
            return self._json(self._state(visit="visit" in q))
        if u.path == "/api/jobs":
            import jobs
            return self._json({"ok": True, **jobs.summary()})
        if u.path == "/api/zernio":
            return self._json(summary.build(force="force" in q))
        if u.path == "/api/images":
            import images
            return self._json({"ok": True, **images.state()})
        if u.path == "/upl":                       # thumbnails of files picked for a new post
            import newpost
            try:
                f = newpost._source((q.get("p") or [""])[0])
            except ValueError:
                return self._send(404, b"not found", "text/plain")
            return self._send_file(f)
        if u.path == "/img":
            import images
            try:
                ref = (q.get("p") or [""])[0]
                f = images.path_of((q.get("id") or [""])[0]) if not ref else images.ref_path(ref)
            except ValueError:
                return self._send(404, b"not found", "text/plain")
            return self._send_file(f)
        if u.path == "/api/keytest":
            import providers
            name = (q.get("name") or [""])[0].upper()
            return self._json({"ok": True, "test": providers.last_tests().get(name)})
        if u.path == "/api/accounts":
            return self._json(self._accounts_live())
        if u.path == "/connected":
            plat = esc_html((q.get("platform") or [""])[0])[:30]
            page = f"""<!doctype html><meta charset="utf-8"><title>Connected · 200BPS Publish</title>
<style>body{{margin:0;min-height:100vh;display:grid;place-items:center;background:#08090A;color:#F4F5F2;font:16px system-ui,sans-serif}}
.c{{text-align:center;max-width:420px;padding:24px}}.t{{width:64px;height:64px;border-radius:50%;background:#CCFF33;color:#08090A;display:grid;place-items:center;font:700 32px system-ui;margin:0 auto 16px}}
a{{color:#CCFF33}}</style><div class="c"><div class="t">✓</div><h1>{plat.title() or "Account"} connected</h1>
<p>You can close this tab and go back to the 200BPS Publish dashboard. It updates by itself.</p><p><a href="/">Back to the dashboard</a></p></div>
<script>try{{window.opener&&window.opener.postMessage({{bps:"connected"}},location.origin)}}catch(e){{}}setTimeout(()=>{{try{{window.close()}}catch(e){{}}}},2500)</script>"""
            return self._send(200, page.encode(), "text/html; charset=utf-8")
        if u.path == "/media":
            return self._media(q)
        if u.path == "/fmedia":
            return self._folder_media(q)
        if u.path == "/api/batch":
            return self._json({"ok": True, **batch.status()})
        if u.path == "/api/batch/folders":
            return self._json({"ok": True, "folders": batch.scan()})
        if u.path == "/api/fs":
            return self._json({"ok": True, **batch.fs_list((q.get("path") or [""])[0])})
        rel = "index.html" if u.path in ("/", "") else u.path.lstrip("/")
        target = (UI_DIR / rel).resolve()
        if UI_DIR.resolve() not in target.parents and target != UI_DIR.resolve() or not target.is_file():
            return self._send(404, b"not found", "text/plain")
        ctype = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        if target.suffix == ".webp":
            ctype = "image/webp"
        body = target.read_bytes()
        if target.name == "index.html":
            body = body.replace(b"</head>", f'<meta name="bps-token" content="{TOKEN}">\n</head>'.encode(), 1)
        return self._send(200, body, ctype)

    def do_POST(self):
        if not self._host_ok():
            return self._send(403, b"forbidden", "text/plain")
        origin = self.headers.get("Origin") or ""
        host = self.headers.get("Host") or ""
        if origin and origin not in (f"http://{host}",):
            return self._json({"ok": False, "error": "bad origin"}, 403)
        if self.headers.get("X-BPS-Token") != TOKEN:
            print(f"[{time.strftime('%H:%M:%S')}] refused {self.path}: page is out of date (old session)", flush=True)
            return self._json({"ok": False, "error": "This page is out of date. Reload it (Ctrl+Shift+R) and try again."}, 403)
        if urlparse(self.path).path == "/api/upload":        # raw file body, streamed to .bps/uploads
            import newpost
            from urllib.parse import unquote
            try:
                out = newpost.save_upload(unquote(self.headers.get("X-File-Name") or ""), self.rfile, int(self.headers.get("Content-Length") or 0))
            except ValueError as e:
                return self._json({"ok": False, "error": str(e)}, 400)
            return self._json({"ok": True, **out})
        if "application/json" not in (self.headers.get("Content-Type") or ""):
            return self._json({"ok": False, "error": "json only"}, 415)
        n = int(self.headers.get("Content-Length") or 0)
        if n > (MAX_UPLOAD if urlparse(self.path).path == "/api/images" else MAX_BODY):
            return self._json({"ok": False, "error": "too large"}, 413)
        try:
            data = json.loads(self.rfile.read(n) or b"{}")
        except json.JSONDecodeError:
            return self._json({"ok": False, "error": "bad json"}, 400)
        path = urlparse(self.path).path
        try:
            if path == "/api/answer":
                q = hitl.answer(str(data.get("id", "")), str(data.get("answer", "")), str(data.get("note", "")), via="ui",
                                edited=str(data.get("edited", ""))[:5000])
                return self._json({"ok": True, "question": q})
            if path == "/api/note":
                return self._json({"ok": True, "note": hitl.add_note(str(data.get("text", "")))})
            if path == "/api/chat":
                op = str(data.get("op", ""))
                if op == "seen":
                    hitl.seen(str(data.get("id", "")))
                elif op == "reply":
                    n = hitl.reply(str(data.get("id", "")), str(data.get("text", "")))
                    return self._json({"ok": True, "note": n, "thread": hitl.thread()})
                else:
                    raise ValueError("Unknown action.")
                return self._json({"ok": True, "thread": hitl.thread()})
            if path == "/api/connect":
                return self._json(self._connect(data))
            if path == "/api/ideas":
                return self._json(self._ideas(data))
            if path == "/api/publish":
                import jobs
                if (str(data.get("confirm", "")).strip().lower() != "go"):
                    raise PermissionError("Type go to publish.")
                with jobs.job("publish", "Publishing your post", estimate=40, step="Checking the post"):
                    out = plans.publish_from_dashboard(str(data.get("confirm", "")))
                (state_dir() / "cache.json").unlink(missing_ok=True)      # Posts tab shows it on next load
                return self._json({"ok": True, **out})
            if path == "/api/keys":
                return self._json(self._keys(data))
            if path == "/api/images":
                return self._json(self._images(data))
            if path == "/api/newpost":
                import newpost
                if data.get("op") == "folder":
                    return self._json({"ok": True, **newpost.from_folder(str(data.get("path", "")))})
                if data.get("op") == "pick":
                    r = batch.pick()
                    return self._json({"ok": True, "pick": r})
                return self._json({"ok": True, **newpost.create([str(f) for f in (data.get("files") or [])][:newpost.MAX_FILES + 1],
                                                                str(data.get("name") or ""), str(data.get("caption") or "")[:5000])})
            if path == "/api/plan":
                return self._json(self._plan_op(data))
            if path == "/api/fixrequest":
                cid, plat = str(data.get("check", "")), str(data.get("platform", ""))
                msg = str(data.get("msg", ""))[:300]
                if not cid:
                    raise ValueError("No check.")
                p = plans.load()
                key = f"{cid}:{plat}"
                open_ = (p or {}).get("fixRequests", {}).get(key)
                if open_ and time.time() - open_.get("ts", 0) < 6 * 3600:
                    q = hitl.get(open_["questionId"]) if open_.get("questionId") else None
                    if not q or q.get("status") == "pending" or open_.get("status") == "requested":
                        return self._json({"ok": True, "duplicate": True, "status": open_.get("status"), "questionId": open_.get("questionId")})
                n = hitl.add_note(f"Suggest a fix for '{cid}' on {plat or 'all platforms'}: {msg}. {str(data.get('note', ''))[:1000]}".strip(),
                                  {"type": "fix_request", "check": cid, "platform": plat, "msg": msg})
                if p:
                    p.setdefault("fixRequests", {})[key] = {"status": "requested", "ts": int(time.time()), "note": n["id"]}
                    plans.save(p, record=False)
                return self._json({"ok": True, "queued": n["id"]})
            if path == "/api/report":
                pid = str(data.get("postId", "")).strip()
                if not pid:
                    raise ValueError("No post.")
                n = hitl.add_note(f"Give me the full report for post {pid}.", {"type": "report", "postId": pid})
                return self._json({"ok": True, "queued": n["id"]})
            if path == "/api/slot":
                return self._json(self._slot(data))
            if path == "/api/cancel":
                if data.get("draft"):
                    return self._json({"ok": True, **cancel.delete_draft(str(data["draft"]))})
                return self._json({"ok": True, **cancel.cancel_post(str(data.get("postId", "")), str(data.get("confirm", "")))})
            if path == "/api/batch":
                return self._json(self._batch(data))
            if path == "/api/goal":
                try:
                    n = int(data.get("followers"))
                except (TypeError, ValueError):
                    raise ValueError("Goal must be a number.")
                if not 0 < n <= 1_000_000_000:
                    raise ValueError("Goal must be a positive number.")
                cfg = config()
                cfg.setdefault("goal", {})["followers"] = n
                save_config(cfg)
                return self._json({"ok": True, "goal": cfg["goal"]})
        except PermissionError as e:
            return self._json({"ok": False, "error": str(e)}, 403)
        except ZernioError as e:
            return self._json({"ok": False, "error": "Zernio: " + str(e)}, 502)
        except ValueError as e:
            print(f"[{time.strftime('%H:%M:%S')}] {path}: {e}", flush=True)
            return self._json({"ok": False, "error": str(e)}, 400)
        except Exception as e:                       # never leave the page without an answer
            import traceback
            traceback.print_exc()
            return self._json({"ok": False, "error": f"Something broke on this computer ({type(e).__name__}). Details are in the dashboard's terminal output."}, 500)
        return self._json({"ok": False, "error": "not found"}, 404)

    def _batch(self, data: dict) -> dict:
        """Batch scheduling. prepare/suggest are local; run needs the typed
        "go" and creates every post in Zernio as scheduled."""
        op = data.get("op")
        if op == "pick":
            return batch.pick()
        if op == "add":
            return {"ok": True, "found": batch.add_roots([str(x) for x in data.get("folders") or []])}
        if op == "prepare":
            return {"ok": True, "items": batch.prepare([str(x) for x in data.get("folders") or []])}
        if op == "suggest":
            return {"ok": True, "times": batch.suggest(
                int(data.get("count") or 0), str(data.get("start") or ""), int(data.get("every") or 1),
                [int(x) for x in data.get("days") or []], str(data.get("mode") or "best"),
                int(data.get("hour", 20)), int(data.get("minute", 0)), bool(data.get("skipBusy", True)))}
        if op == "check":
            return {"ok": True, "items": batch.validate(list(data.get("items") or []))}
        if op == "run":
            return {"ok": True, **batch.run(list(data.get("items") or []), str(data.get("confirm", "")))}
        raise ValueError("Unknown batch action.")

    def _connect(self, data: dict) -> dict:
        """Start connecting a social account: returns Zernio's OAuth link.
        The user signs in on the network's own site; this server never sees
        their password or tokens. Zernio sends them back to /connected."""
        import accounts as acct
        from zernio import Zernio
        plat = str(data.get("platform", "")).lower()
        if plat not in acct.CONNECTABLE:
            raise ValueError(f"{plat or 'That network'} isn't available yet.")
        z = Zernio()
        if not z.configured:
            raise ValueError("Add your Zernio API key first (Settings → Keys).")
        pid = acct.profile_id(z)
        if not pid:
            raise ValueError("No Zernio profile found. Create one at zernio.com first.")
        host = self.headers.get("Host") or "127.0.0.1"
        back = f"http://{host}/connected?platform={plat}"
        try:
            r = z.connect_url(plat, pid, back)
        except ZernioError as e:
            if e.status == 400:                      # redirect not accepted: use Zernio's default finish page
                r = z.connect_url(plat, pid)
                back = None
            else:
                raise
        before = [a.get("_id") for a in (acct.live(z) or []) if a.get("platform") == plat]
        write_json(state_dir() / "connecting.json", {"platform": plat, "before": before, "ts": int(time.time())})
        return {"ok": True, "authUrl": r.get("authUrl"), "returnsHere": bool(back)}

    def _accounts_live(self) -> dict:
        """Poll target while connecting: live accounts; a new one is saved and enabled."""
        import accounts as acct
        from zernio import Zernio
        z = Zernio()
        live_ = acct.live(z)
        if live_ is None:
            return {"ok": False, "error": "Zernio not reachable."}
        pend = read_json(state_dir() / "connecting.json") or {}
        new = [a for a in live_ if a.get("platform") == pend.get("platform") and a.get("_id") not in pend.get("before", [])]
        rec = acct.reconcile(live_)
        if new:
            acct.enable_platform(new[0]["platform"])
            (state_dir() / "connecting.json").unlink(missing_ok=True)
            (state_dir() / "cache.json").unlink(missing_ok=True)
            _doctor_cache["t"] = 0
            hitl.add_note(f"Connected {new[0]['platform']} @{new[0].get('username')} from the dashboard.",
                          {"type": "account_connected", "platform": new[0]["platform"], "username": new[0].get("username")})
        return {"ok": True, "new": [{"platform": a.get("platform"), "username": a.get("username")} for a in new],
                "accounts": [{"platform": a.get("platform"), "username": a.get("username"), "active": a.get("isActive"),
                              "needsReconnection": a.get("needsReconnection")} for a in live_],
                "connected": rec["connected"], "auto": rec["auto"]}

    def _ideas(self, data: dict) -> dict:
        """Idea bank actions from the dashboard: ask Claude for ideas, mark or drop one."""
        op = data.get("op")
        p = state_dir() / "ideas.json"
        ideas = read_json(p, []) or []
        if op == "request":
            topic = str(data.get("topic", "")).strip()[:200]
            n = hitl.add_note(("Give me fresh post ideas" + (f" about: {topic}" if topic else "") + "."),
                              {"type": "ideas_request", "topic": topic})
            return {"ok": True, "queued": n["id"]}
        title = str(data.get("title", ""))
        hit = next((i for i in ideas if i.get("title") == title), None)
        if not hit:
            raise ValueError("Unknown idea.")
        if op == "mark":
            st = str(data.get("status", ""))
            if st not in ("new", "drafted", "posted"):
                raise ValueError("Bad status.")
            hit["status"] = st
        elif op == "drop":
            ideas = [i for i in ideas if i is not hit]
        else:
            raise ValueError("Unknown action.")
        write_json(p, ideas)
        return {"ok": True}

    def _keys(self, data: dict) -> dict:
        """Save / remove / test API keys. Values are written to .env only and
        never sent back; the response carries masked forms."""
        import providers
        op, saved, test = data.get("op"), None, None
        if op == "set":
            saved = keys.set_key(str(data.get("name", "")), str(data.get("value", "")))
            if saved["name"] in providers.PROVIDERS:
                test = providers.test(saved["name"])         # check it right away
        elif op == "remove":
            keys.remove_key(str(data.get("name", "")))
        elif op == "test":
            test = providers.test(str(data.get("name") or "ZERNIO_API_KEY"))
        else:
            raise ValueError("Unknown action.")
        _doctor_cache["t"] = 0                       # re-check readiness now
        if op != "test" or (test and test["name"] == "ZERNIO_API_KEY"):
            (state_dir() / "cache.json").unlink(missing_ok=True)
        return {"ok": True, "saved": saved, "test": test, "keys": keys.listing()}

    def _images(self, data: dict) -> dict:
        """Create images with OpenAI and manage them. Everything stays in
        .bps/images; copying into a post folder happens only on request."""
        import images
        op = data.get("op")
        if op == "generate":
            try:
                out = images.generate(str(data.get("prompt", "")), [str(r) for r in (data.get("refs") or [])][:images.MAX_REFS],
                                      str(data.get("model") or ""), str(data.get("shape") or ""), str(data.get("quality") or ""),
                                      int(data.get("n") or 0), via="dashboard")
            except RuntimeError as e:
                return {"ok": False, "error": str(e)}
            return {"ok": True, **out}
        if op == "upload":
            return {"ok": True, **images.save_upload(str(data.get("name", "")), str(data.get("data", "")))}
        if op == "settings":
            return {"ok": True, "settings": images.save_settings(**{k: data.get(k) for k in ("model", "shape", "quality", "n")})}
        if op == "delete":
            images.delete(str(data.get("id", "")))
            return {"ok": True}
        if op == "copy":
            return {"ok": True, **images.copy_to(str(data.get("id", "")), str(data.get("folder") or ""))}
        if op == "ask":                      # "Ask Claude to write the prompt"
            idea = str(data.get("text", ""))[:2000]
            n = hitl.add_note(f"Write an image prompt for: {idea}", {"type": "image_prompt", "text": idea,
                                                                       "refs": [str(r) for r in (data.get("refs") or [])][:10]})
            return {"ok": True, "queued": n["id"]}
        raise ValueError("Unknown action.")

    def _plan_op(self, data: dict) -> dict:
        """Local edits to the current draft from the dashboard: the gift
        switch, undo of a journey step, revert of one change, clearing the
        time. Nothing here touches Zernio; a live DM automation is only created
        by the agent after publishing, with the user's yes."""
        op = data.get("op")
        if op == "clear":
            return {"ok": True, "kept": plans.clear_current()}
        if op == "select":
            pid = str(data.get("id", ""))
            if not plans.load(pid):
                raise ValueError("Unknown post.")
            (state_dir() / "current.txt").write_text(pid)
            return {"ok": True}
        p = plans.load()
        if not p:
            raise ValueError("No post loaded.")
        if op in ("gift", "clear_time") and not plans.editable(p):
            raise PermissionError("This post is already scheduled or live; ask Claude to change it.")
        if op == "gift":
            g = data.get("dm") or {}
            if g.get("enabled"):
                kw = str(g.get("keyword", "")).strip()
                msg = str(g.get("message", "")).strip()
                if not kw or not msg:
                    raise ValueError("A gift needs a keyword and a message.")
                link = str(g.get("link", "")).strip()
                if link and not link.startswith(("https://", "http://")):
                    raise ValueError("The link must start with https://")
                p["dm"] = {"enabled": True, "asked": True, "keyword": kw[:40], "message": msg[:640],
                           "link": link or None, "buttonTitle": (str(g.get("buttonTitle", "")).strip() or "Open")[:20],
                           "followGate": bool(g.get("followGate", True)), "matchMode": "word",
                           "commentReply": str(g.get("commentReply", "")).strip()[:300] or None}
            else:
                p["dm"] = {"enabled": False, "asked": True}
            if p.get("status") == "awaiting_approval":
                p["status"] = "draft"
            plans.recheck(p)
            plans.save(p, via="dashboard")
            return {"ok": True, "dm": p["dm"]}
        if op == "clear_time":
            p["schedule"] = {"mode": "ask"}
            if p.get("status") == "awaiting_approval":
                p["status"] = "draft"
            plans.recheck(p)
            plans.save(p, via="dashboard")
            return {"ok": True}
        if op == "select":
            pid = str(data.get("id", ""))
            if not plans.load(pid):
                raise ValueError("Unknown post.")
            (state_dir() / "current.txt").write_text(pid)
            return {"ok": True}
        if op == "undo":
            plans.undo_step(p, str(data.get("step", "")))
            return {"ok": True}
        if op == "revert":
            plans.revert(p, str(data.get("id", "")))
            return {"ok": True}
        raise ValueError("Unknown action.")

    def _slot(self, data: dict) -> dict:
        """Heatmap slot actions. Scheduling the current (unpublished) plan is a
        local change, so it is applied here; publishing still needs "go".
        Moving a live scheduled post or assigning a folder becomes a
        structured request for the agent, which carries it out and reports."""
        from datetime import datetime, timedelta
        from zoneinfo import ZoneInfo
        day, hour = int(data.get("day", 0) if data.get("date") else data.get("day", -1)), int(data.get("hour", -1))
        if not (0 <= day <= 6 and 0 <= hour <= 23):
            raise ValueError("Bad slot.")
        tz = ZoneInfo(config().get("timezone", "UTC"))
        date = str(data.get("date") or "")
        if date:                              # a specific calendar day
            y, m, dd = (int(x) for x in date.split("-"))
            when = datetime(y, m, dd, hour, tzinfo=tz)
            if when < datetime.now(tz) + timedelta(minutes=15):
                raise ValueError("That time has already passed. Pick a later hour or day.")
            at = when.isoformat()
        else:
            at = besttime.next_occurrence({"day": day, "hour": hour}, tz).replace(microsecond=0).isoformat()
        act = data.get("action")
        note = str(data.get("note", ""))[:1000]
        if act == "plan":
            p = plans.load()
            if not p or p.get("status") in ("published", "scheduled"):
                raise ValueError("No unpublished post loaded.")
            p["schedule"] = {"mode": "at", "at": at, "via": "dashboard"}
            if p.get("status") == "awaiting_approval":
                p["status"] = "draft"          # time changed: re-confirm before publishing
            plans.recheck(p)
            plans.save(p, via="dashboard")
            hitl.add_note(f"I scheduled this post for {at} from the dashboard. {note}".strip(),
                          {"type": "plan_scheduled", "plan": p["id"], "at": at})
            return {"ok": True, "at": at, "applied": True}
        if act == "reschedule":
            pid = str(data.get("postId", ""))
            if not pid:
                raise ValueError("Pick a scheduled post.")
            n = hitl.add_note(f"Move scheduled post {pid} to {at}. {note}".strip(),
                              {"type": "reschedule", "postId": pid, "at": at})
            return {"ok": True, "at": at, "queued": n["id"]}
        if act == "assign":
            folder = str(data.get("folder", "")).strip()
            if not folder:
                raise ValueError("Type a post folder.")
            n = hitl.add_note(f"Prepare the post in '{folder}' for {at}. {note}".strip(),
                              {"type": "assign", "folder": folder, "at": at})
            return {"ok": True, "at": at, "queued": n["id"]}
        if act == "idea":
            title = str(data.get("idea", "")).strip()
            if not title:
                raise ValueError("Pick an idea.")
            n = hitl.add_note(f"Draft a post from the idea '{title}' for {at}. {note}".strip(),
                              {"type": "idea", "idea": title, "at": at})
            return {"ok": True, "at": at, "queued": n["id"]}
        raise ValueError("Unknown action.")

    def _state(self, visit: bool) -> dict:
        cfg = config()
        data = {
            "version": VERSION,
            "workspace": ws_id(),
            "boot": BOOT,
            "config": _public_config(cfg),
            "doctor": _doctor(),
            "plan": plans.load(),
            "ideas": read_json(state_dir() / "ideas.json", []),
            "question": hitl.pending(),
            "listening": hitl.listening(),
            "presence": hitl.presence(),
            "thread": hitl.thread(),
            "claudeMsg": hitl.unseen(),
            "keys": keys.listing(),
            "plans": plans.list_plans(),
            "notes": hitl.notes(unread_only=False)[-5:],
        }
        if visit:
            snap_p = state_dir() / "snapshot.json"
            data["previousVisit"] = read_json(snap_p)
            cache = read_json(state_dir() / "cache.json") or {}
            fol = (cache.get("followers") or {}).get("current")
            if fol is not None:
                write_json(snap_p, {"followers": fol, "ts": int(time.time())})
        return data

    def _media(self, q):
        p = plans.load((q.get("plan") or [None])[0])
        name = (q.get("f") or [""])[0]
        if not p:
            return self._send(404, b"no plan", "text/plain")
        allowed = {m["file"]: Path(p["folder"]) / m["file"] for m in p.get("media", [])}
        if p.get("cover"):
            allowed["cover"] = Path(p["cover"].get("path") or Path(p["folder"]) / p["cover"]["file"])
        for c in p.get("coverCandidates", []):
            allowed[f"{c['kind']}:{c['n']}"] = Path(c["path"])
        if name not in allowed or not allowed[name].exists():
            return self._send(403, b"forbidden", "text/plain")
        return self._send_file(allowed[name])

    def _folder_media(self, q):
        """A thumbnail from a post folder that has no plan yet (batch picker)."""
        try:
            f = batch.folder_file((q.get("d") or [""])[0], (q.get("f") or [""])[0])
        except ValueError:
            return self._send(403, b"forbidden", "text/plain")
        return self._send_file(f)

    def _send_file(self, f: Path):
        ctype = mimetypes.guess_type(f.name)[0] or "application/octet-stream"
        size = f.stat().st_size
        rng = self.headers.get("Range")
        if rng and rng.startswith("bytes="):        # video scrubbing
            a, _, b = rng[6:].partition("-")
            start = int(a or 0)
            end = min(int(b) if b else size - 1, size - 1)
            with open(f, "rb") as fh:
                fh.seek(start)
                chunk = fh.read(end - start + 1)
            self.send_response(206)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Content-Length", str(len(chunk)))
            self.end_headers()
            self.wfile.write(chunk)
            return
        self._send(200, f.read_bytes(), ctype)


def running_url() -> str | None:
    """URL of a dashboard already serving this workspace, if any."""
    import urllib.request
    info = read_json(state_dir() / "server.json") or {}
    url = info.get("url")
    if not url:
        return None
    try:
        with urllib.request.urlopen(url + "api/state", timeout=3) as r:
            if r.status != 200:
                return None
            return url if json.loads(r.read() or b"{}").get("workspace") == ws_id() else None
    except Exception:
        return None


def serve(port: int = 4217, open_browser: bool = True) -> None:
    existing = running_url()
    if existing:
        print(f"200BPS Publish dashboard already running: {existing}", flush=True)
        if open_browser:
            webbrowser.open(existing)
        return
    for p in range(port, port + 20):
        try:
            httpd = ThreadingHTTPServer(("127.0.0.1", p), Handler)
            break
        except OSError:
            continue
    else:
        raise SystemExit("No free port found.")
    url = f"http://127.0.0.1:{httpd.server_port}/"
    write_json(state_dir() / "server.json", {"url": url, "started": int(time.time()), "workspace": ws_id()})
    print(f"200BPS Publish dashboard: {url}", flush=True)
    if open_browser:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
