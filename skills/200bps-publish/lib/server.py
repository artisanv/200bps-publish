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
from store import SKILL_DIR, VERSION, build_id, config, read_json, save_config, state_dir, write_json

UI_DIR = SKILL_DIR / "ui"
_UI = [0.0, 0]


def ui_stamp() -> int:
    """When the dashboard's own files last changed: an open page reloads itself to pick up fixes."""
    if time.time() - _UI[0] < 3:
        return _UI[1]
    newest = max((f.stat().st_mtime for f in UI_DIR.glob("*") if f.is_file()), default=0)
    _UI[0], _UI[1] = time.time(), int(newest)
    return _UI[1]
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
MAX_IDEAS_BODY = 2 * 1024 * 1024     # an imported idea backup


def _doctor():
    if time.time() - _doctor_cache["t"] > 60:
        _doctor_cache.update(t=time.time(), v=doctor.run(online=True))
    return _doctor_cache["v"]


def _public_config(cfg: dict) -> dict:
    keep = ("language", "timezone", "platforms", "goal", "keywords", "primary_platform")
    out = {k: cfg.get(k) for k in keep if k in cfg}
    out["accounts"] = {p: {"username": (a or {}).get("username")} for p, a in (cfg.get("accounts") or {}).items()}
    ig = cfg.get("instagram") or {}
    out["reelDefaults"] = {"trial": bool(ig.get("trial_reels", False)), "graduation": ig.get("trial_graduation") or "SS_PERFORMANCE",
                           "remind": ig.get("trial_remind", True) is not False}
    import accounts as acct
    out["connectable"] = list(acct.CONNECTABLE)
    out["comingSoon"] = list(acct.COMING_SOON)
    return out



def _trial_due() -> list:
    """Live Trial Reels 3+ days old that the user hasn't answered (never breaks the page)."""
    try:
        import trial
        return trial.due()
    except Exception:
        return []

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
        if u.path == "/api/facebook-pages":            # which Page to post to, when there's more than one
            from zernio import Zernio
            acc = (config().get("accounts", {}).get("facebook") or {}).get("id")
            if not acc:
                return self._json({"ok": False, "error": "No Facebook account connected."})
            try:
                r = Zernio().get(f"/accounts/{acc}/facebook-page")
                return self._json({"ok": True, "pages": [{"id": x.get("id"), "name": x.get("name")} for x in r.get("pages") or []],
                                   "selected": r.get("selectedPageId")})
            except ZernioError as e:
                return self._json({"ok": False, "error": str(e)})
        if u.path == "/api/tiktok":                    # the account's real privacy choices and limits
            from zernio import Zernio
            acc = (config().get("accounts", {}).get("tiktok") or {}).get("id")
            if not acc:
                return self._json({"ok": False, "error": "No TikTok account connected."})
            mt = (q.get("mediaType") or ["video"])[0]
            try:
                return self._json({"ok": True, **Zernio().get(f"/accounts/{acc}/tiktok/creator-info", mediaType=mt if mt in ("video", "photo") else "video")})
            except ZernioError as e:
                return self._json({"ok": False, "error": str(e)})
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
        if target.suffix in (".js", ".mjs"):          # ES modules need a JavaScript type on every OS
            ctype = "text/javascript"
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
        limit = {"/api/images": MAX_UPLOAD, "/api/ideas": MAX_IDEAS_BODY, "/api/zpost": 64 * 1024, "/api/inbox": 64 * 1024}.get(urlparse(self.path).path, MAX_BODY)
        if n > limit:
            return self._json({"ok": False, "error": "too large"}, 413)
        try:
            data = json.loads(self.rfile.read(n) or b"{}")
        except json.JSONDecodeError:
            return self._json({"ok": False, "error": "bad json"}, 400)
        path = urlparse(self.path).path
        try:
            if path == "/api/jobs":             # Stop: a job, or a note Claude hasn't finished
                import jobs
                if data.get("op") != "stop":
                    raise ValueError("Unknown action.")
                return self._json({"ok": True, "job": jobs.stop(str(data.get("id", ""))), **jobs.summary()})
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
                import rewrite
                plats = rewrite.eligible(p) if p else []
                if p and len(plats) >= 2 and plans.editable(p):     # one version per network, each fitted to it
                    n = hitl.add_note(f"Fix '{cid}' ({msg}) with one caption per network ({', '.join(plats)}), each fitted to that network. "
                                      f"{str(data.get('note', ''))[:1000]}".strip(),
                                      {"type": "fix_request", "check": cid, "platform": plat, "msg": msg, "perNetwork": True, "platforms": plats,
                                       "current": {x: p["captions"].get(x, "")[:5000] for x in plats},
                                       "rules": {x: rewrite._rules(x, p) for x in plats}, "gift": rewrite.gift_info(p)})
                else:
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
            if path == "/api/inbox":            # Inbox: reply, gift, hide, delete (typed), labels
                import inbox
                op, a = data.get("op"), [str(data.get(k, "")) for k in ("postId", "accountId", "commentId")]
                if op == "reply":
                    return self._json({"ok": True, **inbox.reply(*a, str(data.get("text", "")))})
                if op == "gift":
                    return self._json({"ok": True, **inbox.gift(*a, str(data.get("text", "")), str(data.get("link") or ""),
                                                                  str(data.get("button") or ""), bool(data.get("asButton")))})
                if op in ("hide", "show"):
                    return self._json({"ok": True, **inbox.hide(*a, op == "hide")})
                if op == "delete":
                    return self._json({"ok": True, **inbox.delete(*a, str(data.get("confirm", "")))})
                if op == "label":
                    return self._json({"ok": True, "inbox": inbox.label(a[2], str(data.get("name", "")), bool(data.get("on", True)))})
                if op == "ignore":
                    return self._json({"ok": True, "inbox": inbox.ignore([str(x) for x in (data.get("ids") or [a[2]])][:200])})
                if op == "unhandle":
                    return self._json({"ok": True, "inbox": inbox.unhandle(a[2])})
                if op == "hide_gifted":             # local view setting: hide comments whose authors got the gift
                    return self._json({"ok": True, "inbox": inbox.set_hide_gifted(bool(data.get("on", True)))})
                if op == "hide_replied":            # local view setting: hide comments already replied to
                    return self._json({"ok": True, "inbox": inbox.set_hide_replied(bool(data.get("on", True)))})
                if op == "ask_drafts":
                    return self._json({"ok": True, **inbox.ask_drafts(data.get("items") or [])})
                if op == "drop_draft":
                    return self._json({"ok": True, "inbox": inbox.drop_draft(a[2])})
                raise ValueError("Unknown action.")
            if path == "/api/zpost":            # Plan tab: move / edit a post in Zernio (typed word)
                import zedit
                if data.get("op") == "move":
                    return self._json({"ok": True, **zedit.move(str(data.get("postId", "")), str(data.get("at", "")), str(data.get("confirm", "")))})
                if data.get("op") == "networks":   # turn networks / accounts on or off (typed edit)
                    return self._json({"ok": True, **zedit.set_networks(str(data.get("postId", "")), data.get("platforms") or [], str(data.get("confirm", "")))})
                if data.get("op") == "unpublish":  # take a published post off one network (typed remove)
                    return self._json({"ok": True, **zedit.remove_published(str(data.get("postId", "")), str(data.get("platform", "")),
                                                                            str(data.get("accountId", "")), str(data.get("confirm", "")))})
                if data.get("op") == "copy":       # Paste a copied post on another day
                    import copypost
                    return self._json({"ok": True, **copypost.copy(data)})
                if data.get("op") == "edit":
                    return self._json({"ok": True, **zedit.edit_caption(str(data.get("postId", "")), str(data.get("text", ""))[:5000], str(data.get("confirm", "")))})
                raise ValueError("Unknown action.")
            if path == "/api/slot":
                return self._json(self._slot(data))
            if path == "/api/rewrite":          # one post, every network: Claude's version per network, the user picks
                import rewrite
                p = plans.load()
                if not p:
                    raise ValueError("No post open.")
                op = str(data.get("op", ""))
                if op == "ask":
                    return self._json({"ok": True, **rewrite.ask(p)})
                if op == "apply":
                    return self._json({"ok": True, **rewrite.apply(p, [str(x) for x in (data.get("platforms") or [])] or None,
                                                                    {str(k): str(v) for k, v in (data.get("edited") or {}).items()})})
                if op == "drop":
                    return self._json({"ok": True, "rewrite": rewrite.drop(p)})
                raise ValueError("Unknown action.")
            if path == "/api/abtest":           # hook A/B test with two Instagram Trial Reels (typed go)
                import abtest
                op = str(data.get("op", ""))
                if op == "list":
                    return self._json({"ok": True, "tests": abtest.tests()})
                if op == "results":
                    return self._json({"ok": True, "test": abtest.results(str(data.get("test", "")))})
                p = plans.load()
                if not p:
                    raise ValueError("No post open.")
                if op == "setup":
                    return self._json({"ok": True, "abtest": abtest.setup(p, data.get("captionB"), data.get("coverB"))})
                if op == "ask_hook":
                    return self._json({"ok": True, **abtest.ask_hook(p)})
                if op == "start":
                    import jobs
                    with jobs.job("abtest", "Starting a hook test", estimate=40):
                        return self._json({"ok": True, "test": abtest.start(p, str(data.get("confirm", "")))})
                raise ValueError("Unknown action.")
            if path == "/api/recycle":          # re-post a best post every N weeks/months with new hooks (typed go)
                import recycle
                op, pid = str(data.get("op", "")), str(data.get("postId", ""))
                if op == "list":
                    return self._json({"ok": True, **recycle.best(int(data.get("n") or 8))})
                if op == "state":
                    return self._json({"ok": True, **recycle.state(pid)})
                if op == "ask_hooks":
                    return self._json({"ok": True, **recycle.ask_hooks(pid, str(data.get("topic", "")))})
                if op == "variations":
                    return self._json({"ok": True, "draft": recycle.save_variations(pid, [str(v) for v in (data.get("variations") or [])][:40], via="dashboard")})
                if op == "enable":
                    times = data.get("times")
                    return self._json({"ok": True, **recycle.enable(pid, int(data.get("gap") or 0), str(data.get("freq", "")),
                                                                    int(times) if times not in (None, "", 0) else None,
                                                                    [str(v) for v in (data.get("variations") or [])][:40], str(data.get("confirm", "")),
                                                                    start=str(data.get("start", "")))})
                if op == "disable":
                    return self._json({"ok": True, **recycle.disable(pid)})
                raise ValueError("Unknown action.")
            if path == "/api/cancel":
                if data.get("draft"):
                    return self._json({"ok": True, **cancel.delete_draft(str(data["draft"]))})
                return self._json({"ok": True, **cancel.cancel_post(str(data.get("postId", "")), str(data.get("confirm", "")))})
            if path == "/api/batch":
                return self._json(self._batch(data))
            if path == "/api/trial":            # Trial Reels for Instagram Reels not published yet
                import trial
                op = data.get("op")
                if op == "advice":
                    return self._json({"ok": True, **trial.advice()})
                if op == "remind_done":          # 3-day reminder answered: shared in the app, or keep it a trial
                    return self._json(trial.remind_done(str(data.get("postId", "")), str(data.get("how", ""))))
                if op == "apply":                # Zernio posts need the typed word "edit"
                    return self._json({"ok": True, **trial.apply(data.get("changes") or [], str(data.get("typed") or ""))})
                if op == "ask":                  # Ask PIX: advice in the user's chat, nothing is changed
                    adv = trial.advice()
                    ids = set(data.get("ids") or [])
                    items = [{"id": i["id"], "where": i["where"], "at": i["at"], "trial": i["trial"], "graduation": i["graduation"],
                              "firstLine": (i["caption"] or "").split("\n")[0][:120], "notes": [n["key"] for n in i["notes"]]}
                             for i in adv["items"] if not ids or i["id"] in ids]
                    q = str(data.get("question") or "").strip()[:1000]
                    n = hitl.add_note(q or "Which of my waiting Reels should be Trial Reels, and Automatic or Manual?",
                                      {"type": "trial_advice", "items": items, "stats": adv["stats"]})
                    return self._json({"ok": True, "note": n.get("id")})
                raise ValueError("Unknown trial op.")
            if path == "/api/reeldefaults":      # Settings: new Instagram Reels start as Trial Reels or not
                cfg = config()
                ig = cfg.setdefault("instagram", {})
                if "trial" in data:
                    ig["trial_reels"] = bool(data.get("trial"))
                if "remind" in data:
                    ig["trial_remind"] = bool(data.get("remind"))
                if "graduation" in data:
                    g = str(data.get("graduation") or "")
                    if g not in ("MANUAL", "SS_PERFORMANCE"):
                        raise ValueError("After the trial is MANUAL or SS_PERFORMANCE.")
                    ig["trial_graduation"] = g
                save_config(cfg)
                return self._json({"ok": True, "reelDefaults": {"trial": bool(ig.get("trial_reels", False)),
                                                                 "graduation": ig.get("trial_graduation") or "SS_PERFORMANCE",
                                                                 "remind": ig.get("trial_remind", True) is not False}})
            if path == "/api/goal":
                try:
                    n = int(data.get("followers"))
                except (TypeError, ValueError):
                    raise ValueError("Goal must be a number.")
                if not 0 < n <= 1_000_000_000:
                    raise ValueError("Goal must be a positive number.")
                cfg = config()
                pf, acc = str(data.get("platform") or ""), str(data.get("account") or "")
                if acc:                               # a goal per account (Growth → network → account)
                    cfg.setdefault("goal", {}).setdefault("by", {})[acc] = n
                    if pf == "instagram" and acc == ((cfg.get("accounts") or {}).get("instagram") or {}).get("id"):
                        cfg["goal"]["followers"] = n  # the main Instagram account keeps driving the overview ring
                elif pf and pf != "instagram":        # older form: a goal per network
                    cfg.setdefault("goal", {}).setdefault("by", {})[pf] = n
                else:
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
        """Idea bank actions from the dashboard (lib/ideas.py). Only local
        files change; asking for new ideas is a note for Claude."""
        import ideas
        op = data.get("op")
        if op == "request":
            topic = str(data.get("topic", "")).strip()[:200]
            n = hitl.add_note(("Give me fresh post ideas" + (f" about: {topic}" if topic else "") + "."),
                              {"type": "ideas_request", "topic": topic})
            return {"ok": True, "queued": n["id"]}
        iid = str(data.get("id", ""))
        if not iid and data.get("title"):          # older dashboards name the idea by title
            iid = next((i["id"] for i in ideas.load() if i.get("title") == data["title"]), "")
        ids = [str(x) for x in (data.get("ids") or [])][:ideas.MAX_IDEAS]
        if op == "mark":
            ideas.mark(iid, str(data.get("status", "")))
            return {"ok": True}
        if op in ("drop", "delete"):
            return {"ok": True, "deleted": ideas.delete(ids or [iid])}
        if op == "clear":
            return {"ok": True, "deleted": ideas.delete([i["id"] for i in ideas.load()])}
        if op == "undo":
            return {"ok": True, "restored": ideas.undo()}
        if op == "edit":
            return {"ok": True, "idea": ideas.edit(iid, data.get("fields") or {})}
        if op == "add":
            return {"ok": True, "idea": ideas.add(data.get("fields") or {})}
        if op == "export":
            return {"ok": True, **ideas.export(ids, str(data.get("format", "md")))}
        if op == "import":
            return {"ok": True, **ideas.import_(data.get("data"))}
        raise ValueError("Unknown action.")

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
                                      int(data.get("n") or 0), via="dashboard", edit_of=str(data.get("editOf") or ""),
                                      mask=str(data.get("mask") or ""), notes=[str(x)[:500] for x in (data.get("notes") or [])][:20],
                                      kind=str(data.get("kind") or "single"))
            except (RuntimeError, ValueError) as e:
                from store import append_log
                append_log({"ts": int(time.time()), "event": "image_failed", "edit": bool(data.get("editOf")), "error": str(e)[:300]})
                return {"ok": False, "error": str(e)}
            return {"ok": True, **out}
        if op == "upload":
            return {"ok": True, **images.save_upload(str(data.get("name", "")), str(data.get("data", "")))}
        if op == "settings":
            return {"ok": True, "settings": images.save_settings(**{k: data.get(k) for k in ("model", "shape", "quality", "n", "nMode", "kind")})}
        if op == "delete":
            images.delete(str(data.get("id", "")))
            return {"ok": True}
        if op == "copy":
            return {"ok": True, **images.copy_to(str(data.get("id", "")), str(data.get("folder") or ""), bool(data.get("pick")))}
        if op == "keep_outside":
            return {"ok": True, "image": images.keep_outside(str(data.get("id", "")), str(data.get("data", "")))}
        if op == "projects":                 # your saved projects (folders in my-projects)
            return {"ok": True, "projects": images.projects()}
        if op == "project":                  # save several images together (a project folder) or each as it is
            return {"ok": True, **images.save_project([str(x) for x in (data.get("ids") or [])][:200], str(data.get("name") or ""),
                                                      str(data.get("mode") or "new"), str(data.get("folder") or ""))}
        if op == "saveas":
            return {"ok": True, **images.save_as(str(data.get("id", "")))}
        if op == "models_refresh":           # "Check now": read OpenAI's model list again
            try:
                images.refresh_models(force=True)
            except (RuntimeError, ValueError) as e:
                return {"ok": False, "error": str(e)}
            return {"ok": True, "models": images.models()}
        if op == "models_seen":              # the "new model" notice was read
            return {"ok": True, "models": images.mark_models_seen([str(x) for x in (data.get("ids") or [])][:50] or None)}
        if op == "claude":                   # "Claude designs it": queue it for the listening loop
            return {"ok": True, **images.ask_claude(str(data.get("prompt", "")), str(data.get("shape") or "tall"),
                                                    0 if data.get("n") in ("auto", 0, "0") else int(data.get("n") or 1),
                                                    [str(r) for r in (data.get("refs") or [])][:images.MAX_REFS],
                                                    str(data.get("editOf") or ""), str(data.get("kind") or "single"))}
        if op == "ask":                      # "Ask Claude to write the prompt"
            idea = str(data.get("text", ""))[:8000]
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
        # the Plan tab can time any local draft (it becomes the open post)
        p = plans.load(str(data["planId"])) if op in ("time", "networks") and data.get("planId") else plans.load()
        if not p:
            raise ValueError("No post loaded.")
        if op in ("gift", "clear_time", "caption", "time", "setting", "targets", "networks") and not plans.editable(p):
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
                for k, n in (("followGateMessage", 640), ("followGateButton", 20), ("notFollowingMessage", 640)):
                    v = str(g.get(k, "")).strip()
                    if v:
                        p["dm"][k] = v[:n]                 # the follow-first messages, in the user's words
            else:
                p["dm"] = {"enabled": False, "asked": True}
            if p.get("status") == "awaiting_approval":
                p["status"] = "draft"
            plans.recheck(p)
            plans.save(p, via="dashboard")
            return {"ok": True, "dm": p["dm"]}
        if op == "setting":                   # a network's own options (TikTok privacy, Snapchat type…)
            import json as _j
            v = data.get("value")
            plans.set_setting(p, str(data.get("path", "")), v if isinstance(v, str) else _j.dumps(v), via="dashboard")
            return {"ok": True, "settings": p["settings"], "score": {k: x["value"] for k, x in p["score"].items()}}
        if op == "caption":                   # New post steps: the user's own edit, re-checked at once
            text = str(data.get("text", "")).strip()
            if not text:
                raise ValueError("The caption is empty.")
            plats = [str(data["platform"])] if data.get("platform") else list(p["platforms"])
            for pl in plats:
                if pl not in p["platforms"]:
                    raise ValueError(f"{pl} is not in this post.")
                if p["captions"].get(pl, "") != text:
                    p.setdefault("caption_history", []).append(
                        {"ts": int(time.time()), "platform": pl, "before": p["captions"].get(pl, ""), "after": text[:5000], "via": "dashboard"})
                    p["captions"][pl] = text[:5000]
            if p.get("status") == "awaiting_approval":
                p["status"] = "draft"
            plans.recheck(p)
            plans.save(p, via="dashboard")
            return {"ok": True, "score": {k: v["value"] for k, v in p["score"].items()}}
        if op == "time":                      # New post steps: any day and minute, or now
            from datetime import datetime, timedelta
            from zoneinfo import ZoneInfo
            if data.get("now"):
                p["schedule"] = {"mode": "now", "via": "dashboard"}
            else:
                tz = ZoneInfo(config().get("timezone", "UTC"))
                try:
                    when = datetime.fromisoformat(str(data.get("at", ""))[:16]).replace(tzinfo=tz)
                except ValueError:
                    raise ValueError("Pick a day and a time.") from None
                if when < datetime.now(tz) + timedelta(minutes=15):
                    raise ValueError("Pick a time at least 15 minutes from now.")
                p["schedule"] = {"mode": "at", "at": when.isoformat(), "via": "dashboard"}
            if p.get("status") == "awaiting_approval":
                p["status"] = "draft"
            plans.recheck(p)
            plans.save(p, via="dashboard")
            return {"ok": True, "schedule": p["schedule"]}
        if op == "networks":                 # a local draft: which networks (and accounts) it goes to
            known = (summary.build() or {}).get("accounts") or []
            plans.set_networks(p, data.get("platforms") or [], known)
            return {"ok": True}
        if op == "targets":                  # which accounts on each network this post goes to
            known = (summary.build() or {}).get("accounts") or []
            plans.set_targets(p, data.get("targets") or {}, known)
            return {"ok": True}
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

    def _state(self, visit: bool) -> dict:  # noqa: C901
        import ideas
        import inbox
        cfg = config()
        data = {
            "version": VERSION, "build": build_id(), "ui": ui_stamp(),
            "workspace": ws_id(),
            "boot": BOOT,
            "config": _public_config(cfg),
            "doctor": _doctor(),
            "plan": plans.load(),
            "ideas": ideas.load(), "ideasUndo": ideas.undo_info(), "inbox": inbox.state(),
            "question": hitl.pending(),
            "listening": hitl.listening(),
            "presence": hitl.presence(),
            "thread": hitl.thread(), "activity": hitl.activity(),
            "claudeMsg": hitl.unseen(),
            "keys": keys.listing(),
            "plans": plans.list_plans(),
            "notes": hitl.notes(unread_only=False)[-5:],
            "trialDue": _trial_due(),
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


# ---------------- self-update: a running dashboard picks up new plugin code by itself ----------------
CODE_DIRS = ("lib", "bin")


def code_stamp() -> float:
    """Newest change to the dashboard's Python code (lib/, bin/)."""
    newest = 0.0
    for sub in CODE_DIRS:
        for f in (SKILL_DIR / sub).glob("*.py"):
            try:
                newest = max(newest, f.stat().st_mtime)
            except OSError:
                pass
    return newest


class _Server(ThreadingHTTPServer):
    """Counts requests in flight, so a reload never cuts one off (a publish runs inside a request)."""
    daemon_threads = True

    def __init__(self, *a, **kw):
        self.inflight = 0
        self._il = threading.Lock()
        super().__init__(*a, **kw)

    def process_request_thread(self, request, client_address):
        with self._il:
            self.inflight += 1
        try:
            super().process_request_thread(request, client_address)
        finally:
            with self._il:
                self.inflight -= 1


def _busy_here() -> bool:
    """A job this dashboard process started is still running (refresh, image, publish…)."""
    import os
    import jobs
    try:
        rows = jobs._load()
    except Exception:
        return True
    return any(j.get("state") == "running" and j.get("pid") == os.getpid() for j in rows.values())


def _watch_code(httpd: "_Server", argv: list[str], every: float = 3.0, settle: float = 2.0) -> None:
    """When the plugin's Python code changes (an update, or a fix), restart this dashboard in place on the
    same port once it's idle. Open pages see the new boot id and reload themselves."""
    import os
    import sys
    start = code_stamp()
    seen = start
    while True:
        time.sleep(every)
        now = code_stamp()
        if now == start:
            continue
        if now != seen:                    # still being written (a sync copies many files): wait until it settles
            seen = now
            time.sleep(settle)
            continue
        if httpd.inflight or _busy_here():
            continue
        print("200BPS Publish: new plugin code, restarting the dashboard…", flush=True)
        try:
            httpd.server_close()
        except Exception:
            pass
        args = [a for a in argv if a != "--no-open"] + ["--no-open"]   # the page is already open; it reloads itself
        os.execv(sys.executable, [sys.executable] + args)


def serve(port: int = 4217, open_browser: bool = True) -> None:
    existing = running_url()
    if existing:
        print(f"200BPS Publish dashboard already running: {existing}", flush=True)
        if open_browser:
            webbrowser.open(existing)
        return
    for p in range(port, port + 20):
        try:
            httpd = _Server(("127.0.0.1", p), Handler)
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
    import sys
    threading.Thread(target=_watch_code, args=(httpd, list(sys.argv)), daemon=True, name="code-watch").start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
