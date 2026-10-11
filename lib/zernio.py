"""Minimal Zernio REST client (stdlib only).

Reference: https://docs.zernio.com and https://zernio.com/openapi.yaml
The API key is read from <workspace>/.env or the ZERNIO_API_KEY environment
variable. It is never logged, printed, or sent anywhere except zernio.com.
"""
from __future__ import annotations

import json
import mimetypes
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from pathlib import Path

from store import load_env

DEFAULT_BASE = "https://zernio.com/api/v1"


class ZernioError(Exception):
    def __init__(self, status: int, body: dict | str):
        self.status = status
        self.body = body
        if isinstance(body, dict):
            msg = f"{status} {body.get('code') or body.get('type') or ''}: {body.get('error') or body}"
        else:
            msg = f"{status}: {str(body)[:300]}"
        super().__init__(msg)

    @property
    def code(self) -> str | None:
        return self.body.get("code") if isinstance(self.body, dict) else None


class Zernio:
    def __init__(self, api_key: str | None = None, base: str | None = None):
        env = load_env()
        self.key = api_key or env.get("ZERNIO_API_KEY", "")
        self.base = (base or env.get("ZERNIO_BASE_URL") or DEFAULT_BASE).rstrip("/")

    @property
    def configured(self) -> bool:
        return self.key.startswith("sk_") and len(self.key) >= 20

    # ---------------- transport ----------------
    def _req(self, method: str, path: str, query: dict | None = None, body=None,
             headers: dict | None = None, retries: int = 3):
        if not self.configured:
            raise ZernioError(401, {"code": "missing_api_key", "error": "ZERNIO_API_KEY is not set in .env"})
        url = self.base + path
        if query:
            q = {k: v for k, v in query.items() if v is not None}
            if q:
                url += "?" + urllib.parse.urlencode(q, doseq=True)
        data = None
        h = {"Authorization": f"Bearer {self.key}", "Accept": "application/json",
             "User-Agent": "200bps-publish"}
        if body is not None:
            data = json.dumps(body).encode()
            h["Content-Type"] = "application/json"
        h.update(headers or {})
        for attempt in range(retries + 1):
            req = urllib.request.Request(url, data=data, method=method, headers=h)
            try:
                with urllib.request.urlopen(req, timeout=60) as r:
                    raw = r.read()
                    return json.loads(raw) if raw else {}
            except urllib.error.HTTPError as e:
                raw = e.read()
                try:
                    payload = json.loads(raw)
                except json.JSONDecodeError:
                    payload = raw.decode(errors="replace")
                if e.code == 429 and attempt < retries:
                    wait = float(e.headers.get("Retry-After") or 2 ** attempt)
                    time.sleep(min(wait, 30))
                    continue
                if e.code == 207 and isinstance(payload, dict):
                    return payload  # partial publish; caller inspects platforms[].errorMessage
                raise ZernioError(e.code, payload) from None
            except urllib.error.URLError as e:
                if attempt < retries:
                    time.sleep(2 ** attempt)
                    continue
                raise ZernioError(0, {"code": "network", "error": str(e.reason)}) from None

    def get(self, path, **q):
        return self._req("GET", path, query=q)

    # ---------------- accounts ----------------
    def accounts(self) -> list[dict]:
        return self.get("/accounts").get("accounts", [])

    def accounts_health(self):
        return self.get("/accounts/health")

    def profiles(self):
        return self.get("/profiles")

    def connect_url(self, platform: str, profile_id: str, redirect_url: str | None = None) -> dict:
        """OAuth link for connecting a social account. The user approves on the
        network's own site; Zernio stores the tokens, never this skill."""
        return self.get(f"/connect/{platform}", profileId=profile_id, redirect_url=redirect_url)

    def linkedin_orgs(self, account_id: str):
        return self.get(f"/accounts/{account_id}/linkedin-organizations")

    # ---------------- media ----------------
    def upload(self, path: Path) -> str:
        """Presign + PUT. Returns the public URL to use in mediaItems."""
        ctype = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        if path.suffix.lower() == ".mov":
            ctype = "video/quicktime"
        size = path.stat().st_size
        pre = self._req("POST", "/media/presign", body={"filename": path.name, "contentType": ctype, "size": size})
        with open(path, "rb") as f:
            req = urllib.request.Request(pre["uploadUrl"], data=f.read(), method="PUT",
                                         headers={"Content-Type": ctype})
        try:
            urllib.request.urlopen(req, timeout=600).read()
        except urllib.error.HTTPError as e:
            raise ZernioError(e.code, {"code": "upload_failed", "error": e.read().decode(errors="replace")[:300]}) from None
        return pre["publicUrl"]

    # ---------------- posts ----------------
    def validate_post(self, body: dict):
        return self._req("POST", "/tools/validate/post", body=body)

    def create_post(self, body: dict, idempotency_key: str | None = None):
        return self._req("POST", "/posts", body=body,
                         headers={"Idempotency-Key": idempotency_key or str(uuid.uuid4())}, retries=1)

    def post(self, post_id: str):
        return self.get(f"/posts/{post_id}")

    def update_post(self, post_id: str, body: dict):
        return self._req("PUT", f"/posts/{post_id}", body=body)

    def posts(self, **q):
        return self.get("/posts", **q)

    def delete_post(self, post_id: str):
        """Remove a not-yet-published post (scheduled, draft, failed, partial,
        publishing) from Zernio so it never goes out. Published posts: 400."""
        return self._req("DELETE", f"/posts/{post_id}", retries=1)

    def unpublish_post(self, post_id: str, platform: str, account_id: str | None = None):
        """Delete a published post from one platform (not Instagram/TikTok)."""
        body = {"platform": platform}
        if account_id:
            body["accountId"] = account_id
        return self._req("POST", f"/posts/{post_id}/unpublish", body=body, retries=1)

    # ---------------- analytics ----------------
    def analytics(self, **q):
        return self.get("/analytics", **q)

    def best_time(self, **q):
        return self.get("/analytics/best-time", **q)

    def post_timeline(self, post_id: str, **q):
        return self.get("/analytics/post-timeline", postId=post_id, **q)

    def ig_insights(self, account_id: str, **q):
        return self.get("/analytics/instagram/account-insights", accountId=account_id, **q)

    def ig_follower_history(self, account_id: str, **q):
        return self.get("/analytics/instagram/follower-history", accountId=account_id, **q)

    def ig_demographics(self, account_id: str, **q):
        return self.get("/analytics/instagram/demographics", accountId=account_id, **q)

    def follower_stats(self, account_ids: list[str], **q):
        return self.get("/accounts/follower-stats", accountIds=",".join(account_ids), **q)

    # ---------------- inbox ----------------
    def comment_posts(self, **q):
        return self.get("/inbox/comments", **q)

    def comments(self, post_id: str, account_id: str, **q):
        return self.get(f"/inbox/comments/{post_id}", accountId=account_id, **q)

    # ---------------- automations ----------------
    def automations(self, profile_id: str | None = None):
        return self.get("/comment-automations", profileId=profile_id)

    def create_automation(self, body: dict):
        return self._req("POST", "/comment-automations", body=body)

    def update_automation(self, automation_id: str, body: dict):
        return self._req("PATCH", f"/comment-automations/{automation_id}", body=body)

    def delete_automation(self, automation_id: str):
        return self._req("DELETE", f"/comment-automations/{automation_id}")

    def ice_breakers(self, account_id: str):
        return self.get(f"/accounts/{account_id}/instagram-ice-breakers")

    def set_ice_breakers(self, account_id: str, items: list[dict]):
        return self._req("PUT", f"/accounts/{account_id}/instagram-ice-breakers", body={"ice_breakers": items})
