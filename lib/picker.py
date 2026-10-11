"""Open the computer's own folder picker and print the chosen folders as JSON.

Run as a separate process by the dashboard server (it blocks until the user
closes the window). Tries, in order: macOS (osascript), Windows (PowerShell),
Linux zenity / kdialog / yad, then the desktop portal (xdg-desktop-portal,
used by GNOME, KDE, Hyprland and others). Prints {"ok": true, "folders": [...]}
or {"ok": false, "error": "..."}; {"ok": true, "folders": []} means cancelled.
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import uuid
from urllib.parse import unquote, urlparse

TITLE = "Choose post folders"


def _run(cmd: list[str]) -> list[str] | None:
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode not in (0, 1):
        raise RuntimeError((r.stderr or "picker failed").strip()[:300])
    return [x for x in r.stdout.strip().splitlines() if x.strip()] if r.returncode == 0 else []


def _mac(start: str) -> list[str] | None:
    if sys.platform != "darwin":
        return None
    script = (f'set fs to choose folder with prompt "{TITLE}" default location (POSIX file "{start}") with multiple selections allowed\n'
              'set out to ""\nrepeat with f in fs\nset out to out & POSIX path of f & linefeed\nend repeat\nreturn out')
    return _run(["osascript", "-e", script])


def _windows(start: str) -> list[str] | None:
    if os.name != "nt":
        return None
    ps = ("Add-Type -AssemblyName System.Windows.Forms; $d = New-Object System.Windows.Forms.FolderBrowserDialog; "
          f"$d.Description = '{TITLE}'; $d.SelectedPath = '{start}'; "
          "if ($d.ShowDialog() -eq 'OK') { $d.SelectedPath }")
    return _run(["powershell", "-NoProfile", "-STA", "-Command", ps])


def _linux_tools(start: str) -> list[str] | None:
    if shutil.which("zenity"):
        out = _run(["zenity", "--file-selection", "--directory", "--multiple", "--separator=\n", f"--title={TITLE}", f"--filename={start}/"])
    elif shutil.which("kdialog"):
        out = _run(["kdialog", "--getexistingdirectory", start, "--title", TITLE])
    elif shutil.which("yad"):
        out = _run(["yad", "--file", "--directory", "--multiple", "--separator=\n", f"--title={TITLE}", f"--filename={start}/"])
    else:
        return None
    return out


def _portal(start: str) -> list[str] | None:
    try:
        from gi.repository import Gio, GLib
    except Exception:
        return None
    try:
        bus = Gio.bus_get_sync(Gio.BusType.SESSION, None)
    except Exception:
        return None
    token = "bps" + uuid.uuid4().hex[:10]
    sender = bus.get_unique_name()[1:].replace(".", "_")
    handle = f"/org/freedesktop/portal/desktop/request/{sender}/{token}"
    loop, result = GLib.MainLoop(), {}

    def on_response(_c, _s, _p, _i, _sig, params):
        code, res = params.unpack()
        result["code"], result["uris"] = code, res.get("uris", [])
        loop.quit()

    bus.signal_subscribe("org.freedesktop.portal.Desktop", "org.freedesktop.portal.Request", "Response", handle,
                         None, Gio.DBusSignalFlags.NO_MATCH_RULE, on_response)
    opts = {"handle_token": GLib.Variant("s", token), "directory": GLib.Variant("b", True),
            "multiple": GLib.Variant("b", True), "modal": GLib.Variant("b", True),
            "current_folder": GLib.Variant("ay", start.encode() + b"\0")}
    try:
        bus.call_sync("org.freedesktop.portal.Desktop", "/org/freedesktop/portal/desktop",
                      "org.freedesktop.portal.FileChooser", "OpenFile",
                      GLib.Variant("(ssa{sv})", ("", TITLE, opts)), None, Gio.DBusCallFlags.NONE, -1, None)
    except Exception:
        return None                       # no FileChooser portal on this desktop
    GLib.timeout_add_seconds(900, loop.quit)
    loop.run()
    if result.get("code") != 0:
        return []                         # cancelled
    return [unquote(urlparse(u).path) for u in result.get("uris", []) if u.startswith("file://")]


def main() -> None:
    start = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
    for f in (_mac, _windows, _linux_tools, _portal):
        try:
            got = f(start)
        except Exception as e:
            print(json.dumps({"ok": False, "error": str(e)}))
            return
        if got is not None:
            print(json.dumps({"ok": True, "folders": [g.rstrip("/") or "/" for g in got]}))
            return
    print(json.dumps({"ok": False, "error": "no-native-picker"}))


if __name__ == "__main__":
    main()
