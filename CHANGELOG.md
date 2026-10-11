# Changelog

## 1.15.1 (2026-10-11)
- **Fixed: notes to Claude could loop, go unanswered or disappear.** The dashboard and Claude now take turns on the notes and replies files (a file lock on Linux, macOS and Windows), so neither side overwrites the other. In a stress test before the fix, 25 of 500 notes were lost; now 0.
- **Fixed: a note sent while Claude was busy could be marked "✓ Claude got it" without being handled.** `notes --mark-read` now marks only the notes Claude was actually shown (by `watch` or `notes`); anything newer stays unread and the next `watch` returns it. `--ids A,B` marks exact notes.
- **Fixed: the listening loop could stop on a half-written note** (the status light then stayed on "Claude is working" with your note on "Waiting for Claude…"). `watch` now skips an unfinished line and keeps listening; a damaged line is kept in the file, never dropped.

## 1.15.0 (2026-10-09)
- **Claude talks back in the dashboard.** Claude's replies pop up ("Claude says") with answer buttons and a reply box; your answer goes straight back to Claude. Chat: `bps.py say --text … [--to NOTE] [--option A --option B] [--expect]`, `bps.py thread`.
- **"Note to Claude" is now a chat**: your notes and Claude's replies in one thread, live, with "✓ Claude got it" / "Waiting for Claude…" on each of your messages. A badge on the button counts unread replies.
- **Clearer status light**: "Claude is listening" (green), "Claude is working" (pulsing, Claude Code is busy between requests; it no longer flips to "away"), "Claude Code is closed" (grey, after 10 minutes with no sign of it; requests wait).
- Fixed: "No cover yet" no longer shows on top of a chosen Reel cover (Post tab → Cover).
- **Posts tab**: every post shows its full date and time, e.g. "Thu, Oct 29, 2026 · 11:00 AM".

## 1.14.1 (2026-10-09)
- **Everything stays inside the project folder.** A post folder picked outside the workspace (Browse…, New post → A post folder) is copied into `my-posts/<name>` and the copy is used; outside folders are no longer remembered. The built-in folder browser shows the project folder only. The cover renderer keeps its browser profile in `.bps/browser`.

## 1.14.0 (2026-10-09)
- **Background jobs meter** in the top bar: "2 running · 64%" with a thin progress line while anything works behind the scenes; click it for the list (label, current step, progress bar with %, elapsed time, ✓ / ✕ when done). Finished jobs stay for a minute. Also Ctrl+K → "Background jobs".
- Tracked: making images (per image; a moving estimate for one image, capped at 95% until it lands), publishing (upload → create → verify), batch scheduling (per post), large uploads (MB), key tests, refreshing from Zernio (per section), new post folders, and dashboard requests Claude is still working on ("Claude: Writing a caption…").
- Work started from the chat (`bps.py image gen`, `publish --confirm`, `batch run`, `sync`) shows too: jobs live in `.bps/jobs.json`. A job whose process died, or that hasn't reported for 10 minutes, shows as stopped. Chat: `bps.py jobs`.

## 1.13.0 (2026-10-09)
- **Create images with OpenAI** (top bar → **Image**, the Preview card, or Ctrl+K): describe it, optionally add guide pictures (drop / paste / pick, from this post or earlier images), pick shape, quality, how many and model, press Create. Results can be added to the current post, saved to a folder, reused as a guide, made again, downloaded or deleted. Chat: `bps.py image gen|models|list|set|copy|prompt`.
- "Ask Claude to improve it" sends your rough idea to Claude, whose prompt appears in the window with "Use this prompt".
- Default image model in Settings → Keys → OpenAI, filled from your key's live model list (short names first, pinned dated versions after).
- Adding media to a draft is recorded in its history (undoable).
- **New post without typing paths:** one window with **Photos or video** (from your computer, drag & drop too), **My images** (pick several in order = carousel) and **A post folder** (your computer's folder picker or the built-in browser). Reorder slides, name the post, add a caption or let Claude write it. Also on every made image ("New post") and in Ctrl+K.
- **Test any key and see its models** (Settings → Keys): every saved key has **Test**; OpenAI and Anthropic keys list their models (filter, grouped by kind, image models highlighted), Zernio lists its accounts. Last result is remembered in `.bps/keytests.json` (never the key).
- OpenAI and Anthropic keys have their own rows, with OpenAI / Anthropic presets in "Add another API key". A blank name is filled in from the key's shape (`sk-ant-…` → Anthropic, `sk-…` → OpenAI).
- Fixed: keys silently not saving (the empty name field looked filled in; errors are now shown in a red box), the Test button crashing, and failed requests getting no answer. An out-of-date page now says "reload".

## 1.12.0 (2026-10-08)
- **Cancel anything, anywhere** (type "cancel" to confirm):
  - **scheduled / pending / failed / partial posts** are deleted from Zernio so they never go out; the local draft is kept (back under Not uploaded) so you can schedule it again
  - **published posts** are removed from networks that allow it (LinkedIn, Facebook, Threads, X and others); Instagram doesn't allow apps to delete posts, so the window says so and links to the post to delete in the app
  - **local drafts** (never uploaded) are set aside in `.bps/trash`; your post folder is never touched
  - available from a post's details (Posts), the calendar day panel, the Post tab banner, batch results, and Ctrl+K → "Cancel a post" (a list of everything cancellable)
  - chat: `bps.py cancel --post ID --confirm` and `bps.py cancel --draft PLAN_ID`
- Guide and hover tips cover cancelling.

## 1.11.0 (2026-10-08)
- **Hover tips everywhere:** rest the mouse (or move keyboard focus) on a button, tab, card, calendar day, chart or batch control and a short card explains what it is and how to use it, in English or Arabic. Turn them off in Settings → Preferences → Hover tips.
- **Full guide** in Settings → About (also Ctrl+K → Guide): 11 sections covering every feature with how to use it: getting started, publishing one post, batch schedule, the calendar and best hours, Posts, Growth and the goal, Inbox, working with Claude, look and settings, safety, and chat commands.

## 1.10.0 (2026-10-07)
- **Batch schedule** (Plan tab, Posts tab, or Ctrl+K → Batch schedule): Pick posts → Set times → Go.
  - **Pick posts:** every post folder in the workspace as a card with its thumbnail (videos preview on hover); "Select all new"; folders already sent are greyed out
  - **Browse…** opens the computer's own folder picker (desktop portal on Linux, Finder on macOS, Explorer on Windows); a **Folder browser** inside the dashboard works everywhere. A chosen folder can be one post or hold many
  - **Set times:** the weekday's best hour from your own posts (only peaks above your average; the best overall slot otherwise), or one fixed time; every day, every 2 days, or chosen weekdays; skips days that already have a post. Each time says why ("best Wed · +96% · n=5"). Drag or ↑↓ to reorder, edit any time
  - posts with blocking checks are listed apart, with "Ask Claude to fix" and "Remove"
  - **Go:** one typed "go" for exactly that list. The server re-checks everything first (all or nothing), then creates each post in Zernio as scheduled, with live progress per post; a failure doesn't stop the others
  - preparing a batch never changes the post open in the Post tab
  - chat: `bps.py batch scan | prepare | suggest | run --confirm`
- **Background:** the 200bps.ai mark, wordmark and founder name as a faint pattern on the 28° slope, in three depth layers that follow the mouse and lift under the cursor. Still with "reduce motion"; paused in hidden tabs.

## 1.9.0 (2026-10-07)
- **Logo:** the header now shows the approved horizontal lockup from the 200bps.ai brand system (mark | rule | 200bps.ai), using the identity file unchanged. The mark is no longer cropped into a circle anywhere, and light mode uses the approved dark-on-paper version.
- **English matches Arabic:** labels, tabs, buttons, badges and pills use the same plain sentence-case text in both languages (no more spaced-out capitals in English). The last hard-coded English words (day counts, "follow-gated", "Ice breakers", "Trial") are now translated.
- **Calendar:**
  - shows exactly the posts in the Posts tab (published, scheduled, needs attention, not uploaded), on the right local day
  - each post is a chip coloured like its Posts-tab badge, with a legend under the calendar and "+N more" on busy days
  - previous/next arrows point outward in both languages, with a Today button between them
  - Arabic weekday names are shown in full (they were cut to three letters)
- **Hover a video to preview it:** any video tile in Posts (and videos in the post preview) plays muted while the mouse is over it. Off on touch screens and with reduced motion.
- **Follower goal:** the Goal card shows how many followers are left, explains where the goal comes from (setup) and how progress updates (follower count from Zernio, on every refresh), and has a "Change goal" button with quick picks. Saved to `.bps/config.json` through a new local `/api/goal` endpoint.
- **Posts:** status badges on thumbnails are solid, so they're readable over any image.
- **Fix:** the New post card showed the word "null" when there were no drafts.

## 1.8.0 (2026-09-28)
- **Connect accounts from the dashboard** (Settings → Accounts, "+ Connect account" in Posts, or Ctrl+K → Connect):
  - Instagram and LinkedIn today; other networks are listed as "coming soon"
  - opens Zernio's secure sign-in link; you approve on the network's own site and come back to a "Connected" page
  - the dashboard notices the new account, saves it, enables it for posts and refreshes
  - the skill never sees social-network passwords
  - `bps.py connect <platform>` prints the link for use from chat
- **Notices:** always centred, wrapped and inside the screen (LTR, RTL, phones), and they stay up longer for long messages.

## 1.7.2 (2026-09-28)
- The dashboard page reloads itself when the dashboard server restarts (for example after an update), and stays on the current tab. Before, a tab opened earlier kept showing the old data (no thumbnails, every post labelled "Post").
- Cached Zernio data is stamped with the skill version and never reused by a newer version.

## 1.7.1 (2026-09-28)
- **Real thumbnails:**
  - posts now use the platform's own thumbnail from Zernio analytics (`thumbnailUrl`), the same image Zernio's dashboard shows
  - Zernio's stored upload links can 404 after publishing, so each tile falls back through other images and then a video frame
- **A type label on every post, in Grid and List:** Carousel · N slides, Reel, Video, Story, Document, Article, Text or Post, with the real slide count.
- **Posts made outside Zernio** (straight on Instagram and other networks) now appear, marked "posted outside Zernio".
- **Accounts and networks:**
  - every post shows its network and @account
  - a new account filter helps when many accounts are connected
  - posts made outside Zernio are assigned to the only connected account of that network
- **Fix:** follower history asked Zernio for 89 days (the limit is 88), so the follower chart failed. It now uses 87.
- Verified on a real account: 25 posts, 23 with image thumbnails and 2 video frames, 6 carousels with slide counts, 0 posts missing an account.

## 1.7.0 (2026-09-28)
- **Posts: grid view with thumbnails** (the default; switch to List anytime, and your choice is remembered):
  - real images and Reel covers from Zernio, and your own media for local drafts
  - status badges, carousel and video markers, failed posts outlined
  - click a tile for full details: caption, per-platform status, links, errors and actions
- **Idea bank that fills itself:**
  - a "Get ideas" button with an optional topic, plus "More ideas"
  - Claude refills to 5 fresh ideas after every publish or report
  - ideas from topics (not results) are labelled
  - "Ask Claude to draft it" marks an idea Drafted; "Not for me" removes it

## 1.6.0 (2026-09-28)
- **Publish button in the dashboard** (the Go step, the big button on the post path, or Ctrl+K → Publish):
  - it shows a summary, then you type **go**
  - the dashboard uploads to Zernio, creates the post and the approved DM gift, then **reads the post back from Zernio** and shows the verified status per platform, with links
  - no Claude Code permission is involved
  - blocked posts list what to fix instead of offering Publish
  - publishing twice is refused
- Claude's "Publish?" pop-up now publishes the same way. Claude gets a `published` note and reports; it never publishes again.
- The optional Gift step no longer holds back the Publish button.

## 1.5.1 (2026-09-28)
- **New post** button (post path, command bar, or `bps.py clear`): start fresh without deleting anything. The current post moves to Posts → Not uploaded, where "Continue this post" reopens it. A "Start a new post" card sends the next folder to Claude.

## 1.5.0 (2026-09-28)
- **Posts tab:** a mirror of the Zernio account:
  - every post with its real status per platform, live links, error messages, Trial badges, filters and counts
  - local drafts not uploaded yet, plus "Continue this post"
  - `sync` updates each local plan's status from Zernio
- **Publish permission:** `bps.py allow-publish` (asks first; `--yes` adds exact allow rules for `publish --confirm` and `dm --confirm` to `.claude/settings.json`). SKILL.md says what to do if a publish is still blocked.
- **`.env` is 0600** from `init` onward.
- **Only connected platforms:**
  - plans leave out platforms with no connected Zernio account
  - `doctor` warns about them
  - a platform's only connected account is saved automatically
  - `ready` catches a missing account before asking for approval
- **`bps.py set platform.setting value`** for firstComment, collaborators, trial, documentTitle and more. Recorded in history, undoable, re-checked.
- **Fix requests are de-duplicated:** a second click shows the open request or suggestion (`suggest --check` links them).
- **Fix:** a dashboard from another folder is never reused by mistake (it's matched by workspace).

## 1.4.0 (2026-09-28)
- API keys are entered in the dashboard:
  - a "Connect Zernio" card appears when no key is set
  - Settings → Keys lets you replace, test or remove keys, or add any other API key
- Keys are written only to the workspace `.env`, with owner-only (600) permissions and git-ignored. The page sees only a masked form (`sk_…1234`). Requests without the session token or from another site are refused.
- The Zernio key is tested as soon as it's saved, and readiness updates immediately.
- Tested: 12 key checks and 36 interaction checks pass; motion is unchanged (still at idle, 60 fps scrolling).

## 1.3.2 (2026-09-28)
- Calm motion. Things move only when you act or when data changes:
  - removed the looping hops, bobbing, blinking and pulsing; only a slow "Claude is listening" glow remains
  - removed scroll parallax and the pointer tilt on large cards; small tiles keep a gentle, eased tilt
  - card depth is now one solid edge (was 6 stacked shadows), and cards no longer each get their own graphics layer
  - softer pop-up and tab transitions
- Validated in headless Chrome at desktop and phone sizes:
  - idle: 0 DOM changes, 0 animation restarts, 0 layout shift
  - scroll: every frame 16.7 ms (60 fps), 0 long tasks
  - 36 interaction checks pass with no JS errors

## 1.3.1 (2026-09-28)
- Smoother animations: the dashboard redraws only when data changes (it used to rebuild every 2 s, replaying entrance animations). The score ring and progress bar glide from their previous values, cards enter once, and the tilt eases.

## 1.3.0 (2026-09-28)
- Undo and history:
  - ↺ undo on each step of the post's path
  - a Changes timeline with Revert on every choice
  - CLI: `history`, `revert`, `undo-step`
- Back button (top bar), plus browser and phone back to close pop-ups or return to the previous tab.
- Gift step opens a real pop-up with an On/Off switch, keyword, message, link and follow-gate, saved instantly. It used to only message Claude.
- Peak times with evidence:
  - each weekday's own best and 2nd-best hour
  - lift vs your average, post count and a confidence badge
  - ranked by a shrunk average, so one lucky post can't top the list
- Audience clocks: follower countries → time zones, the share on your clock, the best slot in their local time, and a mismatch warning.
- Softer shape: rounded cards, buttons and pop-ups; pill badges.
- Button audit: 49 automated interaction checks pass with no JS errors.

## 1.2.0 (2026-09-28)
- The dashboard opens automatically every time the skill runs, and reuses one that is already running.
- Fully responsive:
  - phone: bottom tab bar, bottom-sheet pop-ups, compact journey bar
  - tablet: 2-column layouts
  - wide screens: a wider page
  - no sideways page scrolling; wide charts and tables scroll inside their cards
- No overlaps: no floating elements ("Note to Claude" is in the top bar, or the tab bar on phones). Notifications appear one at a time under the top bar. Heatmap rank cells stay inside their squares.
- "Sent" feel: the pop-up flies back into depth, a 3D chip flies to the "Claude is listening" light, and notifications are floating plates.

## 1.1.0 (2026-09-28)
- Platforms: Instagram and LinkedIn only. Facebook and Threads are switched off in code for now.
- Caption fix suggestions: before/after with the score change; approve, edit or reject; backups and undo.
- Reel covers: pick a video frame, use your own image, or have Claude design one in your brand (headless Chrome). Profile-grid crop preview.
- Human in the loop: dashboard pop-ups (choices, frames, fixes, publish with a typed "go"), "Note to Claude", and a listening mode (`watch`).
- Clickable checks, heatmap slots, calendar days and ideas.
- Heatmap: 5-step scale, ranked best slots (1/2/3) and a top-times list.
- Simplified layout:
  - 4 tabs (Post, Plan, Growth, Inbox) and a settings drawer
  - a journey bar with a "Next step" button
  - a command bar (Ctrl/⌘ + K)
- Look: 2.5D depth and tilt, chamfered bevels, parallax, count-ups, 3D pop-ups, lime cubes. Light/dark themes; 12h/24h clock.

## 1.0.1 (2026-09-28)
- Added: About tab (who made it, what it does, how to use it, contact links).
- Fixed: dashboard audience (age, gender) plus follower history, post stats, comments and automations now read Zernio's documented response shapes.
- Added: top countries with full names; age groups in order; gender labels in Arabic and English.

## 1.0.0 (2026-09-27)
First release.
- Readiness checks and a first-run setup wizard.
- Post folder analysis:
  - caption, hashtag, SEO, call-to-action and restricted-wording checks
  - media spec checks (read-only)
  - a 0–100 score with tips
- Best time from the account's own Zernio analytics, with a minimum-data threshold.
- Publishing to Instagram, Facebook, Threads and LinkedIn, after the user approves in chat. Includes Trial Reels, Reel covers, location, first comment and collaborators.
- Follow-gated comment-to-DM gifts (opt-in for each post) and Instagram ice breakers.
- A branded local dashboard in Arabic and English:
  - post preview, growth, calendar, inbox and idea bank
  - streak, goal ring, "since last visit" and milestones
