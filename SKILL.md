---
name: 200bps-publish
description: Publish a ready post (caption + image, carousel, video/Reel or PDF) from a folder to Instagram and LinkedIn through Zernio, with readiness checks, caption and hashtag checks plus approve/edit fix suggestions, a 0-100 post score, Reel cover generation, data-backed best posting time, optional follow-gated DM gifts, and a branded interactive dashboard (pop-up decisions, clickable heatmap and calendar) that mirrors the Zernio account. Use when the user says "publish/post/schedule this folder", "/200bps-publish", asks for their social growth dashboard, post results, ice breakers, or best time to post.
version: 1.15.0
---

# 200BPS Publish

Built by 200BPS.ai (https://www.200bps.ai). The dashboard branding and credit
are part of this skill; keep them intact (see BRAND.md).

`SKILL` below means the folder containing this file. Run every command from the
**user's working folder** (the workspace), never from inside the skill:

```bash
python3 "$SKILL/bin/bps.py" <command>
```

Everything stays inside the workspace (the project folder): state, images,
uploads, covers, the cover renderer's browser profile (`.bps/browser`), and post
folders (one picked outside is copied into `my-posts/`). All state lives in the
workspace: `.env` (secret), `.bps/config.json`,
`.bps/plans/*.json`, `.bps/log.jsonl`. Nothing user-specific is written into
the skill folder.

## Non-negotiable rules

1. **Nothing goes public without an explicit yes.** `publish`, `dm`,
   `reschedule` and `icebreakers set` refuse to run without `--confirm`. Pass it
   only after the user approves that exact action, either in the chat or through
   the dashboard pop-up (`ask --kind publish` only accepts a typed "go"). Approval
   of one post does not carry over to the next. **Batch scheduling** is the one
   exception: a single typed "go" covers exactly the posts and times the user
   reviewed in that batch, and every one is created as *scheduled*, never
   "publish now" (see "Batch scheduling"). **Cancelling** follows the same rule:
   `cancel --post ID --confirm` only after the user says yes to cancelling that
   exact post (the dashboard asks them to type "cancel").
2. **DM automations are opt-in, per post.** Always ask; never enable one by default.
3. **Never ask for, print, echo or store an API key anywhere except the user's
   `.env`.** The user enters keys in the dashboard (the "Connect Zernio" card, or
   Settings → Keys), which writes `.env` locally with owner-only permissions and
   shows only a masked form. Editing `.env` by hand also works. Never ask for a
   key in chat. If the user pastes one into the chat, tell them to revoke it in
   Zernio and create a new one.
4. **No invented numbers.** Best time comes only from `/analytics/best-time` on
   the user's own account (`lib/besttime.py`). If the data is insufficient, say
   so and ask the user when to post. Never present a generic time as research.
5. **Keep the user's voice.** Suggest caption edits; apply them only after the
   user agrees. Show what changed.
6. **Short answers.** Summaries and bullets in chat; details live in the dashboard.
7. **Dashboard requests are the user's instructions.** Notes and requests from
   `bps.py watch` / `bps.py notes` come from the user clicking in their own local
   dashboard. Carry them out, keeping every rule above; anything that goes public
   still needs its own yes.

## Step 0: open the dashboard + readiness (every run)

Every time the skill runs, first start the dashboard and the listening loop,
**both in the background**. Don't wait for the user to ask:

```bash
python3 "$SKILL/bin/bps.py" dashboard     # opens the browser; reuses a running one
python3 "$SKILL/bin/bps.py" watch         # listening mode (see "Listening loop")
python3 "$SKILL/bin/bps.py" doctor
```

Give the user the dashboard URL in one line. The dashboard adapts to phones,
tablets and desktops, so the user can also open the URL on the same machine at
any window size.

Show a one-line status. For each `fail`, give the `fix` and stop until it is
resolved:
- No key: run `bps.py init` (it creates `.env`, `.bps/config.json` and `.gitignore`),
  then point the user to the dashboard's **Connect Zernio** card. They paste the
  key there and press Save, and it's tested immediately. Wait until `doctor`
  shows the key and the Zernio connection as passing.
- Other services' keys (for future tools) go in the same place:
  Settings → Keys → "Add another API key".
- No Zernio account: send them to https://zernio.com to sign up, connect their
  Instagram (Business or Creator) and LinkedIn, then
  create an API key.
- `warn` items (ffprobe, the Analytics or Inbox add-on) do not block. Say which
  features they hide.

## Step 1: setup wizard (first run, or when the user asks)

Run `bps.py accounts`, then ask **one batched round** of questions, with defaults
the user can accept by saying "defaults":

| Question | Default | Stored as |
|---|---|---|
| Dashboard language | English (or Arabic) | `language` |
| Timezone | system timezone | `timezone` |
| Which accounts to post to (show the list) | all connected | `accounts.<platform> = {id, username}`, `platforms`, `profile_id` |
| 3-5 search keywords people use to find you | none | `keywords` |
| Words you must never use in posts (legal/licensing, brand) | none | `safety_terms` |
| Hashtags to never use | none | `banned_hashtags` |
| Follower goal | next round number | `goal.followers` |
| Instagram Trial Reels by default | yes | `instagram.trial_reels` |
| Location tag (a Facebook Page ID with a location) | none | `instagram.location_id`, `location_name` |
| LinkedIn: personal profile or company page | personal | `linkedin.organization_urn` (from `GET /accounts/{id}/linkedin-organizations`) |
| DM ice breakers (up to 4 buttons, 80 chars max) | skip | `ice_breakers` |

Connecting accounts: the user can connect Instagram or LinkedIn from the
dashboard (Settings → Accounts, or "+ Connect" in the Posts tab). It opens
Zernio's sign-in link; they approve on the network's own site, and the new
account is saved and enabled automatically. From chat, `bps.py connect linkedin`
prints the link to give them. Never ask for social-network passwords. Other
networks are listed as "coming soon" (`lib/accounts.py → CONNECTABLE`).

Accounts: `doctor` and `analyze` save the connected account automatically
when a platform has exactly one (say so: "Using @200bps.ai for Instagram").
Only ask the user to choose when there are several. Platforms without a
connected account are left out of posts, and `doctor` warns about them.

**Publish permission (ask once, during setup).** Claude Code may block
`publish --confirm` and `dm --confirm` as real-world actions, even after the
user typed "go". Run `bps.py allow-publish` to see the exact rules, and ask:
"May I run the publish and DM-gift commands myself after you approve a post?
This adds two exact allow rules to .claude/settings.json." Only on yes, run
`bps.py allow-publish --yes`. The commands still refuse to act without an
approved plan.

Write `.bps/config.json`. If the user wants ice breakers, show the final list
and ask "set these live?". Only on yes, write them to a JSON file
`[{"question","payload"}]` and run `bps.py icebreakers set <file> --confirm`.

Then start the dashboard in the background (Step 3) and give the URL.

## Step 2: publish a post folder

Folder conventions (tell the user if something is missing):
- `caption.txt` or `caption.md`: the main caption (required)
- `caption.<platform>.txt`: optional override, e.g. `caption.linkedin.txt`
- media files (jpg, png, webp, mp4, mov, pdf): posted in filename order
- `cover.jpg`: Reel cover, 1080x1920 (optional)

Sequence:

1. `bps.py doctor`, then `bps.py sync` (refreshes analytics and best time), then
   `bps.py analyze <folder>` (add `--platforms` if the user named some).
2. Make sure the dashboard is running (Step 3) and point the user to it.
3. **Tell the user what you found and what you will do**, in 5-8 bullets: post
   type, platforms, blocking problems, score per platform, top 3 tips, best time
   or "not enough data", and the settings you plan to apply.
4. **Caption fixes (approve / edit / reject).** For each failing or warning
   check, write an improved caption that fixes it and keeps the user's voice:
   - the hook in the first line, within `hook_chars`
   - one search keyword in the first line
   - a specific closing question
   - hashtags within the cap (Instagram 5, LinkedIn 5; ask which to keep if over)
   - removing restricted wording
   - a LinkedIn version, if they want one

   Save it to a file and run, **in the background**:
   `bps.py suggest --platform instagram[,linkedin] --file fix.txt --reason "..." --check <check id>`.
   `--check` links the suggestion to the dashboard's fix request, so repeated
   "Fix" clicks show this suggestion instead of creating new requests.
   The user sees a before/after with the score change in the dashboard pop-up.
   They can also answer in chat; relay that with `bps.py answer <id> approve|reject`,
   or with `bps.py answer <id> edit --edited "<their text>"`. On approve or edit,
   the command applies the text, backs up the old one (`caption_history`) and
   re-checks. `bps.py undo --platform P` restores the previous version.
5. **Reel cover** (video posts without `cover.jpg`). Ask how they want it:
   - **frame:** `bps.py cover frames` (use `--video FILE` for another video)
   - **their image:** give the file path
   - **Claude designs it:** `bps.py cover design --headline "<hook>" --kicker "..." [--bg frame:N|FILE]`.
     For a fully custom look, copy `templates/cover.html`, edit it, and pass `--html`.
   - **mix:** a design over a frame (`--bg frame:N`)

   Then ask with `bps.py ask --kind frames --question "Which cover?"`, run in
   the background. The pop-up shows the candidates. Apply with
   `bps.py cover use frame:N|design:N|FILE`. Keep the headline inside the
   grid-safe area; the built-in template does this.
6. **Settings.** Propose, then set each one with
   `bps.py set <platform>.<setting> "<value>"`. That records history (so it can
   be undone) and re-runs the checks. Never hand-edit the plan JSON for settings.
   - Instagram: `firstComment` (a question), `collaborators` (up to 3, only if the user names them)
   - Instagram Reels: `trial` on/off
   - LinkedIn: `documentTitle` for PDFs
7. **When.** If `bestTime.basis == "data"`, propose the top slot and run
   `bps.py schedule best` on agreement. Otherwise say plainly that there isn't
   enough history yet, and ask: now, or a specific time
   (`bps.py schedule now|<ISO time>`). The user may also pick a slot in the
   dashboard heatmap or calendar; that sets the plan's schedule directly.
8. **DM gift: always ask.** "Add a DM gift to this post?" Only if yes, collect
   and write to `dm`:
   - `keyword` (for example `skill`) and `matchMode` (`word` by default)
   - `message` (at most about 640 characters when a button is used) and an optional `link` + `buttonTitle` (20 characters or fewer)
   - `followGate`: must they follow first? (default yes). Optionally `followGateMessage` and `notFollowingMessage`
   - `minFollowerCount`, or any other criteria the user wants
   - `commentReply`: an optional public reply, for example "Sent! Check your DMs"

   Set `enabled: true` only after the yes.
9. `bps.py ready`, then ask for the final approval. The simplest path is the
   dashboard's **Publish** button (the Go step): the user types **go** and the
   dashboard itself uploads to Zernio, creates the post (and the approved DM
   gift), then reads the post back from Zernio and shows the verified status.
   No Claude Code permission is involved. A `published` request then arrives
   through `watch`: report it in 1-2 lines and **do not run publish again**
   (it would refuse anyway, since the plan is no longer awaiting approval).
   If the user prefers the chat, ask in both places at once:
   - Run `bps.py ask --kind publish --question "Publish?"` in the background.
     The pop-up only accepts a typed **go**.
   - Also ask **"Publish?"** in chat. If the user answers in chat, relay it with
     `bps.py answer <id> go`. The first answer wins.
10. **Only on go / yes:**
    - Run `bps.py publish --confirm`. It runs Zernio's validator first, then creates the post.
    - **If Claude Code blocks the command** (a permission or "real-world action"
      refusal): don't retry. Tell the user in one line to run it themselves by
      typing `! python3 <skill>/bin/bps.py publish --confirm` (and the same with
      `dm --confirm` for a gift). Offer `bps.py allow-publish --yes` for next
      time, and only run it on their yes.
    - If a DM gift was approved, run `bps.py dm --confirm`.
    - Report the result in 2-3 lines. Say that results can be checked in 48 hours ("report").

If publishing returns an error, show the error `code` and message. Don't retry
blindly: fix the cause, then ask again.

## Batch scheduling (several posts at once)

The dashboard's **Batch schedule** button (Plan tab, Posts tab, or Ctrl+K) opens
a three-step window: **Pick posts → Set times → Go**.

- **Pick posts:** every folder with a caption under the workspace, plus folders
  the user adds with **Browse…** (the computer's own folder picker) or the
  built-in **Folder browser**. A chosen folder can be one post or hold many.
  **Everything stays inside the workspace:** a folder picked outside it is copied
  into `my-posts/<name>` and the copy is used (the original is never referenced).
- **Set times:** each post gets the next slot. With data, the weekday's best hour
  (a peak above the account average, preferring medium/high confidence), else
  the best overall slot; or one fixed time. Rhythm: every day, every 2 days, or
  chosen weekdays. Days that already have a post are skipped by default. The
  user can drag to reorder or edit any time. Posts with blocking checks are
  listed separately with "Ask Claude to fix".
- **Go:** the user types go once. The server re-checks the whole list first (all
  or nothing), then creates each post in Zernio as scheduled, one by one, with
  live progress. A `batch_scheduled` request then arrives through `watch`.

From chat, the same flow:
```bash
python3 "$SKILL/bin/bps.py" batch scan                      # post folders
python3 "$SKILL/bin/bps.py" batch prepare FOLDER [FOLDER ...]  # checks + scores; current post unchanged
python3 "$SKILL/bin/bps.py" batch suggest --count N [--start YYYY-MM-DD] [--every 2 | --days 0,3,5] [--mode best|fixed] [--hour 20]
python3 "$SKILL/bin/bps.py" batch run --file items.json --confirm   # [{"plan": ID, "at": TIME}]
```
Show the user the full list (post, day, time, why that time) and run `batch run
--confirm` only after they say go to that exact list. If any time or post
changes afterwards, show the list again and ask again.

## Cancelling a post

From the dashboard: the post's details (Posts tab), the calendar day panel, the
Post tab banner, the batch results, or Ctrl+K → "Cancel a post". From chat:
```bash
python3 "$SKILL/bin/bps.py" cancel --post ZERNIO_POST_ID --confirm   # after the user's yes
python3 "$SKILL/bin/bps.py" cancel --draft PLAN_ID                    # a draft never uploaded
```
- Not published yet (scheduled, draft, failed, partial, publishing): deleted from
  Zernio, so it never goes out. The local draft is kept (status draft), so it can
  be scheduled again.
- Published: removed from networks that allow it (LinkedIn, Facebook, Threads,
  X and others). Instagram doesn't allow apps to delete posts: tell the user to
  delete it in the Instagram app and give the post link.
- A local draft is moved to `.bps/trash`; the user's post folder is never touched.
A `post_cancelled` request arrives through `watch`: confirm in one line.

## Step 3: dashboard

```bash
python3 "$SKILL/bin/bps.py" dashboard            # opens the browser
python3 "$SKILL/bin/bps.py" dashboard --no-open  # headless
```

Run it in the background. The URL is also saved in `.bps/server.json`. If a
server is already running, reuse it.

The dashboard binds to 127.0.0.1, is read-only, and never receives the API key.
It shows (bilingual, with 12h/24h and light/dark toggles):
- **Posts tab:** every post in the user's Zernio account (draft, scheduled,
  publishing, published, partial, failed), plus local drafts not uploaded yet.
  Each has per-platform status, links and error messages, with filters and a
  "Refresh from Zernio" button. `sync` also updates each local plan's status
  from Zernio. When the user asks "did it post?", run `bps.py sync` and answer
  from `.bps/cache.json → zposts`.
- a pop-up for every pending question, and a "Note to Claude" button
- readiness
- the current post: preview, caption per platform, checks, score, plan, best time
- growth: KPIs, followers, top posts, engagement heatmap, audience
- calendar
- inbox: comments waiting, DM automations, ice breakers
- idea bank
- streak, goal ring, "since last visit"

## Starting a new post

The **New post** card (Post tab, when no post is open), Ctrl+K → "New post", and
the "New post" button on any made image open one window with three ways in:
**Photos or video** (from the computer; uploaded to `.bps/uploads` then copied),
**My images** (made in Create an image; click in order for a carousel) and
**A post folder** (the computer's folder picker, or the built-in browser). The
items can be reordered; one photo = single, several = carousel, one video =
Reel. A new folder is made under `my-posts/<name>`. With a caption the post opens
at once; without one, Claude gets a `new_post` request to write it. The user's
own files are never moved or changed.

The dashboard's **New post** button (or `bps.py clear`) sets the current post
aside. Nothing is deleted: its plan stays in `.bps/plans/` and shows under
Posts → Not uploaded, with "Continue this post" to reopen it. Open questions
about it are cancelled. When a "Start a new post from the folder …" request
arrives, run the step 2 flow on that folder.

## Undo and history

Every change to a draft's caption, cover, time, gift, settings or platforms is
recorded in `plan.history`, whether it came from the dashboard, the chat or you.
The user can undo a journey step or revert any single change from the dashboard.
From chat, use these:
- `bps.py history`: list changes, newest first
- `bps.py revert --id ID`: put one change back
- `bps.py undo-step cover|time|gift|check`: undo the latest change for a step

Reverting only works before publishing. It also sends an "awaiting approval"
post back to draft, so the user confirms again.

## Best time: evidence and audience

`besttime` ranks slots by a shrunk average, so small samples can't win on luck.
Every slot carries:
- `posts` (n)
- `lift`, in % vs the account average
- `confidence`: high is 5+ posts, medium 3-4, low under 3

`byDay` gives each weekday's own top 2 slots. `summary.audience` turns follower
countries into UTC offsets (`lib/audience.py`) and flags a timezone mismatch.
When you recommend a time, always quote the evidence, for example:
"Wed 7 PM · +78% vs your average · 4 posts · medium confidence · 95% of your
audience shares your clock". Never recommend a low-confidence slot without
saying it's low confidence.

## Listening loop (while the dashboard is open)

The dashboard lets the user act without typing in chat, and every click becomes a
request. Keep one `bps.py watch` running in the background whenever the dashboard
is open; the pill then shows "Claude is listening". When `watch` exits, it
returns the unread requests. For each one:

| `action.type` | What to do |
|---|---|
| none (plain note) | Follow the instruction; reply in one line in chat **and** in the dashboard: `bps.py say --to <note id> --text "..."` |
| `reply` | The user answered one of your `say` messages (`claudeSaid` = what you asked). Act on it, then confirm with `say --to <id>` |
| `fix_request` | Write a fix for that check → `suggest` (step 2.4) |
| `plan_scheduled` | Already applied; just acknowledge and re-run `recheck` |
| `account_connected` | Say which account is now connected; it is already saved and enabled |
| `post_cancelled` | The user cancelled a post from the dashboard. Run `bps.py sync` and confirm in one line (for a published Instagram post, remind them to delete it in the app) |
| `batch_scheduled` | The user batch-scheduled from the dashboard. Run `bps.py sync`, then report in 2-3 lines: how many were scheduled, the first and last date, and any failures with their error. Never schedule them again |
| `published` | The user published from the dashboard. Confirm with `bps.py sync`, then report the status and links. Never publish again |
| gift switched in the dashboard | Already saved in `plan.dm`; the automation is created only after publishing (`dm --confirm`, with a yes) |
| `reschedule` | Confirm with the post and time, then `bps.py reschedule --post ID --at ISO --confirm` |
| `assign` | Run the step 2 flow on that folder with `schedule <at>` |
| `idea` | Draft caption + media plan for that idea and date; show it; nothing is published |
| `report` | `bps.py report --plan …` or summarise that post's analytics |
| `new_post` | The user started a post from the dashboard's **New post** window (files, made images, or a folder). If `opened`, the post is already the current plan: run the step 2 flow from point 3 (report findings, fixes, time, gift). If `needsCaption`, look at the media (and `hint`, the image prompts), write a caption in the user's voice, save it as `caption.txt` in `folder`, show it in chat, then `analyze` that folder and continue step 2 |
| `image_prompt` | The user pressed "Ask Claude to improve it" in the image window. Turn `action.text` (and any guide pictures in `action.refs`) into one clear, specific image prompt in their language, then `bps.py image prompt --prompt "…" --note "…"`. It appears in the window with a "Use this prompt" button. Don't generate the image yourself |

Then run `bps.py notes --mark-read` and start `watch` again.

**Talking back in the dashboard.** The user may not be looking at the terminal.
After handling a dashboard request, send a short reply they see as a pop-up (and
in the "Note to Claude" chat): `bps.py say --to <note id> --text "Done: …"`.
When you need a decision, add `--option "A" --option "B"` (buttons) or
`--expect` (free answer); the answer comes back through `watch` as a `reply`
request. Public actions still need their own typed "go".

**The status light.** Green "Claude is listening": `watch` is waiting. Pulsing
"Claude is working": Claude Code is open and busy (between two watches; any
`bps.py` command counts). Grey "Claude Code is closed": no sign of Claude Code
for 10 minutes; requests are saved and wait until the user opens Claude Code and
runs `/200bps-publish`.

## Background jobs meter

The top bar shows what is working in the background and how far along it is
(images, publishing, batch, uploads, key tests, Zernio refresh, and dashboard
requests you haven't marked read yet). `bps.py jobs` prints the same list.
Requests stay listed as "Claude: …" until `notes --mark-read`, so mark them
read once handled. New long-running code reports through `lib/jobs.py`
(`jobs.job(kind, label, total=, estimate=)` + `jobs.progress` / `jobs.here`).

## Create images (OpenAI gpt-image)

Needs `OPENAI_API_KEY` (Settings → Keys → OpenAI → Add key; it's tested on save
and lists the key's models). The dashboard's **Image** button (top bar, the
Preview card, or Ctrl+K → "Create an image") opens one window:
**1 Describe → 2 Guide pictures (optional) → 3 Options → Create.**

- Guide pictures: drop, paste or pick files, or choose from the current post or
  earlier images. With guides the request goes to `/v1/images/edits`, without to
  `/v1/images/generations`. Up to 10 guides, up to 4 images per run.
- Options use plain words: shape square / tall / wide, quality draft / standard /
  best, and the model (from the key's live list; ★ = default, set in Settings →
  Keys → OpenAI → Image model, or "Keep these as my defaults").
- Results land in `.bps/images/` (with `index.json`: prompt, model, settings,
  guides). Each image offers Add to post (current draft: copied into its folder
  and the media list refreshed, recorded in history), Save to folder, Use as
  guide, Again, Download, Delete (moved to `.bps/trash/images`).
- Creating an image costs the user OpenAI credit; it never publishes anything.

From chat:
```bash
python3 "$SKILL/bin/bps.py" image gen --prompt "..." [--ref FILE ...] [--shape square|tall|wide] [--quality draft|standard|best] [--n 1-4] [--model ID]
python3 "$SKILL/bin/bps.py" image models | list | set --model ID [--shape ..] [--quality ..]
python3 "$SKILL/bin/bps.py" image copy --id IMAGE_ID [--to FOLDER]
python3 "$SKILL/bin/bps.py" image prompt --prompt "<improved prompt>" --note "<one line why>"
```
Show generated images to the user by path; run `image gen` only when the user asked for an image.

## Step 4: results, ideas, weekly review

- `bps.py report`: pull the post's analytics into the log. Summarise reach,
  saves, shares and follows versus the account's recent average.
- **Idea bank** (`.bps/ideas.json`, shown in Growth → Idea bank). Keep it useful without being asked:
  - **When:** refill it to **5 fresh ideas** (status `new`) after every publish, after every
    `report`, and whenever an `ideas_request` arrives (it may carry a `topic`).
  - **Format:** `[{"title","why","format","basedOn","hook","outline":[…],"cta","hashtags":[…],"bestTime","basis","status"}]`.
  - **Basis:** set `basis: "results"` when the idea comes from the user's top posts in `summary`
    (ranked by follows, then saves + shares), and say which post inspired it in `basedOn`.
    With too little data, use their keywords and topics and set `basis: "topics"`; the
    dashboard labels those "not based on results yet". Never invent metrics.
  - **Status:** the dashboard marks ideas `drafted` or `posted` and can drop them. Keep those
    marks, and don't re-suggest dropped ideas.
- Weekly: the top 3 posts, what they share, and one thing to do more of.

## Reference

- `reference/platform-rules.md`: limits, where each comes from, and the verification date
- `reference/zernio-api.md`: the endpoints this skill uses
- `lib/checks.py → RULES`: the single place to update limits
