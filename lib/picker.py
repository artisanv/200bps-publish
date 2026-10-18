"""Open the computer's own file manager dialog and print the choice as JSON.

    picker.py START                          choose post folders (several)
    picker.py START --folder "Title"         choose one folder
    picker.py START --save NAME "Title"      "Save as": choose where and the name

Run as a separate process by the dashboard server (it blocks until the user
closes the window). Tries, in order: macOS (osascript), Windows (PowerShell),
Linux zenity / kdialog / yad, then the desktop portal (xdg-desktop-portal,
used by GNOME, KDE, Hyprland and others). Prints {"ok": true, "folders": [...]}
(--save: {"ok": true, "files": [path]}) or {"ok": false, "error": "..."};
an empty list means cancelled.
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
MODE = "folders"                          # folders | folder | save
NAME = ""                                 # suggested file name for "save"


def _run(cmd: list[str]) -> list[str] | None:
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode not in (0, 1):
        raise RuntimeError((r.stderr or "picker failed").strip()[:300])
    return [x for x in r.stdout.strip().splitlines() if x.strip()] if r.returncode == 0 else []


def _mac(start: str) -> list[str] | None:
    if sys.platform != "darwin":
        return None
    if MODE == "save":
        return _run(["osascript", "-e", f'return POSIX path of (choose file name with prompt "{TITLE}" default name "{NAME}" '
                                        f'default location (POSIX file "{start}"))'])
    if MODE == "folder":
        return _run(["osascript", "-e", f'return POSIX path of (choose folder with prompt "{TITLE}" default location (POSIX file "{start}"))'])
    script = (f'set fs to choose folder with prompt "{TITLE}" default location (POSIX file "{start}") with multiple selections allowed\n'
              'set out to ""\nrepeat with f in fs\nset out to out & POSIX path of f & linefeed\nend repeat\nreturn out')
    return _run(["osascript", "-e", script])


def _windows(start: str) -> list[str] | None:
    if os.name != "nt":
        return None
    if MODE == "save":
        ps = ("Add-Type -AssemblyName System.Windows.Forms; $d = New-Object System.Windows.Forms.SaveFileDialog; "
              f"$d.Title = '{TITLE}'; $d.InitialDirectory = '{start}'; $d.FileName = '{NAME}'; "
              "if ($d.ShowDialog() -eq 'OK') { $d.FileName }")
        return _run(["powershell", "-NoProfile", "-STA", "-Command", ps])
    ps = ("Add-Type -AssemblyName System.Windows.Forms; $d = New-Object System.Windows.Forms.FolderBrowserDialog; "
          f"$d.Description = '{TITLE}'; $d.SelectedPath = '{start}'; "
          "if ($d.ShowDialog() -eq 'OK') { $d.SelectedPath }")
    return _run(["powershell", "-NoProfile", "-STA", "-Command", ps])


def _linux_tools(start: str) -> list[str] | None:
    if MODE != "folders":
        save = MODE == "save"
        if shutil.which("zenity"):
            return _run(["zenity", "--file-selection", f"--title={TITLE}"]
                        + (["--save", "--confirm-overwrite", f"--filename={start}/{NAME}"] if save else ["--directory", f"--filename={start}/"]))
        if shutil.which("kdialog"):
            return _run(["kdialog", "--getsavefilename", f"{start}/{NAME}", "--title", TITLE] if save
                        else ["kdialog", "--getexistingdirectory", start, "--title", TITLE])
        if shutil.which("yad"):
            return _run(["yad", "--file", f"--title={TITLE}"]
                        + (["--save", "--confirm-overwrite", f"--filename={start}/{NAME}"] if save else ["--directory", f"--filename={start}/"]))
        return None
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
    opts = {"handle_token": GLib.Variant("s", token), "modal": GLib.Variant("b", True),
            "current_folder": GLib.Variant("ay", start.encode() + b"\0")}
    if MODE == "save":
        opts["current_name"] = GLib.Variant("s", NAME)
    else:
        opts["directory"] = GLib.Variant("b", True)
        opts["multiple"] = GLib.Variant("b", MODE == "folders")
    try:
        bus.call_sync("org.freedesktop.portal.Desktop", "/org/freedesktop/portal/desktop",
                      "org.freedesktop.portal.FileChooser", "SaveFile" if MODE == "save" else "OpenFile",
                      GLib.Variant("(ssa{sv})", ("", TITLE, opts)), None, Gio.DBusCallFlags.NONE, -1, None)
    except Exception:
        return None                       # no FileChooser portal on this desktop
    GLib.timeout_add_seconds(900, loop.quit)
    loop.run()
    if result.get("code") != 0:
        return []                         # cancelled
    return [unquote(urlparse(u).path) for u in result.get("uris", []) if u.startswith("file://")]


def main() -> None:
    global MODE, NAME, TITLE
    args = sys.argv[1:]
    start = args[0] if args else os.getcwd()
    if "--save" in args[1:]:
        i = args.index("--save")
        MODE, NAME = "save", args[i + 1]
        TITLE = args[i + 2] if len(args) > i + 2 else "Save as"
    elif "--folder" in args[1:]:
        i = args.index("--folder")
        MODE, TITLE = "folder", (args[i + 1] if len(args) > i + 1 else "Choose a folder")
    for f in (_mac, _windows, _linux_tools, _portal):
        try:
            got = f(start)
        except Exception as e:
            print(json.dumps({"ok": False, "error": str(e)}))
            return
        if got is not None:
            key = "files" if MODE == "save" else "folders"
            print(json.dumps({"ok": True, key: [g.rstrip("/") or "/" for g in got]}))
            return
    print(json.dumps({"ok": False, "error": "no-native-picker"}))


if __name__ == "__main__":
    main()
