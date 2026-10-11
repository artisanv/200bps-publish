#!/usr/bin/env python3
"""200BPS Publish command line. The agent drives this; the user rarely types it.

    bps.py doctor [--offline]            readiness checks (JSON)
    bps.py init                          create .env / .bps/config.json from the examples
    bps.py accounts                      list connected Zernio accounts (for setup)
    bps.py sync                          refresh the Zernio mirror (analytics, best time...)
    bps.py jobs                          what is running in the background, with % done
    bps.py analyze <folder> [--platforms instagram,linkedin]
    bps.py recheck                       re-run checks + score on the current plan
    bps.py schedule best|now|<ISO time>  set when the current plan goes out
    bps.py ready                         mark the plan "awaiting_approval" (shows in dashboard)
    bps.py preview                       print the exact request body (no upload, no publish)
    bps.py publish --confirm             publish/schedule. Only after the user says yes in chat
    bps.py dm --confirm                  create the DM gift automation. Only after a yes
    bps.py icebreakers get | set <file.json> --confirm
    bps.py report [--plan ID]            post results (48h+ after publishing) into the log
    bps.py cover frames [--video FILE] [-n 6]      candidate frames from the Reel (or another video)
    bps.py cover use frame:N | design:N | FILE [--at SEC]   make it the 1080x1920 cover
    bps.py cover design --headline TEXT [--kicker TEXT] [--bg frame:N|FILE] [--html FILE]
    bps.py cover clear
    bps.py ask --question TEXT [--kind choice|text|frames|publish] [--option X ...] [--timeout S]
                                         dashboard pop-up; blocks until answered (run in background)
    bps.py suggest --platform instagram[,linkedin] --file NEW.txt --reason "..." [--reason ...]
                                         before/after caption fix; applies only on approve/edit (run in background)
    bps.py reschedule --post ID --at ISO [--confirm]   move a scheduled Zernio post (dashboard request)
    bps.py revert --id CHANGE_ID          put one recorded change back (before publishing)
    bps.py undo-step cover|time|gift|check  undo the latest change behind a journey step
    bps.py history                       list recorded changes on the current post
    bps.py undo --platform P             restore the caption before the last applied fix
    bps.py answer ID TEXT [--note TEXT]  record the user's chat answer (first answer wins)
    bps.py watch [--timeout S]           wait for dashboard notes/requests (run in background; restart after handling)
    bps.py notes [--mark-read]           notes the user typed in the dashboard
    bps.py allow-publish [--yes]         let Claude Code run publish/dm itself (adds 2 exact allow rules; ask the user first)
    bps.py connect PLATFORM              print the sign-in link to connect instagram or linkedin in Zernio
    bps.py clear                         start fresh: set the current post aside (nothing is deleted)
    bps.py set PLATFORM.SETTING VALUE    e.g. set instagram.firstComment "..." (history + undo + re-check)
    bps.py batch scan                    list post folders in the workspace (for batch scheduling)
    bps.py batch prepare FOLDER ...      analyse several folders (the current post is not changed)
    bps.py batch suggest --count N [--start YYYY-MM-DD] [--every D | --days 0,3,5] [--mode best|fixed] [--hour H]
    bps.py batch run --file ITEMS.json --confirm   schedule [{"plan","at"}] in Zernio. Only after the user says go
    bps.py cancel --post ID --confirm     cancel a scheduled post in Zernio (or unpublish where allowed). Only after the user says yes
    bps.py cancel --draft PLAN_ID        set a never-uploaded draft aside (.bps/trash; the folder is untouched)
    bps.py dashboard [--no-open] [--port N]
    bps.py version
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "lib"))

import accounts as acct  # noqa: E402
import cover as covers  # noqa: E402
import doctor  # noqa: E402
import hitl  # noqa: E402
import plan as plans  # noqa: E402
import store  # noqa: E402
import suggest  # noqa: E402
import summary  # noqa: E402
from zernio import Zernio, ZernioError  # noqa: E402


def emit(data) -> None:
    print(json.dumps(data, ensure_ascii=False, indent=2, default=str))


def need_plan() -> dict:
    p = plans.load()
    if not p:
        sys.exit("No current plan. Run: bps.py analyze <folder>")
    return p


def main() -> None:
    ap = argparse.ArgumentParser(prog="bps.py", description="200BPS Publish")
    sub = ap.add_subparsers(dest="cmd", required=True)
    d = sub.add_parser("doctor"); d.add_argument("--offline", action="store_true")
    sub.add_parser("init")
    sub.add_parser("accounts")
    sub.add_parser("sync")
    a = sub.add_parser("analyze"); a.add_argument("folder"); a.add_argument("--platforms")
    sub.add_parser("recheck")
    s = sub.add_parser("schedule"); s.add_argument("when")
    sub.add_parser("ready")
    sub.add_parser("preview")
    p = sub.add_parser("publish"); p.add_argument("--confirm", action="store_true")
    m = sub.add_parser("dm"); m.add_argument("--confirm", action="store_true")
    i = sub.add_parser("icebreakers"); i.add_argument("action", choices=["get", "set"]); i.add_argument("file", nargs="?"); i.add_argument("--confirm", action="store_true")
    r = sub.add_parser("report"); r.add_argument("--plan")
    cv = sub.add_parser("cover"); cv.add_argument("action", choices=["frames", "use", "design", "clear"]); cv.add_argument("target", nargs="?")
    cv.add_argument("--video"); cv.add_argument("-n", type=int, default=6); cv.add_argument("--at", type=float)
    cv.add_argument("--headline"); cv.add_argument("--kicker", default=""); cv.add_argument("--bg"); cv.add_argument("--html"); cv.add_argument("--handle")
    q = sub.add_parser("ask"); q.add_argument("--question", required=True); q.add_argument("--kind", default="choice", choices=list(hitl.KINDS))
    q.add_argument("--option", action="append", default=[]); q.add_argument("--no-text", action="store_true"); q.add_argument("--placeholder", default="")
    q.add_argument("--context", default=""); q.add_argument("--id"); q.add_argument("--timeout", type=int, default=900); q.add_argument("--no-wait", action="store_true")
    sg = sub.add_parser("suggest"); sg.add_argument("--platform", required=True); sg.add_argument("--file", required=True)
    sg.add_argument("--reason", action="append", default=[]); sg.add_argument("--timeout", type=int, default=900)
    sg.add_argument("--check", action="append", default=[], help="check id(s) this fixes (links dashboard fix requests)")
    rs = sub.add_parser("reschedule"); rs.add_argument("--post", required=True); rs.add_argument("--at", required=True); rs.add_argument("--confirm", action="store_true")
    rv = sub.add_parser("revert"); rv.add_argument("--id", required=True)
    us = sub.add_parser("undo-step"); us.add_argument("step", choices=["cover", "time", "gift", "check"])
    sub.add_parser("history")
    ud = sub.add_parser("undo"); ud.add_argument("--platform", required=True)
    an = sub.add_parser("answer"); an.add_argument("id"); an.add_argument("text"); an.add_argument("--note", default="")
    sy = sub.add_parser("say", help="message the user in the dashboard (pop-up they can answer)")
    sy.add_argument("--text", required=True); sy.add_argument("--to", default="", help="the note id this answers")
    sy.add_argument("--option", action="append", default=[]); sy.add_argument("--expect", action="store_true", help="needs an answer")
    sub.add_parser("thread")
    wt = sub.add_parser("watch"); wt.add_argument("--timeout", type=int, default=3600)
    nt = sub.add_parser("notes"); nt.add_argument("--mark-read", action="store_true"); nt.add_argument("--all", action="store_true")
    ap_ = sub.add_parser("allow-publish"); ap_.add_argument("--yes", action="store_true")
    cn = sub.add_parser("connect"); cn.add_argument("platform")
    sub.add_parser("clear")
    st_ = sub.add_parser("set"); st_.add_argument("path"); st_.add_argument("value")
    db = sub.add_parser("dashboard"); db.add_argument("--no-open", action="store_true"); db.add_argument("--port", type=int, default=4217)
    sub.add_parser("version")
    sub.add_parser("jobs")
    cx = sub.add_parser("cancel"); cx.add_argument("--post"); cx.add_argument("--draft"); cx.add_argument("--confirm", action="store_true")
    im = sub.add_parser("image"); im.add_argument("action", choices=["gen", "models", "list", "set", "copy", "prompt"])
    im.add_argument("--prompt", default=""); im.add_argument("--ref", action="append", default=[])
    im.add_argument("--model", default=""); im.add_argument("--shape", default="", choices=["", "square", "tall", "wide", "auto"])
    im.add_argument("--quality", default="", choices=["", "draft", "standard", "best"]); im.add_argument("--n", type=int, default=0)
    im.add_argument("--id", default=""); im.add_argument("--to", default=""); im.add_argument("--note", default="")
    bt_ = sub.add_parser("batch"); bt_.add_argument("action", choices=["scan", "prepare", "suggest", "run"]); bt_.add_argument("folders", nargs="*")
    bt_.add_argument("--count", type=int, default=0); bt_.add_argument("--start", default=""); bt_.add_argument("--every", type=int, default=1)
    bt_.add_argument("--days", default=""); bt_.add_argument("--mode", default="best", choices=["best", "fixed"]); bt_.add_argument("--hour", type=int, default=20)
    bt_.add_argument("--file"); bt_.add_argument("--confirm", action="store_true")
    args = ap.parse_args()

    try:
        run(args)
    except (ZernioError, PermissionError, ValueError, RuntimeError) as e:
        emit({"ok": False, "error": str(e)})
        sys.exit(1)


def run(args) -> None:
    c = args.cmd
    if c not in ("dashboard", "watch"):
        try:
            hitl.active()          # the dashboard shows "Claude is working" while commands run
        except Exception:
            pass
    if c == "version":
        print(store.VERSION)
    elif c == "doctor":
        emit(doctor.run(online=not args.offline))
    elif c == "init":
        ws, made = store.workspace(), []
        if not (ws / ".env").exists():
            shutil.copy(store.SKILL_DIR / ".env.example", ws / ".env"); made.append(".env")
        os.chmod(ws / ".env", 0o600)                     # owner-only, always
        cfg_p = store.state_dir() / "config.json"
        if not cfg_p.exists():
            shutil.copy(store.SKILL_DIR / "config.example.json", cfg_p); made.append(".bps/config.json")
        gi = ws / ".gitignore"
        lines = gi.read_text().splitlines() if gi.exists() else []
        add = [x for x in (".env", ".bps/") if x not in lines]
        if add:
            gi.write_text("\n".join(lines + add) + "\n"); made.append(".gitignore (+" + ", ".join(add) + ")")
        emit({"ok": True, "created": made, "next": "Open the dashboard and paste the Zernio API key in the 'Connect Zernio' card (Settings → Keys). Never paste it into the chat. Then ask the user whether Claude may run the publish command itself (bps.py allow-publish)."})
    elif c == "accounts":
        emit([{"id": x.get("_id"), "platform": x.get("platform"), "username": x.get("username"),
               "profileId": (x.get("profileId") or {}).get("_id") if isinstance(x.get("profileId"), dict) else x.get("profileId"),
               "followers": x.get("followersCount"), "active": x.get("isActive"),
               "needsReconnection": x.get("needsReconnection")} for x in Zernio().accounts()])
    elif c == "sync":
        s = summary.build(force=True)
        emit({"ok": s.get("ok"), "error": s.get("error"), "warnings": s.get("warnings"),
              "followers": (s.get("followers") or {}).get("current"), "posts": len(s.get("posts") or []),
              "besttime": {k: (s.get("besttime") or {}).get(k) for k in ("basis", "sample", "slots", "note", "next_at")}})
    elif c == "analyze":
        rec = acct.reconcile(acct.live(Zernio()) if Zernio().configured else None)
        pl = plans.analyze(args.folder, args.platforms.split(",") if args.platforms else None, connected=rec["connected"])
        out = _brief(pl)
        out["accounts"] = {"auto_selected": rec["auto"], "skipped_not_connected": pl.get("skipped_platforms", []), "notes": rec["notes"]}
        emit(out)
    elif c == "recheck":
        pl = need_plan(); plans.recheck(pl); plans.save(pl); emit(_brief(pl))
    elif c == "schedule":
        pl = need_plan()
        if args.when == "now":
            pl["schedule"] = {"mode": "now"}
        elif args.when == "best":
            bt = pl.get("bestTime") or {}
            if bt.get("basis") != "data" or not bt.get("next_at"):
                raise ValueError("No data-backed best time yet. Ask the user for a time, or use 'now'.")
            pl["schedule"] = {"mode": "best", "at": bt["next_at"]}
        else:
            from datetime import datetime
            datetime.fromisoformat(args.when)
            pl["schedule"] = {"mode": "at", "at": args.when}
        plans.recheck(pl); plans.save(pl); emit({"ok": True, "schedule": pl["schedule"]})
    elif c == "ready":
        pl = need_plan(); plans.recheck(pl)
        missing = [p for p in pl["platforms"] if not (store.config().get("accounts", {}).get(p) or {}).get("id")]
        if missing:
            rec = acct.reconcile(acct.live(Zernio()))
            missing = [p for p in pl["platforms"] if p not in rec["connected"]]
            if missing:
                raise ValueError("No connected account selected for: " + ", ".join(missing) + ". Run setup (accounts) or remove that platform.")
        if pl["blocking"]:
            raise ValueError("Fix blocking checks first: " + "; ".join(x["msg"] for x in pl["blocking"]))
        pl["status"] = "awaiting_approval"; plans.save(pl); emit({"ok": True, "status": pl["status"]})
    elif c == "preview":
        pl = need_plan(); emit(plans.build_body(pl, Zernio(), dry=True))
    elif c == "cancel":
        import cancel
        if args.draft:
            emit(cancel.delete_draft(args.draft, via="chat"))
        else:
            if not args.confirm:
                raise PermissionError("Cancelling a post needs the user's yes for that exact post (--confirm).")
            emit({"ok": True, **cancel.cancel_post(args.post or "", "cancel", via="chat")})
    elif c == "image":
        import images
        if args.action == "gen":
            emit({"ok": True, **images.generate(args.prompt, args.ref, args.model, args.shape, args.quality, args.n, via="chat")})
        elif args.action == "models":
            emit(images.models())
        elif args.action == "list":
            emit(list(reversed(images.gallery()))[:20])
        elif args.action == "set":
            emit(images.save_settings(model=args.model, shape=args.shape, quality=args.quality, n=args.n or None))
        elif args.action == "copy":
            emit(images.copy_to(args.id, args.to))
        else:                                   # answer an "Ask Claude for a prompt" request
            emit(images.suggest_prompt(args.prompt, args.note))
    elif c == "batch":
        import batch
        if args.action == "scan":
            emit(batch.scan())
        elif args.action == "prepare":
            emit(batch.prepare(args.folders))
        elif args.action == "suggest":
            emit(batch.suggest(args.count, args.start, args.every, [int(x) for x in args.days.split(",") if x.strip()], args.mode, args.hour))
        else:
            if not args.confirm:
                raise PermissionError("Batch scheduling needs the user's go for this exact list (--confirm).")
            if not args.file:
                raise ValueError("Pass --file with [{\"plan\": ID, \"at\": TIME}, ...].")
            emit(batch.run(json.loads(Path(args.file).read_text(encoding="utf-8")), "go", via="chat", wait=True))
    elif c == "publish":
        import jobs
        pl = need_plan()
        if args.confirm and pl.get("status") == "awaiting_approval":
            with jobs.job("publish", "Publishing your post", estimate=40, step="Checking with Zernio"):
                pl = plans.publish(pl, confirm=True)
        else:
            pl = plans.publish(pl, confirm=args.confirm)
        emit({"ok": True, "status": pl["status"], "result": pl["result"]})
    elif c == "jobs":
        import jobs
        emit(jobs.summary())
    elif c == "dm":
        pl = need_plan(); emit({"ok": True, "automation": plans.create_dm(pl, confirm=args.confirm)})
    elif c == "icebreakers":
        cfg = store.config(); ig = (cfg.get("accounts", {}).get("instagram") or {}).get("id")
        if not ig:
            raise ValueError("No Instagram account selected in setup.")
        if args.action == "get":
            emit(Zernio().ice_breakers(ig))
        else:
            if not args.confirm:
                raise PermissionError("Changing ice breakers needs the user's yes in chat (--confirm).")
            items = json.loads(Path(args.file).read_text(encoding="utf-8"))
            if not 1 <= len(items) <= 4 or any(len(x.get("question", "")) > 80 or not x.get("payload") for x in items):
                raise ValueError("Ice breakers: 1-4 items, each {question <= 80 chars, payload}.")
            emit(Zernio().set_ice_breakers(ig, items))
    elif c == "report":
        pl = plans.load(args.plan) if args.plan else need_plan()
        pid = (pl.get("result") or {}).get("postId")
        if not pid:
            raise ValueError("This plan was not published yet.")
        z = Zernio()
        res = {"post": z.post(pid), "analytics": z.analytics(postId=pid)}
        pl["report"] = res; plans.save(pl)
        store.append_log({"event": "report", "plan": pl["id"], "postId": pid, "analytics": res["analytics"]})
        emit(res)
    elif c == "cover":
        run_cover(args)
    elif c == "ask":
        opts = args.option
        if args.kind == "frames" and not opts:
            pl = need_plan()
            opts = [f"frame:{x['n']}" for x in pl.get("coverCandidates", []) if x.get("kind") == "frame"] + \
                   [f"design:{x['n']}" for x in pl.get("coverCandidates", []) if x.get("kind") == "design"]
        qq = hitl.create(args.question, args.kind, opts, not args.no_text, args.placeholder, qid=args.id, context=args.context)
        if args.no_wait:
            emit(qq); return
        print(json.dumps({"asked": qq["id"]}), flush=True)
        emit(hitl.wait(qq["id"], timeout=args.timeout))
    elif c == "say":
        emit({"ok": True, "message": hitl.say(args.text, args.to, args.option, args.expect),
              "next": "The user sees it in the dashboard; an answer arrives through watch as a 'reply' request."})
    elif c == "thread":
        emit(hitl.thread())
    elif c == "answer":
        emit(hitl.answer(args.id, args.text, args.note, via="chat", edited=args.edited))
    elif c == "suggest":
        text = Path(args.file).read_text(encoding="utf-8").strip()
        res = suggest.propose([p.strip() for p in args.platform.split(",") if p.strip()], text, args.reason, args.check)
        print(json.dumps({"asked": res["question"], "rows": [{k: r[k] for k in ("platform", "scoreBefore", "scoreAfter", "fixed", "newIssues")} for r in res["suggestion"]["rows"]]}, ensure_ascii=False), flush=True)
        q = hitl.wait(res["question"], timeout=args.timeout)
        emit(suggest.resolve(res["suggestion"]["id"], q))
    elif c == "reschedule":
        from datetime import datetime
        datetime.fromisoformat(args.at)
        if not args.confirm:
            raise PermissionError("Rescheduling a live post needs --confirm (the user asked for it in the dashboard or chat).")
        res = Zernio().update_post(args.post, {"scheduledFor": args.at, "timezone": store.config().get("timezone", "UTC")})
        store.append_log({"event": "reschedule", "postId": args.post, "at": args.at})
        summary.build(force=True)
        emit({"ok": True, "post": (res.get("post") or res).get("scheduledFor")})
    elif c == "revert":
        pl = plans.revert(need_plan(), args.id, via="chat"); emit({"ok": True, "status": pl["status"]})
    elif c == "undo-step":
        pl = plans.undo_step(need_plan(), args.step, via="chat"); emit({"ok": True, "status": pl["status"]})
    elif c == "history":
        emit([{k: h[k] for k in ("id", "ts", "title", "from", "to", "via")} for h in reversed(need_plan().get("history", []))])
    elif c == "undo":
        emit(suggest.undo(args.platform))
    elif c == "watch":
        items = hitl.watch(timeout=args.timeout)
        emit({"requests": items, "next": "Handle each, run 'notes --mark-read', then start 'watch' again."} if items else {"requests": [], "timeout": True})
    elif c == "notes":
        emit(hitl.notes(unread_only=not args.all, mark_read=args.mark_read))
    elif c == "connect":
        plat = args.platform.lower()
        if plat not in acct.CONNECTABLE:
            raise ValueError(f"Connectable now: {', '.join(acct.CONNECTABLE)} (coming soon: {', '.join(acct.COMING_SOON)}).")
        z = Zernio(); pid = acct.profile_id(z)
        if not pid:
            raise ValueError("No Zernio profile found.")
        r = z.connect_url(plat, pid)
        emit({"ok": True, "platform": plat, "authUrl": r.get("authUrl"),
              "next": "Give the user this link; they approve on the network's site. Then run doctor (the account is saved automatically)."})
    elif c == "clear":
        kept = plans.clear_current()
        emit({"ok": True, "kept": kept, "note": "Nothing deleted; the post is under Posts → Not uploaded and can be continued."})
    elif c == "allow-publish":
        emit(allow_publish(args.yes))
    elif c == "set":
        pl = plans.set_setting(need_plan(), args.path, args.value, via="chat")
        emit({"ok": True, "settings": pl["settings"], "score": {k: v["value"] for k, v in pl["score"].items()}})
    elif c == "dashboard":
        import server
        server.serve(port=args.port, open_browser=not args.no_open)


def allow_publish(yes: bool) -> dict:
    """Add exact allow rules so Claude Code can run the two approval-gated
    commands itself. The commands still refuse to act unless the plan is
    awaiting approval (publish) or a gift was approved (dm)."""
    ws = store.workspace()
    try:
        rel = str(store.SKILL_DIR.relative_to(ws))
    except ValueError:
        rel = None
    cmds = []
    for base in filter(None, [rel, str(store.SKILL_DIR)]):
        for sub_ in ("publish --confirm", "dm --confirm"):
            cmds.append(f"Bash(python3 {base}/bin/bps.py {sub_})")
    path = ws / ".claude" / "settings.json"
    if not yes:
        return {"ok": False, "needs_user_ok": True, "file": str(path), "would_add": cmds,
                "ask": "May Claude run the publish and DM-gift commands itself after you approve a post (type go)? This adds these exact allow rules."}
    data = store.read_json(path, {}) or {}
    allow = data.setdefault("permissions", {}).setdefault("allow", [])
    added = [c for c in cmds if c not in allow]
    allow.extend(added)
    store.write_json(path, data)
    return {"ok": True, "file": str(path), "added": added, "note": "Restart Claude Code (or /permissions) if a publish is still blocked."}


def _source(pl: dict, ref: str) -> tuple:
    """Resolve 'frame:N', 'design:N' or a file path to (path, at)."""
    if ref and ":" in ref and ref.split(":")[0] in ("frame", "design"):
        k, n = ref.split(":", 1)
        hit = next((x for x in pl.get("coverCandidates", []) if x.get("kind") == k and str(x.get("n")) == n), None)
        if not hit:
            raise ValueError(f"No {k} {n}. Run 'cover frames' or 'cover design' first.")
        return Path(hit["path"]), None
    p = Path(ref).expanduser()
    if not p.is_absolute():
        p = (store.workspace() / p) if (store.workspace() / p).exists() else Path(pl["folder"]) / p
    if not p.exists():
        raise ValueError(f"File not found: {ref}")
    return p, None


def run_cover(args) -> None:
    pl = need_plan()
    cands = [x for x in pl.get("coverCandidates", [])]
    if args.action == "frames":
        vid = Path(args.video).expanduser() if args.video else next((Path(m["path"]) for m in pl["media"] if m["kind"] == "video"), None)
        if not vid or not vid.exists():
            raise ValueError("No video in this post. Pass --video FILE to take frames from another video.")
        got = covers.frames(vid, pl["id"], args.n)
        cands = [x for x in cands if x.get("kind") != "frame"] + [{**g, "kind": "frame"} for g in got]
        pl["coverCandidates"] = cands; plans.save(pl)
        emit({"ok": True, "frames": got, "next": "Ask the user to pick one (bps.py ask --kind frames ...), then: cover use frame:N"})
    elif args.action == "design":
        if not args.headline and not args.html:
            raise ValueError("Give --headline (or --html for a custom design).")
        bg = _source(pl, args.bg)[0] if args.bg else None
        got = covers.design(pl["id"], args.headline or "", args.kicker, bg, args.handle, Path(args.html) if args.html else None)
        cands.append({**got, "kind": "design", "headline": args.headline})
        pl["coverCandidates"] = cands; plans.save(pl)
        emit({"ok": True, "design": got})
    elif args.action == "use":
        if not args.target:
            raise ValueError("Say which: frame:N, design:N or a file path.")
        src, _ = _source(pl, args.target)
        out = covers.cover_dir(pl["id"]) / f"cover_{covers.stamp()}.jpg"
        covers.fit(src, out, at=args.at)
        import media as _m
        pl["cover"] = {**_m.inspect(out), "source": args.target}
        pl.get("uploads", {}).pop(pl["cover"]["path"], None)
        plans.recheck(pl); plans.save(pl)
        emit({"ok": True, "cover": pl["cover"]})
    elif args.action == "clear":
        pl["cover"] = None; plans.recheck(pl); plans.save(pl); emit({"ok": True})


def _brief(pl: dict) -> dict:
    return {
        "id": pl["id"], "type": pl["type"], "platforms": pl["platforms"], "status": pl["status"],
        "media": [{k: m.get(k) for k in ("file", "kind", "width", "height", "duration", "verified")} for m in pl["media"]],
        "cover": pl["cover"] and pl["cover"]["file"], "ignored": pl["ignored"],
        "score": {k: {"value": v["value"], "tips": v["tips"]} for k, v in pl["score"].items()},
        "checks": [c for c in pl["checks"] if c["status"] != "pass"],
        "bestTime": pl.get("bestTime"),
        "plan_file": str(plans.plan_path(pl["id"])),
    }


if __name__ == "__main__":
    main()
