"""A fake Zernio API on 127.0.0.1 for the self-tests.

Nothing here talks to the internet: the plugin is pointed at this server with
ZERNIO_BASE_URL, and every request it makes is recorded in `calls`, so a test can
check exactly what would have been sent to Zernio (and that nothing was sent
without a confirm).
"""
from __future__ import annotations

import json
import threading
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

IG, LI = "acc_ig_0000000000000001", "acc_li_0000000000000002"
PROFILE = "prof_00000000000000000001"
ACCOUNTS = [
    {"_id": IG, "platform": "instagram", "username": "test.account", "displayName": "Test", "isActive": True,
     "profileId": PROFILE},
    {"_id": LI, "platform": "linkedin", "username": "Test Person", "displayName": "Test Person", "isActive": True,
     "profileId": PROFILE},
]


def _oid() -> str:
    return uuid.uuid4().hex[:24]


class FakeZernio:
    def __init__(self):
        self.calls: list[dict] = []
        self.posts: dict[str, dict] = {}
        self.automations: dict[str, dict] = {}
        self.uploads: dict[str, int] = {}
        self.lock = threading.Lock()
        self.fail_next: dict[str, tuple[int, dict]] = {}     # "POST /posts" -> (status, body)
        fz = self

        class H(BaseHTTPRequestHandler):
            def log_message(self, *a):
                pass

            def _body(self):
                n = int(self.headers.get("Content-Length") or 0)
                raw = self.rfile.read(n) if n else b""
                try:
                    return json.loads(raw) if raw else None
                except ValueError:                 # binary upload (UnicodeDecodeError / JSONDecodeError)
                    return {"_bytes": len(raw)}

            def _send(self, code, obj):
                raw = json.dumps(obj).encode()
                self.send_response(code)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(raw)))
                self.end_headers()
                self.wfile.write(raw)

            def _handle(self, method):
                u = urlparse(self.path)
                path = u.path.removeprefix("/api/v1")
                body = self._body() if method in ("POST", "PUT", "PATCH") else None
                with fz.lock:
                    fz.calls.append({"method": method, "path": path, "query": parse_qs(u.query), "body": body,
                                     "auth": self.headers.get("Authorization", ""), "idem": self.headers.get("Idempotency-Key"),
                                     "t": time.time()})
                    key = f"{method} {path}"
                    if key in fz.fail_next:
                        code, err = fz.fail_next.pop(key)
                        return self._send(code, err)
                    try:
                        code, out = fz.route(method, path, parse_qs(u.query), body, self.headers)
                    except KeyError:
                        code, out = 404, {"error": "Not found", "code": "not_found"}
                return self._send(code, out)

            def do_GET(self):
                self._handle("GET")

            def do_POST(self):
                self._handle("POST")

            def do_PUT(self):
                self._handle("PUT")

            def do_PATCH(self):
                self._handle("PATCH")

            def do_DELETE(self):
                self._handle("DELETE")

        self.httpd = ThreadingHTTPServer(("127.0.0.1", 0), H)
        self.httpd.daemon_threads = True
        self.base = f"http://127.0.0.1:{self.httpd.server_port}/api/v1"
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()

    def close(self):
        self.httpd.shutdown()
        self.httpd.server_close()

    # what the plugin sent
    def sent(self, method: str, prefix: str) -> list[dict]:
        return [c for c in self.calls if c["method"] == method and c["path"].startswith(prefix)]

    # ---------------------------------------------------------------- routes
    def route(self, m, path, q, body, headers):
        parts = [p for p in path.split("/") if p]
        if path == "/accounts" and m == "GET":
            return 200, {"accounts": ACCOUNTS}
        if path == "/accounts/health":
            return 200, {"accounts": [{"accountId": a["_id"], "platform": a["platform"], "status": "healthy"} for a in ACCOUNTS]}
        if path == "/profiles":
            return 200, {"profiles": [{"_id": PROFILE, "name": "Test", "isDefault": True}]}
        if path == "/media/presign" and m == "POST":
            mid = _oid()
            return 200, {"uploadUrl": f"{self.base}/_upload/{mid}", "publicUrl": f"https://media.example/{mid}/{body.get('filename')}"}
        if parts[:1] == ["_upload"] and m == "PUT":
            self.uploads[parts[1]] = (body or {}).get("_bytes", 0)
            return 200, {}
        if path == "/tools/validate/post":
            return 200, {"valid": True}
        if path == "/posts" and m == "POST":
            pid = _oid()
            plats = []
            for t in body.get("platforms") or []:
                acc = next((a for a in ACCOUNTS if a["_id"] == t.get("accountId")), {"_id": t.get("accountId")})
                plats.append({**t, "_id": _oid(), "accountId": acc, "status": "pending"})
            post = {"_id": pid, "content": body.get("content", ""), "platforms": plats, "mediaItems": body.get("mediaItems") or [],
                    "scheduledFor": body.get("scheduledFor"), "timezone": body.get("timezone"),
                    "status": "scheduled" if body.get("scheduledFor") and not body.get("publishNow") else "published",
                    "createdAt": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())}
            self.posts[pid] = post
            return 201, {"post": post, "message": "ok"}
        if parts[:1] == ["posts"] and len(parts) == 3 and parts[2] == "unpublish" and m == "POST":
            for t in self.posts[parts[1]]["platforms"]:
                if t["platform"] == (body or {}).get("platform"):
                    t["status"] = "unpublished"
            return 200, {"message": "unpublished"}
        if parts[:1] == ["posts"] and len(parts) == 2:
            pid = parts[1]
            if m == "GET":
                return 200, {"post": self.posts[pid]}
            if m == "PUT":
                p = self.posts[pid]
                for k, v in (body or {}).items():
                    if k == "platforms":
                        for upd in v:
                            for t in p["platforms"]:
                                if t["platform"] == upd.get("platform"):
                                    t.update({kk: vv for kk, vv in upd.items() if kk != "accountId"})
                    else:
                        p[k] = v
                return 200, {"post": p}
            if m == "DELETE":
                self.posts.pop(pid)
                return 200, {"message": "deleted"}
        if path == "/posts" and m == "GET":
            return 200, {"posts": list(self.posts.values()), "pagination": {"page": 1, "pages": 1, "total": len(self.posts)}}
        if path == "/comment-automations":
            if m == "GET":
                return 200, {"automations": list(self.automations.values())}
            if m == "POST":
                aid = _oid()
                a = {"id": aid, **body, "isActive": True}
                self.automations[aid] = a
                return 201, {"automation": a}
        if parts[:1] == ["comment-automations"] and len(parts) == 2:
            aid = parts[1]
            if m == "DELETE":
                self.automations.pop(aid)
                return 200, {"message": "deleted"}
            if m == "PATCH":
                self.automations[aid].update(body or {})
                return 200, {"automation": self.automations[aid]}
        # read-only analytics & inbox: empty but well-formed
        if path.startswith("/analytics") or path.startswith("/inbox") or path.startswith("/accounts/"):
            return 200, {}
        raise KeyError(path)
