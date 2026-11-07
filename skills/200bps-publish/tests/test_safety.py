"""Rule 1: nothing goes public without an explicit confirm. Every command that changes
something in Zernio must refuse without --confirm and send no write request."""
import json
import unittest

from helpers import CAPTION, Workspace

WRITES = ("POST", "PUT", "PATCH", "DELETE")


class NeedsConfirm(Workspace):
    def setUp(self):
        self.before = len([c for c in self.fz.calls if c["method"] in WRITES])

    def assertNoWrites(self, what):
        after = [c for c in self.fz.calls if c["method"] in WRITES][self.before:]
        harmless = [c for c in after if c["path"] in ("/tools/validate/post",)]
        self.assertEqual(len(after) - len(harmless), 0, f"{what} wrote to Zernio without confirm: {after}")

    def test_publish(self):
        d = self.post_folder("s1", CAPTION)
        self.bps("analyze", str(d), "--platforms", "instagram")
        self.bps("ready")
        self.bps("publish", ok=False)
        self.assertNoWrites("publish")

    def test_dm(self):
        self.bps("dm", ok=False)
        self.assertNoWrites("dm")

    def test_cancel(self):
        self.bps("cancel", "--post", "abc", ok=False)
        self.assertNoWrites("cancel")

    def test_reschedule(self):
        self.bps("reschedule", "--post", "abc", "--at", "2030-01-01T10:00:00+03:00", ok=False)
        self.assertNoWrites("reschedule")

    def test_trial(self):
        self.bps("trial", "set", "--post", "abc", ok=False)
        self.assertNoWrites("trial")

    def test_abtest_start(self):
        self.bps("abtest", "start", ok=False)
        self.assertNoWrites("abtest start")

    def test_recycle_on(self):
        self.bps("recycle", "on", "--post", "abc", "--every", "2", ok=False)
        self.assertNoWrites("recycle on")

    def test_batch_run(self):
        f = self.ws / "items.json"
        f.write_text(json.dumps([{"plan": "x", "at": "2030-01-01T10:00:00+03:00"}]))
        self.bps("batch", "run", "--file", str(f), ok=False)
        self.assertNoWrites("batch run")

    def test_icebreakers(self):
        f = self.ws / "ib.json"
        f.write_text(json.dumps([{"question": "Hi?", "payload": "hi"}]))
        self.bps("icebreakers", "set", str(f), ok=False)
        self.assertNoWrites("icebreakers")


class KeysStayPrivate(Workspace):
    def test_key_never_printed(self):
        key = self.env["ZERNIO_API_KEY"]
        for args in (("doctor",), ("version",), ("accounts",), ("jobs",)):
            out = self.bps(*args, ok=None)
            self.assertNotIn(key, json.dumps(out), f"{args} printed the API key")


if __name__ == "__main__":
    unittest.main()
