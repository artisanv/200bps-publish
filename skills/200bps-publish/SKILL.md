---
name: 200bps-publish
description: Publish a ready post (caption + image, carousel, video/Reel or PDF) from a folder to Instagram, LinkedIn, Facebook, TikTok and Snapchat through Zernio, with readiness checks, caption and hashtag checks plus approve/edit fix suggestions, a 0-100 post score, Reel cover generation, data-backed best posting time, optional follow-gated DM gifts, and a branded interactive dashboard (pop-up decisions, clickable heatmap and calendar) that mirrors the Zernio account. Use when the user says "publish/post/schedule this folder", "/200bps-publish", asks for their social growth dashboard, post results, ice breakers, or best time to post.
version: 1.20.0
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

## PIX: the face of this skill in the dashboard

In the dashboard the user talks to **PIX**, the 200BPS.AI screen mascot, not to
"Claude". Every `bps.py say` text, note result and question you send is written as
PIX: first person, short, warm, the user's language. Read `reference/pix.md` (voice,
rules) once per session. PIX knows every feature: answer "how do I / where is"
questions from `reference/features.md` (generated from the dashboard Guide; rerun
`python3 tools/gen_features.py` after changing the Guide). A plain note is a chat
with PIX: do what it asks with the commands below, keeping every rule (public
actions still need the user's own yes / typed go).

## Self-test and updates

- `bps.py selftest [--quick]` runs the offline self-tests: the real CLI, server and page against a fake Zernio in a
  throwaway folder. It never touches the user's workspace, keys or Zernio account. Run it after changing this
  plugin and before a release, and report the result in one line.
- A running dashboard restarts itself when the plugin's Python code changes, once nothing is in progress, on the
  same address; open pages reload. No manual restart after an update.

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
| Instagram Trial Reels by default (and after the trial: automatic or manual) | no (automatic) | `instagram.trial_reels`, `instagram.trial_graduation` |
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

A post can also be an **archive** (.zip, .7z, .rar, .tar.gz…): `bps.py analyze post.zip` unpacks it safely into
`my-posts/<name>/` (`lib/archive.py`) and analyzes the post inside; an archive with several post folders returns
their paths for `batch prepare` (which also accepts archives). A folder with a **PDF and photos/video** is split:
LinkedIn gets the PDF (document post), every other network gets the photos/video (`plan.media_for`, Zernio `customMedia`).
PDFs never go to Instagram, Facebook, TikTok or Snapchat; a PDF-only post skips them with the reason.

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
   - Instagram Reels: `trial` on/off (Trial Reel: non-followers first; only at creation) and `graduation`
     `SS_PERFORMANCE` (automatic: shared to followers if it does well) or `MANUAL` (the user shares it in the app).
     The dashboard has the same switch in Network settings → Instagram; the default for new Reels is in
     Settings → Preferences (off unless the user turns it on). Ask before turning it on: a trial hides the Reel from followers.
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

## LinkedIn polls, reposts and text posts

A post folder with only a caption (no media) is a **text post**: LinkedIn and Facebook take it; the
others are skipped. The New post window allows it (write the caption, add no media). On LinkedIn
the post type can be (`bps.py set linkedin.kind post|poll|repost`, or Network settings → LinkedIn):
- **poll**: `bps.py set linkedin.poll '{"question":"…","options":["A","B"],"duration":"SEVEN_DAYS"}'`
  (question ≤140, 2-4 choices ≤30 each, ONE_DAY / THREE_DAYS / SEVEN_DAYS / FOURTEEN_DAYS)
- **repost**: `bps.py set linkedin.reshareUrl "https://www.linkedin.com/posts/…"`; the caption is the commentary.
Both go out as Zernio `platformSpecificData.poll` / `reshareUrl` and can't carry media (a blocking check says so).
After scheduling, the poll shows in the post window (Posts/Plan) from the local plan (Zernio does not echo it); vote counts are not available through the API, only on LinkedIn.
Native LinkedIn articles are not possible: neither Zernio nor LinkedIn's API offers them.

## One post, every network (caption per network)

For a post with 2+ networks the user can press "✨ Fit it for every network". A `rewrite_all` request arrives
with `action.caption`, `current` (per network) and `rules` per network (`max` length, `hashtags` cap, `hook`
characters before "more", a `tip`). Write one version per network: same message, the user's voice and
language, fitted to that network (hook placement, tone, length, hashtag limits; a Snapchat saved-story title
≤45). Save a JSON object `{"instagram": "...", "linkedin": "..."}` and run
`bps.py rewrite --file v.json --note "<one line what changed>"`. The user reviews each with its score change
and uses all, some (editing any) or none; applied captions are backed up in caption_history.

## The DM gift is Instagram only (captions per network)

The gift works on Instagram only: the person **follows first**, then **comments the keyword**, and the link comes
**by DM**; the follow is checked **inside the DM** (follow-first message + button, then Zernio verifies). Other networks
have no DM gift. So when the gift is on (`rewrite.gift_info`):
- **Instagram caption:** must end with that call to action ("Follow us, then comment 'WORD' and the link comes in your
  DM"). Checks: `gift.cta_missing` (keyword missing), `gift.follow_hint` (follow-first not said), `gift.ok`.
- **LinkedIn, Facebook, Threads:** must **not** ask for the keyword or promise a DM (comment-bait lines lose reach;
  `gift.not_here`). Give the gift **directly**: the link typed at the end of the caption, after the value, then a
  "Follow me for more like this" line and a real question (`gift.link_missing` if the link is absent). Plain URL in the
  text, no link preview card. Why: on personal LinkedIn profiles large 2025-26 studies find little reach cost for a typed
  link, a first-comment link costs about the same and gets fewer clicks, and "comment WORD" posts got about half the reach.
- **TikTok, Snapchat** (links not clickable): "the link is in my bio" and invite a follow.
- Rewrites and per-network fixes get these rules in `rules[p].tip` and `gift`; follow them in every version.

## Hook A/B test (Instagram Trial Reels)

For an Instagram Reel that isn't scheduled yet: version A is the post, version B gets a different first
line (and optionally another cover from `coverCandidates`). `bps.py abtest start --confirm` (only after the
user's go; the dashboard asks for a typed go itself) creates **two Instagram-only Trial Reels** at the same
time (`trialParams.graduationStrategy = MANUAL`), so only non-followers see them. The post's other networks
are not posted by the test. Results: `bps.py abtest results --test ID` reads each post's analytics
(`GET /analytics?postId=`): a winner only with ≥100 views each and ≥48 h; skip rate decides first (≥5 points),
then average watch time (≥10%); otherwise "too close to call". Never invent a winner. The user shares the
winner to followers in the Instagram app (no API).
- When an `ab_hook` request arrives: write hook B (the full caption with a different first line: a new angle,
  not a rewording; the user's voice and language), save it to a file and run
  `bps.py abtest hook --file b.txt --note "<one line why>"`. It appears in the Hook test window.

## Trial Reels for waiting Reels (Instagram)

Posts → 🧪 Trial Reels (also Ctrl+K, a post's window, Plan right-click, the networks window) lists every Instagram
Reel not published yet (opened from one Reel it shows only that Reel, with "Show all") (Zernio scheduled/draft/failed/partial, plus local drafts), with what the user's own results say
(`bps.py trial advice`: trial vs normal Reels, average views with n and confidence; a verdict only with 3+ of each) and
what Instagram's Help Center says (`trial.FACTS`). Warnings: same first line as a Reel already live (Instagram limits
trials of content shared before), duplicates among waiting posts, goes out in under 30 minutes.
- Changing a Zernio post is public: the dashboard asks for the typed word **edit**; it updates only the Instagram entry's
  `platformSpecificData.trialParams` (everything else kept) and reads it back. From chat:
  `bps.py trial set --post ID [--off] [--graduation SS_PERFORMANCE|MANUAL] --confirm`, only after the user's yes for that post.
- **3-day reminder:** no app can share a live Trial Reel with followers (Instagram allows only the comment setting to change after publishing). `bps.py trial due` lists live Trial Reels 72 h+ old (last 30 days) not answered yet; the dashboard shows them in a card at the top. `bps.py trial done --post ID --as shared|keep` records the user's answer. Never claim a Reel was shared unless the user says so. Settings → Preferences turns it off (`instagram.trial_remind`).
- When a `trial_advice` request arrives (the user pressed ✨ Ask PIX): look at `action.items` (first line, time, trial,
  warnings) and `action.stats`; recommend which Reels to try as trials and Automatic or Manual, each with its reason from
  the data (quote n and confidence; never invent numbers), in one short `say --to <id> --status done` (bullets in the
  user's language). Offer to apply with `--option "Yes, apply" --option "Not now"`; only on yes run `trial set ... --confirm`.

## Recycle best posts

Zernio's own `recycling`: a **published** post is re-posted every N weeks/months, rotating new caption
versions (`contentVariations`, 2-20, round-robin). Candidates come only from the user's results
(follows, then saves + shares, then reach; `bps.py recycle list`). Max 10 recycling per account;
TikTok/YouTube are never recycled. Dashboard: Growth → Top posts → ♻ (or Ctrl+K "Recycle").
- When a `recycle_hooks` request arrives: write 3-5 versions of that post (same message, a fresh first
  line, the user's voice and language, within the networks' caption limits), save them as a JSON list
  and run `bps.py recycle hooks --post ID --file f.json --note "<one line why>"`. They appear in the
  Recycle window. Then `say --to <note> --status done`.
- Starting is public: `bps.py recycle on --post ID --every N --unit week|month [--times K] [--start DATE] [--file f.json] --confirm`
  only after the user's go for that exact post and rhythm (the dashboard asks for a typed go itself).
  `bps.py recycle off --post ID` stops it; reposts already made stay.

## Accounts per post

When a network has several connected accounts in Zernio, the Post tab shows **Post to these accounts**: the user ticks
each account the post goes to (`/api/plan op=targets`, stored in `plan.targets`, recorded in history). Publishing sends
one Zernio platform entry per chosen account, same caption and settings. Without a pick, the account from setup is used.
A DM gift attaches to the setup Instagram account.

## Networks on or off for a post

⇆ Networks… (post window, network icons, or right-click in Plan) switches each network/account on or off.
Scheduled/draft posts: `/api/zpost op=networks` (typed **edit**, `zedit.set_networks`, read back; published entries
always kept; at least one stays). Local drafts: `/api/plan op=networks`. Published: `op=unpublish` (typed **remove**)
per network where allowed. A `post_networks` request arrives through `watch`: it's already done; acknowledge in one line.

## Copy a post to another day

Posts → a post → **Copy**, or Plan → hover a post and press Ctrl+C. Then click a day (or press Ctrl+V on it) →
**Paste here**: same media, networks, accounts and settings; the user sets the time and may edit the caption.
Scheduling the copy needs a typed **go**; "Save as a draft in Zernio" publishes nothing. A local draft is copied as a
new local draft (folder copied into `my-posts/`). If the source has a DM gift, the Paste window offers **Also copy the gift** (unticked; opt-in): ticked, the same automation is created on the new post. From chat, only on the user's explicit yes for that exact copy.

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
- growth: KPIs, followers (Total / Daily / Weekly / Monthly switch: the follower curve or the followers gained per period as bars, with average, best and latest period; remembered), top posts, engagement heatmap, audience; the idea bank on every Growth tab; plus one dashboard per connected network (Growth tabs: its own audience (`networks[].audience`: Instagram, Facebook Pages, LinkedIn company pages; status personal/unsupported/empty otherwise; cached 6 h in `.bps/audience_cache.json`), followers, its own
  goal (`/api/goal` with `platform`, stored in `goal.by`), last 30 days vs the 30 before, best times, rhythm, top posts)
- calendar
- inbox: comments waiting, DM automations, ice breakers
- idea bank
- streak, goal ring, "since last visit"

## Starting a new post

The **New post** card (Post tab, when no post is open), Ctrl+K → "New post", and
the "New post" button on any made image open one window with four ways in:
**Photos or video** (from the computer; uploaded to `.bps/uploads` then copied),
**My images** (made in Create an image; click in order for a carousel) and
**A post folder** (the computer's folder picker, or the built-in browser) and
**Create an image** (makes one, then "Add to new post"). The
items can be reordered; one photo = single, several = carousel, one video =
Reel. A new folder is made under `my-posts/<name>`. With a caption the post opens
at once; without one, Claude gets a `new_post` request to write it. The user's
own files are never moved or changed.

The window then walks the user through **4 steps**: 1 media & caption →
2 **Check & improve** (score, checks, the user's own caption edits saved with
`/api/plan op=caption`, "Ask Claude to fix" per item; your `ask --kind fix`
suggestion is shown inline there with Use it / Edit / No thanks, so answer
fix requests as usual) → 3 **Time** (their best slots, any day and minute,
or right away; `op=time`) → 4 **Review & schedule** (optional gift, typed
**go**, same publish path as the Publish button). Keep replies about a post
that is still in the window short; the user sees the result live there.

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
| none (plain note) | Follow the instruction; reply in one line in chat **and** in the dashboard with its live status: `bps.py say --to <note id> --status done --text "..."` (see "Live status of every note") |
| `reply` | The user answered one of your `say` messages (`claudeSaid` = what you asked). Act on it, then confirm with `say --to <id>` |
| `fix_request` | With `action.perNetwork` (the post goes to 2+ networks): write **one caption per network** that fixes that check, each fitted to its network (`action.rules[p]`: length, hashtags, hook, tip, which includes the gift rule) and keeping the user's voice; save `{network: caption}` as JSON and run `bps.py rewrite --file v.json --note "…" --check <check id>`. The Fix button then opens the per-network versions (use all, some, edit, or no). Without `perNetwork` (one network): `suggest` (step 2.4) |
| `plan_scheduled` | Already applied; just acknowledge and re-run `recheck` |
| `account_connected` | Say which account is now connected; it is already saved and enabled |
| `post_cancelled` | The user cancelled a post from the dashboard. Run `bps.py sync` and confirm in one line (for a published Instagram post, remind them to delete it in the app) |
| `batch_scheduled` | The user batch-scheduled from the dashboard. Run `bps.py sync`, then report in 2-3 lines: how many were scheduled, the first and last date, and any failures with their error. Never schedule them again |
| `published` | The user published from the dashboard. Confirm with `bps.py sync`, then report the status and links. Never publish again |
| gift switched in the dashboard | Already saved in `plan.dm` (keyword, message, link + button, follow-first on/off, public reply, and the user's own follow-first texts `followGateMessage` / `followGateButton` / `notFollowingMessage`, used instead of the English defaults). The dashboard's gift window explains the whole scenario to the user; the automation is created only after publishing (`dm --confirm`, with a yes) |
| `reschedule` | Confirm with the post and time, then `bps.py reschedule --post ID --at ISO --confirm` |
| `comment_deleted` | The user deleted a comment in the Inbox (typed delete). Already done; acknowledge in one line with `say --to <id> --status done` |
| `post_moved` / `post_edited` | The user moved a post or edited its caption in the Plan tab (after typing move / edit). It is **already done** in Zernio (`lib/zedit.py`, read back). Just acknowledge in one line with `say --to <id> --status done`; never repeat it |
| `assign` | Run the step 2 flow on that folder with `schedule <at>` |
| `idea` | Draft caption + media plan for that idea and date; show it; nothing is published |
| `report` | `bps.py report --plan …` or summarise that post's analytics |
| `new_post` | The user started a post from the dashboard's **New post** window (files, made images, or a folder). If `opened`, the post is already the current plan: run the step 2 flow from point 3 (report findings, fixes, time, gift). If `needsCaption`, look at the media (and `hint`, the image prompts), write a caption in the user's voice, save it as `caption.txt` in `folder`, show it in chat, then `analyze` that folder and continue step 2 |
| `reply_drafts` | The user pressed "Ask Claude to draft replies" in the Inbox. `action.comments` lists the waiting comments (id, author, text, post, platform). Write one short public reply per comment in the user's voice and language (match the comment's language), and save each with `bps.py inbox draft --comment ID --text "…"`. Never send them: the user presses Use it → Send reply. Skip spam or comments that need no answer, and say so in the `say --status done` line |
| `post_copied` | The user copied a post to another day from the dashboard (Copy → Paste). It's **already done** in Zernio (a new scheduled post after typed go, or a Zernio draft). Acknowledge in one line with `say --to <id> --status done`; never repeat it |
| `rewrite_all` | The user pressed "Fit it for every network". Write one caption per network and save with `bps.py rewrite` (see "One post, every network"). Never apply them yourself |
| `ab_hook` | The user pressed "Ask Claude for hook B" in the Hook test window. `action.caption` is version A. Write B and save it with `bps.py abtest hook` (see "Hook A/B test"). Never start the test yourself |
| `abtest_started` | The user started a hook test from the dashboard. Already done; acknowledge in one line and say results come after 48 hours |
| plain note starting with `[About … post …]` | Sent from the small 💬 Ask PIX chat next to a post (day card, post window, right-click in Plan/Posts). The bracket says which post (Zernio id or local draft id, first line, time, status, networks with format). Answer about that post in 1-3 short lines with `say --to <id> --status done`; it shows in the same small chat. Public changes still need the user's yes |
| `trial_advice` | The user pressed ✨ Ask PIX in the Trial Reels window. Advise per Reel from `action.items` + `action.stats` (see "Trial Reels for waiting Reels"); change nothing without their yes |
| `trial_changed` | The user switched Trial on/off from the dashboard (typed edit). Already done in Zernio; acknowledge in one line with `say --to <id> --status done` |
| `recycle_hooks` | The user pressed "Ask Claude for new hooks" in the Recycle window. `action.caption`, `metrics` and `platforms` describe the post. Write 3-5 new versions and save them with `bps.py recycle hooks` (see "Recycle best posts"). Never start recycling yourself |
| (any note) stopped | The user can press ■ Stop on a note or a job. `watch` never returns a stopped note; if one you're already working on shows `status: stopped` (in `bps.py notes`), drop it and don't `say` done. `image claude` refuses a stopped design request |
| note with `Attached: <paths>` | The user dropped or attached files (photos, video, PDF, zip) in the dashboard; they're in `.bps/uploads/`. Look at them before answering |
| `claude_image` | The user picked **Claude designs it** in the image window. Design `n` images for `prompt` at `width`×`height` (`shape`). `kind: "carousel"` = `n` slides of ONE carousel: one story in order (cover with the hook → one point per slide → closing takeaway/CTA), same layout system, colours and type on every slide, numbered `k / N`, passed to `image claude` in slide order (they become one set). `kind: "single"` = `n` different takes on the same idea. `auto: true` (n = 0) = **you decide how many** (≤ `maxN`): the count the prompt states, else what the story needs (a carousel usually 5-8 slides, single 2-4 takes); say the count and why in `--note`. Otherwise: copy `templates/claude-image.html` (brand v2 tokens, φ-curve), write one self-contained HTML file per image (Google Fonts OK, no network-waiting scripts, phone-readable text, Arabic RTL in Cairo/IBM Plex Sans Arabic, technical terms in Latin). Look at any `refs` first. With `editOf`, change the existing design: edit its `html` (a workspace path) and keep everything not asked for. Then `bps.py image claude --html f1.html [--html f2.html] --shape SHAPE --note "<one line what you made>"`, check the PNG it prints by viewing it, and `say --to <id> --status done`. Never publish it yourself |
| `image_prompt` | The user pressed "Ask Claude to improve it" in the image window. Turn `action.text` (and any guide pictures in `action.refs`) into one clear, specific image prompt in their language, then `bps.py image prompt --prompt "…" --note "…"`. It appears in the window with a "Use this prompt" button. Don't generate the image yourself |

Then run `bps.py notes --mark-read` and start `watch` again **right away**. `--mark-read` marks only the notes you were shown; anything that arrived meanwhile stays unread and the next `watch` returns it at once. Never leave the dashboard open without a `watch` running: notes then wait on "Waiting for Claude…" with no one to answer them.

**Live status of every note (required).** The dashboard shows each note's
progress under it and pops a notice when it's finished, then refreshes itself.
`watch` already marks the notes it returns as "Claude got it". For each one:
1. If it takes more than a few seconds, say what you're doing:
   `bps.py say --to <note id> --status working --text "Rewriting the hook"`
   (no pop-up; repeat with the next step for long jobs).
2. Always finish it, in one or two plain lines with the concrete result:
   `bps.py say --to <note id> --status done --text "Done: caption shortened, score 82 → 95"`
   or, when it can't be done, `--status failed --text "Couldn't: <why> · <what the user can do>"`.
The **Activity** bell in the top bar lists every note with this status and your
result text, so keep results short and concrete. A note marked read without
done/failed shows as "Handled".
A note that needs the user's decision first gets a normal `say --to … --expect`
(or `--option`) question instead; finish it with done/failed after the answer.

**Open a window ready for the user.** For anything public the user must finish (they type the word themselves), prepare it and send `bps.py say --text "…" --open '{"kind":"paste","post":"<Zernio id>","day":"YYYY-MM-DD","time":"HH:MM","nets":["instagram"]}'`: PIX's pop-up and chat get an **Open it** button that opens the Copy → Paste window filled in; the user checks it and types **go**. To show the user certain comments, label them (`inbox.label`) and send `--open '{"kind":"inbox","filter":"all","label":"🎁 Send gift"}'`: **Open it** shows the Inbox filtered to that label.

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

## Facebook, TikTok and Snapchat

All three connect like Instagram and LinkedIn (Posts → + Connect account).
- **Facebook** (a Page): `facebook.format` feed (text, 1-10 photos or a video,
  no mixing) / reel (one vertical video, 3-90 s, optional `facebook.title`) /
  story (one item, 24h, no caption, no draft). Also `facebook.firstComment`,
  `facebook.draft` (Publishing Tools draft) and `facebook.pageId` (Pages from
  `/accounts/{id}/facebook-page`; empty = the default Page).

A post goes to every connected network that can show it (`plan.FITS`):
Facebook takes everything but a PDF, TikTok videos and photo posts (no
PDF/text), Snapchat one photo or one video; the
others are listed in `skipped_reasons`. Never work around a skip.
- **TikTok** blocks until the user sets `tiktok.privacyLevel` (from
  `/accounts/{id}/tiktok/creator-info`, shown in the dashboard) and gives
  **their own** consent (`tiktok.consent`), which is tied to the exact caption
  and media and asked again after any change. Never set consent yourself;
  ask the user to tick it in the dashboard (or say yes to that exact post).
  Other settings: allowComment/Duet/Stitch, commercialContentType
  (none / brand_organic / brand_content), videoMadeWithAi, draft (Creator Inbox).
- **Snapchat** `snapchat.contentType`: story (24h, no caption), saved_story
  (title ≤45), spotlight (video only, ≤160). Needs a Public Profile.
Set them with `bps.py set tiktok.privacyLevel PUBLIC_TO_EVERYONE` style
commands or the dashboard's Network settings.

## Inbox (dashboard)

The Inbox lists comments waiting (last 7 days, the 5 posts with comments),
each with its post and that post's gift. From the dashboard the user can
**reply** (public), **send the gift** as a private reply (`lib/inbox.py`;
Instagram/Facebook, one per comment within 7 days; the link goes in the text,
a button only if they choose it), **hide/show**, **delete** (typed "delete")
and add **labels**. Labels and "handled" marks are local (`.bps/inbox.json`).
When asked to answer comments from chat, draft the replies and let the user
send them (or send only after their explicit yes per comment).
`bps.py inbox waiting` lists the comments still waiting (with any draft); `bps.py inbox hide-gifted | show-gifted` hides or shows the comments whose authors already got the gift, and `hide-replied | show-replied` the ones already replied to (here or in the Instagram app) (local view only, nothing changes on Instagram; the dashboard's 🎁 and ↩ buttons do the same); `bps.py inbox draft --comment ID --text "…"`
saves a draft the user sees on that comment. Comments a Zernio DM automation already answered (from its log) move to
Handled by themselves; each automation shows its gift funnel (Zernio's stats). Comments the user answered in the Instagram app (a reply under it,
an @mention in their own comment, or a DM they sent afterwards) also move to Handled (`ig-replied` / `ig-mentioned` / `ig-dm`).

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
  `/v1/images/generations`. Up to 10 guides, up to 20 images per run (OpenAI draws 4 at a time).
- **One image or a carousel:** *One image* = N tries of the same picture (keep the best). *Carousel* = N slides
  that go together: each slide gets the whole brief plus "slide k of N, same style on every slide" (cover first,
  closing slide last); a `Slide 1: … Slide 2: …` list in the prompt gives each slide its own text and sets the count.
  Results carry `set`, `slide`, `of`; **▦ Make a carousel post** opens New post with them in order.
- **How many:** 1, 2, 4, any number (≤20), *As my prompt says* (the number written: "6 slides", "خمس صور", or the
  Slide list), or *Recommended* (PIX decides for its own designs; for OpenAI the prompt's number, else 5 slides for a
  carousel, or 4 / 2 / 1 tries for draft / standard / best).
- **View here:** clicking any image opens it big inside the dashboard (no new tab), with ← → / mouse wheel / swipe /
  thumbnails through the carousel, the new results or all images; Download, Use as guide, Make a carousel post; Esc closes.
- **Save together (projects):** 💾 *Save all as a project…* on new results, or ☐ *Select* in Your images (click order =
  save order). A **new project** is `my-projects/<name>/` with `01-…, 02-…` and `project.json` (prompts, model, slide);
  or **add to a project** (numbering continues), or a new project folder **anywhere on the computer** (folder window; an empty picked folder IS the project, a folder
  with files gets a `<name>` subfolder). New post → A post folder looks one level down if the folder only holds post folders.
  *Save each to a folder…* copies the picked images as they are. A project folder can become a post (New post → A post
  folder, plus a caption). Chat: `bps.py image project --id A,B,C --name "…" [--project my-projects/x]`, `bps.py image projects`.
- Options use plain words: shape square / tall / wide, quality draft / standard /
  best, and the model (from the key's live list; ★ = default, set in Settings →
  Keys → OpenAI → Image model, or "Keep these as my defaults").
- Results land in `.bps/images/` (with `index.json`: prompt, model, settings,
  guides). Each image offers Add to post (current draft: copied into its folder
  and the media list refreshed, recorded in history), Save to folder (the
  computer's own folder window, any folder), Save as… (the file manager's
  save window, any place and name), Edit, Use as guide, Again, Download,
  Delete (moved to `.bps/trash/images`).
- **Edit** changes one picture as the user describes and keeps the rest
  (sent to OpenAI's edits endpoint with high input fidelity, shape "auto" keeps
  the original proportions). Like ChatGPT, the user marks the picture with
  pins, boxes, paint strokes or loops (Surround), writes a note for each
  mark, and can work in full screen. The notes go in one request, each tied
  to its place; with "Only change the marked spots" (on by default) the
  dashboard also sends a mask made from the marks, then pastes only the
  marked areas of OpenAI's answer onto the original (soft edge, original
  size), so everything outside the marks is pixel-for-pixel unchanged.
  OpenAI's own full output is kept as `<name>-openai.png`. The source can be any gallery image or a picture
  from the computer ("Edit a picture from my computer" uploads it into
  `.bps/images/refs`). Edits are new gallery images; the original is untouched.
- Creating an image costs the user OpenAI credit; it never publishes anything.

From chat:
```bash
python3 "$SKILL/bin/bps.py" image gen --prompt "..." [--ref FILE ...] [--shape square|tall|wide] [--quality draft|standard|best] [--n 1-20] [--carousel] [--model ID]
python3 "$SKILL/bin/bps.py" image gen --edit FILE --prompt "what to change" [--quality ..] [--n 1-20]
python3 "$SKILL/bin/bps.py" image models | list | set --model ID [--shape ..] [--quality ..]
python3 "$SKILL/bin/bps.py" image copy --id IMAGE_ID [--to FOLDER]
python3 "$SKILL/bin/bps.py" image prompt --prompt "<improved prompt>" --note "<one line why>"
python3 "$SKILL/bin/bps.py" image models --refresh                   # ask OpenAI for its model list now
python3 "$SKILL/bin/bps.py" image claude --html F.html [--html G.html] --shape square|tall|wide|story --note "…"
```
- **Model list:** refreshed from OpenAI by itself once a day (background, when the image window opens); models the user hasn't
  seen yet are listed as `new` and shown as a notice (Try it / Make it my default / Got it).
- **Claude designs it** (second engine in the window): no OpenAI key or credit. The dashboard sends a `claude_image` request;
  you write HTML and render it (see the listening-loop table). Sizes: square 1080×1080, tall 1080×1350, wide 1920×1080,
  story 1080×1920. The HTML is kept in `.bps/images/claude/` so "Ask Claude to change" can edit it.
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
