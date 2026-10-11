/* 200BPS Publish dashboard. Read-only: this page never publishes anything.
   Data comes from the local server (bin/bps.py dashboard), which holds the
   API key; the key never reaches the browser. */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") n.className = v;
      else if (k === "html") n.innerHTML = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return n;
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmt = (n) => n == null ? "–" : Intl.NumberFormat(state.lang === "ar" ? "ar-KW" : "en", { notation: n >= 10000 ? "compact" : "standard" }).format(n);

  const I18N = {
    en: {
      kicker: "200 breakthroughs per second", heroTitle: "Post smarter. Grow faster.",
      heroSub: "Your accounts, your content, one screen. Nothing is published until you approve it in the chat.",
      tabPost: "Post", tabGrowth: "Growth", tabCalendar: "Calendar", tabInbox: "Inbox", tabIdeas: "Ideas", tabSystem: "System",
      preview: "Preview", checks: "Checks", score: "Post score", plan: "Plan", bestTime: "Best time",
      followers: "Followers", goal: "Goal", topPosts: "Top posts", rankedBy: "ranked by follows, then saves + shares",
      heatmap: "When your audience engages", audience: "Audience", comments: "Comments waiting", automations: "DM automations",
      ideaBank: "Idea bank", ideaHint: "from your best posts", readiness: "Readiness", accounts: "Connected accounts",
      credit: "A free gift from Nasser Al-Ostath. Learn and build AI with us.",
      awaiting: "Ready. Type “go” in the pop-up or in Claude Code to publish.",
      published: "Published", scheduled: "Scheduled for", draft: "Draft: the agent is still preparing this post.",
      noPlan: "No post open. Start one below, or continue a draft from Posts.",
      streak: "day streak", sinceLast: "since your last visit", newFollowers: "followers", newComments: "new comments",
      noData: "No data yet.", zernioOff: "Zernio is not connected yet. Finish setup in the chat.",
      reach7: "Reach · 7 days", views7: "Views · 7 days", eng7: "Engagement · 7 days", follows7: "New follows · 7 days",
      platforms: "Platforms", when: "When", type: "Type", trial: "Trial Reel", cover: "Cover", location: "Location",
      firstComment: "First comment", collab: "Collaborators", dmGift: "DM gift", off: "off", on: "on", now: "Now",
      basisData: "from your data", basisNone: "not enough data",
      ready: "ready", issues: "issues", post: "Post", reach: "Reach", saves: "Saves", shares: "Shares", follows: "Follows",
      ideaOpen: "Open details", ideaKicker: "Idea", ideaHook: "Hook", ideaWhy: "Why it should work", ideaOutline: "Outline", ideaCta: "Call to action",
      ideaTags: "Hashtags", ideaWhen: "Suggested time", ideaBased: "Inspired by", ideaDrop: "Not for me", ideaPlan: "Plan it on a day", ideaPickDay: "Pick a day in the calendar",
      kind_carousel: "Carousel", kind_reel: "Reel", kind_video: "Video", kind_short: "Short", kind_story: "Story", kind_document: "Document",
      kind_article: "Article", kind_text: "Text", kind_post: "Post", zOutside: "posted outside Zernio", zAccounts: "Accounts", zAllAccounts: "All accounts",
      accKicker: "Accounts", accTitle: "Connect a social account", accHint: "Sign in on the network's own site and approve. Zernio keeps the connection; this skill never sees your password.",
      accNotConnected: "Not connected", accConnect: "Connect", accReconnect: "Reconnect", accAddAnother: "Add another", accSoon: "Coming soon", accConnectShort: "Connect account",
      accWaiting: "Waiting for {n}…", accW1: "Opened the secure sign-in page", accW2: "Approve access on {n} (in the new tab)", accW3: "Saved and ready to post",
      accPrivacy: "Your password goes only to the network. Keep this window open; it updates by itself when you're done.", accOpenAgain: "Open the sign-in page again",
      accDone: "Connected: {a}. It's ready to post.",
      zGrid: "Grid", zList: "List", zViewLabel: "View", ideaGet: "Get ideas", ideaMore: "More ideas", ideaTopicPh: "Optional topic, e.g. AI Agents for beginners",
      ideaEmptyTitle: "No ideas yet", ideaEmptyHint: "Claude studies your best posts in Zernio (follows, saves, shares) and suggests 5 posts with a hook, outline and best time. It refills after every publish.",
      ideaComing: "Claude is on it. Ideas will appear here shortly.", ideaQueued: "Sent. Ideas will appear when Claude Code is open.",
      ideaSt_drafted: "Drafted", ideaSt_posted: "Posted", ideaTopicsBasis: "Not based on results yet",
      pubTitle: "Publish this post?", pubHint: "It's uploaded to Zernio, which posts it at the time below. Then we read it back from Zernio to prove it's there.",
      pubNow: "Right away", pubBlocked: "Fix these first:", pubBtn: "Publish", pubWorking: "Publishing…", pubS1: "Uploading media", pubS2: "Checking with Zernio",
      pubS3: "Creating the post", pubS4: "Verifying in Zernio", pubDontClose: "Keep this window open for a moment.", pubFailed: "Not published",
      pubFailedHint: "Nothing went live. Fix the issue and publish again, or ask Claude to help.", pubDoneSched: "Uploaded to Zernio and scheduled",
      pubDonePub: "Uploaded to Zernio and published", pubVerified: "Verified: we read this post back from your Zernio account.",
      pubNotVerified: "Created in Zernio, but reading it back failed. Check the Posts tab in a moment.", zPostId: "Zernio post", zStatus: "Status in Zernio",
      pubGiftOn: "DM gift is live: comment “{k}”.", pubGiftFail: "The post is up, but the DM gift failed:", openZernio: "Open Zernio", seeInPosts: "See it in Posts",
      newPost: "New post", newPostQ: "Start a new post?", newPostKeep: "This post is set aside, not deleted. You'll find it in Posts → Not uploaded, and can continue it anytime.",
      newPostKeepShort: "start fresh; nothing is deleted", newPostGo: "Start fresh", newPostDone: "Ready for a new post", newPostTitle: "Start a new post",
      newPostHow: "Make a folder with your image or video and a caption.txt, then send the folder name to Claude (or type /200bps-publish and the folder in the chat).",
      newPostSend: "Send to Claude", newPostNeedFolder: "Type the folder name first.", newPostDrafts: "You have {n} draft(s) not uploaded yet.",
      tabPosts: "Posts", zTitle: "Your Zernio account", zRefresh: "Refresh from Zernio", zRefreshing: "Refreshing…", zUpdated: "Updated from Zernio", synced: "synced",
      zAll: "All", zNotUploaded: "Not uploaded yet", zAttention: "Needs attention", zNone: "Nothing here.", reconnect: "Reconnect in Zernio",
      stLocal: "Not uploaded", stAwaiting: "Waiting for go", stDraft: "Draft in Zernio", stScheduled: "Scheduled", stPublishing: "Publishing", stPublished: "Published",
      stPartial: "Partly published", stFailed: "Failed", stCancelled: "Cancelled", stPending: "Pending",
      openPost: "Open", zContinue: "Continue this post", zOpenPlan: "Open plan", zAskFix: "Ask Claude to fix", zLocalHint: "local draft, only on this computer",
      zFromSkill: "sent by this skill", zFromZernio: "in your Zernio account",
      fixInProgress: "Claude is already working on this fix", fixInProgressHint: "You'll get a before/after to approve as soon as it's ready. No need to ask again.", ok: "OK",
      keysTitle: "API keys", keysLocal: "stored on this computer only", keyName: "Key name", keyValue: "Paste the key", show: "Show", hide: "Hide", showKey: "Show or hide the key",
      saveKey: "Save", saving: "Saving…", keySaved: "Key saved", keyOk: "Connected: {a}", accountsWord: "accounts", required: "Required", connected: "OK", check: "CHECK", missing: "MISSING",
      replace: "Replace", addKey: "Add key", test: "Test", remove: "Remove", removed: "Key removed", removeConfirm: "Remove {k} from this computer?", whereKey: "Get it at", addOther: "Add another API key",
      keysSafe: "Keys are saved in the .env file in this folder, readable only by you. They never go into the chat and are never shown in full again.",
      npTitle: "New post", npSub: "Pick what goes in it. One photo = single post, several = carousel, one video = Reel.", npPaletteHint: "files · images · folder",
      npFromPc: "Photos or video", npFromPcHint: "from your computer", npFromMine: "My images", npFromMineHint: "made in Create an image", npFromFolder: "A post folder", npFromFolderHint: "already has the files",
      npFromImage: "New post", npFromImageHint: "Start a new post with this image", npCarouselFromMine: "Make a post or carousel from these",
      npMedia: "In this post", npDrop: "Nothing yet. Drop files here or use the buttons above.", npSingle: "Single image", npCarousel: "Carousel · {n} slides", npReel: "Reel",
      npEarlier: "Move earlier", npLater: "Move later", npName: "Post name", npWhere: "Saved in {f}", npCap: "Caption",
      npCapPh: "Optional. Leave empty and Claude writes it in your voice.", npCapHint: "With a caption the post opens right away; without one, Claude writes it first.",
      npCreateOpen: "Create post", npCreateClaude: "Create post · Claude writes the caption", npCreating: "Creating…", npUploading: "Uploading {i} of {n}…",
      npBadFile: "Use photos (JPG, PNG, WEBP), a video (MP4, MOV) or a PDF.", npMineHint: "Click images in the order you want them",
      npOpened: "Post opened: {f}", npClaudeWrites: "Folder {f} is ready. Claude is writing the caption…", npUseFolder: "Use this folder",
      npChat: "You can also just tell Claude in the chat, e.g. \"make a post from my-posts/robot\".", npOrType: "Or type a folder path:",
      imgTitle: "Create an image", imgSub: "Describe it, add pictures to guide it if you like, press Create. Images stay on this computer until you add them to a post.",
      jobsTitle: "Background jobs", jobsSub: "What's working behind the scenes, and how far along it is.", jobsRunning: "{n} running",
      jobsDoneShort: "Done", jobsNone: "Nothing running right now. Making images, publishing, uploads, key tests and Zernio refreshes show here while they work.",
      jobsFailed: "Didn't finish", jobsLost: "Stopped", jobsWorking: "working…", jobsFinished: "finished",
      jk_image: "Making images", jk_publish: "Publishing your post", jk_batch: "Scheduling posts", jk_upload: "Adding a file", jk_keytest: "Testing a key",
      jk_sync: "Refreshing from Zernio", jk_newpost: "Making a post folder", jk_claude: "Claude is working",
      imgShort: "Image", imgOpen: "Create image", imgNoKey: "Add your OpenAI key to create images", imgNoKeyHint: "Paste it below and press Save. It's tested right away.",
      imgStep1: "Describe the image", imgPh: "e.g. A lime-green paper airplane on a dark desk, soft light, minimal, room for a headline at the top",
      imgAsk: "Ask Claude to improve it", imgAsking: "Claude is writing a better prompt… it will appear here.", imgSuggested: "Claude suggests", imgUseIt: "Use this prompt",
      imgAskNeed: "Write a few words first, then Claude can turn them into a full prompt.", imgSugArrived: "Claude's prompt is ready",
      imgStep2: "Guide pictures", imgDrop: "Drop or paste pictures here, or click to pick. The new image will follow their style, people or products.",
      imgFromPc: "From computer", imgFromPost: "From this post", imgFromMine: "From my images", imgPickHint: "Click pictures to add or remove them", imgPickDone: "Done",
      imgStep3: "Options", imgShape: "Shape", shapeSquare: "Square", shapeTall: "Tall", shapeWide: "Wide",
      shapeHint_square: "Square: Instagram feed and carousels", shapeHint_tall: "Tall: stories and Reel covers", shapeHint_wide: "Wide: LinkedIn and banners", shapeHint_auto: "Auto shape",
      imgQuality: "Quality", qDraft: "Draft", qStandard: "Standard", qBest: "Best", qHint_draft: "Draft is fastest and cheapest, good for trying ideas", qHint_standard: "Standard suits most posts", qHint_best: "Best takes longer and costs more",
      imgCount: "How many", imgModel: "Model", imgModelsMain: "Models", imgModelsPinned: "Pinned versions (results don't change)", imgMakeDefault: "Keep these as my defaults", imgDefSaved: "Saved as your default",
      imgDefModel: "Image model", imgGo: "Create image", imgGoRefs: "Create image from {n} guide picture(s)", imgMaking: "Creating…", imgMakingN: "Creating {n}…",
      imgNeedPrompt: "Describe the image first.", imgWhere: "Ctrl+Enter also creates. Images are saved in .bps/images in this folder.",
      imgNew: "Just made", imgMine: "Your images", imgNone: "No images yet. Your first one will show up here.", imgGuides: "guides",
      imgAddPost: "Add to post", imgSaveFolder: "Save to folder", imgUseGuide: "Use as guide", imgUseGuideHint: "Add this image as a guide picture for the next one",
      imgAgain: "Again", imgAgainHint: "Fill in the same prompt and settings", imgAddedGuide: "Added as a guide picture",
      imgBadFile: "Use PNG, JPG or WEBP pictures.", imgMaxRefs: "Up to {n} guide pictures.", imgTooBig: "That picture is over 20 MB.",
      imgDone: "{n} image(s) ready in {s} s", imgFolderAsk: "Save into which folder? (inside this workspace; it's created if needed)",
      imgAddedPost: "Added to the post as {f}", imgSavedTo: "Saved to {f}", imgDelConfirm: "Delete this image? (it goes to .bps/trash)",
      keyNamePh: "e.g. MY_SERVICE_API_KEY", keyValuePh: "Paste the key here", keyFor: "Key for:", keyOther: "Other…",
      keyWillBe: "Will be saved as {n}.", keyGuessed: "(recognised from the key)", keyNeedName: "Pick OpenAI / Anthropic above, or type a name.",
      keySavedAs: "✓ Saved as {n}", keySavedBad: "Saved as {n}, but the test failed:", keyNoServer: "Can't reach the dashboard server. Is it still running?",
      keyConnected: "Connected", modelsWord: "models", notSet: "NOT SET", untested: "NOT TESTED", keyFailed: "FAILED", testing: "Testing…", tested: "tested",
      showModels: "Models", showAccounts: "Accounts", modelsNone: "No list yet. Press Test.", modelsFilter: "Filter models…", modelsNoMatch: "Nothing matches.",
      modelsImageOk: "This key can generate images ({n} image models).", modelsNoImage: "No image models on this key. Image generation may need a verified OpenAI organisation.",
      kind_all: "All", kind_image: "Image", kind_text: "Text", kind_video: "Video", kind_audio: "Audio", kind_embedding: "Embedding", kind_moderation: "Moderation", kind_account: "Account",
      step1: "Step 1 of setup", connectTitle: "Connect Zernio", connectHint: "Paste your Zernio API key here to connect Instagram and LinkedIn. Don't paste it in the chat.",
      connect1: "Sign in at", connect2: "Open Settings → API keys and create a key.", connect3: "Paste it below and press Save. We test it right away.", zernioKey: "Zernio API key",
      back: "Back", changes: "Changes", undo: "Undo", undone: "Undone", saved: "Saved", revert: "Revert", reverted: "Reverted",
      viaYou: "you, here", viaChat: "you, in chat", liveNoRevert: "This post is scheduled or live. Ask Claude to change it.",
      ch_captions: "Caption", ch_schedule: "Time", ch_cover: "Cover", ch_dm: "Gift", ch_settings: "Settings", ch_platforms: "Platforms",
      giftTitle: "DM gift for this post", giftHint: "People who comment the keyword get your gift in their DMs. It goes live only after you publish and say yes.",
      giftOn: "On", giftOff: "Off", giftKeyword: "Keyword they comment", giftMessage: "DM message", giftMsgPh: "Here's your gift…",
      giftLink: "Link (optional)", giftBtn: "Button text", giftBtnPh: "Get it", giftGate: "They must follow you first", giftReply: "Public reply (optional)",
      giftReplyPh: "Sent! Check your DMs", save: "Save", giftSavedOn: "Gift is on", giftSavedOff: "Gift is off",
      peakByDay: "Peak times by day", peakHint: "From your own posts. Lift = engagement vs your average. n = posts behind it.",
      day: "Day", peak1: "Best", peak2: "2nd", postsThatDay: "Posts", conf_high: "High", conf_medium: "Medium", conf_low: "Low",
      confHint: "Confidence: High = 5+ posts, Medium = 3-4, Low = fewer than 3", audClocks: "Your audience's clocks", bestLocal: "Best slot in their time:",
      audOk: "{p}% of your audience shares your clock.", evPosts: "Based on {n} of your posts", vsAvg: "vs your average", localFor: "Their local time:",
      tabPlan: "Plan", planHint: "Click a day or an hour to schedule, move or plan a post.", settings: "Settings", close: "Close", prefs: "Preferences",
      language: "Language", timeFormat: "Time format", theme: "Theme", version: "Version", cmdShort: "Search", navigate: "navigate", run: "run",
      jTitle: "Your post's path", jCheck: "Check", jCover: "Cover", jTime: "Time", jGift: "Gift", jGo: "Go", jToFix: "to fix", jAllGood: "all good",
      jSet: "set", jNeeded: "needed", jPick: "pick a time", jOptional: "optional", jScheduled: "scheduled", jTypeGo: "type go", jLast: "last step",
      jNext: "Next", jAllDone: "All done", jCoverNote: "Make cover options for this Reel (frames and a design).",
      jGiftNote: "Ask me whether to add a DM gift to this post.", jGoNote: "I'm ready. Ask me to publish (I'll type go).",
      cNext: "Do the next step", cFix: "Fix the checks", cCover: "Choose a cover", cTime: "Pick a time", cGift: "Add a DM gift", cGo: "Publish (type go)",
      cTheme: "Switch light / dark", cClock: "Switch 12h / 24h", cLang: "Switch language", cPh: "Type a command… (cover, fix, time, dark)", noMatch: "No match",
      clickToFix: "Click to ask Claude for a fix", fixIt: "Fix", fixAsked: "Asked", fixKicker: "Fix this check", fixNotePh: "e.g. keep my tone, only change the first line",
      fixHow: "Claude will write a fix and show you a before/after. You can approve it, edit it, or reject it.", askFix: "Ask Claude for a fix",
      fixSent: "Claude is writing a fix", listening: "Claude is listening", away: "Claude Code is closed", working: "Claude is working",
      workingHint: "Claude Code is open and busy with a request. New requests are picked up as soon as it finishes.",
      claudeSays: "Claude says", chatReplyPh: "Type your answer…", chatAnswer: "Your answer", chatReplyOpt: "Reply (optional)", gotIt: "Got it", chatOpen: "Open chat",
      chatTitle: "Chat with Claude", chatHint: "Ask, give instructions, or answer Claude. Replies show up here and as a pop-up.", chatEmpty: "No messages yet. Write the first one below.",
      chatYou: "You", chatSeen: "✓ Claude got it", chatWaiting: "Waiting for Claude…",
      listeningHint: "Requests from this page reach Claude right away.", awayHint: "Claude Code isn't running. Your requests are saved and wait until you open Claude Code here and run /200bps-publish.",
      dayHint: "Click, double-click or right-click", dayPast: "Past day", dayPlan: "Plan this day", dayPublished: "Published", dayScheduled: "Scheduled",
      dayNothing: "Nothing was published this day.", getReport: "Get full report", pickTime: "Pick a time", anyHour: "Any hour…", pickHour: "Pick a time first.",
      choosePost: "Choose a scheduled post", chooseIdea: "Choose an idea", dayIdea: "Plan a post from an idea", dayIdeaBtn: "Ask Claude to draft it",
      keySched: "scheduled post", keyPlan: "this post", keyClick: "Click any slot to schedule", slotKicker: "Time slot", ofBest: "of your best slot",
      noHistory: "no history yet", nextOn: "Next:", slotPlan: "Schedule this post here", slotPlanBtn: "Use this slot", slotPlanned: "Scheduled. Type go to publish.",
      slotNoPlan: "No unpublished post is loaded.", slotMove: "Move a scheduled post here", slotMoveBtn: "Ask Claude to move it", slotNoSched: "No scheduled posts.",
      slotAssign: "Assign a post folder to this slot", slotAssignBtn: "Send to Claude", slotQueued: "Sent to Claude", toDark: "Dark mode", toLight: "Light mode",
      low: "Low", high: "High", bestSlot: "best time", best: "Best", second: "2nd best", third: "3rd best",
      cover: "Cover", gridView: "Grid view", noCover: "No cover yet", candidates: "Options", noCands: "Ask Claude for frames or a design.",
      needsYou: "Claude needs your decision", later: "Later", send: "Send", anythingElse: "Anything else?", notePh: "Optional: extra instructions for Claude",
      typeAnswer: "Type your answer", orType: "Or type your own", yourAnswer: "Your answer", pickOne: "Pick an option or type an answer.",
      sent: "Sent to Claude", decisionWaiting: "1 decision waiting", publishNow: "Publish", typeGo: "Type “{w}” to confirm",
      before: "Before", after: "After", approve: "Approve", reject: "Reject", edit: "Edit", saveEdit: "Use my edit",
      noteFab: "Note to Claude", noteShort: "Note", noteKicker: "Message", noteTitle: "Note to Claude", noteHint: "Anything you want Claude to change or know. It reads this before the next step.",
      notePh2: "e.g. use frame 4, make the headline shorter, post on LinkedIn too", noteSent: "Note sent", cancel: "Cancel",
      tabAbout: "About", aboutKicker: "About this tool", aboutTitle: "200BPS Publish",
      aboutMade: "Vibe-coded by Nasser Al-Ostath with Claude Code.",
      aboutWhat: "It checks your post, finds your best time from your own data, and publishes to Instagram and LinkedIn. Nothing goes live until you say so.",
      aboutFree: "Free to use. Share it with anyone.", aboutHow: "How to use it",
      aboutStep1: "Put your caption and media in one folder.",
      aboutStep2: "In Claude Code, type /200bps-publish and the folder name.",
      aboutStep3: "Review everything here, then type “go” in Claude Code.",
      aboutContactTitle: "Have an AI idea or project?", aboutContact: "Let's talk. I help people and teams learn and build with AI.",
      aboutRole: "Founder, 200BPS.ai · Kuwait", aboutName: "Nasser Al-Ostath",
      ages: "Age", gender: "Gender", cities: "Top cities", countries: "Top countries", male: "Male", female: "Female", unknown: "Unknown",
      milestone: "Milestone reached", days: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
      daysN: "{n} days", followGated: "follow-gated", iceBreakers: "Ice breakers", postWord: "post", trialShort: "Trial",
      calPrev: "Previous month", calNext: "Next month", calToday: "Today", calMore: "+{n} more",
      goalHow: "How this goal works", goalSet: "Your goal: {g} followers.", goalSrc: "You set it during setup. Change it anytime.",
      goalNow: "{c} now · {r} to go", goalReached: "Goal reached. Pick the next one.", goalLive: "Progress comes from your follower count in Zernio and updates with every refresh.",
      goalEdit: "Change goal", goalPh: "e.g. 1000", goalQuick: "Quick picks", goalSaved: "Goal updated", goalBad: "Enter a number above your current followers.",
      goalTitle: "Your follower goal", goalNeed: "Connect Zernio to track progress.",
      bBtn: "Batch schedule", bKicker: "Batch schedule", bS1: "Pick posts", bS2: "Set times", bS3: "Go",
      bPickTitle: "Which posts should go out?", bPickHint: "Every folder in this workspace that has a caption. Tick the ones to schedule.",
      bAllNew: "Select all new", bNone: "Clear", bSel: "{n} selected", bNext2: "Next: set times", bNext3: "Next: review",
      bEmpty: "No post folders found here. Make one folder per post with a caption.txt and its images or video.",
      bSent: "Already sent", bChecking: "Checking {n} posts…", bTimesTitle: "When should each one go out?",
      bTimesHint: "Drag to change the order. Each post gets the next slot; edit any time directly.",
      bStart: "Start", bRhythm: "How often", bEvery1: "Every day", bEvery2: "Every 2 days", bDays: "Pick days", bTime: "Time",
      bBest: "My best times", bFixed: "Same time", bSkip: "Skip days that already have a post", bTz: "Times are in {tz}",
      bBasisBest: "best {d} · +{l}% · n={n}", bBasisOverall: "your best overall slot · +{l}%", bBasisFixed: "your chosen time",
      bBasisEdited: "set by you", bLow: "low confidence", bRemove: "Remove", bFixAsk: "Ask Claude to fix",
      bBlocked: "Can't be scheduled yet:", bNoSlots: "Not enough free days in that range. Pick more days or turn off skipping.",
      bReviewTitle: "Schedule {n} posts?", bReviewHint: "Each post is created in Zernio as scheduled. Nothing goes out now, and you can move or cancel any of them later in Zernio.",
      bGo: "Schedule {n} posts", bWorking: "Scheduling…", bQueued: "waiting", bSending: "uploading", bDone: "scheduled", bFailed: "failed",
      bAllDone: "{n} posts scheduled", bSomeFailed: "{ok} scheduled, {bad} failed", bSeeCal: "See them in the calendar",
      bRunning: "A batch is being scheduled", bMoveUp: "Move up", bMoveDown: "Move down", bBack: "Back",
      cKicker: "Cancel", cSchedQ: "Cancel this post?", cPubQ: "Remove this published post?", cDraftQ: "Delete this draft?",
      cSchedHow: "It's removed from Zernio and won't go out. Your folder and draft stay, so you can schedule it again anytime.",
      cSending: "It's being sent right now. A part that has already started may still go out.",
      cWillRemove: "will be removed from this network", cManual: "Instagram doesn't let apps delete posts. Delete it in the Instagram app (open the post → ⋯ → Delete).",
      cDraftHow: "Only the draft on this computer is set aside (in .bps/trash). Your folder and files are not touched.",
      cKeep: "Keep it", cCancelBtn: "Cancel post", cRemoveBtn: "Remove it", cDelDraft: "Delete draft", cCancelShort: "Cancel…", cDelShort: "Delete…",
      cDoneSched: "Cancelled: it won't go out. The draft is kept under Not uploaded.", cDoneRemoved: "Removed from {p}.", cDoneManual: "Delete it on {p} by hand.",
      cDraftGone: "Draft deleted", cGone: "That post isn't in the list anymore. Refresh from Zernio.",
      cPickTitle: "Cancel a post", cPickHint: "Pick what to cancel. You'll confirm on the next screen.", cPickSched: "Scheduled and pending", cPickDrafts: "Drafts not uploaded",
      cPickPub: "Published posts: open one in Posts and choose Remove.", cThis: "Cancel this post",
      tipsLabel: "Hover tips", guideTitle: "Guide: every feature", guideHint: "Rest the mouse on anything for a quick tip.",
      bBrowse: "Browse…", bBrowseWait: "Pick one or more folders in the window that just opened…", bAdded: "Added {n} post folders",
      bNoneFound: "No post folders in what you chose. A post folder has a caption.txt with its images or video.",
      bExplorer: "Folder browser", bUp: "Up", bHome: "Home", bWs: "This workspace", bAddSel: "Add {n}", bPostTag: "post",
      bExplorerHint: "Tick post folders, or a folder that holds many posts. Click a name to open it.", bDone: "Done",
    },
    ar: {
      kicker: "200 اختراق في الثانية", heroTitle: "انشر بذكاء. وانمُ أسرع.",
      heroSub: "حساباتك ومحتواك في شاشة وحدة. ما ينشر أي شي إلا بعد موافقتك في المحادثة.",
      tabPost: "البوست", tabGrowth: "النمو", tabCalendar: "التقويم", tabInbox: "الرسائل", tabIdeas: "أفكار", tabSystem: "النظام",
      preview: "معاينة", checks: "الفحوصات", score: "تقييم البوست", plan: "الخطة", bestTime: "أفضل وقت",
      followers: "المتابعين", goal: "الهدف", topPosts: "أفضل البوستات", rankedBy: "حسب المتابعات ثم الحفظ والمشاركة",
      heatmap: "متى يتفاعل جمهورك", audience: "الجمهور", comments: "تعليقات تنتظر رد", automations: "رسائل تلقائية",
      ideaBank: "بنك الأفكار", ideaHint: "من أفضل بوستاتك", readiness: "الجاهزية", accounts: "الحسابات المربوطة",
      credit: "هدية مجانية من ناصر الأستاذ. تعلّم وابنِ الـAI معنا.",
      awaiting: "جاهز. اكتب «go» في النافذة أو في Claude Code للنشر.",
      published: "تم النشر", scheduled: "مجدول في", draft: "مسودة: الوكيل لسه يجهز البوست.",
      noPlan: "ما في بوست مفتوح. ابدأ واحد تحت، أو كمّل مسودة من المنشورات.",
      streak: "يوم متواصل", sinceLast: "من آخر زيارة", newFollowers: "متابع", newComments: "تعليق جديد",
      noData: "ما في بيانات للحين.", zernioOff: "Zernio مو مربوط للحين. كمّل الإعداد في المحادثة.",
      reach7: "الوصول · 7 أيام", views7: "المشاهدات · 7 أيام", eng7: "التفاعل · 7 أيام", follows7: "متابعين جدد · 7 أيام",
      platforms: "المنصات", when: "الموعد", type: "النوع", trial: "Trial Reel", cover: "الغلاف", location: "الموقع",
      firstComment: "أول تعليق", collab: "تعاون", dmGift: "هدية بالخاص", off: "مطفي", on: "شغّال", now: "الحين",
      basisData: "من بياناتك", basisNone: "البيانات ما تكفي",
      ready: "جاهز", issues: "ملاحظات", post: "البوست", reach: "الوصول", saves: "حفظ", shares: "مشاركة", follows: "متابعة",
      ideaOpen: "التفاصيل", ideaKicker: "فكرة", ideaHook: "الافتتاحية", ideaWhy: "ليش بتنجح", ideaOutline: "المخطط", ideaCta: "الدعوة للتفاعل",
      ideaTags: "الهاشتاقات", ideaWhen: "الوقت المقترح", ideaBased: "مستوحاة من", ideaDrop: "مو لي", ideaPlan: "خطط لها بيوم", ideaPickDay: "اختار يوم من التقويم",
      kind_carousel: "كاروسيل", kind_reel: "ريل", kind_video: "فيديو", kind_short: "شورت", kind_story: "ستوري", kind_document: "مستند",
      kind_article: "مقال", kind_text: "نص", kind_post: "بوست", zOutside: "انتشر برا Zernio", zAccounts: "الحسابات", zAllAccounts: "كل الحسابات",
      accKicker: "الحسابات", accTitle: "اربط حساب سوشال ميديا", accHint: "سجّل دخول في موقع الشبكة نفسها ووافق. Zernio يحفظ الربط، والسكل ما يشوف كلمة السر أبداً.",
      accNotConnected: "مو مربوط", accConnect: "اربط", accReconnect: "أعد الربط", accAddAnother: "أضف حساب ثاني", accSoon: "قريباً", accConnectShort: "اربط حساب",
      accWaiting: "بانتظار {n}…", accW1: "انفتحت صفحة الدخول الآمنة", accW2: "وافق على الصلاحية في {n} (بالتبويب الجديد)", accW3: "انحفظ وجاهز للنشر",
      accPrivacy: "كلمة السر تروح للشبكة بس. خل هالنافذة مفتوحة؛ بتتحدث بروحها أول ما تخلص.", accOpenAgain: "افتح صفحة الدخول مرة ثانية",
      accDone: "انربط: {a}. جاهز للنشر.",
      zGrid: "شبكة", zList: "قائمة", zViewLabel: "العرض", ideaGet: "اطلب أفكار", ideaMore: "أفكار أكثر", ideaTopicPh: "موضوع اختياري، مثلاً: AI Agents للمبتدئين",
      ideaEmptyTitle: "ما في أفكار للحين", ideaEmptyHint: "Claude يدرس أفضل بوستاتك في Zernio (المتابعات، الحفظ، المشاركة) ويقترح 5 بوستات مع افتتاحية ومخطط وأفضل وقت. وتتجدد بعد كل نشر.",
      ideaComing: "Claude قاعد يشتغل عليها. بتطلع الأفكار هني بعد شوي.", ideaQueued: "انرسلت. بتطلع الأفكار أول ما تفتح Claude Code.",
      ideaSt_drafted: "انكتبت", ideaSt_posted: "انتشرت", ideaTopicsBasis: "مو مبنية على نتائج للحين",
      pubTitle: "تنشر هالبوست؟", pubHint: "بيترفع على Zernio وهو ينشره بالموعد تحت. بعدها نقراه من Zernio عشان نتأكد إنه موجود.",
      pubNow: "الحين", pubBlocked: "صلّح هذي أول:", pubBtn: "انشر", pubWorking: "قاعد ينشر…", pubS1: "رفع الصور/الفيديو", pubS2: "فحص مع Zernio",
      pubS3: "إنشاء البوست", pubS4: "التأكد من Zernio", pubDontClose: "خل النافذة مفتوحة لحظة.", pubFailed: "ما انتشر",
      pubFailedHint: "ما انتشر شي. صلّح المشكلة وانشر مرة ثانية، أو اطلب مساعدة Claude.", pubDoneSched: "انرفع على Zernio وانجدول",
      pubDonePub: "انرفع على Zernio وانتشر", pubVerified: "تم التأكد: قرينا البوست من حسابك في Zernio.",
      pubNotVerified: "انسوى في Zernio بس ما قدرنا نقراه. شيّك تبويب المنشورات بعد شوي.", zPostId: "بوست Zernio", zStatus: "الحالة في Zernio",
      pubGiftOn: "الهدية شغّالة: علّق «{k}».", pubGiftFail: "البوست نزل بس الهدية فشلت:", openZernio: "افتح Zernio", seeInPosts: "شوفه في المنشورات",
      newPost: "بوست جديد", newPostQ: "تبدأ بوست جديد؟", newPostKeep: "هالبوست بينحط على جنب، ما بينحذف. تلقاه في المنشورات ← ما انرفع، وتقدر تكمّله أي وقت.",
      newPostKeepShort: "بداية جديدة؛ ما ينحذف شي", newPostGo: "ابدأ من جديد", newPostDone: "جاهز لبوست جديد", newPostTitle: "ابدأ بوست جديد",
      newPostHow: "سوّ مجلد فيه الصورة أو الفيديو وملف caption.txt، وبعدين أرسل اسم المجلد لـClaude (أو اكتب ‎/200bps-publish‎ واسم المجلد بالمحادثة).",
      newPostSend: "أرسل لـClaude", newPostNeedFolder: "اكتب اسم المجلد أول.", newPostDrafts: "عندك {n} مسودة ما انرفعت للحين.",
      tabPosts: "المنشورات", zTitle: "حسابك في Zernio", zRefresh: "تحديث من Zernio", zRefreshing: "قاعد يحدّث…", zUpdated: "انحدّث من Zernio", synced: "آخر تحديث",
      zAll: "الكل", zNotUploaded: "ما انرفع للحين", zAttention: "يحتاج انتباه", zNone: "ما في شي هني.", reconnect: "أعد الربط في Zernio",
      stLocal: "ما انرفع", stAwaiting: "ينتظر go", stDraft: "مسودة في Zernio", stScheduled: "مجدول", stPublishing: "قاعد ينشر", stPublished: "منشور",
      stPartial: "منشور جزئياً", stFailed: "فشل", stCancelled: "ملغي", stPending: "بالانتظار",
      openPost: "افتح", zContinue: "كمّل هالبوست", zOpenPlan: "افتح الخطة", zAskFix: "اطلب من Claude يصلحه", zLocalHint: "مسودة محلية، على هالجهاز بس",
      zFromSkill: "انرسل من السكل", zFromZernio: "في حسابك بـZernio",
      fixInProgress: "Claude قاعد يشتغل على هالتصحيح", fixInProgressHint: "بيوصلك قبل/بعد توافق عليه أول ما يجهز. لا تطلبه مرة ثانية.", ok: "تمام",
      keysTitle: "مفاتيح API", keysLocal: "محفوظة على هالجهاز بس", keyName: "اسم المفتاح", keyValue: "الصق المفتاح", show: "إظهار", hide: "إخفاء", showKey: "إظهار أو إخفاء المفتاح",
      saveKey: "حفظ", saving: "قاعد يحفظ…", keySaved: "انحفظ المفتاح", keyOk: "متصل: {a}", accountsWord: "حسابات", required: "مطلوب", connected: "تمام", check: "راجع", missing: "ناقص",
      replace: "استبدال", addKey: "أضف مفتاح", test: "اختبار", remove: "حذف", removed: "انحذف المفتاح", removeConfirm: "تحذف {k} من هالجهاز؟", whereKey: "تحصله من", addOther: "أضف مفتاح API ثاني",
      keysSafe: "المفاتيح تنحفظ في ملف ‎.env‎ بهالمجلد، وأنت بس تقدر تقراه. ما تروح للمحادثة وما تنعرض كاملة مرة ثانية.",
      npTitle: "بوست جديد", npSub: "اختار شنو فيه. صورة وحدة = بوست عادي، كم صورة = كاروسيل، فيديو واحد = ريل.", npPaletteHint: "ملفات · صور · مجلد",
      npFromPc: "صور أو فيديو", npFromPcHint: "من جهازك", npFromMine: "صوري", npFromMineHint: "اللي سويتها في سوّ صورة", npFromFolder: "مجلد بوست", npFromFolderHint: "فيه الملفات أصلاً",
      npFromImage: "بوست جديد", npFromImageHint: "ابدأ بوست جديد بهالصورة", npCarouselFromMine: "سوّ بوست أو كاروسيل منها",
      npMedia: "في هالبوست", npDrop: "ما في شي للحين. اسحب الملفات هني أو استخدم الأزرار فوق.", npSingle: "صورة وحدة", npCarousel: "كاروسيل · {n} شرائح", npReel: "ريل",
      npEarlier: "قدّمها", npLater: "أخّرها", npName: "اسم البوست", npWhere: "ينحفظ في {f}", npCap: "الكابشن",
      npCapPh: "اختياري. خله فاضي وClaude يكتبه بأسلوبك.", npCapHint: "إذا فيه كابشن البوست ينفتح على طول، وإذا لا Claude يكتبه أول.",
      npCreateOpen: "سوّ البوست", npCreateClaude: "سوّ البوست · Claude يكتب الكابشن", npCreating: "قاعد يسوي…", npUploading: "قاعد يرفع {i} من {n}…",
      npBadFile: "استخدم صور (JPG, PNG, WEBP) أو فيديو (MP4, MOV) أو PDF.", npMineHint: "اضغط الصور بالترتيب اللي تبيه",
      npOpened: "انفتح البوست: {f}", npClaudeWrites: "المجلد {f} جاهز. Claude قاعد يكتب الكابشن…", npUseFolder: "استخدم هالمجلد",
      npChat: "تقدر بعد تقول لClaude بالمحادثة، مثلاً: «سوّ بوست من my-posts/robot».", npOrType: "أو اكتب مسار المجلد:",
      imgTitle: "سوّ صورة", imgSub: "اوصفها، وإذا تبي حط صور ترشدها، واضغط سوّ. الصور تبقى بجهازك لين تضيفها لبوست.",
      jobsTitle: "الشغل بالخلفية", jobsSub: "شنو قاعد يشتغل ورا الكواليس، ووين وصل.", jobsRunning: "{n} شغّال",
      jobsDoneShort: "خلص", jobsNone: "ما في شي شغّال الحين. الصور، النشر، رفع الملفات، فحص المفاتيح وتحديث Zernio يطلعون هني وهم يشتغلون.",
      jobsFailed: "ما كمل", jobsLost: "وقف", jobsWorking: "يشتغل…", jobsFinished: "خلص",
      jk_image: "صنع صور", jk_publish: "نشر البوست", jk_batch: "جدولة بوستات", jk_upload: "إضافة ملف", jk_keytest: "فحص مفتاح",
      jk_sync: "تحديث من Zernio", jk_newpost: "مجلد بوست جديد", jk_claude: "طلب لـClaude",
      imgShort: "صورة", imgOpen: "سوّ صورة", imgNoKey: "أضف مفتاح OpenAI عشان تسوي صور", imgNoKeyHint: "الصقه تحت واضغط حفظ. ينختبر على طول.",
      imgStep1: "اوصف الصورة", imgPh: "مثلاً: طيارة ورق لونها ليموني على مكتب غامق، إضاءة ناعمة، بسيطة، وفي مكان للعنوان فوق",
      imgAsk: "خل Claude يحسّنه", imgAsking: "Claude قاعد يكتب وصف أحسن… بيطلع هني.", imgSuggested: "اقتراح Claude", imgUseIt: "استخدم هالوصف",
      imgAskNeed: "اكتب كم كلمة أول، وClaude يحولها لوصف كامل.", imgSugArrived: "وصف Claude جاهز",
      imgStep2: "صور مرشدة", imgDrop: "اسحب أو الصق الصور هني، أو اضغط عشان تختار. الصورة الجديدة بتمشي على أسلوبها أو الأشخاص أو المنتجات اللي فيها.",
      imgFromPc: "من الجهاز", imgFromPost: "من هالبوست", imgFromMine: "من صوري", imgPickHint: "اضغط على الصور عشان تضيفها أو تشيلها", imgPickDone: "تم",
      imgStep3: "الخيارات", imgShape: "الشكل", shapeSquare: "مربع", shapeTall: "طولي", shapeWide: "عرضي",
      shapeHint_square: "مربع: فيد إنستقرام والكاروسيل", shapeHint_tall: "طولي: الستوري وكفر الريل", shapeHint_wide: "عرضي: لينكدإن والبنرات", shapeHint_auto: "شكل تلقائي",
      imgQuality: "الجودة", qDraft: "مسودة", qStandard: "عادية", qBest: "أفضل", qHint_draft: "المسودة أسرع وأرخص، حلوة للتجربة", qHint_standard: "العادية تناسب أغلب البوستات", qHint_best: "الأفضل تاخذ وقت أطول وتكلف أكثر",
      imgCount: "كم وحدة", imgModel: "الموديل", imgModelsMain: "الموديلات", imgModelsPinned: "نسخ ثابتة (النتيجة ما تتغير)", imgMakeDefault: "خلها الإعدادات الافتراضية", imgDefSaved: "انحفظت كافتراضي",
      imgDefModel: "موديل الصور", imgGo: "سوّ الصورة", imgGoRefs: "سوّ الصورة من {n} صورة مرشدة", imgMaking: "قاعد يسوي…", imgMakingN: "قاعد يسوي {n}…",
      imgNeedPrompt: "اوصف الصورة أول.", imgWhere: "Ctrl+Enter بعد يسويها. الصور تنحفظ في ‎.bps/images‎ بهالمجلد.",
      imgNew: "توها انسوت", imgMine: "صورك", imgNone: "ما في صور للحين. أول وحدة بتطلع هني.", imgGuides: "مرشدة",
      imgAddPost: "أضفها للبوست", imgSaveFolder: "احفظ بمجلد", imgUseGuide: "استخدمها كمرشدة", imgUseGuideHint: "أضف هالصورة كمرشدة للصورة الجاية",
      imgAgain: "مرة ثانية", imgAgainHint: "عبّي نفس الوصف والإعدادات", imgAddedGuide: "انضافت كصورة مرشدة",
      imgBadFile: "استخدم صور PNG أو JPG أو WEBP.", imgMaxRefs: "لين {n} صور مرشدة.", imgTooBig: "الصورة أكبر من 20 ميقا.",
      imgDone: "{n} صورة جاهزة في {s} ثانية", imgFolderAsk: "تحفظها بأي مجلد؟ (داخل هالمجلد، وينسوى إذا مو موجود)",
      imgAddedPost: "انضافت للبوست باسم {f}", imgSavedTo: "انحفظت في {f}", imgDelConfirm: "تحذف هالصورة؟ (تروح لـ ‎.bps/trash‎)",
      keyNamePh: "مثلاً MY_SERVICE_API_KEY", keyValuePh: "الصق المفتاح هني", keyFor: "مفتاح لـ:", keyOther: "غيره…",
      keyWillBe: "بينحفظ باسم {n}.", keyGuessed: "(عرفناه من شكل المفتاح)", keyNeedName: "اختار OpenAI / Anthropic فوق، أو اكتب اسم.",
      keySavedAs: "✓ انحفظ باسم {n}", keySavedBad: "انحفظ باسم {n}، بس الاختبار فشل:", keyNoServer: "ما قدرنا نوصل لسيرفر اللوحة. للحين شغّال؟",
      keyConnected: "متصل", modelsWord: "موديل", notSet: "مو مضاف", untested: "ما انختبر", keyFailed: "فشل", testing: "قاعد يختبر…", tested: "انختبر",
      showModels: "الموديلات", showAccounts: "الحسابات", modelsNone: "ما في قائمة للحين. اضغط اختبار.", modelsFilter: "دوّر موديل…", modelsNoMatch: "ما في شي يطابق.",
      modelsImageOk: "هالمفتاح يقدر يولّد صور ({n} موديل صور).", modelsNoImage: "ما في موديلات صور على هالمفتاح. يمكن تحتاج توثيق منظمتك في OpenAI.",
      kind_all: "الكل", kind_image: "صور", kind_text: "نص", kind_video: "فيديو", kind_audio: "صوت", kind_embedding: "Embedding", kind_moderation: "فلترة", kind_account: "حساب",
      step1: "الخطوة 1 من الإعداد", connectTitle: "اربط Zernio", connectHint: "الصق مفتاح Zernio هني عشان تربط Instagram وLinkedIn. لا تلصقه بالمحادثة.",
      connect1: "سجّل دخول في", connect2: "افتح Settings ← API keys وسوّ مفتاح.", connect3: "الصقه تحت واضغط حفظ. بنختبره على طول.", zernioKey: "مفتاح Zernio",
      back: "رجوع", changes: "التغييرات", undo: "تراجع", undone: "تم التراجع", saved: "انحفظ", revert: "استرجاع", reverted: "تم الاسترجاع",
      viaYou: "أنت، هني", viaChat: "أنت، بالمحادثة", liveNoRevert: "البوست مجدول أو منشور. اطلب من Claude يغيّره.",
      ch_captions: "الكابشن", ch_schedule: "الوقت", ch_cover: "الغلاف", ch_dm: "الهدية", ch_settings: "الإعدادات", ch_platforms: "المنصات",
      giftTitle: "هدية بالخاص لهالبوست", giftHint: "اللي يكتب الكلمة بالتعليقات يوصله هديتك بالخاص. ما تشتغل إلا بعد النشر وموافقتك.",
      giftOn: "شغّال", giftOff: "مطفي", giftKeyword: "الكلمة اللي يكتبونها", giftMessage: "رسالة الخاص", giftMsgPh: "هذي هديتك…",
      giftLink: "رابط (اختياري)", giftBtn: "نص الزر", giftBtnPh: "خذها", giftGate: "لازم يتابعونك أول", giftReply: "رد عام (اختياري)",
      giftReplyPh: "أرسلتها لك بالخاص", save: "حفظ", giftSavedOn: "الهدية شغّالة", giftSavedOff: "الهدية مطفية",
      peakByDay: "أفضل الأوقات لكل يوم", peakHint: "من بوستاتك أنت. الزيادة = التفاعل مقارنة بمعدلك. n = عدد البوستات.",
      day: "اليوم", peak1: "الأفضل", peak2: "الثاني", postsThatDay: "البوستات", conf_high: "عالية", conf_medium: "متوسطة", conf_low: "قليلة",
      confHint: "الثقة: عالية = 5+ بوستات، متوسطة = 3-4، قليلة = أقل من 3", audClocks: "ساعات جمهورك", bestLocal: "أفضل وقت بتوقيتهم:",
      audOk: "{p}% من جمهورك على نفس توقيتك.", evPosts: "مبني على {n} من بوستاتك", vsAvg: "مقارنة بمعدلك", localFor: "بتوقيتهم:",
      tabPlan: "الخطة", planHint: "اضغط على يوم أو ساعة عشان تجدول أو تنقل أو تخطط بوست.", settings: "الإعدادات", close: "إغلاق", prefs: "التفضيلات",
      language: "اللغة", timeFormat: "صيغة الوقت", theme: "المظهر", version: "الإصدار", cmdShort: "بحث", navigate: "تنقّل", run: "تنفيذ",
      jTitle: "مسار البوست", jCheck: "فحص", jCover: "غلاف", jTime: "وقت", jGift: "هدية", jGo: "نشر", jToFix: "للتصحيح", jAllGood: "كله تمام",
      jSet: "جاهز", jNeeded: "مطلوب", jPick: "اختار وقت", jOptional: "اختياري", jScheduled: "مجدول", jTypeGo: "اكتب go", jLast: "آخر خطوة",
      jNext: "التالي", jAllDone: "خلصنا", jCoverNote: "سوّ خيارات غلاف لهالريل (لقطات وتصميم).",
      jGiftNote: "اسألني إذا أبي أضيف هدية بالخاص لهالبوست.", jGoNote: "أنا جاهز. اطلب مني النشر (بكتب go).",
      cNext: "سوّ الخطوة الجاية", cFix: "صحّح الفحوصات", cCover: "اختار غلاف", cTime: "اختار وقت", cGift: "أضف هدية بالخاص", cGo: "انشر (اكتب go)",
      cTheme: "بدّل فاتح / داكن", cClock: "بدّل 12 / 24 ساعة", cLang: "بدّل اللغة", cPh: "اكتب أمر… (غلاف، تصحيح، وقت)", noMatch: "ما في نتيجة",
      clickToFix: "اضغط عشان تطلب تصحيح من Claude", fixIt: "صحّح", fixAsked: "انطلب", fixKicker: "صحّح هذا الفحص", fixNotePh: "مثلاً: خل نفس أسلوبي، غيّر أول سطر بس",
      fixHow: "Claude بيكتب تصحيح ويوريك قبل وبعد. تقدر توافق، تعدّل، أو ترفض.", askFix: "اطلب تصحيح من Claude",
      fixSent: "Claude قاعد يكتب التصحيح", listening: "Claude يسمعك", away: "Claude Code مسكّر", working: "Claude قاعد يشتغل",
      workingHint: "Claude Code مفتوح ومشغول بطلب. الطلبات الجديدة يشوفها أول ما يخلص.",
      claudeSays: "Claude يقول", chatReplyPh: "اكتب ردك…", chatAnswer: "ردك", chatReplyOpt: "رد (اختياري)", gotIt: "تمام", chatOpen: "افتح المحادثة",
      chatTitle: "محادثة مع Claude", chatHint: "اسأل، عط تعليمات، أو رد على Claude. ردوده تطلع هني وكنافذة منبثقة.", chatEmpty: "ما فيه رسائل للحين. اكتب أول وحدة تحت.",
      chatYou: "أنت", chatSeen: "✓ وصلت Claude", chatWaiting: "ينتظر Claude…",
      listeningHint: "أي طلب من هالصفحة يوصل لـClaude فوراً.", awayHint: "Claude Code مو شغّال. طلباتك محفوظة وتنتظر لين تفتح Claude Code هني وتشغّل /200bps-publish.",
      dayHint: "اضغط، أو اضغط مرتين، أو كليك يمين", dayPast: "يوم سابق", dayPlan: "خطط لهاليوم", dayPublished: "منشور", dayScheduled: "مجدول",
      dayNothing: "ما انتشر شي هاليوم.", getReport: "التقرير الكامل", pickTime: "اختار الوقت", anyHour: "أي ساعة…", pickHour: "اختار الوقت أول.",
      choosePost: "اختار بوست مجدول", chooseIdea: "اختار فكرة", dayIdea: "خطط بوست من فكرة", dayIdeaBtn: "خل Claude يكتبه",
      keySched: "بوست مجدول", keyPlan: "هذا البوست", keyClick: "اضغط على أي خانة للجدولة", slotKicker: "خانة وقت", ofBest: "من أفضل خانة",
      noHistory: "ما في بيانات", nextOn: "القادم:", slotPlan: "جدول هذا البوست هني", slotPlanBtn: "استخدم هالوقت", slotPlanned: "تمت الجدولة. اكتب go للنشر.",
      slotNoPlan: "ما في بوست غير منشور.", slotMove: "انقل بوست مجدول لهني", slotMoveBtn: "اطلب من Claude ينقله", slotNoSched: "ما في بوستات مجدولة.",
      slotAssign: "خصص مجلد بوست لهالوقت", slotAssignBtn: "أرسل لـClaude", slotQueued: "وصلت لـClaude", toDark: "الوضع الداكن", toLight: "الوضع الفاتح",
      low: "قليل", high: "عالي", bestSlot: "أفضل وقت", best: "الأفضل", second: "الثاني", third: "الثالث",
      cover: "الغلاف", gridView: "عرض الشبكة", noCover: "ما في غلاف للحين", candidates: "الخيارات", noCands: "اطلب من Claude لقطات أو تصميم.",
      needsYou: "Claude يحتاج قرارك", later: "بعدين", send: "إرسال", anythingElse: "أي شي ثاني؟", notePh: "اختياري: تعليمات إضافية لـClaude",
      typeAnswer: "اكتب جوابك", orType: "أو اكتب جوابك", yourAnswer: "جوابك", pickOne: "اختار خيار أو اكتب جواب.",
      sent: "وصلت لـClaude", decisionWaiting: "قرار واحد ينتظرك", publishNow: "انشر", typeGo: "اكتب «{w}» للتأكيد",
      before: "قبل", after: "بعد", approve: "موافق", reject: "رفض", edit: "تعديل", saveEdit: "استخدم تعديلي",
      noteFab: "رسالة لـClaude", noteShort: "رسالة", noteKicker: "رسالة", noteTitle: "رسالة لـClaude", noteHint: "أي شي تبي Claude يغيّره أو يعرفه. بيقراه قبل الخطوة الجاية.",
      notePh2: "مثلاً: استخدم اللقطة 4، قصّر العنوان، انشر على LinkedIn بعد", noteSent: "وصلت الرسالة", cancel: "إلغاء",
      tabAbout: "عن الأداة", aboutKicker: "عن هذي الأداة", aboutTitle: "200BPS Publish",
      aboutMade: "صممها ناصر الأستاذ بأسلوب Vibe Coding مع Claude Code.",
      aboutWhat: "تفحص البوست، وتلقى أفضل وقت للنشر من بياناتك أنت، وتنشر على Instagram وLinkedIn. وما ينشر أي شي إلا بموافقتك.",
      aboutFree: "مجانية بالكامل. شاركها مع أي أحد.", aboutHow: "شلون تستخدمها",
      aboutStep1: "حط الكابشن والصور أو الفيديو في مجلد واحد.",
      aboutStep2: "في Claude Code اكتب ‎/200bps-publish‎ واسم المجلد.",
      aboutStep3: "راجع كل شي هني، وبعدين اكتب «go» في Claude Code.",
      aboutContactTitle: "عندك فكرة أو مشروع AI؟", aboutContact: "تواصل معي. أساعد الأفراد والفرق يتعلمون الـAI ويبنون فيه.",
      aboutRole: "مؤسس 200BPS.ai · الكويت", aboutName: "ناصر الأستاذ",
      ages: "العمر", gender: "الجنس", cities: "أكثر المدن", countries: "أكثر الدول", male: "ذكور", female: "إناث", unknown: "غير محدد",
      milestone: "وصلت لإنجاز جديد", days: ["الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"],
      daysN: "{n} يوم", followGated: "للمتابعين بس", iceBreakers: "أسئلة البداية", postWord: "بوست", trialShort: "تجريبي",
      calPrev: "الشهر السابق", calNext: "الشهر الجاي", calToday: "اليوم", calMore: "+{n} ثانية",
      goalHow: "شلون يشتغل الهدف", goalSet: "هدفك: {g} متابع.", goalSrc: "حددته وقت الإعداد. تقدر تغيّره أي وقت.",
      goalNow: "{c} الحين · باقي {r}", goalReached: "وصلت للهدف. اختار الهدف الجاي.", goalLive: "التقدم محسوب من عدد متابعينك في Zernio ويتحدث مع كل تحديث.",
      goalEdit: "غيّر الهدف", goalPh: "مثلاً 1000", goalQuick: "اختيارات سريعة", goalSaved: "انحدّث الهدف", goalBad: "اكتب رقم أكبر من عدد متابعينك الحين.",
      goalTitle: "هدف المتابعين", goalNeed: "اربط Zernio عشان نتابع التقدم.",
      bBtn: "جدولة مجموعة", bKicker: "جدولة مجموعة", bS1: "اختار البوستات", bS2: "حدد الأوقات", bS3: "نشر",
      bPickTitle: "أي بوستات تبي تنزل؟", bPickHint: "كل مجلد في هالمساحة فيه كابشن. علّم على اللي تبي تجدوله.",
      bAllNew: "اختار كل الجديد", bNone: "مسح", bSel: "{n} مختار", bNext2: "التالي: الأوقات", bNext3: "التالي: المراجعة",
      bEmpty: "ما لقيت مجلدات بوستات هني. سوّ مجلد لكل بوست فيه caption.txt والصور أو الفيديو.",
      bSent: "انرسل قبل", bChecking: "قاعد أفحص {n} بوستات…", bTimesTitle: "متى ينزل كل بوست؟",
      bTimesHint: "اسحب عشان تغيّر الترتيب. كل بوست ياخذ الوقت اللي بعده، وتقدر تعدّل أي وقت مباشرة.",
      bStart: "البداية", bRhythm: "كم مرة", bEvery1: "كل يوم", bEvery2: "كل يومين", bDays: "اختار الأيام", bTime: "الوقت",
      bBest: "أفضل أوقاتي", bFixed: "نفس الوقت", bSkip: "تجاهل الأيام اللي فيها بوست", bTz: "الأوقات بتوقيت {tz}",
      bBasisBest: "أفضل وقت {d} · +{l}% · n={n}", bBasisOverall: "أفضل وقت عندك بشكل عام · +{l}%", bBasisFixed: "الوقت اللي اخترته",
      bBasisEdited: "حددته أنت", bLow: "ثقة قليلة", bRemove: "شيل", bFixAsk: "اطلب من Claude يصلحه",
      bBlocked: "ما ينفع ينجدول للحين:", bNoSlots: "ما في أيام فاضية كفاية. اختار أيام أكثر أو طفّي التجاهل.",
      bReviewTitle: "تجدول {n} بوستات؟", bReviewHint: "كل بوست ينسوى في Zernio كمجدول. ما ينزل شي الحين، وتقدر تنقل أو تلغي أي واحد بعدين في Zernio.",
      bGo: "جدول {n} بوستات", bWorking: "قاعد يجدول…", bQueued: "ينتظر", bSending: "قاعد يرفع", bDone: "انجدول", bFailed: "فشل",
      bAllDone: "انجدولت {n} بوستات", bSomeFailed: "{ok} انجدولت، {bad} فشلت", bSeeCal: "شوفها في التقويم",
      bRunning: "في مجموعة قاعدة تنجدول", bMoveUp: "فوق", bMoveDown: "تحت", bBack: "رجوع",
      cKicker: "إلغاء", cSchedQ: "تلغي هالبوست؟", cPubQ: "تشيل هالبوست المنشور؟", cDraftQ: "تحذف هالمسودة؟",
      cSchedHow: "ينشال من Zernio وما بينزل. مجلدك ومسودتك يظلون، وتقدر تجدوله مرة ثانية أي وقت.",
      cSending: "قاعد ينرسل الحين. الجزء اللي بدأ ممكن ينزل.",
      cWillRemove: "بينشال من هالمنصة", cManual: "Instagram ما يسمح للتطبيقات تحذف البوستات. احذفه من تطبيق Instagram (افتح البوست ← ⋯ ← حذف).",
      cDraftHow: "بس المسودة اللي على هالجهاز تنحط على جنب (في ‎.bps/trash‎). مجلدك وملفاتك ما تنلمس.",
      cKeep: "خلّه", cCancelBtn: "ألغِ البوست", cRemoveBtn: "شيله", cDelDraft: "احذف المسودة", cCancelShort: "إلغاء…", cDelShort: "حذف…",
      cDoneSched: "انلغى: ما بينزل. المسودة محفوظة تحت «ما انرفع».", cDoneRemoved: "انشال من {p}.", cDoneManual: "احذفه من {p} بنفسك.",
      cDraftGone: "انحذفت المسودة", cGone: "هالبوست مو موجود بالقائمة. حدّث من Zernio.",
      cPickTitle: "ألغِ بوست", cPickHint: "اختار شنو تبي تلغي. بتأكد بالشاشة الجاية.", cPickSched: "مجدولة وبالانتظار", cPickDrafts: "مسودات ما انرفعت",
      cPickPub: "البوستات المنشورة: افتح البوست من المنشورات واختار «شيله».", cThis: "ألغِ هالبوست",
      tipsLabel: "الشروحات", guideTitle: "الدليل: كل الميزات", guideHint: "حط الماوس على أي شي عشان تطلع لك نصيحة سريعة.",
      bBrowse: "تصفح…", bBrowseWait: "اختار مجلد أو أكثر من النافذة اللي انفتحت…", bAdded: "انضاف {n} مجلد بوستات",
      bNoneFound: "ما في مجلدات بوستات في اللي اخترته. مجلد البوست فيه caption.txt مع الصور أو الفيديو.",
      bExplorer: "متصفح المجلدات", bUp: "فوق", bHome: "الرئيسية", bWs: "هالمساحة", bAddSel: "أضف {n}", bPostTag: "بوست",
      bExplorerHint: "علّم على مجلدات البوستات، أو مجلد فيه بوستات كثيرة. اضغط الاسم عشان تفتحه.", bDone: "تم",
    },
  };

  const state = {
    lang: "en", view: "post", data: null, z: null, plat: null, dismissed: {}, counted: false, fixAsked: {},
    calMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  };
  state.h12 = (() => { try { const v = localStorage.getItem("bps.h12"); if (v != null) return v === "1"; } catch (e) {} return !!Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions().hour12; })();
  try { state.lang = localStorage.getItem("bps.lang") || state.lang; state.view = localStorage.getItem("bps.view") || state.view; } catch (e) {}
  const t = (k) => (I18N[state.lang] && I18N[state.lang][k]) ?? I18N.en[k] ?? k;
  const localDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const loc = () => (state.lang === "ar" ? "ar-KW" : undefined);
  // one place for every time shown: follows the 12h / 24h toggle
  const hourLabel = (h, short) => {
    if (!state.h12) return String(h).padStart(2, "0") + (short ? "" : ":00");
    const ap = h < 12 ? (state.lang === "ar" ? "ص" : "AM") : (state.lang === "ar" ? "م" : "PM");
    const hh = h % 12 || 12;
    return short ? hh + (state.lang === "ar" ? ap : ap[0].toLowerCase()) : `${hh}:00 ${ap}`;
  };
  // full date + time for posts: "Thu, 29 Oct 2026 · 11:00 AM"
  const dtFull = (iso) => { try { const d = new Date(iso); return d.toLocaleDateString(loc(), { weekday: "short", day: "numeric", month: "short", year: "numeric" }) + " · " + d.toLocaleTimeString(loc(), { hour: "numeric", minute: "2-digit", hour12: state.h12 }); } catch (e) { return iso; } };
  const dt = (iso, opts = {}) => { try { return new Date(iso).toLocaleString(loc(), { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: state.h12, ...opts }); } catch (e) { return iso; } };

  function applyLang() {
    document.documentElement.lang = state.lang;
    document.documentElement.dir = state.lang === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-i18n]").forEach((n) => { n.textContent = t(n.dataset.i18n); });
    $("#langBtn").textContent = state.lang === "ar" ? "English" : "العربية";
    document.querySelectorAll("[data-i18n-label]").forEach((n) => { n.setAttribute("aria-label", t(n.dataset.i18nLabel)); n.title = t(n.dataset.i18nLabel); });
  }

  function setView(v) {
    if (!["post", "posts", "plan", "growth", "inbox"].includes(v)) v = { calendar: "plan", ideas: "growth" }[v] || "post";
    state.view = v;
    try { localStorage.setItem("bps.view", v); } catch (e) {}
    document.querySelectorAll(".tab").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.view === v)));
    document.querySelectorAll(".view").forEach((s) => s.classList.toggle("active", s.id === "view-" + v));
  }

  /* ---------- rings ---------- */
  function ring(host, value, max, label) {
    const key = `${value}/${max}/${label}/${state.lang}`;
    if (host.dataset.key === key && host.firstChild) return;      // same value: keep it still
    const prevPct = host.dataset.pct != null ? +host.dataset.pct : 0;
    host.dataset.key = key;
    const r = 64, c = 2 * Math.PI * r, pct = Math.max(0, Math.min(1, max ? value / max : 0));
    host.dataset.pct = pct;
    const col = pct >= 0.8 ? "var(--bps-lime)" : pct >= 0.5 ? "var(--bps-warn)" : "var(--bps-danger)";
    host.innerHTML = `
      <svg viewBox="0 0 150 150" aria-hidden="true">
        <circle cx="75" cy="75" r="${r}" fill="none" stroke="var(--bps-slate)" stroke-width="10"/>
        <circle cx="75" cy="75" r="${r}" fill="none" stroke="${label === "goal" ? "var(--bps-lime)" : col}" stroke-width="10"
          stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - prevPct)}" stroke-linecap="round"/>
      </svg>
      <div><span class="num">${label === "goal" ? Math.round(pct * 100) + "%" : value}</span><span class="of">${label === "goal" ? esc(fmt(value)) + " / " + esc(fmt(max)) : "/ 100"}</span></div>`;
    requestAnimationFrame(() => requestAnimationFrame(() => { host.querySelectorAll("circle")[1].style.strokeDashoffset = String(c * (1 - pct)); }));
  }

  /* ---------- hover a video anywhere: a muted, looping preview ---------- */
  // Tiles carry data-hv (their video url): a preview layer fades in over the
  // thumbnail. Plain <video> elements just play muted while hovered.
  function hvStart(host) {
    if (host.dataset.hv) {
      let v = host.querySelector("video.hvp");
      if (!v) {
        v = el("video", { class: "hvp", src: host.dataset.hv, muted: true, loop: true, playsinline: true, preload: "auto", "aria-hidden": "true" });
        v.muted = true;
        v.addEventListener("playing", () => host.classList.add("hv-on"));
        v.addEventListener("error", () => { v.remove(); host.classList.remove("hv-on"); });
        host.append(v);
      }
      host.classList.add("hv-load");
      v.play().catch(() => {});
      return;
    }
    if (!host.paused) return;                       // already playing (e.g. the user pressed play)
    host.dataset.hvAuto = "1"; host.muted = true; host.loop = true;
    host.play().catch(() => {});
  }
  function hvStop(host) {
    if (host.dataset.hv) {
      host.classList.remove("hv-on", "hv-load");
      const v = host.querySelector("video.hvp");
      if (v) { v.pause(); setTimeout(() => { if (!host.classList.contains("hv-load")) v.remove(); }, 260); }
      return;
    }
    if (host.dataset.hvAuto) { delete host.dataset.hvAuto; host.pause(); try { host.currentTime = 0.5; } catch (e) {} }
  }
  const hvHost = (n) => n && n.closest && (n.closest("[data-hv]") || n.closest("video"));
  // mouse or pen only: on touch screens a tap opens the post as before
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.addEventListener("pointerover", (e) => { if (e.pointerType === "touch") return; const h = hvHost(e.target); if (h && !h.contains(e.relatedTarget)) hvStart(h); });
    document.addEventListener("pointerout", (e) => { if (e.pointerType === "touch") return; const h = hvHost(e.target); if (h && !h.contains(e.relatedTarget)) hvStop(h); });
  }

  /* ---------- cancel anything, anywhere: one window used by Posts, the calendar,
     the Post tab, the batch list and Ctrl+K. Remote changes need the typed word
     "cancel"; a local draft only needs a second click. ---------- */
  const PENDING = ["scheduled", "publishing", "pending", "processing", "uploading", "draft", "failed", "partial"];
  const rowByPost = (id) => postRows().find((r) => r.id === id) || null;
  async function cApi(body) {
    const r = await fetch("/api/cancel", { method: "POST", headers: { "Content-Type": "application/json", "X-BPS-Token": TOKEN }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) throw new Error(j.error || "HTTP " + r.status);
    return j;
  }
  const refreshAll = () => { lastSig = ""; load(false); lastZSig = ""; loadZernio(); };
  function cSummary(r) {
    const when = r.scheduledFor || (r.platforms || []).map((p) => p.publishedAt).filter(Boolean)[0];
    return el("div", { class: "csum" }, badge(r.status),
      el("div", { class: "cmeta" }, el("b", { style: "unicode-bidi:plaintext" }, (r.caption || "").split("\n")[0] || "—"),
        el("small", {}, [(r.platforms || []).map((p) => NET_NAME[p.platform] || p.platform).join(" · "), when ? dt(when) : ""].filter(Boolean).join(" · "))));
  }
  function openCancel(r) {
    if (!r) { toast(t("cGone")); return; }
    const build = (body) => {
      const err = el("div", { class: "err", role: "alert" });
      if (r.local) {
        const del = el("button", { class: "btn danger", type: "button" }, t("cDelDraft"));
        del.addEventListener("click", async () => {
          del.disabled = true;
          try { await cApi({ draft: r.planId }); closeModal(() => { toast(t("cDraftGone")); refreshAll(); }); }
          catch (e) { err.textContent = e.message; del.disabled = false; }
        });
        body.append(el("div", { class: "label kicker cdanger" }, t("cKicker")), el("h2", { id: "mTitle" }, t("cDraftQ")), cSummary(r),
          el("p", { class: "hint" }, t("cDraftHow")), err,
          el("div", { class: "actions" }, el("button", { class: "btn", type: "button", onclick: () => closeModal(renderQuestion) }, t("cKeep")), del));
        return;
      }
      const published = r.status === "published";
      const plats = (r.platforms || []).filter((p) => !published || p.status === "published");
      const manual = published ? plats.filter((p) => ["instagram", "tiktok", "snapchat"].includes(p.platform)) : [];
      const removable = published ? plats.filter((p) => !manual.includes(p)) : plats;
      body.append(el("div", { class: "label kicker cdanger" }, t("cKicker")), el("h2", { id: "mTitle" }, published ? t("cPubQ") : t("cSchedQ")), cSummary(r));
      if (!published) body.append(el("p", { class: "hint" }, t("cSchedHow")));
      if (["publishing", "pending", "processing", "uploading"].includes(r.status)) body.append(el("p", { class: "warnline" }, t("cSending")));
      if (published) {
        const ul = el("ul", { class: "cplats" });
        removable.forEach((p) => ul.append(el("li", {}, el("b", {}, NET_NAME[p.platform] || p.platform), el("span", {}, t("cWillRemove")))));
        manual.forEach((p) => ul.append(el("li", { class: "manual" }, el("b", {}, NET_NAME[p.platform] || p.platform),
          el("span", {}, t("cManual")), p.url ? el("a", { href: p.url, target: "_blank", rel: "noopener" }, t("openPost") + " ↗") : null)));
        body.append(ul);
      }
      const acts = el("div", { class: "actions" }, el("button", { class: "btn", type: "button", onclick: () => closeModal(renderQuestion) }, published && !removable.length ? t("close") : t("cKeep")));
      if (!published || removable.length) {
        const word = el("input", { type: "text", placeholder: "cancel", autocomplete: "off", spellcheck: "false", class: "bgo" });
        const go_ = el("button", { class: "btn danger", type: "button", disabled: true }, published ? t("cRemoveBtn") : t("cCancelBtn"));
        word.addEventListener("input", () => { go_.disabled = word.value.trim().toLowerCase() !== "cancel"; });
        word.addEventListener("keydown", (e) => { if (e.key === "Enter" && !go_.disabled) go_.click(); });
        go_.addEventListener("click", async () => {
          go_.disabled = true; err.textContent = "";
          try {
            const res = await cApi({ postId: r.id, confirm: word.value });
            closeModal(() => {
              refreshAll();
              const lines = [];
              if (res.deleted) lines.push(t("cDoneSched"));
              (res.removed || []).forEach((p) => lines.push(fill("cDoneRemoved", { p: NET_NAME[p] || p })));
              (res.manual || []).forEach((m) => lines.push(fill("cDoneManual", { p: NET_NAME[m.platform] || m.platform })));
              (res.failed || []).forEach((f) => lines.push((NET_NAME[f.platform] || f.platform) + ": " + f.error));
              toast(lines.join(" "));
            });
          } catch (e) { err.textContent = e.message; go_.disabled = false; }
        });
        body.append(el("label", { class: "bconfirm" }, el("span", {}, fill("typeGo", { w: "cancel" })), word));
        acts.append(go_);
      }
      body.append(err, acts);
    };
    modal.open ? closeModal(() => showModal("cancel", build)) : showModal("cancel", build);
  }
  function openCancelChooser() {
    const rows = postRows();
    const remote = rows.filter((r) => !r.local && PENDING.includes(r.status)).sort((a, b) => Date.parse(a.scheduledFor || 0) - Date.parse(b.scheduledFor || 0));
    const local = rows.filter((r) => r.local);
    showModal("cancelpick", (body) => {
      body.append(el("div", { class: "label kicker cdanger" }, t("cKicker")), el("h2", { id: "mTitle" }, t("cPickTitle")), el("p", { class: "hint" }, t("cPickHint")));
      const sec = (title, list, label) => {
        if (!list.length) return;
        const ul = el("ul", { class: "cpick" });
        list.forEach((r) => ul.append(el("li", {}, cSummary(r), el("button", { class: "btn cancel-btn", type: "button", onclick: () => openCancel(r) }, label))));
        body.append(el("h3", {}, title), ul);
      };
      sec(t("cPickSched"), remote, t("cCancelShort"));
      sec(t("cPickDrafts"), local, t("cDelShort"));
      if (!remote.length && !local.length) body.append(el("p", { class: "empty" }, t("zNone")));
      body.append(el("p", { class: "hint" }, t("cPickPub")),
        el("div", { class: "actions" }, el("button", { class: "btn", type: "button", onclick: () => closeModal(renderQuestion) }, t("close"))));
    });
  }

  /* ---------- batch schedule: pick posts → set times → type go once ---------- */
  // Every post is created in Zernio as *scheduled*; the server re-checks the
  // whole list before anything is sent (all or nothing), then sends one by one.
  const B = { step: 1, folders: [], sel: new Set(), items: [], times: [], edited: {}, poll: null,
    opts: { start: "", every: 1, days: [], mode: "best", hour: 20, minute: 0, skipBusy: true } };
  async function bApi(path, body) {
    const r = await fetch(path, body ? { method: "POST", headers: { "Content-Type": "application/json", "X-BPS-Token": TOKEN }, body: JSON.stringify(body) } : { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) throw new Error(j.error || "HTTP " + r.status);
    return j;
  }
  const fill = (k, o) => Object.entries(o).reduce((s, [a, b]) => s.replace("{" + a + "}", b), t(k));
  const bTz = () => ((state.data || {}).config || {}).timezone || "UTC";
  function bThumb(f, plan) {
    const box = el("div", { class: "zthumb bthumb" });
    const src = (file) => plan ? planMedia(plan, file) : "/fmedia?d=" + encodeURIComponent(f.folder) + "&f=" + encodeURIComponent(file);
    if (f.thumb) box.append(el("img", { src: src(f.thumb), alt: "", loading: "lazy" }));
    else if (f.video) box.append(el("video", { src: src(f.video) + "#t=0.5", muted: true, preload: "metadata", playsinline: true }));
    if (f.video) box.dataset.hv = src(f.video);
    box.append(el("span", { class: "zph" }, (f.caption || f.name || "·").trim().slice(0, 1)));
    return box;
  }
  function bStepper(body) {
    const s = el("ol", { class: "bsteps" });
    ["bS1", "bS2", "bS3"].forEach((k, i) => s.append(el("li", { class: i + 1 === B.step ? "on" : i + 1 < B.step ? "done" : "" }, el("b", {}, i + 1), t(k))));
    body.append(el("div", { class: "label kicker", style: "color:var(--accent-ink)" }, t("bKicker")), s);
  }
  async function openBatch() {
    try { const st = await bApi("/api/batch"); if (st.state === "running") { B.step = 4; return bShow(); } } catch (e) {}
    B.step = 1; B.items = []; B.times = []; B.edited = {};
    bShow(true);
  }
  function bShow(loading) {
    const build = (body) => {
      bStepper(body);
      if (B.step === 1) bPick(body, loading);
      else if (B.step === 2) bTimes(body);
      else bReview(body);
    };
    if (modal.open && modal.open !== "batch") closeModal(() => showModal("batch", build));
    else { modal.open = null; showModal("batch", build); }
  }
  /* step 1 */
  async function bPick(body, loading) {
    body.append(el("h2", { id: "mTitle" }, t("bPickTitle")), el("p", { class: "hint" }, t("bPickHint")));
    const grid = el("div", { class: "bgrid" });
    const count = el("span", { class: "label" });
    const next = el("button", { class: "btn on", type: "button", onclick: bToTimes }, t("bNext2"));
    const sync = () => { count.textContent = fill("bSel", { n: B.sel.size }); next.disabled = !B.sel.size; };
    const draw = () => {
      grid.innerHTML = "";
      if (!B.folders.length) { grid.append(el("p", { class: "empty" }, t("bEmpty"))); return; }
      B.folders.forEach((f) => {
        const sent = ["scheduled", "published"].includes(f.status);
        const on = B.sel.has(f.folder);
        const card = el("button", { type: "button", class: "bcard" + (on ? " on" : "") + (sent ? " sent" : ""), "aria-pressed": on ? "true" : "false", disabled: sent, title: f.folder },
          bThumb(f), el("span", { class: "bcheck", "aria-hidden": "true" }),
          el("span", { class: "bmeta" }, el("b", {}, f.name), el("small", {}, (f.caption || "").split("\n")[0] || "—"),
            f.outside ? el("small", { class: "bpath", title: f.folder }, f.folder) : null,
            el("span", { class: "bkind" }, kindChip({ kind: { single: "post", reel: "reel", carousel: "carousel", document: "document", text: "text" }[f.type] || "post", count: f.count }),
              sent ? el("span", { class: "zbadge st-pub" }, t("bSent")) : null)));
        card.addEventListener("click", () => { B.sel.has(f.folder) ? B.sel.delete(f.folder) : B.sel.add(f.folder); card.classList.toggle("on"); card.setAttribute("aria-pressed", B.sel.has(f.folder)); sync(); });
        grid.append(card);
      });
    };
    const added = async (paths) => {
      B.folders = (await bApi("/api/batch/folders")).folders;
      paths.forEach((x) => { const f = B.folders.find((g) => g.folder === x || g.folder.endsWith("/" + x) || x.endsWith("/" + g.folder));
        if (f && !["scheduled", "published"].includes(f.status)) B.sel.add(f.folder); });
      toast(paths.length ? fill("bAdded", { n: paths.length }) : t("bNoneFound"));
      draw(); sync();
    };
    const browse = el("button", { class: "btn on bbrowse", type: "button" }, t("bBrowse"));
    browse.addEventListener("click", async () => {
      browse.disabled = true; const was = browse.textContent; browse.textContent = t("bBrowseWait");
      try {
        const r = await fetch("/api/batch", { method: "POST", headers: { "Content-Type": "application/json", "X-BPS-Token": TOKEN }, body: JSON.stringify({ op: "pick" }) }).then((x) => x.json());
        if (r.ok && r.folders && r.folders.length) await added(r.found || []);
        else if (!r.ok) bExplorer(grid, added);          // no system picker here: use the built-in one
      } catch (e) { toast(e.message); }
      browse.disabled = false; browse.textContent = was;
    });
    body.append(el("div", { class: "row2 btools" }, browse,
      el("button", { class: "btn bexpbtn", type: "button", onclick: () => bExplorer(grid, added) }, t("bExplorer")),
      el("button", { class: "btn", type: "button", onclick: () => { B.folders.filter((f) => !["scheduled", "published"].includes(f.status)).forEach((f) => B.sel.add(f.folder)); draw(); sync(); } }, t("bAllNew")),
      el("button", { class: "btn", type: "button", onclick: () => { B.sel.clear(); draw(); sync(); } }, t("bNone")), count), grid,
      el("div", { class: "actions" }, el("button", { class: "btn", type: "button", onclick: () => closeModal(renderQuestion) }, t("cancel")), next));
    sync();
    if (loading || !B.folders.length) {
      grid.append(el("p", { class: "empty" }, "…"));
      try { B.folders = (await bApi("/api/batch/folders")).folders; } catch (e) { grid.innerHTML = ""; grid.append(el("p", { class: "err" }, e.message)); return; }
      const known = new Set(B.folders.map((f) => f.folder)); [...B.sel].forEach((x) => known.has(x) || B.sel.delete(x));
    }
    draw(); sync();
  }
  // built-in folder browser (also the fallback when the computer has no folder picker)
  async function bExplorer(grid, added) {
    const box = el("div", { class: "bexp" });
    const picked = new Set();
    const addBtn = el("button", { class: "btn on", type: "button", disabled: true }, fill("bAddSel", { n: 0 }));
    const syncAdd = () => { addBtn.disabled = !picked.size; addBtn.textContent = fill("bAddSel", { n: picked.size }); };
    addBtn.addEventListener("click", async () => {
      try { const r = await bApi("/api/batch", { op: "add", folders: [...picked] }); box.remove(); grid.hidden = false; await added(r.found); }
      catch (e) { toast(e.message); }
    });
    const open = async (path) => {
      let d; try { d = await bApi("/api/fs?path=" + encodeURIComponent(path || "")); } catch (e) { toast(e.message); return; }
      box.innerHTML = "";
      const crumbs = el("div", { class: "bcrumbs" });
      const parts = d.path.split("/").filter(Boolean);
      parts.forEach((part, i) => {
        const full = "/" + parts.slice(0, i + 1).join("/");
        const reach = full.startsWith(d.home) || full.startsWith(d.workspace);   // the server only lists inside these
        crumbs.append(i ? el("span", { "aria-hidden": "true" }, "/") : "",
          reach ? el("button", { class: "lnk", type: "button", onclick: () => open(full) }, part) : el("span", {}, part));
      });
      const list = el("ul", { class: "bfs" });
      if (!d.dirs.length) list.append(el("li", { class: "empty" }, t("zNone")));
      d.dirs.forEach((x) => {
        const cb = el("input", { type: "checkbox", checked: picked.has(x.path), "aria-label": x.name });
        cb.addEventListener("change", () => { cb.checked ? picked.add(x.path) : picked.delete(x.path); syncAdd(); });
        list.append(el("li", { class: x.post ? "post" : "" }, cb,
          el("span", { class: "bfico", "aria-hidden": "true" }, x.post ? "▣" : "▸"),
          el("button", { class: "lnk", type: "button", onclick: () => open(x.path) }, x.name),
          x.post ? el("span", { class: "conf high" }, t("bPostTag")) : null));
      });
      box.append(el("div", { class: "bexp-head" }, el("h3", {}, t("bExplorer")),
          el("span", { class: "row2" },
            el("button", { class: "btn", type: "button", disabled: !d.parent, onclick: () => open(d.parent) }, "↑ " + t("bUp")),
            el("button", { class: "btn", type: "button", onclick: () => open(d.home) }, t("bHome")),
            el("button", { class: "btn", type: "button", onclick: () => open(d.workspace) }, t("bWs")))),
        crumbs, el("p", { class: "hint" }, t("bExplorerHint")), list,
        el("div", { class: "actions" }, el("button", { class: "btn", type: "button", onclick: () => { box.remove(); grid.hidden = false; } }, t("cancel")), addBtn));
      syncAdd();
    };
    grid.parentNode.querySelectorAll(".bexp").forEach((x) => x.remove());
    grid.hidden = true; grid.before(box);
    await open("");
  }
  async function bToTimes() {
    const body = $("#modalBody");
    body.querySelectorAll("button").forEach((b) => b.disabled = true);
    body.append(el("p", { class: "hint bwait" }, fill("bChecking", { n: B.sel.size })));
    try {
      const order = B.folders.map((f) => f.folder).filter((x) => B.sel.has(x));
      B.items = (await bApi("/api/batch", { op: "prepare", folders: order })).items;
      B.edited = {};
      await bSuggest();
      B.step = 2; bShow();
    } catch (e) { toast(e.message); B.step = 1; bShow(); }
  }
  /* step 2 */
  const bReady = () => B.items.filter((i) => i.plan && !i.error && !i.sent && !(i.blocking || []).length);
  async function bSuggest() {
    const o = B.opts;
    const r = await bApi("/api/batch", { op: "suggest", count: bReady().length, start: o.start, every: o.every, days: o.days, mode: o.mode, hour: o.hour, minute: o.minute, skipBusy: o.skipBusy });
    B.times = r.times; B.edited = {};
  }
  const localVal = (iso) => (iso || "").slice(0, 16);
  function bBasis(tm) {
    if (!tm) return "";
    if (tm.basis === "edited") return t("bBasisEdited");
    if (tm.basis === "fixed") return t("bBasisFixed");
    const wd = new Date(tm.at).toLocaleDateString(loc(), { weekday: "short", timeZone: bTz() });
    const s = tm.basis === "best" ? fill("bBasisBest", { d: wd, l: tm.lift, n: tm.posts }) : fill("bBasisOverall", { l: tm.lift });
    return s + (tm.confidence === "low" ? " · " + t("bLow") : "");
  }
  function bTimes(body) {
    body.append(el("h2", { id: "mTitle" }, t("bTimesTitle")), el("p", { class: "hint" }, t("bTimesHint")));
    const o = B.opts;
    const redo = async () => { try { await bSuggest(); bShow(); } catch (e) { toast(e.message); } };
    const start = el("input", { type: "date", value: o.start || localDay(), min: localDay() });
    start.addEventListener("change", () => { o.start = start.value; redo(); });
    const segBtn = (lbl, on, fn) => el("button", { class: "btn" + (on ? " on" : ""), type: "button", onclick: fn }, lbl);
    const rhythm = el("span", { class: "seg brhythm" },
      segBtn(t("bEvery1"), !o.days.length && o.every === 1, () => { o.days = []; o.every = 1; redo(); }),
      segBtn(t("bEvery2"), !o.days.length && o.every === 2, () => { o.days = []; o.every = 2; redo(); }),
      segBtn(t("bDays"), !!o.days.length, () => { if (!o.days.length) { o.days = [0, 2, 4]; redo(); } }));
    const days = el("span", { class: "bdays" });
    if (o.days.length) t("days").forEach((d, i) => days.append(segBtn(state.lang === "ar" ? d : d.slice(0, 3), o.days.includes(i), () => {
      o.days = o.days.includes(i) ? o.days.filter((x) => x !== i) : [...o.days, i].sort();
      if (!o.days.length) o.days = [i];
      redo();
    })));
    const hh = el("input", { type: "time", value: String(o.hour).padStart(2, "0") + ":" + String(o.minute).padStart(2, "0"), step: "900" });
    hh.addEventListener("change", () => { const [a, b] = hh.value.split(":"); o.hour = +a; o.minute = +b || 0; o.mode = "fixed"; redo(); });
    const mode = el("span", { class: "seg bmode" },
      segBtn(t("bBest"), o.mode === "best", () => { o.mode = "best"; redo(); }),
      segBtn(t("bFixed"), o.mode === "fixed", () => { o.mode = "fixed"; redo(); }));
    const skip = el("label", { class: "bskip" }, el("input", { type: "checkbox", checked: o.skipBusy }), t("bSkip"));
    skip.firstChild.addEventListener("change", (e) => { o.skipBusy = e.target.checked; redo(); });
    body.append(el("div", { class: "bctl" },
      el("label", {}, el("span", { class: "label" }, t("bStart")), start),
      el("div", {}, el("span", { class: "label" }, t("bRhythm")), rhythm, days),
      el("div", {}, el("span", { class: "label" }, t("bTime")), mode, o.mode === "fixed" ? hh : null),
      skip), el("p", { class: "hint btz" }, fill("bTz", { tz: bTz() })));

    const list = el("ol", { class: "blist" });
    const ready = bReady();
    if (ready.length && B.times.length < ready.length) list.append(el("p", { class: "err" }, t("bNoSlots")));
    let dragFrom = null;
    ready.forEach((it, i) => {
      const tm = B.times[i];
      const at = el("input", { type: "datetime-local", value: localVal(tm && tm.at), min: localDay() + "T00:00" });
      at.addEventListener("change", () => { B.times[i] = { at: at.value, basis: "edited" }; row.querySelector(".bbasis").textContent = t("bBasisEdited"); });
      const move = (d) => { const a = B.items.indexOf(it), b = B.items.indexOf(ready[i + d]); if (b < 0) return; [B.items[a], B.items[b]] = [B.items[b], B.items[a]]; bShow(); };
      const sc = Object.entries(it.score || {}).map(([p, v]) => (NET[p] || p) + " " + v).join(" · ");
      const row = el("li", { class: "brow", draggable: "true" },
        el("span", { class: "bgrip", "aria-hidden": "true" }, "⋮⋮"), el("span", { class: "bnum" }, i + 1),
        bThumb({ ...it, thumb: it.hasCover ? "cover" : (it.media[0] || {}).kind === "image" ? it.media[0].file : null, video: (it.media[0] || {}).kind === "video" ? it.media[0].file : null }, it.plan),
        el("span", { class: "bmeta" }, el("b", {}, it.name), el("small", {}, (it.caption || "").split("\n")[0]),
          el("span", { class: "bscore" }, sc, (it.warnings || []).length ? el("span", { class: "conf medium", title: it.warnings.join("\n") }, "! " + it.warnings.length) : null)),
        el("span", { class: "bwhen" }, at, el("small", { class: "bbasis" }, bBasis(tm))),
        el("span", { class: "bmove" },
          el("button", { class: "btn icon-btn", type: "button", "aria-label": t("bMoveUp"), disabled: i === 0, onclick: () => move(-1) }, "↑"),
          el("button", { class: "btn icon-btn", type: "button", "aria-label": t("bMoveDown"), disabled: i === ready.length - 1, onclick: () => move(1) }, "↓")));
      row.addEventListener("dragstart", (e) => { dragFrom = i; row.classList.add("drag"); e.dataTransfer.effectAllowed = "move"; });
      row.addEventListener("dragend", () => row.classList.remove("drag"));
      row.addEventListener("dragover", (e) => { e.preventDefault(); row.classList.add("over"); });
      row.addEventListener("dragleave", () => row.classList.remove("over"));
      row.addEventListener("drop", (e) => {
        e.preventDefault(); row.classList.remove("over");
        if (dragFrom == null || dragFrom === i) return;
        const a = B.items.indexOf(ready[dragFrom]), [moved] = B.items.splice(a, 1);
        B.items.splice(B.items.indexOf(ready[i]) + (dragFrom < i ? 1 : 0), 0, moved);
        bShow();
      });
      list.append(row);
    });
    const blocked = B.items.filter((i) => !bReady().includes(i));
    if (blocked.length) {
      const sec = el("div", { class: "bblocked" }, el("h3", {}, t("bBlocked")));
      blocked.forEach((it) => sec.append(el("div", { class: "brow-x" }, el("b", {}, it.name),
        el("small", {}, it.error || (it.sent ? t("bSent") : (it.blocking || []).join(" · "))),
        el("span", { class: "row2" },
          (it.blocking || []).length ? el("button", { class: "btn", type: "button", onclick: async () => { try { await post("/api/note", { text: `Fix the post in '${it.folder}' so it can be batch scheduled: ${(it.blocking || []).join("; ")}` }); toast(t("sent")); } catch (e) { toast(e.message); } } }, t("bFixAsk")) : null,
          el("button", { class: "btn", type: "button", onclick: () => { B.items = B.items.filter((x) => x !== it); B.sel.delete(it.folder); bShow(); } }, t("bRemove"))))));
      body.append(list, sec);
    } else body.append(list);
    const n = Math.min(ready.length, B.times.length);
    body.append(el("div", { class: "actions" },
      el("button", { class: "btn", type: "button", onclick: () => { B.step = 1; bShow(); } }, t("bBack")),
      el("button", { class: "btn on", type: "button", disabled: !n || B.times.length < ready.length, onclick: () => { B.step = 3; bShow(); } }, t("bNext3") + " (" + n + ")")));
  }
  /* step 3 + progress */
  const bList = () => bReady().map((it, i) => ({ plan: it.plan, at: (B.times[i] || {}).at, name: it.name, it }));
  function bReview(body) {
    if (B.step === 4) return bProgress(body);
    const rows = bList();
    body.append(el("h2", { id: "mTitle" }, fill("bReviewTitle", { n: rows.length })), el("p", { class: "hint" }, t("bReviewHint")));
    const tl = el("ol", { class: "btimeline" });
    rows.forEach((r) => {
      const d = new Date(r.at.length === 16 ? r.at + ":00" : r.at);
      tl.append(el("li", {}, el("span", { class: "bday" }, el("b", {}, d.toLocaleDateString(loc(), { weekday: "short", timeZone: r.at.length === 16 ? undefined : bTz() })),
        el("small", {}, d.toLocaleDateString(loc(), { day: "numeric", month: "short", timeZone: r.at.length === 16 ? undefined : bTz() }))),
        el("span", { class: "btime" }, d.toLocaleTimeString(loc(), { hour: "numeric", minute: "2-digit", hour12: state.h12, timeZone: r.at.length === 16 ? undefined : bTz() })),
        el("span", { class: "bmeta" }, el("b", {}, r.name), el("small", {}, (r.it.caption || "").split("\n")[0]))));
    });
    const word = el("input", { type: "text", placeholder: "go", autocomplete: "off", spellcheck: "false", class: "bgo" });
    const err = el("div", { class: "err", role: "alert" });
    const goBtn = el("button", { class: "btn on big", type: "button", disabled: true }, fill("bGo", { n: rows.length }));
    word.addEventListener("input", () => { goBtn.disabled = word.value.trim().toLowerCase() !== "go"; });
    word.addEventListener("keydown", (e) => { if (e.key === "Enter" && !goBtn.disabled) goBtn.click(); });
    goBtn.addEventListener("click", async () => {
      goBtn.disabled = true; err.textContent = ""; goBtn.textContent = t("bWorking");
      try { await bApi("/api/batch", { op: "run", confirm: word.value, items: rows.map((r) => ({ plan: r.plan, at: r.at })) }); B.step = 4; bShow(); }
      catch (e) { err.textContent = e.message; goBtn.textContent = fill("bGo", { n: rows.length }); goBtn.disabled = false; }
    });
    body.append(tl, el("label", { class: "bconfirm" }, el("span", {}, fill("typeGo", { w: "go" })), word), err,
      el("div", { class: "actions" }, el("button", { class: "btn", type: "button", onclick: () => { B.step = 2; bShow(); } }, t("bBack")), goBtn));
  }
  function bProgress(body) {
    const head = el("h2", { id: "mTitle" }, t("bWorking"));
    const list = el("ol", { class: "bprog" });
    const acts = el("div", { class: "actions" });
    body.append(head, list, acts);
    const tick = async () => {
      let st; try { st = await bApi("/api/batch"); } catch (e) { return; }
      list.innerHTML = "";
      (st.items || []).forEach((r) => list.append(el("li", { class: "bp-" + r.state },
        el("i", { "aria-hidden": "true" }), el("b", {}, r.name), el("small", {}, dt(r.at)),
        el("span", { class: "label" }, t({ queued: "bQueued", sending: "bSending", done: "bDone", failed: "bFailed" }[r.state])),
        r.state === "done" && r.postId && st.state !== "running" ? el("button", { class: "btn danger-ghost cancel-btn", type: "button", onclick: () => openCancel(rowByPost(r.postId)) }, t("cCancelShort")) : "",
        r.error ? el("div", { class: "zerr" }, r.error) : null)));
      if (st.state !== "running") {
        clearInterval(B.poll); B.poll = null;
        const ok = (st.items || []).filter((r) => r.state === "done").length, bad = (st.items || []).length - ok;
        head.textContent = bad ? fill("bSomeFailed", { ok, bad }) : fill("bAllDone", { n: ok });
        acts.innerHTML = "";
        acts.append(el("button", { class: "btn", type: "button", onclick: () => closeModal(renderQuestion) }, t("close")),
          el("button", { class: "btn on", type: "button", onclick: () => closeModal(() => { lastZSig = ""; loadZernio(); go("plan"); }) }, t("bSeeCal")));
        B.sel.clear(); B.folders = []; lastSig = ""; load(false); lastZSig = ""; loadZernio();
      }
    };
    clearInterval(B.poll); B.poll = setInterval(tick, 900); tick();
  }

  /* ---------- follower goal: where it comes from, and changing it ---------- */
  const niceUp = (x) => { const e = 10 ** Math.floor(Math.log10(Math.max(1, x))); return [1, 2, 2.5, 5, 10].map((k) => k * e).find((v) => v >= x); };
  function goalPicks(cur) {
    const out = [];
    [1.25, 1.5, 2, 5].forEach((f) => { const v = niceUp(Math.max(cur + 1, cur * f)); if (!out.includes(v)) out.push(v); });
    return out.slice(0, 4);
  }
  function renderGoalInfo(g, cur) {
    const host = $("#goalInfo"); host.innerHTML = "";
    if (cur == null) { host.append(el("p", { class: "hint" }, t("goalNeed"))); return; }
    const reached = g && cur >= g;
    host.append(el("p", { class: "goal-now" + (reached ? " done" : "") }, reached ? t("goalReached")
      : t("goalNow").replace("{c}", fmt(cur)).replace("{r}", fmt(Math.max(0, (g || 0) - cur)))));
    host.append(el("details", { class: "goal-how" }, el("summary", {}, t("goalHow")),
      el("p", {}, t("goalSet").replace("{g}", fmt(g)) + " " + t("goalSrc")), el("p", {}, t("goalLive"))));
    host.append(el("button", { class: "btn" + (reached ? " on" : ""), type: "button", onclick: () => openGoal(g, cur) }, t("goalEdit")));
  }
  function openGoal(g, cur) {
    showModal("goal", (body) => {
      const inp = el("input", { type: "number", min: String(cur + 1), step: "1", inputmode: "numeric", placeholder: t("goalPh"), value: g || "" });
      const err = el("div", { class: "err", role: "alert" });
      const save = async (n) => {
        n = Math.round(Number(n));
        if (!n || n <= cur) { err.textContent = t("goalBad"); return; }
        try {
          const r = await fetch("/api/goal", { method: "POST", headers: { "Content-Type": "application/json", "X-BPS-Token": TOKEN }, body: JSON.stringify({ followers: n }) });
          const j = await r.json().catch(() => ({}));
          if (!r.ok || !j.ok) throw new Error(j.error || "HTTP " + r.status);
          closeModal(() => { toast(t("goalSaved")); lastSig = ""; load(false); });
        } catch (e) { err.textContent = e.message; }
      };
      const picks = el("div", { class: "opts goal-picks" });
      goalPicks(cur).forEach((v) => picks.append(el("button", { class: "btn" + (v === g ? " on" : ""), type: "button", onclick: () => { inp.value = v; save(v); } }, fmt(v))));
      const form = el("form", { class: "row2 keyform" }, inp, el("button", { class: "btn on", type: "submit" }, t("save")));
      form.addEventListener("submit", (e) => { e.preventDefault(); save(inp.value); });
      body.append(el("div", { class: "label kicker", style: "color:var(--accent-ink)" }, t("goal")),
        el("h2", { id: "mTitle" }, t("goalTitle")),
        el("p", { class: "hint" }, t("goalNow").replace("{c}", fmt(cur)).replace("{r}", fmt(Math.max(0, (g || 0) - cur)))),
        el("div", { class: "label", style: "margin:14px 0 6px" }, t("goalQuick")), picks, form, err,
        el("p", { class: "hint" }, t("goalLive")),
        el("div", { class: "actions" }, el("button", { class: "btn", type: "button", onclick: () => closeModal(renderQuestion) }, t("cancel"))));
    });
  }

  /* ---------- this post ---------- */
  function highlight(text) {
    return esc(text).replace(/(^|[\s(])(#[\w؀-ۿ_]+)/g, '$1<span class="ht">$2</span>');
  }

  function renderPost() {
    const p = state.data && state.data.plan;
    const status = $("#postStatus");
    status.innerHTML = "";
    if (!p) {
      status.append(el("div", { class: "status-banner" }, el("span", { class: "dot" }), t("noPlan")));
      ["#mediaStrip", "#platSwitch", "#captionBox", "#checkList", "#tipList", "#planList", "#bestTime"].forEach((s) => ($(s).innerHTML = ""));
      $("#scoreRing").innerHTML = "";
      return;
    }
    const msg = p.status === "published" ? t("published")
      : p.status === "scheduled" ? t("scheduled") + " " + dt(p.schedule.at)
      : p.status === "awaiting_approval" ? t("awaiting") : t("draft");
    const pid = (p.result || {}).postId;
    status.append(el("div", { class: "status-banner" }, el("span", { class: "dot" }), msg,
      pid && ["scheduled", "published"].includes(p.status) ? el("button", { class: "btn danger-ghost cancel-btn", type: "button", style: "margin-inline-start:auto",
        onclick: () => openCancel(rowByPost(pid)) }, p.status === "published" ? t("cRemoveBtn") + "…" : t("cThis") + "…") : ""));

    $("#postType").textContent = (p.type || "").toUpperCase() + " · " + (p.media || []).length + " FILE" + ((p.media || []).length === 1 ? "" : "S");
    const strip = $("#mediaStrip");
    const mkey = (p.media || []).map((m) => m.file + m.bytes).join("|") + p.id;
    if (strip.dataset.key !== mkey) { strip.dataset.key = mkey; strip.innerHTML = ""; } else { strip.dataset.same = "1"; }
    if (!strip.dataset.same) (p.media || []).forEach((m) => {
      const src = "/media?f=" + encodeURIComponent(m.file) + "&plan=" + encodeURIComponent(p.id);
      const node = m.kind === "video" ? el("video", { src, muted: true, controls: true, preload: "metadata", playsinline: true })
        : m.kind === "image" ? el("img", { src, alt: m.file, loading: "lazy" })
        : el("div", { class: "empty", style: "width:160px;height:200px;display:grid;place-items:center;border:1px solid var(--bps-line)" }, "PDF");
      strip.append(el("figure", {}, node, el("figcaption", {}, m.file + (m.width ? ` · ${m.width}×${m.height}` : "") + (m.duration ? ` · ${m.duration}s` : ""))));
    });

    delete strip.dataset.same;
    const plats = p.platforms || [];
    if (!plats.includes(state.plat)) state.plat = plats[0];
    const sw = $("#platSwitch"); sw.innerHTML = "";
    plats.forEach((pl) => sw.append(el("button", { class: "btn" + (pl === state.plat ? " on" : ""), type: "button", onclick: () => { state.plat = pl; renderPost(); } }, pl)));
    const cap = (p.captions || {})[state.plat] ?? (p.captions || {}).default ?? "";
    $("#captionBox").innerHTML = highlight(cap);

    const list = $("#checkList"); list.innerHTML = "";
    const checks = (p.checks || []).filter((c) => !c.platform || c.platform === state.plat);
    const order = { fail: 0, warn: 1, info: 2, pass: 3 };
    checks.sort((a, b) => order[a.status] - order[b.status]).forEach((c) => {
      const fixable = c.status !== "pass";
      const li = el("li", fixable ? { class: "fixable", role: "button", tabindex: "0", title: t("clickToFix") } : {},
        el("span", { class: "tag " + c.status }, c.status.toUpperCase()),
        el("div", {}, el("div", {}, c.msg), c.fix ? el("div", { class: "fix" }, c.fix) : null, el("div", { class: "sub" }, c.id)),
        fixable ? el("span", { class: "fixme" }, (((state.data.plan || {}).fixRequests || {})[c.id + ":" + (c.platform || state.plat)] || (state.fixAsked && state.fixAsked[c.id + ":" + state.plat])) ? t("fixAsked") : t("fixIt")) : null);
      if (fixable) {
        const open = () => openFixRequest(c);
        li.addEventListener("click", open);
        li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
      }
      list.append(li);
    });
    const bad = checks.filter((c) => c.status === "fail").length, warn = checks.filter((c) => c.status === "warn").length;
    $("#checkCount").textContent = `${bad} FAIL · ${warn} WARN`;

    const sc = (p.score && p.score[state.plat]) || p.score || {};
    ring($("#scoreRing"), sc.value ?? 0, 100, "score");
    const tips = $("#tipList"); tips.innerHTML = "";
    (sc.tips || []).forEach((tp) => tips.append(el("li", {}, el("b", {}, "+" + tp.points), tp.tip)));

    const pl = $("#planList"); pl.innerHTML = "";
    const row = (k, v) => { pl.append(el("dt", {}, t(k)), el("dd", {}, v)); };
    row("type", p.type || "–");
    row("platforms", plats.join(" · ") || "–");
    row("when", p.schedule && p.schedule.at ? dt(p.schedule.at) : t("now"));
    const ig = (p.settings || {}).instagram || {};
    if (plats.includes("instagram")) {
      if (p.type === "reel") row("trial", ig.trial ? t("on") : t("off"));
      if (p.type === "reel") row("cover", p.cover ? p.cover.file : t("off"));
      row("location", ig.locationName || t("off"));
      row("firstComment", ig.firstComment || t("off"));
      row("collab", (ig.collaborators || []).map((u) => "@" + u).join(" ") || t("off"));
    }
    const dm = p.dm || {};
    row("dmGift", dm.enabled ? `“${dm.keyword}”${dm.followGate ? " · " + t("followGated") : ""}` : t("off"));

    const bt = p.bestTime || {};
    $("#btBasis").textContent = bt.basis === "data" ? t("basisData") + (bt.sample ? ` · n=${bt.sample}` : "") : t("basisNone");
    const bth = $("#bestTime"); bth.innerHTML = "";
    if (bt.slots && bt.slots.length) {
      bt.slots.slice(0, 3).forEach((s, i) => bth.append(el("div", { class: "bars" }, el("div", { class: "row" },
        el("span", { class: "mono" }, `${t("days")[s.day]} ${hourLabel(s.hour)}`),
        el("div", { class: "track" }, el("div", { class: "fill", style: `width:${Math.round(s.relative * 100)}%` })),
        el("span", { class: "n" }, i === 0 ? "BEST" : "")))));
    }
    if (bt.note) bth.append(el("p", { class: "empty" }, bt.note));
  }

  /* ---------- growth ---------- */
  function lineChart(host, series) {
    if (!series || series.length < 2) { host.innerHTML = `<p class="empty">${esc(t("noData"))}</p>`; return; }
    const W = 640, H = 200, P = 30;
    const vs = series.map((d) => d.value), min = Math.min(...vs), max = Math.max(...vs), span = max - min || 1;
    const x = (i) => P + (i * (W - P * 2)) / (series.length - 1);
    const y = (v) => H - P - ((v - min) * (H - P * 2)) / span;
    const pts = series.map((d, i) => `${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
    const area = `${x(0)},${H - P} ${pts} ${x(series.length - 1)},${H - P}`;
    const ticks = [min, min + span / 2, max].map((v) => `<line class="grid" x1="${P}" x2="${W - P}" y1="${y(v)}" y2="${y(v)}"/><text x="${W - P + 4}" y="${y(v) + 3}">${esc(fmt(Math.round(v)))}</text>`).join("");
    const lastI = series.length - 1;
    host.innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="followers over time">
      ${ticks}<polygon class="area" points="${area}"/><polyline class="line" points="${pts}"/>
      <rect x="${x(lastI) - 4}" y="${y(series[lastI].value) - 4}" width="8" height="8" fill="var(--bps-lime)"/>
      <text x="${P}" y="${H - 8}">${esc(series[0].date)}</text><text x="${W - P}" y="${H - 8}" text-anchor="end">${esc(series[lastI].date)}</text></svg>`;
    $("#folRange").textContent = t("daysN").replace("{n}", fmt(series.length));
  }

  function delta(cur, prev) {
    if (cur == null || prev == null || prev === 0) return null;
    return Math.round(((cur - prev) / prev) * 100);
  }

  function renderGrowth() {
    const z = state.z;
    const k = $("#kpis"); k.innerHTML = "";
    if (!z || !z.ok) {
      k.append(el("div", { class: "card", style: "grid-column:1/-1" }, el("p", { class: "empty" }, z && z.error ? z.error : t("zernioOff"))));
      return;
    }
    const kp = z.kpis || {};
    [["reach7", "reach"], ["views7", "views"], ["eng7", "engagement"], ["follows7", "follows"]].forEach(([lbl, key], i) => {
      const d = delta(kp[key], kp[key + "_prev"]);
      k.append(el("div", { class: "card kpi" + (state.kpiShown ? "" : " stagger"), style: `animation-delay:${i * 60}ms` },
        el("div", { class: "label" }, t(lbl)), (() => { const v = el("div", { class: "v" }, state.counted ? fmt(kp[key]) : "0"); if (!state.counted) countUp(v, kp[key]); return v; })(),
        el("div", { class: "d " + (d == null ? "" : d >= 0 ? "up" : "down") }, d == null ? " " : (d >= 0 ? "+" : "") + d + "%")));
    });
    state.counted = true; state.kpiShown = true;
    lineChart($("#folChart"), (z.followers || {}).series);

    const goal = (state.data.config || {}).goal || {};
    const cur = (z.followers || {}).current;
    if (goal.followers && cur != null) { ring($("#goalRing"), cur, goal.followers, "goal"); $("#goalLabel").textContent = `${fmt(goal.followers)} ${t("followers")}`; }
    else { $("#goalRing").innerHTML = `<p class="empty">${esc(t("noData"))}</p>`; $("#goalRing").dataset.key = ""; }
    renderGoalInfo(goal.followers, cur);
    const sg = $("#streakGrid"); sg.innerHTML = "";
    ((z.streak || {}).days || []).forEach((on) => sg.append(el("i", { class: on ? "on" : "" })));

    const tp = $("#topPosts"); tp.innerHTML = "";
    const posts = (z.posts || []).slice().sort((a, b) => (b.metrics.follows || 0) - (a.metrics.follows || 0) || ((b.metrics.saves || 0) + (b.metrics.shares || 0)) - ((a.metrics.saves || 0) + (a.metrics.shares || 0))).slice(0, 8);
    if (!posts.length) tp.innerHTML = `<p class="empty">${esc(t("noData"))}</p>`;
    else {
      const tb = el("table", { class: "t" }, el("thead", {}, el("tr", {}, ["post", "reach", "saves", "shares", "follows"].map((h, i) => el("th", { style: i ? "text-align:end" : "" }, t(h))))));
      const body = el("tbody");
      posts.forEach((p) => body.append(el("tr", {},
        el("td", {}, el("div", { class: "cap" }, (p.caption || "").split("\n")[0]), el("div", { class: "label" }, `${p.platform} · ${(p.publishedAt || "").slice(0, 10)}`)),
        el("td", { class: "n" }, fmt(p.metrics.reach)), el("td", { class: "n" }, fmt(p.metrics.saves)),
        el("td", { class: "n" }, fmt(p.metrics.shares)), el("td", { class: "n" }, fmt(p.metrics.follows)))));
      tb.append(body); tp.append(el("div", { class: "hscroll" }, tb));
    }

    const bt = z.besttime || {};
    const heat = $("#heat"); heat.innerHTML = "";
    $("#heatTz").textContent = (bt.tz || "") + (bt.sample ? ` · n=${bt.sample}` : "");
    if (bt.grid) {
      const flat = bt.grid.flat().filter((v) => v > 0), mx = Math.max(...flat, 0) || 1;
      const top = (bt.slots || []).slice(0, 3);
      const rank = new Map(top.map((s, i) => [s.day + ":" + s.hour, i + 1]));
      const level = (v) => (v <= 0 ? 0 : Math.min(5, 1 + Math.floor((v / mx) * 4.999)));   // 5 clear steps
      const hh = (h) => hourLabel(h);
      const g = el("div", { class: "heat" }, el("span"));
      for (let h = 0; h < 24; h++) g.append(el("span", { class: "h" }, h % 3 === 0 ? hourLabel(h, true) : ""));
      // mark the current plan's slot and scheduled posts on the map
      const tzName = bt.tz || undefined;
      const slotOf = (iso) => { try { const d = new Date(iso); const parts = new Intl.DateTimeFormat("en-US", { timeZone: tzName, weekday: "short", hour: "numeric", hour12: false }).formatToParts(d);
        const wd = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(parts.find((x) => x.type === "weekday").value); const hr = +parts.find((x) => x.type === "hour").value % 24; return wd + ":" + hr; } catch (e) { return ""; } };
      const planSlot = state.data && state.data.plan && state.data.plan.schedule && state.data.plan.schedule.at ? slotOf(state.data.plan.schedule.at) : "";
      const schedSlots = new Set((z.scheduled || []).map((x) => slotOf(x.scheduledFor)));
      bt.grid.forEach((row, d) => {
        g.append(el("span", { class: "dl" }, state.lang === "ar" ? t("days")[d] : t("days")[d].slice(0, 3)));
        row.forEach((v, h) => {
          const r = rank.get(d + ":" + h);
          const key = d + ":" + h;
          const cell = el("span", { class: `c click l${level(v)}` + (r ? ` r r${r}` : "") + (schedSlots.has(key) ? " sched" : "") + (planSlot === key ? " plan" : ""),
            role: "button", tabindex: "0", title: `${t("days")[d]} ${hh(h)}` + (r ? ` · #${r}` : "") + (v ? ` · ${(+v).toFixed(1)}` : "") }, r ? el("b", {}, r) : null);
          const openIt = () => openSlot(d, h, v, r, mx, (bt.counts && bt.counts[d] && bt.counts[d][h]) || 0);
          cell.addEventListener("click", openIt);
          cell.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openIt(); } });
          g.append(cell);
        });
      });
      heat.append(el("div", { class: "hscroll" }, g));
      heat.append(el("div", { class: "heat-key" }, el("span", {}, el("i", { style: "background:var(--bps-info)" }), t("keySched")),
        el("span", {}, el("i", { style: "box-shadow:inset 0 0 0 2px var(--bps-info)" }), t("keyPlan")), el("span", {}, t("keyClick"))));
      heat.append(el("div", { class: "heat-legend" },
        el("span", { class: "label" }, t("low")), ...[1, 2, 3, 4, 5].map((l) => el("i", { class: "c l" + l })), el("span", { class: "label" }, t("high")),
        el("span", { class: "sep" }), el("i", { class: "c r r1" }, el("b", {}, "1")), el("span", { class: "label" }, t("bestSlot"))));
      if (top.length) {
        const list = el("ol", { class: "toptimes" });
        const medal = [t("best"), t("second"), t("third")];
        top.forEach((s, i) => list.append(el("li", { class: "r" + (i + 1) },
          el("span", { class: "rk" }, i + 1),
          el("span", { class: "when" }, `${t("days")[s.day]} · ${hh(s.hour)}`),
          el("span", { class: "tag-" + (i + 1) }, medal[i]),
          el("span", { class: "track" }, el("span", { class: "fill", style: `width:${Math.round(s.relative * 100)}%` })),
          el("span", { class: "n" }, liftTxt(s.lift)),
          el("span", { class: "evi" }, `n=${s.posts}`, confChip(s.confidence)))));
        heat.append(list);
      }
      heat.append(peaksByDay(bt), audienceStrip(z.audience, bt));
      if (bt.note) heat.append(el("p", { class: "empty" }, bt.note));
    } else heat.innerHTML = `<p class="empty">${esc(bt.note || t("noData"))}</p>`;

    const demo = $("#demo"); demo.innerHTML = "";
    const d = z.demographics || {};
    const countryName = (c) => { try { return new Intl.DisplayNames([state.lang === "ar" ? "ar" : "en"], { type: "region" }).of(c) || c; } catch (e) { return c; } };
    const genderName = (g) => ({ M: t("male"), F: t("female"), U: t("unknown") }[String(g).toUpperCase()] || g);
    const groups = [["ages", d.ages, 8], ["gender", d.gender, 3], ["cities", d.cities, 6], ["countries", d.countries, 5]].filter(([, v]) => v && v.length);
    if (!groups.length) demo.innerHTML = `<p class="empty">${esc(d.note || t("noData"))}</p>`;
    groups.forEach(([name, rows, limit]) => {
      const shown = rows.slice(0, limit);
      const total = rows.reduce((a, r) => a + r.value, 0) || 1;
      const mx = Math.max(...shown.map((r) => r.value)) || 1;
      demo.append(el("div", { class: "label", style: "margin:12px 0 6px" }, t(name)));
      const b = el("div", { class: "bars" });
      shown.forEach((r) => b.append(el("div", { class: "row" },
        el("span", {}, name === "gender" ? genderName(r.name) : name === "countries" ? countryName(r.name) : r.name),
        el("div", { class: "track" }, el("div", { class: "fill", style: `width:${(100 * r.value / mx).toFixed(1)}%` })),
        el("span", { class: "n" }, Math.round(100 * r.value / total) + "%"))));
      demo.append(b);
    });
  }

  /* ---------- calendar ---------- */
  function renderCalendar() {
    const z = state.z || {};
    const m = state.calMonth, y = m.getFullYear(), mo = m.getMonth();
    $("#calTitle").textContent = m.toLocaleDateString(loc(), { month: "long", year: "numeric" });
    // same rows as the Posts tab, so both always agree; days in local time
    const byUrl = Object.fromEntries((z.posts || []).filter((p) => p.url).map((p) => [p.url, p]));
    const events = {};
    postRows().forEach((r) => {
      const pubAt = (r.platforms || []).map((p) => p.publishedAt).filter(Boolean)[0];
      const when = r.status === "published" || r.status === "partial" ? (pubAt || r.scheduledFor) : (r.scheduledFor || pubAt);
      if (!when) return;
      const a = (r.platforms || []).map((p) => byUrl[p.url]).find(Boolean);
      const kind = ["published", "partial"].includes(r.status) ? "pub" : "sched";
      (events[localDay(new Date(when))] ||= []).push({ ...r, kind, at: when, scheduledFor: when, id: a ? a.id : r.id, metrics: a ? a.metrics : null, row: r });
    });
    Object.values(events).forEach((l) => l.sort((p, q) => Date.parse(p.at) - Date.parse(q.at)));
    const cal = el("div", { class: "cal" });
    t("days").forEach((d) => cal.append(el("div", { class: "hd" }, state.lang === "ar" ? d : d.slice(0, 3))));
    const first = new Date(y, mo, 1).getDay(), days = new Date(y, mo + 1, 0).getDate();
    const today = localDay();
    for (let i = 0; i < first; i++) cal.append(el("div", { class: "d" }));
    for (let d = 1; d <= days; d++) {
      const key = `${y}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const past = key < today;
      const cell = el("div", { class: "d click" + (key === today ? " today" : "") + (past ? " past" : ""), role: "button", tabindex: "0", title: t("dayHint") }, el("div", { class: "n" }, d));
      const openIt = (e) => { if (e) e.preventDefault(); openDay(key, events[key] || []); };
      cell.addEventListener("click", () => openIt());
      cell.addEventListener("contextmenu", openIt);
      cell.addEventListener("dblclick", (e) => { e.preventDefault(); if (!past && !(events[key] || []).length) quickSchedule(key); else openIt(); });
      cell.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") openIt(e); });
      const evs = events[key] || [];
      evs.slice(0, 3).forEach((e) => {
        const st = ZST[e.status] || ZST.draft;
        const net = (e.platforms || [])[0];
        cell.append(el("div", { class: "ev " + st.cls.replace("st-", "ev-"), title: t(st.key) + " · " + (e.caption || "").split("\n")[0] },
          el("i", { class: "evdot", "aria-hidden": "true" }),
          net ? el("span", { class: "evnet" }, NET[net.platform] || net.platform) : null,
          el("span", { class: "evcap" }, (e.caption || "").split("\n")[0] || "—")));
      });
      if (evs.length > 3) cell.append(el("div", { class: "evmore" }, t("calMore").replace("{n}", evs.length - 3)));
      cal.append(cell);
    }
    const key = el("div", { class: "cal-key" });
    [["ev-pub", "stPublished"], ["ev-sched", "stScheduled"], ["ev-fail", "zAttention"], ["ev-local", "stLocal"]].forEach(([c, k]) =>
      key.append(el("span", { class: c }, el("i", { class: "evdot", "aria-hidden": "true" }), t(k))));
    const host = $("#cal"); host.innerHTML = ""; host.append(cal, key);
  }

  /* ---------- inbox ---------- */
  function renderInbox() {
    const z = state.z || {};
    const c = $("#comments"); c.innerHTML = "";
    const cm = z.comments || [];
    $("#cmtCount").textContent = cm.length ? String(cm.length) : "";
    if (!cm.length) c.innerHTML = `<p class="empty">${esc(z.ok ? t("noData") : t("zernioOff"))}</p>`;
    cm.slice(0, 30).forEach((x) => c.append(el("div", { class: "idea", style: "margin-bottom:8px" },
      el("div", { class: "label" }, `@${x.author || "?"} · ${x.platform || ""} · ${(x.createdAt || "").slice(0, 16).replace("T", " ")}`),
      el("p", { style: "unicode-bidi:plaintext" }, x.text || ""))));
    const a = $("#automations"); a.innerHTML = "";
    const au = z.automations || [];
    if (!au.length) a.innerHTML = `<p class="empty">${esc(t("noData"))}</p>`;
    au.forEach((x) => a.append(el("div", { class: "idea", style: "margin-bottom:8px" },
      el("h3", {}, `“${x.keyword || (x.keywords || []).join(", ")}”`),
      el("p", {}, `${x.active === false ? t("off") : t("on")}${x.followGate ? " · " + t("followGated") : ""}${x.postId ? " · " + t("postWord") + " " + x.postId : ""}`))));
    const ib = (z.iceBreakers || []);
    if (ib.length) {
      a.append(el("div", { class: "label", style: "margin:14px 0 6px" }, t("iceBreakers")));
      ib.forEach((q) => a.append(el("div", { class: "pill", style: "display:inline-block;margin:0 6px 6px 0;unicode-bidi:plaintext" }, q.question || q)));
    }
  }

  /* ---------- ideas + system ---------- */
  function ideaRequestForm(compact) {
    const topic = el("input", { type: "text", placeholder: t("ideaTopicPh"), spellcheck: "false" });
    const msg = el("div", { class: "err", role: "status" });
    const f = el("form", { class: "row2 keyform" }, topic, el("button", { class: "btn on", type: "submit" }, compact ? t("ideaMore") : t("ideaGet")));
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      try { await post("/api/ideas", { op: "request", topic: topic.value }); topic.value = ""; msg.className = "ok-msg";
        msg.textContent = state.data && state.data.listening ? t("ideaComing") : t("ideaQueued"); }
      catch (err) { msg.className = "err"; msg.textContent = err.message; }
    });
    return el("div", {}, f, msg);
  }
  function renderIdeas() {
    const h = $("#ideas"); h.innerHTML = "";
    const ideas = (state.data && state.data.ideas) || [];
    if (!ideas.length) {
      h.append(el("div", { class: "idea-empty" }, el("h3", {}, t("ideaEmptyTitle")), el("p", { class: "ctx" }, t("ideaEmptyHint")), ideaRequestForm(false)));
      return;
    }
    setTimeout(markIdeasShown, 600);
    const order = { new: 0, drafted: 1, posted: 2 };
    ideas.slice().sort((a, b) => (order[a.status || "new"] ?? 0) - (order[b.status || "new"] ?? 0)).forEach((i, n) => {
      const st = i.status || "new";
      const card = el("div", { class: "idea click" + (state.ideasShown ? " seen" : "") + (st !== "new" ? " used" : ""), role: "button", tabindex: "0", title: t("ideaOpen"), style: `animation-delay:${n * 60}ms` },
        el("div", { class: "label" }, (i.format || "") + (i.basedOn ? " · " + i.basedOn : "")),
        el("h3", { style: "unicode-bidi:plaintext" }, i.title),
        el("p", { style: "unicode-bidi:plaintext" }, i.why || ""),
        el("div", { class: "idea-tags" },
          st !== "new" ? el("span", { class: "conf " + (st === "posted" ? "high" : "medium") }, t("ideaSt_" + st)) : null,
          i.basis === "topics" ? el("span", { class: "conf low" }, t("ideaTopicsBasis")) : null,
          el("span", { class: "more" }, t("ideaOpen"))));
      card.addEventListener("click", () => openIdea(i));
      card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openIdea(i); } });
      h.append(card);
    });
    h.append(el("div", { class: "idea-more" }, ideaRequestForm(true)));
  }

  function markIdeasShown() { state.ideasShown = true; }
  function openIdea(i) {
    const z = state.z || {};
    const src = i.basedOn ? (z.posts || []).find((p) => (p.caption || "").includes(i.basedOn) || i.basedOn.includes((p.caption || "").split("\n")[0])) : null;
    const build = (body) => {
      const err = el("div", { class: "err", role: "alert" });
      const note = el("textarea", { rows: 2, placeholder: t("notePh") });
      const send = async (text, action) => {
        try { await post("/api/note", { text: text + (note.value ? " " + note.value : "") }); closeModal(() => toast(t("sent"))); }
        catch (e) { err.textContent = e.message; }
      };
      body.append(el("div", { class: "label kicker", style: "color:var(--accent-ink)" }, t("ideaKicker") + (i.format ? " · " + i.format : "") + (i.basis === "topics" ? " · " + t("ideaTopicsBasis") : "")),
        el("h2", { id: "mTitle", style: "unicode-bidi:plaintext" }, i.title));
      if (i.hook) body.append(el("div", { class: "idea-hook" }, el("span", { class: "label" }, t("ideaHook")), el("p", { style: "unicode-bidi:plaintext" }, i.hook)));
      if (i.why) body.append(el("div", { class: "slot-sec" }, el("h3", {}, t("ideaWhy")), el("p", { class: "ctx", style: "unicode-bidi:plaintext" }, i.why)));
      if (i.outline && i.outline.length) body.append(el("div", { class: "slot-sec" }, el("h3", {}, t("ideaOutline")),
        el("ol", { class: "outline" }, i.outline.map((x) => el("li", { style: "unicode-bidi:plaintext" }, x)))));
      const meta = el("dl", { class: "sum" });
      const add = (k, v) => v && meta.append(el("dt", {}, t(k)), el("dd", { style: "unicode-bidi:plaintext" }, v));
      add("ideaCta", i.cta); add("ideaTags", (i.hashtags || []).map((x) => "#" + x.replace(/^#/, "")).join(" ")); add("ideaWhen", i.bestTime);
      if (meta.childNodes.length) body.append(el("div", { class: "slot-sec" }, meta));
      if (i.basedOn) body.append(el("div", { class: "slot-sec" }, el("h3", {}, t("ideaBased")),
        el("div", { class: "daypost" }, el("div", { style: "unicode-bidi:plaintext" }, src ? (src.caption || "").split("\n")[0] : i.basedOn),
          src ? el("div", { class: "label" }, `${t("reach")} ${fmt(src.metrics.reach)} · ${t("saves")} ${fmt(src.metrics.saves)} · ${t("shares")} ${fmt(src.metrics.shares)}`) : null)));
      body.append(el("div", { class: "field" }, el("label", { class: "label" }, t("anythingElse")), note), err,
        el("div", { class: "actions" },
          el("button", { class: "btn", type: "button", onclick: async () => { try { await post("/api/ideas", { op: "drop", title: i.title }); } catch (e) {} send(`Drop the idea '${i.title}'; it's not for me.`); } }, t("ideaDrop")),
          el("button", { class: "btn", type: "button", onclick: () => closeModal(() => { go("plan"); toast(t("ideaPickDay")); }) }, t("ideaPlan")),
          el("button", { class: "btn on big", type: "button", onclick: async () => { try { await post("/api/ideas", { op: "mark", title: i.title, status: "drafted" }); } catch (e) {} send(`Draft a post from the idea '${i.title}'.`); } }, t("dayIdeaBtn"))));
    };
    modal.open ? closeModal(() => showModal("idea", build)) : showModal("idea", build);
  }

  function renderSystem() {
    const d = (state.data && state.data.doctor) || { checks: [] };
    const list = $("#doctorList"); list.innerHTML = "";
    d.checks.forEach((c) => list.append(el("li", {}, el("span", { class: "tag " + c.status }, c.status.toUpperCase()),
      el("div", {}, el("div", {}, c.msg), c.fix ? el("div", { class: "fix" }, c.fix) : null))));
    const ok = d.checks.filter((c) => c.status === "pass").length;
    $("#readyCount").textContent = `${ok}/${d.checks.length} ${t("ready")}`;
    renderAccountsCard($("#accounts"));
  }

  /* ---------- header: streak + since last visit + milestones ---------- */
  function renderHeader() {
    const lp = $("#listenPill"), pres = (state.data && state.data.presence) || (state.data && state.data.listening ? "listening" : "closed");
    lp.classList.toggle("on", pres === "listening");
    lp.classList.toggle("busy", pres === "working");
    lp.querySelector("span").textContent = pres === "listening" ? t("listening") : pres === "working" ? t("working") : t("away");
    lp.title = pres === "listening" ? t("listeningHint") : pres === "working" ? t("workingHint") : t("awayHint");
    const thr = (state.data && state.data.thread) || [];
    const sig = thr.map((m) => m.id + (m.read ? 1 : 0)).join();
    if (modal.open === "note" && state.chatDraw && sig !== state.chatSig) { state.chatSig = sig; state.chatDraw(); }
    state.chatSig = sig;
    const unseen = thr.filter((m) => m.from === "claude" && !m.seen).length;
    ["#noteTop", "#noteFab"].forEach((id) => { const b_ = $(id); if (!b_) return; let dot = b_.querySelector(".msg-dot");
      if (unseen && !dot) { dot = el("b", { class: "msg-dot" }); b_.append(dot); }
      if (dot) { if (unseen) dot.textContent = unseen; else dot.remove(); } });
    const z = state.z || {};
    const s = (z.streak || {}).current;
    $("#streakPill").innerHTML = s != null ? `<b>${esc(s)}</b> ${esc(t("streak"))}` : "&nbsp;";
    $("#versionPill").textContent = "v" + ((state.data && state.data.version) || "");
    const since = $("#since"); since.innerHTML = "";
    const prev = state.data && state.data.previousVisit;
    const cur = z.followers && z.followers.current;
    if (prev && cur != null && prev.followers != null) {
      const df = cur - prev.followers;
      since.append(el("span", { class: "pill" }, el("b", {}, (df >= 0 ? "+" : "") + fmt(df)), " " + t("newFollowers")));
      if (z.comments) since.append(el("span", { class: "pill" }, el("b", {}, fmt(z.comments.length)), " " + t("newComments")));
      since.append(el("span", { class: "label", style: "align-self:center" }, t("sinceLast")));
      const hit = milestone(prev.followers, cur);
      if (hit) celebrate(`${t("milestone")}: ${fmt(hit)} ${t("followers")}`);
    }
  }

  function milestone(a, b) {
    const marks = [100, 250, 500, 750, 1000, 2000, 2500, 5000, 7500, 10000, 25000, 50000, 100000];
    return marks.filter((m) => a < m && b >= m).pop();
  }

  let celebrated = false;
  function celebrate(text) {
    if (celebrated) return; celebrated = true;
    const box = el("div", { class: "confetti", "aria-hidden": "true" });
    for (let i = 0; i < 60; i++) box.append(el("i", { style: `left:${Math.random() * 100}%;animation-delay:${Math.random() * 400}ms;animation-duration:${1200 + Math.random() * 900}ms` }));
    document.body.append(box, el("div", { class: "toast", role: "status" }, text));
    setTimeout(() => box.remove(), 2600);
  }

  function renderAll() {
    applyLang(); applyToggles(); renderHeader(); renderConnect(); renderNewPost(); renderKeys(); renderPosts(); renderJourney(); renderChanges(); renderPost(); renderCover(); renderGrowth(); renderCalendar(); renderInbox(); renderIdeas(); renderSystem(); renderQuestion();
    if (typeof renderGuide === "function" && !$("#drawer").hidden) renderGuide();
  }

  /* ---------- human in the loop: pop-up questions, notes, cover ---------- */
  const TOKEN = (document.querySelector('meta[name="bps-token"]') || {}).content || "";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // remember which button started a send, so the "sent" chip can fly from it
  let lastBtn = null;
  document.addEventListener("pointerdown", (e) => { const b = e.target.closest && e.target.closest("button, .step, .c.click, .d.click, li.fixable, .idea.click"); if (b) lastBtn = b; }, true);
  document.addEventListener("keydown", (e) => { if (e.key === "Enter" && document.activeElement && document.activeElement.matches("button, [role=button]")) lastBtn = document.activeElement; }, true);

  async function post(path, body) {
    const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json", "X-BPS-Token": TOKEN }, body: JSON.stringify(body) });
    let j = {};
    try { j = await r.json(); } catch (e) {}
    if (!r.ok || !j.ok) throw new Error(j.error || ("HTTP " + r.status));
    modal.sentMode = true;          // the next modal close uses the fly-away exit
    flyToClaude(lastBtn);
    return j;
  }

  // 2.5D "message chip": lifts off the button and flies to the listening light
  function flyToClaude(from) {
    const target = $("#listenPill");
    if (reduced || !from || !target || !from.getBoundingClientRect) return;
    const a = from.getBoundingClientRect(), b = target.getBoundingClientRect();
    if (!a.width) return;
    const chip = el("div", { class: "flyer", "aria-hidden": "true" }, el("i"), el("span", {}, "→ Claude"));
    document.body.append(chip);
    const x0 = a.left + a.width / 2 - 50, y0 = a.top + a.height / 2 - 16;
    const x1 = b.left + b.width / 2 - 50, y1 = b.top + b.height / 2 - 16;
    const mx = (x0 + x1) / 2 + (x1 > x0 ? -60 : 60), my = Math.min(y0, y1) - 120;
    const anim = chip.animate([
      { transform: `translate3d(${x0}px, ${y0}px, 0) rotateX(0deg) rotateY(0deg) scale(.6)`, opacity: 0 },
      { transform: `translate3d(${x0}px, ${y0 - 24}px, 60px) rotateX(24deg) rotateY(-18deg) scale(1)`, opacity: 1, offset: .18 },
      { transform: `translate3d(${mx}px, ${my}px, 120px) rotateX(-12deg) rotateY(28deg) scale(1.05)`, opacity: 1, offset: .6 },
      { transform: `translate3d(${x1}px, ${y1}px, 0) rotateX(0deg) rotateY(0deg) scale(.3)`, opacity: 0 },
    ], { duration: 1100, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" });
    anim.onfinish = () => {
      chip.remove();
      target.classList.remove("ping"); void target.offsetWidth; target.classList.add("ping");
    };
  }

  function toast(text) {
    document.querySelectorAll(".toast").forEach((x) => x.remove());
    const n = el("div", { class: "toast", role: "status" }, el("span", { class: "toast-dot" }), el("span", {}, text));
    document.body.append(n);
    const ms = Math.min(7000, 2600 + String(text).length * 35);
    setTimeout(() => n.classList.add("out"), ms);
    setTimeout(() => n.remove(), ms + 700);
  }

  const modal = { open: null, sentMode: false };
  const overlay = () => {
    document.body.classList.toggle("has-overlay", !$("#modal").hidden || !$("#drawer").hidden || !$("#palette").hidden);
    if (typeof updateBack === "function") setTimeout(updateBack, 0);
  };
  function closeModal(after) {
    const wrap = $("#modal"), box = wrap.querySelector(".modal");
    if (wrap.hidden) { after && after(); return; }
    const sent = modal.sentMode; modal.sentMode = false;
    const cls = sent ? "sent" : "out";
    const done = () => { wrap.hidden = true; box.classList.remove("out", "sent"); wrap.classList.remove("closing"); modal.open = null; overlay(); after && after(); };
    if (reduced) return done();
    box.classList.add(cls);
    wrap.classList.add("closing");
    setTimeout(done, sent ? 620 : 320);
  }
  function showModal(key, build) {
    const wrap = $("#modal"), body = $("#modalBody");
    wrap.querySelector(".modal").classList.toggle("wide", key === "batch");
    body.innerHTML = "";
    build(body);
    modal.open = key;
    wrap.hidden = false;
    overlay();
    const f = body.querySelector("textarea, input, .btn.on");
    if (f) setTimeout(() => f.focus(), 360);
  }
  $("#modalDim").addEventListener("click", () => laterQuestion());
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.open) laterQuestion(); });
  function laterQuestion() {
    const q = state.data && state.data.question;
    if (q && modal.open === "q:" + q.id) state.dismissed[q.id] = true;
    closeModal(renderQuestion);
  }

  // word-level diff (LCS) for the before/after view
  function diff(a, b) {
    const A = a.split(/(\s+)/), B = b.split(/(\s+)/);
    const n = A.length, m = B.length;
    if (n * m > 400000) return { before: esc(a), after: esc(b) };
    const L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    let i = 0, j = 0, bo = "", ao = "";
    while (i < n && j < m) {
      if (A[i] === B[j]) { bo += esc(A[i]); ao += esc(B[j]); i++; j++; }
      else if (L[i + 1][j] >= L[i][j + 1]) { bo += /^\s+$/.test(A[i]) ? esc(A[i]) : `<del>${esc(A[i])}</del>`; i++; }
      else { ao += /^\s+$/.test(B[j]) ? esc(B[j]) : `<ins>${esc(B[j])}</ins>`; j++; }
    }
    while (i < n) { bo += /^\s+$/.test(A[i]) ? esc(A[i]) : `<del>${esc(A[i])}</del>`; i++; }
    while (j < m) { ao += /^\s+$/.test(B[j]) ? esc(B[j]) : `<ins>${esc(B[j])}</ins>`; j++; }
    return { before: bo, after: ao };
  }

  function mediaUrl(key) {
    const p = state.data && state.data.plan;
    return "/media?f=" + encodeURIComponent(key) + "&plan=" + encodeURIComponent(p ? p.id : "") + "&v=" + (p ? p.updated || 0 : 0);
  }

  function questionUI(q, body) {
    let selected = null;
    const err = el("div", { class: "err", role: "alert" });
    const note = el("textarea", { rows: 2, placeholder: t("notePh") });
    const noteField = el("div", { class: "field" }, el("label", { class: "label" }, t("anythingElse")), note);
    const send = async (answer, extra = {}) => {
      err.textContent = "";
      try {
        await post("/api/answer", { id: q.id, answer, note: note.value, ...extra });
        closeModal(() => toast(t("sent")));
        state.data.question = null;
      } catch (e) { err.textContent = e.message; }
    };
    body.append(el("div", { class: "label kicker", style: "color:var(--bps-lime)" }, t("needsYou")),
      el("h2", { id: "mTitle", style: "unicode-bidi:plaintext" }, q.question));
    if (q.context && q.kind !== "fix") body.append(el("p", { class: "ctx", style: "unicode-bidi:plaintext" }, q.context));
    const later = el("button", { class: "btn", type: "button", onclick: laterQuestion }, t("later"));

    if (q.kind === "publish") {
      const p = state.data.plan || {};
      const sum = el("dl", { class: "sum" });
      const add = (k, v) => sum.append(el("dt", {}, t(k)), el("dd", {}, v));
      add("platforms", (p.platforms || []).join(" · "));
      add("when", p.schedule && p.schedule.at ? dt(p.schedule.at) : t("now"));
      add("score", Object.entries(p.score || {}).map(([k, v]) => `${k} ${v.value}`).join(" · "));
      add("dmGift", p.dm && p.dm.enabled ? `“${p.dm.keyword}”` : t("off"));
      const word = q.confirm_word || "go";
      const inp = el("input", { type: "text", class: "go-input", placeholder: word, "aria-label": t("typeGo").replace("{w}", word), autocomplete: "off", spellcheck: "false" });
      const btn = el("button", { class: "btn on big", type: "button", disabled: true, onclick: () => doPublish(body, inp.value.trim()) }, t("publishNow"));
      inp.addEventListener("input", () => { btn.disabled = inp.value.trim().toLowerCase() !== word.toLowerCase(); });
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter" && !btn.disabled) btn.click(); });
      body.append(sum, el("div", { class: "field" }, el("label", { class: "label" }, t("typeGo").replace("{w}", word)), inp), noteField, err,
        el("div", { class: "actions" }, later, btn));
      return;
    }

    if (q.kind === "fix") {
      const s = q.suggestion || {};
      const rows = s.rows || [];
      const r0 = rows[0] || { before: "", scoreBefore: 0, scoreAfter: 0, fixed: [], newIssues: [] };
      const d = diff(r0.before || "", s.after || "");
      body.append(
        el("div", { class: "scorejump" }, el("span", { class: "from" }, r0.scoreBefore), el("span", { class: "arrow" }), el("span", { class: "to" }, r0.scoreAfter),
          el("span", { class: "label", style: "align-self:center" }, (s.platforms || []).join(" · "))),
        s.reasons && s.reasons.length ? el("ul", { class: "reasons" }, s.reasons.map((x) => el("li", {}, x))) : null,
        el("div", { class: "chips" }, (r0.fixed || []).map((x) => el("span", { class: "chip ok" }, "✓ " + x)), (r0.newIssues || []).map((x) => el("span", { class: "chip bad" }, "! " + x))),
      );
      const beforeCol = el("div", { class: "fixcol", html: d.before });
      const afterCol = el("div", { class: "fixcol after", html: d.after });
      const editor = el("textarea", { rows: 10, style: "display:none" });
      editor.value = s.after || "";
      body.append(el("div", { class: "fixrow" },
        el("div", {}, el("div", { class: "label", style: "margin-bottom:6px" }, t("before")), beforeCol),
        el("div", {}, el("div", { class: "label", style: "margin-bottom:6px" }, t("after")), afterCol, editor)));
      const editBtn = el("button", { class: "btn", type: "button" }, t("edit"));
      let editing = false;
      editBtn.addEventListener("click", () => {
        if (!editing) { editing = true; afterCol.style.display = "none"; editor.style.display = "block"; editor.focus(); editBtn.textContent = t("saveEdit"); editBtn.classList.add("on"); }
        else send("edit", { edited: editor.value });
      });
      body.append(noteField, err, el("div", { class: "actions" },
        el("button", { class: "btn", type: "button", onclick: () => send("reject") }, t("reject")),
        later, editBtn,
        el("button", { class: "btn on big", type: "button", onclick: () => (editing ? send("edit", { edited: editor.value }) : send("approve")) }, t("approve"))));
      return;
    }

    const opts = el("div", { class: q.kind === "frames" ? "frames" : "opts" });
    (q.options || []).forEach((o) => {
      const b = q.kind === "frames"
        ? el("button", { type: "button", "aria-pressed": "false", title: o }, el("img", { src: mediaUrl(o), alt: o, loading: "lazy" }), el("span", {}, o.replace("frame:", "#").replace("design:", "D")))
        : el("button", { class: "btn", type: "button", "aria-pressed": "false" }, o);
      b.addEventListener("click", () => {
        opts.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", "false"));
        b.setAttribute("aria-pressed", "true"); selected = o; if (txt) txt.value = "";
      });
      b.addEventListener("dblclick", () => send(o));
      opts.append(b);
    });
    if ((q.options || []).length) body.append(opts);
    let txt = null;
    if (q.allow_text || q.kind === "text") {
      txt = el(q.kind === "text" ? "textarea" : "input", { type: "text", rows: 3, placeholder: q.placeholder || t("typeAnswer") });
      txt.addEventListener("input", () => { if (txt.value) { selected = null; opts.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", "false")); } });
      body.append(el("div", { class: "field" }, el("label", { class: "label" }, (q.options || []).length ? t("orType") : t("yourAnswer")), txt));
    }
    body.append(noteField, err, el("div", { class: "actions" }, later,
      el("button", { class: "btn on big", type: "button", onclick: () => {
        const v = (txt && txt.value.trim()) || selected;
        if (!v && !note.value.trim()) { err.textContent = t("pickOne"); return; }
        send(v || "", {});
      } }, t("send"))));
  }

  // A message from Claude (bps.py say): pops up once; answer with a button, a reply, or "Got it".
  function claudeMsgUI(m, body) {
    const err = el("div", { class: "err", role: "alert" });
    const ta = el("textarea", { rows: m.expect ? 3 : 2, placeholder: t("chatReplyPh") });
    const done = () => { state.data.claudeMsg = null; (state.data.thread || []).forEach((x) => { if (x.id === m.id) x.seen = true; }); renderHeader(); };
    const reply = async (text) => {
      err.textContent = "";
      try { await post("/api/chat", { op: "reply", id: m.id, text }); done(); closeModal(() => { toast(t("noteSent")); renderQuestion(); }); }
      catch (e) { err.textContent = e.message; }
    };
    const opts = (m.options || []).length ? el("div", { class: "opts" }, ...(m.options || []).map((o) =>
      el("button", { class: "btn opt", type: "button", onclick: () => reply(o) }, o))) : null;
    body.append(el("div", { class: "label kicker claude-kicker" }, el("i", { class: "cdot" }), t("claudeSays")),
      el("div", { class: "claude-say", id: "mTitle", style: "unicode-bidi:plaintext" }, m.text), opts,
      el("div", { class: "field" }, el("label", { class: "label" }, t(m.expect ? "chatAnswer" : "chatReplyOpt")), ta), err,
      el("div", { class: "actions" },
        el("button", { class: "btn", type: "button", onclick: async () => { try { await post("/api/chat", { op: "seen", id: m.id }); } catch (e) {} done(); closeModal(renderQuestion); } }, t("gotIt")),
        el("button", { class: "btn", type: "button", onclick: () => closeModal(() => openChat()) }, t("chatOpen")),
        el("button", { class: "btn on big", type: "button", onclick: () => reply(ta.value) }, t("send"))));
  }

  function renderQuestion() {
    const q = state.data && state.data.question;
    const pill = $("#decisionPill");
    const cm = state.data && state.data.claudeMsg;
    if (!q && cm && !modal.open && !state.dismissed["m:" + cm.id]) {
      state.dismissed["m:" + cm.id] = true;           // pops up once; it stays in the chat
      showModal("m:" + cm.id, (body) => claudeMsgUI(cm, body));
    }
    if (!q) {
      pill.hidden = true;
      if (modal.open && modal.open.startsWith("q:")) closeModal();
      return;
    }
    pill.hidden = false;
    pill.innerHTML = `<b class="n1">1</b><span>${esc(t("decisionWaiting"))}</span>`;
    if (modal.open === "q:" + q.id || state.dismissed[q.id]) return;
    if (modal.open && modal.open !== "note") return;
    showModal("q:" + q.id, (body) => questionUI(q, body));
  }
  $("#decisionPill").addEventListener("click", () => {
    const q = state.data && state.data.question;
    if (!q) return;
    delete state.dismissed[q.id];
    const go = () => showModal("q:" + q.id, (body) => questionUI(q, body));
    modal.open ? closeModal(go) : go();
  });

  // "Note to Claude" is a chat: your notes and Claude's replies, newest at the bottom.
  function openChat() {
    const open = () => showModal("note", (body) => {
      const list = el("div", { class: "chat-list", role: "log", "aria-live": "polite" });
      const draw = () => {
        list.innerHTML = "";
        const rows = (state.data && state.data.thread) || [];
        if (!rows.length) list.append(el("p", { class: "empty" }, t("chatEmpty")));
        rows.forEach((m) => {
          const mine = m.from === "you";
          const b_ = el("div", { class: "chat-msg " + (mine ? "me" : "claude") },
            el("div", { class: "chat-who" }, mine ? t("chatYou") : "Claude", el("span", {}, " · " + ago(m.ts))),
            el("div", { class: "chat-text", style: "unicode-bidi:plaintext" }, m.text));
          if (!mine && (m.options || []).length && !m.answered) b_.append(el("div", { class: "opts" }, ...m.options.map((o) =>
            el("button", { class: "btn opt", type: "button", onclick: () => send(o, m.id) }, o))));
          if (mine) b_.append(el("div", { class: "chat-state" }, m.read ? t("chatSeen") : t("chatWaiting")));
          list.append(b_);
        });
        setTimeout(() => { list.scrollTop = list.scrollHeight; }, 30);
        rows.filter((m) => m.from === "claude" && !m.seen).forEach((m) => { m.seen = true; post("/api/chat", { op: "seen", id: m.id }).catch(() => {}); });
        if (state.data) state.data.claudeMsg = null;
        renderHeader();
      };
      const ta = el("textarea", { rows: 3, placeholder: t("notePh2") });
      const err = el("div", { class: "err", role: "alert" });
      const send = async (text, to) => {
        err.textContent = "";
        try {
          const lastClaude = [...((state.data && state.data.thread) || [])].reverse().find((m) => m.from === "claude" && m.expect && !m.answered);
          const target = to || (lastClaude && lastClaude.id);
          const r = target ? await post("/api/chat", { op: "reply", id: target, text }) : await post("/api/note", { text });
          if (r.thread) state.data.thread = r.thread;
          else state.data.thread = [...(state.data.thread || []), { id: r.note.id, ts: r.note.ts, from: "you", text: r.note.text, read: false }];
          ta.value = ""; draw(); toast(t("noteSent"));
        } catch (e) { err.textContent = e.message; }
      };
      ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send(ta.value); });
      body.append(el("div", { class: "label kicker", style: "color:var(--bps-lime)" }, t("noteKicker")),
        el("h2", { id: "mTitle" }, t("chatTitle")), el("p", { class: "ctx" }, t("chatHint")), list, ta, err,
        el("div", { class: "actions" },
          el("button", { class: "btn", type: "button", onclick: () => closeModal(renderQuestion) }, t("close")),
          el("button", { class: "btn on big", type: "button", onclick: () => send(ta.value) }, t("send"))));
      draw();
      state.chatDraw = draw;
    });
    modal.open ? closeModal(open) : open();
  }
  $("#noteFab").addEventListener("click", openChat);

  function renderCover() {
    const p = state.data && state.data.plan;
    const card = $("#coverCard");
    if (!p || p.type !== "reel") { card.hidden = true; return; }
    card.hidden = false;
    const img = $("#coverImg"), none = $("#noCover");
    if (p.cover) { const u = mediaUrl("cover"); if (img.dataset.src !== u) { img.src = u; img.dataset.src = u; } img.hidden = false; none.hidden = true; }
    else { img.hidden = true; none.hidden = false; }
    const box = $("#coverCands"); box.innerHTML = "";
    const cur = p.cover && p.cover.source;
    (p.coverCandidates || []).forEach((c) => {
      const key = `${c.kind}:${c.n}`;
      const b = el("button", { type: "button", class: cur === key ? "cur" : "", title: key },
        el("img", { src: mediaUrl(key), alt: key, loading: "lazy" }), el("span", {}, c.kind === "frame" ? "#" + c.n : "D" + c.n));
      b.addEventListener("click", async () => {
        const q = state.data.question;
        try {
          if (q && q.kind === "frames" && (q.options || []).includes(key)) await post("/api/answer", { id: q.id, answer: key, note: "" });
          else await post("/api/note", { text: `Use ${key} as the cover.` });
          toast(t("sent"));
        } catch (e) { toast(e.message); }
      });
      box.append(b);
    });
    if (!(p.coverCandidates || []).length) box.append(el("span", { class: "empty" }, t("noCands")));
  }
  $("#gridToggle").addEventListener("click", () => { const ph = $("#phone"); ph.classList.toggle("grid"); $("#gridToggle").classList.toggle("on", ph.classList.contains("grid")); });

  /* ---------- 2.5D: tilt, parallax, count-up ---------- */
  // Gentle 2.5D tilt, only on small interactive tiles (steps, ideas, KPIs,
  // peak buttons). Eased with rAF so it never snaps; big content cards stay still.
  if (!reduced && matchMedia("(pointer: fine)").matches) {
    const SEL = ".step, .idea.click, .kpi, .pk, .aud-z";
    let cur = null, tx = 0, ty = 0, rx = 0, ry = 0, raf = 0;
    const tick = () => {
      rx += (tx - rx) * 0.18; ry += (ty - ry) * 0.18;
      if (cur) cur.style.transform = `perspective(700px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-2px)`;
      if (Math.abs(tx - rx) > 0.02 || Math.abs(ty - ry) > 0.02) raf = requestAnimationFrame(tick);
      else { raf = 0; if (cur && !tx && !ty) { cur.style.transform = ""; cur = null; } }
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    document.addEventListener("pointermove", (e) => {
      const c = e.target.closest && e.target.closest(SEL);
      if (c !== cur) { if (cur) cur.style.transform = ""; cur = c; rx = ry = 0; }
      if (!c || c.closest(".modal")) { tx = ty = 0; return kick(); }
      const r = c.getBoundingClientRect();
      tx = -((e.clientY - r.top) / r.height - 0.5) * 6;       // max ~3deg each way
      ty = ((e.clientX - r.left) / r.width - 0.5) * 6;
      kick();
    }, { passive: true });
    document.addEventListener("pointerleave", () => { tx = ty = 0; kick(); });
  }
  function countUp(node, to) {
    if (reduced || to == null || !isFinite(to)) { node.textContent = fmt(to); return; }
    const t0 = performance.now(), dur = 900;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      node.textContent = fmt(Math.round(to * e));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- peak evidence + audience clocks ---------- */
  const liftTxt = (l) => (l == null ? "" : (l >= 0 ? "+" : "") + l + "%");
  const confChip = (c) => el("span", { class: "conf " + (c || "low"), title: t("confHint") }, t("conf_" + (c || "low")));
  function peaksByDay(bt) {
    const wrap = el("div", { class: "pbd" }, el("h3", {}, t("peakByDay")), el("p", { class: "hint" }, t("peakHint")));
    if (!bt.byDay) return wrap;
    const tb = el("table", { class: "t pbd-t" }, el("thead", {}, el("tr", {},
      el("th", {}, t("day")), el("th", {}, t("peak1")), el("th", {}, t("peak2")), el("th", { style: "text-align:end" }, t("postsThatDay")))));
    const body = el("tbody");
    const cell = (x) => (x ? el("td", {}, el("button", { class: "pk", type: "button", onclick: () => openSlot(x.day, x.hour, x.avg, null, bt.slots && bt.slots[0] ? bt.slots[0].avg : x.avg, x.posts) },
      el("b", {}, hourLabel(x.hour)), el("span", { class: "lift " + (x.lift >= 0 ? "up" : "down") }, liftTxt(x.lift)), el("small", {}, "n=" + x.posts), confChip(x.confidence))) : el("td", { class: "empty" }, "–"));
    bt.byDay.forEach((d) => body.append(el("tr", {}, el("td", {}, el("b", {}, t("days")[d.day])), cell(d.peaks[0]), cell(d.peaks[1]), el("td", { class: "n" }, d.posts))));
    tb.append(body);
    wrap.append(el("div", { class: "hscroll" }, tb));
    return wrap;
  }
  function audienceStrip(a, bt) {
    const box = el("div", { class: "aud" }, el("h3", {}, t("audClocks")));
    if (!a || !a.zones || !a.zones.length) { box.append(el("p", { class: "empty" }, (a && a.note) || t("noData"))); return box; }
    const acc = a.account_offset;
    const row = el("div", { class: "aud-row" });
    a.zones.forEach((zn) => {
      const diff = zn.offset - acc;
      row.append(el("div", { class: "aud-z" + (diff === 0 ? " same" : "") },
        el("b", {}, Math.round(zn.share * 100) + "%"),
        el("span", {}, `UTC${zn.offset >= 0 ? "+" : ""}${zn.offset}` + (diff ? ` (${diff > 0 ? "+" : ""}${diff}h)` : "")),
        el("small", {}, zn.countries.map(countryName).join(" · ") + (zn.approx ? " ~" : ""))));
    });
    box.append(row);
    const best = bt.slots && bt.slots[0];
    if (best && a.zones.length > 1) {
      const lines = a.zones.map((zn) => `${countryName(zn.countries[0])}: ${hourLabel((best.hour + (zn.offset - acc) + 24) % 24)}`);
      box.append(el("p", { class: "hint" }, t("bestLocal") + " " + lines.join(" · ")));
    }
    box.append(el("p", { class: "hint" + (a.mismatch ? " warn" : "") }, a.mismatch ? a.note : t("audOk").replace("{p}", Math.round((a.same_clock_share || 0) * 100))));
    return box;
  }
  function countryName(c) { try { return new Intl.DisplayNames([state.lang === "ar" ? "ar" : "en"], { type: "region" }).of(c) || c; } catch (e) { return c; } }

  /* ---------- heatmap slot panel ---------- */
  function openSlot(d, h, v, r, mx, n) {
    const z = state.z || {}, p = state.data && state.data.plan;
    const next = nextAt(d, h);
    const build = (body) => {
      const err = el("div", { class: "err", role: "alert" });
      const note = el("textarea", { rows: 2, placeholder: t("notePh") });
      const act = async (payload, okMsg) => {
        err.textContent = "";
        try { await post("/api/slot", { day: d, hour: h, note: note.value, ...payload }); closeModal(() => { toast(okMsg); load(false); }); }
        catch (e) { err.textContent = e.message; }
      };
      body.append(el("div", { class: "label kicker", style: "color:var(--accent-ink)" }, t("slotKicker")),
        el("div", { class: "slot-head" },
          el("div", { class: "slot-badge" + (r ? " r" + r : "") }, r || "·"),
          el("div", { class: "slot-meta" }, el("b", { id: "mTitle" }, `${t("days")[d]} · ${hourLabel(h)}`),
            el("span", { class: "label" }, (r ? [t("best"), t("second"), t("third")][r - 1] + " · " : "") + (v ? Math.round((100 * v) / mx) + "% " + t("ofBest") : t("noHistory")) + (n ? ` · n=${n}` : "")),
            el("span", {}, t("nextOn") + " " + dt(next.toISOString())))));
      const btz = (state.z && state.z.besttime) || {};
      const dd = (btz.byDay || [])[d];
      const pk = dd && dd.peaks.find((x) => x.hour === h);
      if (n || pk) body.append(el("div", { class: "evidence" },
        el("span", {}, t("evPosts").replace("{n}", n)),
        pk && pk.lift != null ? el("span", { class: "lift " + (pk.lift >= 0 ? "up" : "down") }, liftTxt(pk.lift) + " " + t("vsAvg")) : null,
        confChip(pk ? pk.confidence : (n >= 5 ? "high" : n >= 3 ? "medium" : "low"))));
      const aud = state.z && state.z.audience;
      if (aud && aud.zones && aud.zones.length > 1) body.append(el("p", { class: "hint" },
        t("localFor") + " " + aud.zones.map((zn) => `${countryName(zn.countries[0])} ${hourLabel((h + (zn.offset - aud.account_offset) + 24) % 24)} (${Math.round(zn.share * 100)}%)`).join(" · ")));
      // 1. current post
      const s1 = el("div", { class: "slot-sec" }, el("h3", {}, t("slotPlan")));
      if (p && !["published", "scheduled"].includes(p.status)) {
        s1.append(el("p", { class: "ctx", style: "unicode-bidi:plaintext" }, (p.captions && Object.values(p.captions)[0] || "").split("\n")[0]),
          el("button", { class: "btn on", type: "button", onclick: () => act({ action: "plan" }, t("slotPlanned")) }, t("slotPlanBtn")));
      } else s1.append(el("p", { class: "empty" }, t("slotNoPlan")));
      // 2. move a scheduled post
      const s2 = el("div", { class: "slot-sec" }, el("h3", {}, t("slotMove")));
      const sched = z.scheduled || [];
      let pick = null;
      if (sched.length) {
        const list = el("div", { class: "radio-list" });
        sched.forEach((x) => {
          const rb = el("input", { type: "radio", name: "slotpost", value: x.id });
          rb.addEventListener("change", () => (pick = x.id));
          list.append(el("label", {}, rb, el("span", {}, `${dt(x.scheduledFor)} · ${(x.caption || "").split("\n")[0].slice(0, 60)}`)));
        });
        s2.append(list, el("button", { class: "btn", type: "button", onclick: () => (pick ? act({ action: "reschedule", postId: pick }, t("slotQueued")) : (err.textContent = t("pickOne"))) }, t("slotMoveBtn")));
      } else s2.append(el("p", { class: "empty" }, t("slotNoSched")));
      // 3. assign a folder
      const folder = el("input", { type: "text", placeholder: "posts/my-next-reel" });
      const s3 = el("div", { class: "slot-sec" }, el("h3", {}, t("slotAssign")), folder,
        el("div", { style: "margin-top:8px" }, el("button", { class: "btn", type: "button", onclick: () => act({ action: "assign", folder: folder.value }, t("slotQueued")) }, t("slotAssignBtn"))));
      body.append(s1, s2, s3, el("div", { class: "field" }, el("label", { class: "label" }, t("anythingElse")), note), err,
        el("div", { class: "actions" }, el("button", { class: "btn", type: "button", onclick: () => closeModal(renderQuestion) }, t("cancel"))));
    };
    modal.open ? closeModal(() => showModal("slot", build)) : showModal("slot", build);
  }
  function nextAt(d, h) {
    const now = new Date();
    for (let i = 0; i < 8; i++) {
      const c = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, h, 0, 0);
      if (c.getDay() === d && c.getTime() > now.getTime() + 15 * 60000) return c;
    }
    return new Date(now.getTime() + 15 * 60000);
  }

  /* ---------- back navigation: tabs + pop-ups use browser history ---------- */
  state.navStack = [];
  function go(v) {
    if (v === state.view) return;
    state.navStack.push(state.view);
    try { history.pushState({ v }, ""); } catch (e) {}
    setView(v); updateBack();
  }
  function updateBack() {
    const b = $("#backBtn");
    if (b) b.hidden = !(state.navStack.length || modal.open || !$("#drawer").hidden || !$("#palette").hidden);
  }
  function goBack() {
    if (!$("#palette").hidden) { closePalette(); return updateBack(); }
    if (modal.open) { const k = modal.open; if (k.startsWith("q:")) laterQuestion(); else closeModal(renderQuestion); return; }
    if (!$("#drawer").hidden) { closeDrawer(); return; }
    if (state.navStack.length) { setView(state.navStack.pop()); updateBack(); }
  }
  addEventListener("popstate", () => goBack());
  $("#backBtn").addEventListener("click", () => { if (modal.open || !$("#drawer").hidden || !$("#palette").hidden) goBack(); else if (state.navStack.length) history.back(); });
  try { history.replaceState({ v: state.view }, ""); } catch (e) {}

  /* ---------- journey bar: one guided path ---------- */
  function journeySteps() {
    const p = state.data && state.data.plan;
    if (!p) return null;
    const checks = (p.checks || []).filter((c) => c.status === "fail" || c.status === "warn");
    const fails = checks.filter((c) => c.status === "fail").length;
    const live = ["published", "scheduled"].includes(p.status);
    const steps = [
      { id: "check", label: t("jCheck"), done: !checks.length, detail: checks.length ? `${checks.length} ${t("jToFix")}` : t("jAllGood"), blocking: fails > 0 },
    ];
    if (p.type === "reel") steps.push({ id: "cover", label: t("jCover"), done: !!p.cover, detail: p.cover ? t("jSet") : t("jNeeded") });
    steps.push(
      { id: "time", label: t("jTime"), done: !!(p.schedule && (p.schedule.at || p.schedule.mode === "now")), detail: p.schedule && p.schedule.at ? dt(p.schedule.at, { weekday: "short", day: undefined, month: undefined }) : p.schedule && p.schedule.mode === "now" ? t("now") : t("jPick") },
      { id: "gift", label: t("jGift"), optional: true, done: !!(p.dm && (p.dm.asked || p.dm.enabled)), detail: p.dm && p.dm.enabled ? `“${p.dm.keyword}”` : p.dm && p.dm.asked ? t("off") : t("jOptional") },
      { id: "go", label: t("jGo"), done: live, detail: live ? (p.status === "published" ? t("published") : t("jScheduled")) : p.status === "awaiting_approval" ? t("jTypeGo") : t("jLast") },
    );
    return steps;
  }
  function renderJourney() {
    const host = $("#journey");
    const steps = journeySteps();
    if (!steps) { host.hidden = true; return; }
    host.hidden = false;
    const next = steps.find((x) => !x.done);
    host.innerHTML = "";
    const track = el("ol", { class: "steps-track" });
    steps.forEach((st, i) => {
      const field = { check: "captions", cover: "cover", time: "schedule", gift: "dm" }[st.id];
      const canUndo = field && editableNow() && ((state.data.plan.history || []).some((h) => h.field === field));
      const undoBtn = canUndo ? el("button", { class: "undo", type: "button", title: t("undo") + " · " + st.label, "aria-label": t("undo") + " " + st.label }, "↺") : null;
      if (undoBtn) undoBtn.addEventListener("click", (e) => { e.stopPropagation(); planOp({ op: "undo", step: st.id }, t("undone") + " · " + st.label); });
      const li = el("li", { class: "step" + (st.done ? " done" : "") + (next && st.id === next.id ? " current" : "") + (st.blocking ? " blocking" : ""), role: "button", tabindex: "0", "data-step": st.id },
        el("span", { class: "dot" }, st.done ? "✓" : String(i + 1)),
        el("span", { class: "txt" }, el("b", {}, st.label), el("small", {}, st.detail)), undoBtn);
      li.addEventListener("click", () => runStep(st.id));
      li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); runStep(st.id); } });
      track.append(li);
    });
    const done = steps.filter((x) => x.done).length;
    const w = Math.round((100 * done) / steps.length);
    const fill = el("i", { style: `width:${state.jw ?? w}%` });
    const bar = el("div", { class: "progress" }, fill);
    if (state.jw !== w) requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = w + "%"; }));
    state.jw = w;
    const live = ["published", "scheduled"].includes((state.data.plan || {}).status);
    const cta = live
      ? el("button", { class: "btn big next", type: "button", onclick: () => { state.zfilter = "all"; go("posts"); } }, t("seeInPosts"))
      : next && next.id !== "go" && !next.optional
        ? el("button", { class: "btn on big next", type: "button", onclick: () => runStep(next.id) }, t("jNext") + ": " + next.label)
        : el("button", { class: "btn on big next publish-cta", type: "button", onclick: openPublish }, t("pubBtn"));
    const newBtn = el("button", { class: "btn newpost-btn", type: "button", title: t("newPostKeepShort"), onclick: confirmNewPost }, "+ " + t("newPost"));
    host.append(el("div", { class: "journey-head" }, el("div", {}, el("div", { class: "label" }, t("jTitle")), el("b", { class: "jcount" }, `${done}/${steps.length}`)),
      el("div", { class: "row2" }, newBtn, cta)), bar, track);
  }
  async function runStep(id) {
    const p = state.data && state.data.plan;
    if (!p) return;
    if (id === "check") {
      const c = (p.checks || []).filter((x) => x.platform === state.plat || !x.platform).find((x) => x.status === "fail") ||
                (p.checks || []).find((x) => x.status === "fail" || x.status === "warn");
      if (c) { state.plat = c.platform || state.plat; renderPost(); openFixRequest(c); } else toast(t("jAllGood"));
    } else if (id === "cover") {
      go("post"); $("#coverCard").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      if (!(p.coverCandidates || []).length) sendNote(t("jCoverNote"));
    } else if (id === "time") {
      go("plan"); window.scrollTo({ top: $("main").offsetTop - 60, behavior: reduced ? "auto" : "smooth" });
    } else if (id === "gift") {
      openGift();
    } else if (id === "go") {
      openPublish();
    }
  }
  async function sendNote(text) {
    try { await post("/api/note", { text }); toast(t("sent")); } catch (e) { toast(e.message); }
  }

  const editableNow = () => { const p = state.data && state.data.plan; return !!p && !["published", "scheduled"].includes(p.status); };
  async function planOp(body, msg) {
    try { await post("/api/plan", body); toast(msg || t("saved")); await load(false); }
    catch (e) { toast(e.message); }
  }

  /* ---------- changes timeline (revert any single choice) ---------- */
  function ago(ts) {
    const s = Math.max(1, Math.round(Date.now() / 1000 - ts));
    const f = new Intl.RelativeTimeFormat(loc(), { numeric: "auto" });
    return s < 60 ? f.format(-s, "second") : s < 3600 ? f.format(-Math.round(s / 60), "minute") : s < 86400 ? f.format(-Math.round(s / 3600), "hour") : f.format(-Math.round(s / 86400), "day");
  }
  function renderChanges() {
    const box = $("#changes"), p = state.data && state.data.plan;
    const hist = (p && p.history) || [];
    if (!p || !hist.length) { box.hidden = true; return; }
    box.hidden = false;
    $("#changesCount").textContent = hist.length;
    const ol = $("#changesList"); ol.innerHTML = "";
    const fmtVal = (f, v) => (f === "schedule" && v && v.includes && v.includes("T") ? dt(v) : v);
    hist.slice().reverse().forEach((h) => {
      const rb = el("button", { class: "btn", type: "button", disabled: !editableNow() }, t("revert"));
      rb.addEventListener("click", () => planOp({ op: "revert", id: h.id }, t("reverted") + " · " + h.title));
      ol.append(el("li", {},
        el("span", { class: "ch-title" }, t("ch_" + h.field) || h.title),
        el("span", { class: "ch-diff", style: "unicode-bidi:plaintext" }, `${fmtVal(h.field, h.from)} → ${fmtVal(h.field, h.to)}`),
        el("span", { class: "label" }, `${ago(h.ts)} · ${h.via === "dashboard" ? t("viaYou") : h.via === "chat" ? t("viaChat") : "Claude"}`),
        rb));
    });
    if (!editableNow()) ol.append(el("li", { class: "empty" }, t("liveNoRevert")));
  }

  /* ---------- gift pop-up (local switch, saved instantly) ---------- */
  function openGift() {
    const p = state.data && state.data.plan;
    if (!p) return;
    const dm = p.dm || {};
    const build = (body) => {
      const err = el("div", { class: "err", role: "alert" });
      let on = !!dm.enabled;
      const onB = el("button", { class: "btn", type: "button", "aria-pressed": String(on) }, t("giftOn"));
      const offB = el("button", { class: "btn", type: "button", "aria-pressed": String(!on) }, t("giftOff"));
      const kw = el("input", { type: "text", value: dm.keyword || "", placeholder: "Agent" });
      const msg = el("textarea", { rows: 3, placeholder: t("giftMsgPh") }); msg.value = dm.message || "";
      const link = el("input", { type: "text", value: dm.link || "", placeholder: "https://…" });
      const btnT = el("input", { type: "text", value: dm.buttonTitle || "", placeholder: t("giftBtnPh"), maxlength: "20" });
      const gate = el("input", { type: "checkbox" }); gate.checked = dm.followGate !== false;
      const reply = el("input", { type: "text", value: dm.commentReply || "", placeholder: t("giftReplyPh") });
      const fields = el("div", { class: "gift-fields" },
        el("div", { class: "field" }, el("label", { class: "label" }, t("giftKeyword")), kw),
        el("div", { class: "field" }, el("label", { class: "label" }, t("giftMessage")), msg),
        el("div", { class: "row2 field" }, el("div", { style: "flex:2 1 200px" }, el("label", { class: "label" }, t("giftLink")), link), el("div", { style: "flex:1 1 120px" }, el("label", { class: "label" }, t("giftBtn")), btnT)),
        el("label", { class: "check-row" }, gate, el("span", {}, t("giftGate"))),
        el("div", { class: "field" }, el("label", { class: "label" }, t("giftReply")), reply));
      const sync = () => { onB.setAttribute("aria-pressed", String(on)); offB.setAttribute("aria-pressed", String(!on)); fields.classList.toggle("off", !on); fields.inert = !on; };
      onB.addEventListener("click", () => { on = true; sync(); setTimeout(() => kw.focus(), 50); });
      offB.addEventListener("click", () => { on = false; sync(); });
      sync();
      body.append(el("div", { class: "label kicker", style: "color:var(--accent-ink)" }, t("jGift")),
        el("h2", { id: "mTitle" }, t("giftTitle")), el("p", { class: "ctx" }, t("giftHint")),
        el("div", { class: "seg big-seg" }, onB, offB), fields, err,
        el("div", { class: "actions" },
          el("button", { class: "btn", type: "button", onclick: () => closeModal(renderQuestion) }, t("cancel")),
          el("button", { class: "btn on big", type: "button", onclick: async () => {
            err.textContent = "";
            try {
              await post("/api/plan", { op: "gift", dm: { enabled: on, keyword: kw.value, message: msg.value, link: link.value, buttonTitle: btnT.value, followGate: gate.checked, commentReply: reply.value } });
              closeModal(() => { toast(on ? t("giftSavedOn") : t("giftSavedOff")); load(false); });
            } catch (e) { err.textContent = e.message; }
          } }, t("save"))));
    };
    modal.open ? closeModal(() => showModal("gift", build)) : showModal("gift", build);
  }

  /* ---------- Publish from the dashboard: type go, upload to Zernio, verify ---------- */
  function openPublish() {
    const p = state.data && state.data.plan;
    if (!p) return;
    if (["published", "scheduled"].includes(p.status)) { state.zfilter = "all"; go("posts"); return; }
    const build = (body) => {
      const acc = (state.data.config && state.data.config.accounts) || {};
      const blocking = (p.checks || []).filter((c) => c.status === "fail");
      const sum = el("dl", { class: "sum" });
      const add = (k, v) => sum.append(el("dt", {}, t(k)), el("dd", {}, v));
      add("platforms", (p.platforms || []).map((pl) => pl + (acc[pl] && acc[pl].username ? " @" + acc[pl].username : "")).join(" · "));
      add("when", p.schedule && p.schedule.at ? dt(p.schedule.at) : t("pubNow"));
      add("score", Object.entries(p.score || {}).map(([k, v]) => `${k} ${v.value}`).join(" · "));
      if (p.type === "reel") add("cover", p.cover ? t("jSet") : t("off"));
      add("dmGift", p.dm && p.dm.enabled ? `“${p.dm.keyword}”` + (p.dm.followGate ? " · " + t("giftGate").toLowerCase() : "") : t("off"));
      body.append(el("div", { class: "label kicker", style: "color:var(--accent-ink)" }, t("jGo")),
        el("h2", { id: "mTitle" }, t("pubTitle")), el("p", { class: "ctx" }, t("pubHint")), sum);
      if (blocking.length) {
        body.append(el("div", { class: "pub-block" }, el("b", {}, t("pubBlocked")),
          el("ul", {}, blocking.map((c) => el("li", {}, `${c.platform}: ${c.msg}`)))),
          el("div", { class: "actions" }, el("button", { class: "btn", type: "button", onclick: () => closeModal(renderQuestion) }, t("cancel")),
            el("button", { class: "btn on", type: "button", onclick: () => closeModal(() => runStep("check")) }, t("cFix"))));
        return;
      }
      const inp = el("input", { type: "text", class: "go-input", placeholder: "go", autocomplete: "off", spellcheck: "false", "aria-label": t("typeGo").replace("{w}", "go") });
      const btn = el("button", { class: "btn on big", type: "button", disabled: true }, t("pubBtn"));
      const err = el("div", { class: "err", role: "alert" });
      inp.addEventListener("input", () => { btn.disabled = inp.value.trim().toLowerCase() !== "go"; });
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter" && !btn.disabled) btn.click(); });
      btn.addEventListener("click", () => doPublish(body, inp.value));
      body.append(el("div", { class: "field" }, el("label", { class: "label" }, t("typeGo").replace("{w}", "go")), inp), err,
        el("div", { class: "actions" }, el("button", { class: "btn", type: "button", onclick: () => closeModal(renderQuestion) }, t("cancel")), btn));
    };
    modal.open ? closeModal(() => showModal("publish", build)) : showModal("publish", build);
  }
  async function doPublish(body, typed) {
    const steps = [t("pubS1"), t("pubS2"), t("pubS3"), t("pubS4")];
    body.innerHTML = "";
    const list = el("ol", { class: "pub-steps" }, steps.map((x) => el("li", {}, el("i"), el("span", {}, x))));
    body.append(el("div", { class: "label kicker", style: "color:var(--accent-ink)" }, t("jGo")), el("h2", { id: "mTitle" }, t("pubWorking")), list,
      el("p", { class: "hint" }, t("pubDontClose")));
    let k = 0; const lis = list.querySelectorAll("li"); lis[0].classList.add("on");
    const timer = setInterval(() => { if (k < lis.length - 1) { lis[k].classList.add("done"); k++; lis[k].classList.add("on"); } }, 1400);
    try {
      const r = await post("/api/publish", { confirm: typed });
      clearInterval(timer); lis.forEach((li) => li.classList.add("done"));
      modal.sentMode = false;
      showPublished(body, r);
      lastSig = ""; lastZSig = ""; load(false); loadZernio();
    } catch (e) {
      clearInterval(timer);
      body.innerHTML = "";
      body.append(el("div", { class: "label kicker", style: "color:var(--bps-danger)" }, t("jGo")), el("h2", { id: "mTitle" }, t("pubFailed")),
        el("div", { class: "pub-block" }, e.message),
        el("p", { class: "hint" }, t("pubFailedHint")),
        el("div", { class: "actions" }, el("button", { class: "btn", type: "button", onclick: () => closeModal(renderQuestion) }, t("close")),
          el("button", { class: "btn on", type: "button", onclick: () => closeModal(() => sendNote(`Publishing from the dashboard failed: ${e.message}. Please help me fix it.`)) }, t("zAskFix"))));
    }
  }
  function showPublished(body, r) {
    const v = r.verified || {};
    body.innerHTML = "";
    const ok = !v.error;
    body.append(el("div", { class: "pub-ok" }, el("span", { class: "tick" }, "✓"),
      el("div", {}, el("h2", { id: "mTitle" }, r.status === "scheduled" ? t("pubDoneSched") : t("pubDonePub")),
        el("p", { class: "ctx" }, ok ? t("pubVerified") : t("pubNotVerified")))));
    const sum = el("dl", { class: "sum" });
    const add = (k, val) => sum.append(el("dt", {}, t(k)), el("dd", {}, val));
    add("zPostId", el("span", { class: "mono" }, r.postId || "–"));
    add("zStatus", v.status ? badge(v.status) : (v.error || "–"));
    if (v.scheduledFor) add("when", dt(v.scheduledFor));
    body.append(sum);
    const plats = el("div", { class: "zplats" });
    (v.platforms || []).forEach((p) => plats.append(el("div", { class: "zplat" }, el("b", {}, p.platform), badge(p.status),
      p.url ? el("a", { href: p.url, target: "_blank", rel: "noopener" }, t("openPost") + " ↗") : null, p.error ? el("div", { class: "zerr" }, p.error) : null)));
    body.append(plats);
    if (r.dm) body.append(el("p", { class: r.dm.ok ? "ok-msg" : "err" }, r.dm.ok ? t("pubGiftOn").replace("{k}", r.dm.keyword) : t("pubGiftFail") + " " + r.dm.error));
    body.append(el("div", { class: "actions" },
      el("a", { class: "btn", href: "https://zernio.com", target: "_blank", rel: "noopener" }, t("openZernio") + " ↗"),
      el("button", { class: "btn", type: "button", onclick: () => closeModal(() => { state.zfilter = "all"; go("posts"); }) }, t("seeInPosts")),
      el("button", { class: "btn on", type: "button", onclick: () => closeModal(confirmNewPost) }, "+ " + t("newPost"))));
  }

  /* ---------- New post: start fresh without deleting anything ---------- */
  function confirmNewPost() {
    const p = state.data && state.data.plan;
    if (!p) { renderNewPost(true); return; }
    const build = (body) => {
      const err = el("div", { class: "err", role: "alert" });
      body.append(el("div", { class: "label kicker", style: "color:var(--accent-ink)" }, t("newPost")),
        el("h2", { id: "mTitle" }, t("newPostQ")),
        el("p", { class: "ctx" }, t("newPostKeep")),
        el("div", { class: "daypost" }, el("div", { style: "unicode-bidi:plaintext" }, (Object.values(p.captions || {})[0] || "").split("\n")[0] || p.id),
          el("div", { class: "label" }, (p.platforms || []).join(" · ") + " · " + t(p.status === "awaiting_approval" ? "stAwaiting" : (p.status === "published" ? "stPublished" : p.status === "scheduled" ? "stScheduled" : "stLocal")))),
        err,
        el("div", { class: "actions" },
          el("button", { class: "btn", type: "button", onclick: () => closeModal(renderQuestion) }, t("cancel")),
          el("button", { class: "btn on big", type: "button", onclick: async () => {
            try { await post("/api/plan", { op: "clear" }); modal.sentMode = false; closeModal(async () => { lastSig = ""; await load(false); go("post"); window.scrollTo({ top: 0 }); toast(t("newPostDone")); }); }
            catch (e) { err.textContent = e.message; }
          } }, t("newPostGo"))));
    };
    modal.open ? closeModal(() => showModal("newpost", build)) : showModal("newpost", build);
  }
  function renderNewPost() {
    const card = $("#newPostCard"), p = state.data && state.data.plan;
    const keysOk = !((state.data && state.data.keys) || []).some((k) => k.required && !(k.set && k.valid));
    if (p || !keysOk) { card.hidden = true; card.innerHTML = ""; return; }
    if (!card.hidden && card.firstChild) return;           // keep it stable while typing
    card.hidden = false; card.innerHTML = "";
    const drafts = ((state.data && state.data.plans) || []).filter((x) => !x.postId);
    const folder = el("input", { type: "text", placeholder: "posts/my-next-post", spellcheck: "false" });
    const msg = el("div", { class: "err", role: "status" });
    const form = el("form", { class: "row2 keyform" }, folder, el("button", { class: "btn on", type: "submit" }, t("newPostSend")));
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = folder.value.trim();
      if (!f) { msg.textContent = t("newPostNeedFolder"); return; }
      try { await post("/api/note", { text: `Start a new post from the folder '${f}': run /200bps-publish ${f}.` }); folder.value = ""; msg.className = "ok-msg"; msg.textContent = t("sent"); }
      catch (err) { msg.className = "err"; msg.textContent = err.message; }
    });
    card.append(el("div", { class: "label kicker", style: "color:var(--accent-ink)" }, t("newPost")),
      el("h2", {}, t("newPostTitle")),
      el("div", { class: "np-ways" },
        el("button", { class: "np-way", type: "button", onclick: () => openNewPost() }, el("b", {}, "🖼  " + t("npFromPc")), el("span", { class: "hint" }, t("npFromPcHint"))),
        el("button", { class: "np-way", type: "button", onclick: () => openNewPost({ pick: "mine" }) }, el("b", {}, "✦  " + t("npFromMine")), el("span", { class: "hint" }, t("npFromMineHint"))),
        el("button", { class: "np-way", type: "button", onclick: () => { openNewPost(); setTimeout(npFolder, 400); } }, el("b", {}, "📁  " + t("npFromFolder")), el("span", { class: "hint" }, t("npFromFolderHint")))),
      el("p", { class: "ctx" }, t("npOrType")),
      el("pre", { class: "code" }, "posts/my-next-post/\n  01.jpg   (or reel.mp4)\n  caption.txt"),
      form, msg,
      drafts.length ? el("p", { class: "hint" }, t("newPostDrafts").replace("{n}", drafts.length), " ",
        el("button", { class: "btn", type: "button", onclick: () => { state.zfilter = "local"; go("posts"); } }, t("zNotUploaded"))) : "");
  }

  /* ---------- API keys: entered here, saved to .env on this machine ---------- */
  // key calls stay on this computer, so no "→ Claude" flight; errors come back as text
  async function keyPost(body) {
    let r, j = {};
    try { r = await fetch("/api/keys", { method: "POST", headers: { "Content-Type": "application/json", "X-BPS-Token": TOKEN }, body: JSON.stringify(body) }); }
    catch (e) { throw new Error(t("keyNoServer")); }
    try { j = await r.json(); } catch (e) {}
    if (!r.ok || !j.ok) throw new Error(j.error || ("HTTP " + r.status));
    return j;
  }
  const KEY_PRESETS = [["OpenAI", "OPENAI_API_KEY"], ["Anthropic", "ANTHROPIC_API_KEY"]];
  const guessKeyName = (v) => /^sk-ant-/.test(v) ? "ANTHROPIC_API_KEY" : /^sk_[0-9a-fA-F]{64}$/.test(v) ? "ZERNIO_API_KEY" : /^sk-/.test(v) ? "OPENAI_API_KEY" : "";
  state.keyUI = state.keyUI || { open: {}, items: {}, busy: {}, filter: {}, kind: {} };

  function keyForm(opts) {
    // opts: {name, label, known, onDone}
    const wrap = el("form", { class: "keyform", autocomplete: "off" });
    const nameIn = opts.known ? null : el("input", { type: "text", placeholder: t("keyNamePh"), "aria-label": t("keyName"), spellcheck: "false" });
    const val = el("input", { type: "password", placeholder: opts.known ? t("keyValuePh") : t("keyValue"), "aria-label": opts.label || t("keyValue"),
      autocomplete: "new-password", spellcheck: "false" });
    const show = el("button", { class: "btn", type: "button", "aria-label": t("showKey") }, t("show"));
    show.addEventListener("click", () => { val.type = val.type === "password" ? "text" : "password"; show.textContent = val.type === "password" ? t("show") : t("hide"); });
    const msg = el("div", { class: "key-msg", role: "status", "aria-live": "polite" });
    const willBe = el("div", { class: "hint will-be" });
    const save = el("button", { class: "btn on", type: "submit" }, t("saveKey"));
    const presets = nameIn ? el("div", { class: "row2 presets" }, el("span", { class: "label" }, t("keyFor")),
      ...KEY_PRESETS.map(([lbl, nm]) => el("button", { class: "btn sm", type: "button", onclick: () => { nameIn.value = nm; upd(); val.focus(); } }, lbl)),
      el("button", { class: "btn sm", type: "button", onclick: () => { nameIn.value = ""; upd(); nameIn.focus(); } }, t("keyOther"))) : null;
    function upd() {
      if (!nameIn) return;
      const n = nameIn.value.trim(), g = guessKeyName(val.value.trim());
      willBe.textContent = n ? t("keyWillBe").replace("{n}", n.toUpperCase()) : g ? t("keyWillBe").replace("{n}", g) + " " + t("keyGuessed") : val.value ? t("keyNeedName") : "";
      wrap.querySelectorAll(".presets .btn").forEach((b) => b.classList.toggle("on", KEY_PRESETS.some(([l, nm]) => l === b.textContent && nm === n)));
    }
    if (nameIn) { nameIn.addEventListener("input", upd); val.addEventListener("input", upd); }
    wrap.append(...[presets, nameIn ? el("div", { class: "field keyname-field" }, el("label", { class: "label" }, t("keyName")), nameIn) : null,
      el("div", { class: "row2 field" }, val, show, save), willBe, msg].filter(Boolean));
    wrap.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg.className = "key-msg busy"; msg.textContent = t("saving");
      save.disabled = true;
      try {
        const r = await keyPost({ op: "set", name: opts.known ? opts.name : (nameIn.value || ""), value: val.value });
        val.value = "";
        const nm = r.saved.name;
        if (r.test) { state.keyUI.items[nm] = r.test; if (r.test.ok && r.test.what === "models") state.keyUI.open[nm] = true; }
        if (r.test && r.test.ok === false) { msg.className = "key-msg bad"; msg.textContent = t("keySavedBad").replace("{n}", nm) + " " + r.test.error; }
        else {
          msg.className = "key-msg good";
          msg.textContent = t("keySavedAs").replace("{n}", nm) + (r.test && r.test.ok ? " · " + testLine(r.test) : "");
          toast(t("keySavedAs").replace("{n}", nm));
        }
        lastSig = ""; await load(false); renderKeys(true); opts.onDone && opts.onDone(r);
      } catch (err) { msg.className = "key-msg bad"; msg.textContent = "✗ " + err.message; }
      finally { save.disabled = false; }
    });
    return wrap;
  }

  function testLine(r) {
    if (!r) return "";
    if (r.ok === null) return r.error;
    if (!r.ok) return "✗ " + r.error;
    return "✓ " + t("keyConnected") + " · " + r.count + " " + t(r.what === "accounts" ? "accountsWord" : "modelsWord") + (r.ms != null ? " · " + r.ms + " ms" : "");
  }

  async function runKeyTest(name) {
    const ui = state.keyUI;
    ui.busy[name] = true; renderKeys(true);
    try {
      const r = await keyPost({ op: "test", name });
      ui.items[name] = r.test;
      if (r.test.ok && r.test.what) ui.open[name] = true;
      toast(r.test.provider ? r.test.provider + ": " + testLine(r.test) : r.test.error);
      lastSig = ""; await load(false);
    } catch (e) { ui.items[name] = { ok: false, error: e.message, ts: Date.now() / 1000 }; toast(e.message); }
    finally { ui.busy[name] = false; renderKeys(true); }
  }

  async function toggleModels(name) {
    const ui = state.keyUI;
    ui.open[name] = !ui.open[name];
    if (ui.open[name] && !(ui.items[name] && ui.items[name].items)) {
      try { const r = await fetch("/api/keytest?name=" + encodeURIComponent(name), { cache: "no-store" }).then((x) => x.json()); if (r.test) ui.items[name] = r.test; } catch (e) {}
    }
    renderKeys(true);
  }

  const KIND_ORDER = ["image", "text", "video", "audio", "embedding", "moderation", "account"];
  function modelPanel(name) {
    const ui = state.keyUI, r = ui.items[name];
    const box = el("div", { class: "models" });
    if (!r || !r.items) { box.append(el("p", { class: "hint" }, r && r.error ? "✗ " + r.error : t("modelsNone"))); return box; }
    const kinds = {};
    r.items.forEach((m) => { kinds[m.kind] = (kinds[m.kind] || 0) + 1; });
    const cur = ui.kind[name] || "all";
    const filt = el("input", { type: "search", class: "mfilter", placeholder: t("modelsFilter"), value: ui.filter[name] || "", spellcheck: "false", "aria-label": t("modelsFilter") });
    const list = el("ul", { class: "mlist" });
    const fill = () => {
      const q = (ui.filter[name] || "").toLowerCase(), k = ui.kind[name] || "all";
      list.innerHTML = "";
      const shown = r.items.filter((m) => (k === "all" || m.kind === k) && (!q || (m.id + " " + (m.name || "")).toLowerCase().includes(q)));
      shown.forEach((m) => list.append(el("li", { class: "m-" + m.kind },
        el("span", { class: "mono" }, m.id), m.name && m.name !== m.id ? el("span", { class: "hint" }, m.name) : null,
        r.what === "models" ? el("span", { class: "mkind" }, t("kind_" + m.kind)) : null)));
      if (!shown.length) list.append(el("li", { class: "hint" }, t("modelsNoMatch")));
    };
    filt.addEventListener("input", () => { ui.filter[name] = filt.value; fill(); });
    const chips = r.what === "models" ? el("div", { class: "row2 mkinds" },
      ...["all", ...KIND_ORDER.filter((k) => kinds[k]), ...Object.keys(kinds).filter((k) => !KIND_ORDER.includes(k))].map((k) =>
        el("button", { class: "btn sm" + (cur === k ? " on" : "") + (k === "image" ? " img" : ""), type: "button",
          onclick: () => { ui.kind[name] = k; renderKeys(true); } }, (k === "all" ? t("kind_all") : t("kind_" + k)) + " " + (k === "all" ? r.items.length : kinds[k])))) : null;
    box.append(...[el("div", { class: "mhead" }, el("b", {}, r.provider + " · " + r.count + " " + t(r.what === "accounts" ? "accountsWord" : "modelsWord")),
      r.ts ? el("span", { class: "label" }, t("tested") + " " + ago(r.ts)) : null),
      kinds.image ? el("p", { class: "hint ok-msg" }, "✓ " + t("modelsImageOk").replace("{n}", kinds.image)) :
        name === "OPENAI_API_KEY" ? el("p", { class: "hint warn-msg" }, t("modelsNoImage")) : null,
      chips, r.items.length > 8 ? filt : null, list].filter(Boolean));
    fill();
    return box;
  }

  function renderKeys(force) {
    const list = $("#keysList"), ks = (state.data && state.data.keys) || [];
    if (!force && list.contains(document.activeElement) && document.activeElement.matches("input")) return;   // don't wipe a key being typed
    if (!force && list.querySelector(".keyform")) return;                                                     // a form is open
    list.innerHTML = "";
    const ui = state.keyUI;
    ks.forEach((k) => {
      const lt = ui.items[k.name] || k.lastTest;
      const status = !k.set ? (k.required ? ["fail", t("missing")] : ["mute", t("notSet")])
        : lt && lt.ok === false ? ["fail", t("keyFailed")] : lt && lt.ok ? ["pass", t("connected")] : k.valid ? ["info", t("untested")] : ["warn", t("check")];
      const row = el("div", { class: "keyrow" + (k.set ? "" : " unset") },
        el("div", { class: "keyhead" }, el("b", {}, k.label), k.required ? el("span", { class: "conf medium" }, t("required")) : null,
          el("span", { class: "mono keyname" }, k.name), el("span", { class: "tag " + status[0] }, status[1])),
        k.use ? el("small", { class: "hint" }, k.use) : null,
        k.set ? el("div", { class: "mono masked" }, k.masked) : null,
        k.set && lt ? el("div", { class: "testline " + (lt.ok ? "good" : lt.ok === false ? "bad" : "") },
          testLine(lt), lt.ts ? el("span", { class: "label" }, " · " + t("tested") + " " + ago(lt.ts)) : null) : null);
      const acts = el("div", { class: "row2" });
      const replace = el("button", { class: "btn", type: "button" }, k.set ? t("replace") : t("addKey"));
      const holder = el("div");
      replace.addEventListener("click", () => { holder.innerHTML = ""; holder.append(keyForm({ name: k.name, label: k.label, known: true }));
        replace.hidden = true; holder.append(el("button", { class: "btn sm", type: "button", onclick: () => renderKeys(true) }, t("cancel"))); holder.querySelector("input[type=password]").focus(); });
      acts.append(replace);
      if (k.set) {
        const busy = ui.busy[k.name];
        acts.append(el("button", { class: "btn" + (busy ? " busy" : ""), type: "button", disabled: busy ? "" : null, onclick: () => runKeyTest(k.name) },
          busy ? t("testing") : t("test")));
        if (k.testable && lt && lt.ok) acts.append(el("button", { class: "btn" + (ui.open[k.name] ? " on" : ""), type: "button", "aria-expanded": String(!!ui.open[k.name]),
          onclick: () => toggleModels(k.name) }, (ui.open[k.name] ? "▾ " : "▸ ") + t(lt.what === "accounts" ? "showAccounts" : "showModels")));
      }
      if (k.set && !k.required) acts.append(el("button", { class: "btn", type: "button", onclick: async () => {
        if (!confirm(t("removeConfirm").replace("{k}", k.name))) return;
        try { await keyPost({ op: "remove", name: k.name }); delete ui.items[k.name]; ui.open[k.name] = false; lastSig = ""; await load(false); renderKeys(true); toast(t("removed")); } catch (e) { toast(e.message); } } }, t("remove")));
      if (k.help) row.append(el("small", { class: "hint" }, t("whereKey") + " ", el("a", { href: k.url, target: "_blank", rel: "noopener" }, k.help)));
      row.append(acts, holder);
      if (k.set && ui.open[k.name] && lt && lt.ok) row.append(modelPanel(k.name));
      if (k.name === "OPENAI_API_KEY" && k.set) row.append(imgModelRow());
      list.append(row);
    });
    const addHolder = el("div");
    const addBtn = el("button", { class: "btn", type: "button" }, "+ " + t("addOther"));
    addBtn.addEventListener("click", () => { addHolder.innerHTML = ""; addHolder.append(keyForm({ known: false }),
      el("button", { class: "btn sm", type: "button", onclick: () => renderKeys(true) }, t("cancel"))); addBtn.hidden = true; });
    list.append(el("div", { class: "keyrow" }, addBtn, addHolder), el("p", { class: "hint" }, t("keysSafe")));
  }
  function renderConnect() {
    const card = $("#connectCard"), ks = (state.data && state.data.keys) || [];
    const z = ks.find((k) => k.name === "ZERNIO_API_KEY");
    if (!z || (z.set && z.valid)) { card.hidden = true; card.innerHTML = ""; return; }
    if (!card.hidden && card.firstChild) return;         // keep the form stable while typing
    card.hidden = false; card.innerHTML = "";
    card.append(el("div", { class: "label kicker", style: "color:var(--accent-ink)" }, t("step1")),
      el("h2", {}, t("connectTitle")), el("p", { class: "ctx" }, t("connectHint")),
      el("ol", { class: "outline" }, el("li", {}, t("connect1"), " ", el("a", { href: "https://zernio.com", target: "_blank", rel: "noopener" }, "zernio.com")),
        el("li", {}, t("connect2")), el("li", {}, t("connect3"))),
      keyForm({ name: "ZERNIO_API_KEY", label: t("zernioKey"), known: true }),
      el("p", { class: "hint" }, t("keysSafe")));
  }

  /* ---------- Posts tab: every post, local or in Zernio, with its real status ---------- */
  state.zfilter = "all";
  const ZST = {
    local: { cls: "st-local", key: "stLocal" }, draft: { cls: "st-draft", key: "stDraft" }, awaiting_approval: { cls: "st-local", key: "stAwaiting" },
    scheduled: { cls: "st-sched", key: "stScheduled" }, publishing: { cls: "st-sched", key: "stPublishing" }, published: { cls: "st-pub", key: "stPublished" },
    partial: { cls: "st-warn", key: "stPartial" }, failed: { cls: "st-fail", key: "stFailed" }, cancelled: { cls: "st-draft", key: "stCancelled" },
    pending: { cls: "st-sched", key: "stPending" }, processing: { cls: "st-sched", key: "stPublishing" }, uploading: { cls: "st-sched", key: "stPublishing" },
  };
  const badge = (st) => { const m = ZST[st] || { cls: "st-draft", key: st }; return el("span", { class: "zbadge " + m.cls }, t(m.key)); };
  function postRows() {
    const z = state.z || {}, zp = z.zposts || [];
    const local = ((state.data && state.data.plans) || []).filter((p) => !p.postId).map((p) => ({
      id: "local:" + p.id, planId: p.id, status: p.status === "awaiting_approval" ? "awaiting_approval" : "local", caption: p.caption,
      thumbLocal: p.hasCover ? "cover" : (p.firstMedia && p.firstMedia.kind === "image" ? p.firstMedia.file : null),
      videoLocal: p.firstMedia && p.firstMedia.kind === "video" && !p.hasCover ? p.firstMedia.file : null, mediaCount: p.mediaCount,
      kind: p.kind, count: p.mediaCount,
      scheduledFor: p.at, platforms: (p.platforms || []).map((pl) => ({ platform: pl, status: "local",
        account: (((state.data.config || {}).accounts || {})[pl] || {}).username })), local: true, folder: p.folder, score: p.score }));
    const planByPost = Object.fromEntries(((state.data && state.data.plans) || []).filter((p) => p.postId).map((p) => [p.postId, p.id]));
    const remote = zp.map((p) => ({ ...p, planId: planByPost[p.id] }));
    const ts = (r) => Date.parse(r.scheduledFor || (r.platforms || []).map((p) => p.publishedAt).filter(Boolean)[0] || r.createdAt || 0) || 0;
    return [...local, ...remote.sort((a, b) => ts(b) - ts(a))];
  }
  state.zview = (() => { try { return localStorage.getItem("bps.zview") || "grid"; } catch (e) { return "grid"; } })();
  const planMedia = (planId, key) => "/media?f=" + encodeURIComponent(key) + "&plan=" + encodeURIComponent(planId);
  function thumbEl(r, big) {
    const box = el("div", { class: "zthumb" + (big ? " big" : "") });
    let node = null;
    if (r.local && r.thumbLocal) node = el("img", { src: planMedia(r.planId, r.thumbLocal), alt: "", loading: "lazy" });
    else if (r.local && r.videoLocal) node = el("video", { src: planMedia(r.planId, r.videoLocal) + "#t=0.5", muted: true, preload: "metadata", playsinline: true });
    const cands = (r.thumbs || (r.thumb ? [r.thumb] : [])).slice();
    const tryNext = () => {
      if (node) node.remove();
      const u = cands.shift();
      if (u) { node = el("img", { src: u, alt: "", loading: "lazy", referrerpolicy: "no-referrer" }); node.addEventListener("error", tryNext); box.prepend(node); }
      else if (r.video && !box.dataset.v) { box.dataset.v = 1; node = el("video", { src: r.video + "#t=0.5", muted: true, preload: "metadata", playsinline: true }); node.addEventListener("error", tryNext); box.prepend(node); }
      else { node = null; box.classList.add("none"); }
    };
    if (node) { node.addEventListener("error", () => { node.remove(); box.classList.add("none"); }); box.append(node); }
    else tryNext();
    const hv = r.local && r.videoLocal ? planMedia(r.planId, r.videoLocal) : r.video;
    if (hv) box.dataset.hv = hv;
    box.append(el("span", { class: "zph" }, (r.caption || "").trim().slice(0, 1) || "·"));
    box.append(kindChip(r, "zkind"));
    return box;
  }
  const KIND_ICON = { carousel: "▣", reel: "▶", video: "▶", short: "▶", story: "◔", document: "▤", article: "¶", text: "¶", post: "▢" };
  function kindLabel(r) {
    const k = r.kind || (r.videoLocal || r.video ? "video" : ((r.count || r.mediaCount || 0) > 1 ? "carousel" : "post"));
    const n = r.count || r.mediaCount || 0;
    return { k, text: t("kind_" + k) + (k === "carousel" && n > 1 ? " · " + n : "") };
  }
  function kindChip(r, cls) { const { k, text } = kindLabel(r); return el("span", { class: (cls || "kchip") + " k-" + k }, (KIND_ICON[k] || "▢") + " " + text); }
  const NET = { instagram: "IG", linkedin: "in", facebook: "f", threads: "@", twitter: "X", x: "X", tiktok: "TT", youtube: "YT", pinterest: "P", bluesky: "BS", reddit: "R", telegram: "TG", googlebusiness: "G" };
  const netTag = (p) => el("span", { class: "net n-" + p.platform, title: p.platform + (p.account ? " @" + p.account : "") }, NET[p.platform] || p.platform, p.account ? el("small", {}, "@" + p.account) : null);
  function openPostDetail(r) {
    const build = (body) => {
      body.append(el("div", { class: "zdetail" }, thumbEl(r, true),
        el("div", {}, el("div", { class: "zrow-head" }, badge(r.status), kindChip(r),
            el("span", { class: "label" }, r.local ? t("zLocalHint") : r.outside ? t("zOutside") : (r.fromSkill ? t("zFromSkill") : t("zFromZernio")))),
          el("div", { class: "zfullcap", style: "unicode-bidi:plaintext" }, r.caption || "—"),
          (r.scheduledFor || (r.platforms || [])[0]) ? el("p", { class: "hint" }, r.scheduledFor ? t("scheduled") + " " + dt(r.scheduledFor) : "") : null)));
      const plats = el("div", { class: "zplats" });
      (r.platforms || []).forEach((p) => plats.append(el("div", { class: "zplat" }, el("b", {}, p.platform), badge(p.status),
        p.account ? el("small", {}, "@" + p.account) : null, p.trial ? el("small", { class: "conf medium" }, t("trialShort")) : null,
        p.url ? el("a", { href: p.url, target: "_blank", rel: "noopener" }, t("openPost") + " ↗") : null,
        p.error ? el("div", { class: "zerr" }, (p.errorCategory ? p.errorCategory + ": " : "") + p.error) : null)));
      body.append(plats);
      const acts = el("div", { class: "actions" });
      if (!r.local) acts.append(el("a", { class: "btn", href: "https://zernio.com", target: "_blank", rel: "noopener" }, t("openZernio") + " ↗"));
      if (r.local || PENDING.includes(r.status) || r.status === "published")
        acts.append(el("button", { class: "btn danger-ghost cancel-btn", type: "button", onclick: () => openCancel(r) },
          r.local ? t("cDelDraft") : r.status === "published" ? t("cRemoveBtn") + "…" : t("cCancelBtn") + "…"));
      if (!r.local && ["failed", "partial"].includes(r.status)) acts.append(el("button", { class: "btn", type: "button",
        onclick: () => closeModal(() => sendNote(`Post ${r.id} ${r.status} in Zernio. Explain the error and help me fix and retry it.`)) }, t("zAskFix")));
      if (r.planId) acts.append(el("button", { class: "btn on", type: "button", onclick: () => closeModal(async () => {
        try { await post("/api/plan", { op: "select", id: r.planId }); lastSig = ""; await load(false); go("post"); } catch (e) { toast(e.message); } }) }, r.local ? t("zContinue") : t("zOpenPlan")));
      acts.append(el("button", { class: "btn", type: "button", onclick: () => closeModal(renderQuestion) }, t("close")));
      body.append(acts);
    };
    modal.open ? closeModal(() => showModal("zpost", build)) : showModal("zpost", build);
  }
  function renderPosts() {
    const z = state.z || {};
    const rows = postRows();
    // account strip
    const acc = $("#zAccounts"); acc.innerHTML = "";
    if (!z.ok) acc.append(el("p", { class: "empty" }, z.error || t("zernioOff")));
    (z.accounts || []).forEach((a) => acc.append(el("div", { class: "aud-z" + (a.needsReconnection || a.active === false ? " warnz" : " same") },
      el("b", {}, a.platform), el("span", {}, "@" + (a.username || "")),
      el("small", {}, (a.needsReconnection || a.active === false) ? t("reconnect") : (a.followers != null ? fmt(a.followers) + " " + t("followers") : t("connected"))))));
    acc.append(el("button", { class: "aud-z add-acc", type: "button", onclick: openConnectChooser }, el("b", {}, "+"), el("span", {}, t("accConnectShort"))));
    $("#zSynced").textContent = z.synced_at ? t("synced") + " " + ago(z.synced_at) : "";
    // counts
    const count = (f) => rows.filter(f).length;
    const groups = [
      ["all", t("zAll"), () => true],
      ["local", t("zNotUploaded"), (r) => r.local],
      ["scheduled", t("stScheduled"), (r) => ["scheduled", "publishing"].includes(r.status)],
      ["published", t("stPublished"), (r) => r.status === "published"],
      ["attention", t("zAttention"), (r) => ["failed", "partial"].includes(r.status) || (r.platforms || []).some((p) => p.status === "failed")],
      ["draft", t("stDraft"), (r) => ["draft", "cancelled"].includes(r.status)],
    ];
    const cnt = $("#zCounts"); cnt.innerHTML = "";
    groups.slice(1).forEach(([k, label, f]) => cnt.append(el("div", { class: "zcount " + k }, el("b", {}, count(f)), el("span", {}, label))));
    const seg = $("#zFilter"); seg.innerHTML = "";
    groups.forEach(([k, label, f]) => seg.append(el("button", { class: "btn" + (state.zfilter === k ? " on" : ""), type: "button", onclick: () => { state.zfilter = k; renderPosts(); } }, `${label} · ${count(f)}`)));
    const setView_ = (v) => { state.zview = v; try { localStorage.setItem("bps.zview", v); } catch (e) {} renderPosts(); };
    seg.append(el("span", { class: "seg zview", role: "group", "aria-label": t("zViewLabel") },
      el("button", { class: "btn" + (state.zview === "grid" ? " on" : ""), type: "button", title: t("zGrid"), "aria-pressed": String(state.zview === "grid"), onclick: () => setView_("grid") }, "▦ " + t("zGrid")),
      el("button", { class: "btn" + (state.zview === "list" ? " on" : ""), type: "button", title: t("zList"), "aria-pressed": String(state.zview === "list"), onclick: () => setView_("list") }, "☰ " + t("zList"))));
    // list
    // account / network filter (for many connected accounts)
    const accKey = (p) => p.platform + ":" + (p.account || "");
    const accs = {};
    rows.forEach((r) => (r.platforms || []).forEach((p) => { const k = accKey(p); accs[k] = accs[k] || { p, n: 0 }; accs[k].n++; }));
    let accBar = $("#zAccFilter");
    if (!accBar) { accBar = el("div", { id: "zAccFilter", class: "zaccfilter" }); $("#zFilter").after(accBar); }
    accBar.innerHTML = "";
    state.zacc = state.zacc || "all";
    if (Object.keys(accs).length > 1 || state.zacc !== "all") {
      accBar.append(el("span", { class: "label" }, t("zAccounts")),
        el("button", { class: "btn" + (state.zacc === "all" ? " on" : ""), type: "button", onclick: () => { state.zacc = "all"; renderPosts(); } }, t("zAllAccounts")));
      Object.entries(accs).forEach(([k, v]) => accBar.append(el("button", { class: "btn" + (state.zacc === k ? " on" : ""), type: "button", onclick: () => { state.zacc = k; renderPosts(); } },
        netTag(v.p), " · " + v.n)));
    }
    const list = $("#zList"); list.innerHTML = "";
    const f0 = (groups.find((g) => g[0] === state.zfilter) || groups[0])[2];
    const f = (r) => f0(r) && (state.zacc === "all" || (r.platforms || []).some((p) => accKey(p) === state.zacc));
    const shown = rows.filter(f);
    list.classList.toggle("zgrid", state.zview === "grid");
    if (!shown.length) list.append(el("p", { class: "empty" }, t("zNone")));
    if (state.zview === "grid") {
      shown.forEach((r) => {
        const when = r.status === "published" ? (r.platforms || []).map((p) => p.publishedAt).filter(Boolean).sort()[0] : r.scheduledFor;
        const card = el("button", { class: "ztile", type: "button", title: (r.caption || "").split("\n")[0] },
          thumbEl(r),
          el("span", { class: "ztile-badge" }, badge(r.status)),
          el("span", { class: "ztile-body" },
            el("span", { class: "zcap2", style: "unicode-bidi:plaintext" }, (r.caption || "").split("\n")[0] || "—"),
            el("span", { class: "ztile-meta" }, el("span", { class: "nets" }, (r.platforms || []).map(netTag)),
              when ? el("span", { class: "ztile-when", title: dtFull(when) }, dtFull(when)) : null)));
        if (r.outside) card.classList.add("outside");
        if ((r.platforms || []).some((p) => p.status === "failed")) card.classList.add("has-err");
        card.addEventListener("click", () => openPostDetail(r));
        list.append(card);
      });
      return;
    }
    shown.forEach((r) => {
      const when = r.status === "published"
        ? (r.platforms || []).map((p) => p.publishedAt).filter(Boolean).sort()[0]
        : r.scheduledFor;
      const plats = el("div", { class: "zplats" });
      (r.platforms || []).forEach((p) => plats.append(el("div", { class: "zplat" },
        el("b", {}, p.platform), badge(p.status),
        p.account ? el("small", {}, "@" + p.account) : null,
        p.trial ? el("small", { class: "conf medium" }, t("trialShort")) : null,
        p.url ? el("a", { href: p.url, target: "_blank", rel: "noopener" }, t("openPost") + " ↗") : null,
        p.error ? el("div", { class: "zerr" }, (p.errorCategory ? p.errorCategory + ": " : "") + p.error) : null)));
      const actions = el("div", { class: "row2" });
      if (r.planId) actions.append(el("button", { class: "btn" + (r.local ? " on" : ""), type: "button", onclick: async () => {
        try { await post("/api/plan", { op: "select", id: r.planId }); lastSig = ""; await load(false); go("post"); } catch (e) { toast(e.message); } } }, r.local ? t("zContinue") : t("zOpenPlan")));
      if (!r.local && (r.status === "failed" || r.status === "partial")) actions.append(el("button", { class: "btn", type: "button",
        onclick: () => sendNote(`Post ${r.id} ${r.status} in Zernio. Explain the error and help me fix and retry it.`) }, t("zAskFix")));
      list.append(el("div", { class: "zrow card" },
        el("div", { class: "zrow-head" }, el("div", { class: "zrow-thumb" }, thumbEl(r)), badge(r.status), kindChip(r),
          el("span", { class: "label" }, r.local ? t("zLocalHint") : r.outside ? t("zOutside") : (r.fromSkill ? t("zFromSkill") : t("zFromZernio"))),
          when ? el("span", { class: "zwhen" }, dtFull(when)) : null),
        el("div", { class: "zcap", style: "unicode-bidi:plaintext" }, (r.caption || "").split("\n")[0] || "—"),
        plats, actions));
    });
  }
  $("#zRefresh").addEventListener("click", async () => {
    const b = $("#zRefresh"); b.disabled = true; b.textContent = t("zRefreshing");
    try { const r = await fetch("/api/zernio?force=1", { cache: "no-store" }); state.z = await r.json(); lastZSig = ""; lastSig = ""; await load(false); renderAll(); toast(t("zUpdated")); }
    catch (e) { toast(String(e)); }
    b.disabled = false; b.textContent = t("zRefresh");
  });

  /* ---------- connect social accounts (Zernio OAuth; approve on the network's own site) ---------- */
  const NET_NAME = { instagram: "Instagram", linkedin: "LinkedIn", facebook: "Facebook", threads: "Threads", twitter: "X (Twitter)",
    tiktok: "TikTok", youtube: "YouTube", pinterest: "Pinterest", bluesky: "Bluesky" };
  function renderAccountsCard(host) {
    host.innerHTML = "";
    const cfg = (state.data && state.data.config) || {};
    const conn = cfg.connectable || ["instagram", "linkedin"], soon = cfg.comingSoon || [];
    const accounts = (state.z && state.z.accounts) || [];
    conn.forEach((p) => {
      const mine = accounts.filter((a) => a.platform === p);
      const row = el("div", { class: "acc-row" }, el("span", { class: "net-big n-" + p }, NET[p] || p), el("div", { class: "acc-main" }, el("b", {}, NET_NAME[p] || p),
        mine.length ? el("span", {}, mine.map((a) => "@" + (a.username || "") + (a.needsReconnection || a.active === false ? " · " + t("reconnect") : "")).join(", "))
                    : el("span", { class: "hint" }, t("accNotConnected"))));
      const needs = mine.some((a) => a.needsReconnection || a.active === false);
      row.append(el("button", { class: "btn" + (!mine.length || needs ? " on" : ""), type: "button", onclick: () => startConnect(p) },
        !mine.length ? t("accConnect") : needs ? t("accReconnect") : "+ " + t("accAddAnother")));
      host.append(row);
    });
    if (soon.length) host.append(el("div", { class: "acc-soon" }, el("span", { class: "label" }, t("accSoon")),
      ...soon.map((p) => el("span", { class: "chip" }, NET_NAME[p] || p))));
    if (!(state.z && state.z.ok)) host.append(el("p", { class: "hint" }, t("zernioOff")));
  }
  function openConnectChooser() {
    const build = (body) => {
      body.append(el("div", { class: "label kicker", style: "color:var(--accent-ink)" }, t("accKicker")), el("h2", { id: "mTitle" }, t("accTitle")),
        el("p", { class: "ctx" }, t("accHint")));
      const box = el("div", {}); renderAccountsCard(box); body.append(box,
        el("div", { class: "actions" }, el("button", { class: "btn", type: "button", onclick: () => closeModal(renderQuestion) }, t("close"))));
    };
    modal.open ? closeModal(() => showModal("connect", build)) : showModal("connect", build);
  }
  let connectPoll = 0;
  async function startConnect(platform) {
    const win = window.open("about:blank", "_blank");            // open now (inside the click) so it isn't blocked
    let r;
    try { r = await post("/api/connect", { platform }); }
    catch (e) { if (win) win.close(); toast(e.message); return; }
    if (win) win.location.href = r.authUrl; else window.location.assign(r.authUrl);
    const build = (body) => {
      body.append(el("div", { class: "label kicker", style: "color:var(--accent-ink)" }, t("accKicker")),
        el("h2", { id: "mTitle" }, t("accWaiting").replace("{n}", NET_NAME[platform] || platform)),
        el("ol", { class: "pub-steps" }, el("li", { class: "done" }, el("i"), el("span", {}, t("accW1"))),
          el("li", { class: "on" }, el("i"), el("span", {}, t("accW2").replace("{n}", NET_NAME[platform] || platform))),
          el("li", {}, el("i"), el("span", {}, t("accW3")))),
        el("p", { class: "hint" }, t("accPrivacy")),
        el("div", { class: "actions" },
          el("a", { class: "btn", href: r.authUrl, target: "_blank", rel: "noopener" }, t("accOpenAgain") + " ↗"),
          el("button", { class: "btn", type: "button", onclick: () => { clearInterval(connectPoll); closeModal(renderQuestion); } }, t("cancel"))));
    };
    modal.open ? closeModal(() => showModal("connecting", build)) : showModal("connecting", build);
    clearInterval(connectPoll);
    const t0 = Date.now();
    const check = async () => {
      if (Date.now() - t0 > 10 * 60000) { clearInterval(connectPoll); return; }
      try {
        const a = await fetch("/api/accounts", { cache: "no-store" }).then((x) => x.json());
        if (a.new && a.new.length) {
          clearInterval(connectPoll);
          const n = a.new[0];
          if (modal.open === "connecting") closeModal(() => toast(t("accDone").replace("{a}", (NET_NAME[n.platform] || n.platform) + " @" + (n.username || ""))));
          else toast(t("accDone").replace("{a}", (NET_NAME[n.platform] || n.platform) + " @" + (n.username || "")));
          lastSig = ""; lastZSig = "";
          const z = await fetch("/api/zernio?force=1", { cache: "no-store" }).then((x) => x.json()); state.z = z; await load(false); renderAll();
        }
      } catch (e) {}
    };
    connectPoll = setInterval(check, 3000);
    addEventListener("message", (e) => { if (e.origin === location.origin && e.data && e.data.bps === "connected") check(); }, { once: true });
  }

  /* ---------- Create image (OpenAI gpt-image): describe → optional guide pictures → Create ---------- */
  document.addEventListener("paste", (e) => {
    if (modal.open !== "image" || !IMG.st || !IMG.st.hasKey) return;
    const files = [...(e.clipboardData && e.clipboardData.files || [])].filter((f) => f.type.startsWith("image/"));
    if (files.length) { e.preventDefault(); addRefFiles(files); }
  });
  const put = (parent, ...kids) => parent.append(...kids.flat().filter((k) => k != null && k !== false));
  const IMG = { st: null, prompt: "", refs: [], shape: null, quality: null, n: null, model: null, busy: false, t0: 0, last: [], err: "", askedAt: 0, note: "" };
  async function imgApi(body) {
    let r, j = {};
    try { r = body ? await fetch("/api/images", { method: "POST", headers: { "Content-Type": "application/json", "X-BPS-Token": TOKEN }, body: JSON.stringify(body) })
                   : await fetch("/api/images", { cache: "no-store" }); }
    catch (e) { throw new Error(t("keyNoServer")); }
    try { j = await r.json(); } catch (e) {}
    if (!r.ok || !j.ok) throw new Error(j.error || ("HTTP " + r.status));
    return j;
  }
  const imgUrl = (g) => "/img?id=" + encodeURIComponent(g.id);
  const refUrl = (p) => "/img?p=" + encodeURIComponent(p);
  async function imgRefresh() { IMG.st = await imgApi(); return IMG.st; }

  async function openImage(preset) {
    try { await imgRefresh(); } catch (e) { toast(e.message); return; }
    const s = IMG.st.settings;
    IMG.shape = IMG.shape || s.shape; IMG.quality = IMG.quality || s.quality; IMG.n = IMG.n || s.n; IMG.model = IMG.model || s.model;
    if (preset && preset.refs) IMG.refs = [...new Set([...IMG.refs, ...preset.refs])].slice(0, IMG.st.maxRefs);
    const build = (body) => drawImage(body);
    if (modal.open && modal.open !== "image") closeModal(() => showModal("image", build));
    else { modal.open = null; showModal("image", build); }
    $("#modal .modal").classList.add("wide");
  }
  function redrawImage() { if (modal.open === "image") { const b = $("#modalBody"); const keep = b.scrollTop; b.innerHTML = ""; drawImage(b); b.scrollTop = keep; } }

  function seg(opts, cur, onPick, cls) {
    return el("div", { class: "seg " + (cls || ""), role: "group" }, ...opts.map(([v, lbl]) =>
      el("button", { class: "btn" + (v === cur ? " on" : ""), type: "button", "aria-pressed": String(v === cur), onclick: () => onPick(v) }, lbl)));
  }

  function drawImage(body) {
    const st = IMG.st;
    put(body, el("h2", { id: "mTitle" }, t("imgTitle")), el("p", { class: "hint" }, t("imgSub")));
    if (!st.hasKey) {
      put(body, el("div", { class: "img-nokey" }, el("b", {}, t("imgNoKey")), el("p", { class: "hint" }, t("imgNoKeyHint")),
        keyForm({ name: "OPENAI_API_KEY", label: "OpenAI API key", known: true, onDone: async (r) => { if (r.saved) { await imgRefresh(); redrawImage(); } } })));
      return;
    }
    const grid = el("div", { class: "img-grid" });
    const left = el("div", { class: "img-form" }), right = el("div", { class: "img-out" });
    grid.append(left, right); put(body, grid);

    // 1 · describe
    const ta = el("textarea", { rows: "5", class: "img-prompt", placeholder: t("imgPh"), "aria-label": t("imgStep1") });
    ta.value = IMG.prompt;
    ta.addEventListener("input", () => { IMG.prompt = ta.value; });
    ta.addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); runImage(); } });
    const sug = st.suggested && st.suggested.ts >= IMG.askedAt && IMG.askedAt ? st.suggested : null;
    put(left, el("div", { class: "img-step" }, el("span", { class: "n1" }, "1"), el("b", {}, t("imgStep1"))), ta,
      el("div", { class: "row2 img-askrow" },
        el("button", { class: "btn sm", type: "button", onclick: askClaudePrompt }, "✨ " + t("imgAsk")),
        IMG.askedAt && !sug ? el("span", { class: "hint pulse" }, t("imgAsking")) : null),
      sug ? el("div", { class: "img-sug" }, el("div", { class: "label" }, t("imgSuggested")), el("p", {}, sug.text),
        sug.note ? el("p", { class: "hint" }, sug.note) : null,
        el("button", { class: "btn on sm", type: "button", onclick: () => { IMG.prompt = sug.text; IMG.askedAt = 0; redrawImage(); } }, t("imgUseIt"))) : null);

    // 2 · guide pictures
    const fileIn = el("input", { type: "file", accept: "image/png,image/jpeg,image/webp", multiple: true, hidden: true });
    fileIn.addEventListener("change", () => addRefFiles([...fileIn.files]));
    const drop = el("div", { class: "img-drop", tabindex: "0", role: "button", "aria-label": t("imgDrop") },
      IMG.refs.length ? el("div", { class: "img-refs" }, ...IMG.refs.map((p) => el("figure", {},
        el("img", { src: refUrl(p), alt: "", loading: "lazy" }),
        el("button", { class: "x", type: "button", "aria-label": t("remove"), onclick: (e) => { e.stopPropagation(); IMG.refs = IMG.refs.filter((x) => x !== p); redrawImage(); } }, "×"))))
        : el("p", { class: "hint" }, t("imgDrop")));
    drop.addEventListener("click", (e) => { if (e.target === drop || e.target.tagName === "P") fileIn.click(); });
    drop.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileIn.click(); } });
    drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
    drop.addEventListener("dragleave", () => drop.classList.remove("over"));
    drop.addEventListener("drop", (e) => { e.preventDefault(); drop.classList.remove("over"); addRefFiles([...e.dataTransfer.files]); });
    const postImgs = (st.post && st.post.media) || [];
    const pickers = el("div", { class: "row2 img-pickers" },
      el("button", { class: "btn sm", type: "button", onclick: () => fileIn.click() }, "＋ " + t("imgFromPc")),
      postImgs.length ? el("button", { class: "btn sm", type: "button", onclick: () => pickRefs("post") }, t("imgFromPost") + " (" + postImgs.length + ")") : null,
      st.gallery.length ? el("button", { class: "btn sm", type: "button", onclick: () => pickRefs("mine") }, t("imgFromMine") + " (" + st.gallery.length + ")") : null);
    put(left, el("div", { class: "img-step" }, el("span", { class: "n1" }, "2"), el("b", {}, t("imgStep2")),
      el("span", { class: "label" }, IMG.refs.length ? IMG.refs.length + " / " + st.maxRefs : t("jOptional"))), drop, fileIn, pickers);
    if (IMG.picker) put(left, refPicker());

    // 3 · options (plain words; the defaults live in Settings)
    const allModels = [...st.models.main, ...st.models.pinned];
    if (!allModels.includes(IMG.model)) allModels.unshift(IMG.model);
    const sel = el("select", { class: "img-model", "aria-label": t("imgModel") },
      el("optgroup", { label: t("imgModelsMain") }, ...st.models.main.map((m) => el("option", { value: m, selected: m === IMG.model ? "" : null }, m + (m === st.settings.model ? "  ★" : "")))),
      st.models.pinned.length ? el("optgroup", { label: t("imgModelsPinned") }, ...st.models.pinned.map((m) => el("option", { value: m, selected: m === IMG.model ? "" : null }, m))) : null);
    sel.addEventListener("change", () => { IMG.model = sel.value; redrawImage(); });
    const isDefault = IMG.model === st.settings.model && IMG.shape === st.settings.shape && IMG.quality === st.settings.quality && +IMG.n === +st.settings.n;
    put(left, el("div", { class: "img-step" }, el("span", { class: "n1" }, "3"), el("b", {}, t("imgStep3"))),
      el("div", { class: "img-opts" },
        el("label", { class: "label" }, t("imgShape")), seg([["square", "■ " + t("shapeSquare")], ["tall", "▮ " + t("shapeTall")], ["wide", "▬ " + t("shapeWide")]], IMG.shape, (v) => { IMG.shape = v; redrawImage(); }),
        el("label", { class: "label" }, t("imgQuality")), seg([["draft", t("qDraft")], ["standard", t("qStandard")], ["best", t("qBest")]], IMG.quality, (v) => { IMG.quality = v; redrawImage(); }),
        el("label", { class: "label" }, t("imgCount")), seg([1, 2, 4].map((n) => [n, String(n)]), +IMG.n, (v) => { IMG.n = v; redrawImage(); }),
        el("label", { class: "label" }, t("imgModel")), sel),
      el("p", { class: "hint img-shapehint" }, t("shapeHint_" + IMG.shape), " · ", t("qHint_" + IMG.quality)),
      !isDefault ? el("button", { class: "btn sm ghost", type: "button", onclick: saveImgDefaults }, "★ " + t("imgMakeDefault")) : null);

    // go
    const go = el("button", { class: "btn on img-go", type: "button", disabled: IMG.busy ? "" : null, onclick: runImage },
      IMG.busy ? el("span", { class: "img-timer" }, t("imgMaking")) : (IMG.refs.length ? t("imgGoRefs").replace("{n}", IMG.refs.length) : t("imgGo")));
    put(left, go, IMG.err ? el("div", { class: "key-msg bad" }, "✗ " + IMG.err) : null,
      el("p", { class: "hint" }, t("imgWhere")));
    if (IMG.busy) tickTimer(go);

    // results + your images
    if (IMG.busy) put(right, el("div", { class: "img-step" }, el("b", {}, t("imgMakingN").replace("{n}", IMG.n))),
      el("div", { class: "img-tiles" }, ...Array.from({ length: +IMG.n }, () => el("div", { class: "img-tile ghost shape-" + IMG.shape }))));
    if (IMG.last.length) put(right, el("div", { class: "img-step" }, el("b", {}, t("imgNew"))), el("div", { class: "img-tiles" }, ...IMG.last.map((g) => imgTile(g, true))));
    const older = st.gallery.filter((g) => !IMG.last.some((x) => x.id === g.id));
    put(right, el("div", { class: "img-step" }, el("b", {}, t("imgMine")), el("span", { class: "label" }, String(st.gallery.length))),
      st.gallery.length > 1 ? el("button", { class: "btn sm", type: "button", onclick: () => openNewPost({ pick: "mine" }) }, "▦ " + t("npCarouselFromMine")) : null,
      older.length ? el("div", { class: "img-tiles small" }, ...older.slice(0, 24).map((g) => imgTile(g))) : el("p", { class: "hint" }, t("imgNone")));
  }

  function tickTimer(btn) {
    clearInterval(IMG.tick);
    IMG.tick = setInterval(() => {
      if (!IMG.busy || !document.body.contains(btn)) return clearInterval(IMG.tick);
      const s = Math.round((Date.now() - IMG.t0) / 1000);
      const sp = btn.querySelector(".img-timer"); if (sp) sp.textContent = t("imgMaking") + " " + s + " s";
    }, 500);
  }

  function imgTile(g, big) {
    const st = IMG.st, canPost = st.post && st.post.editable;
    const fig = el("figure", { class: "img-tile shape-" + g.shape + (big ? " big" : "") },
      el("a", { href: imgUrl(g), target: "_blank", rel: "noopener", title: g.prompt }, el("img", { src: imgUrl(g), alt: g.prompt.slice(0, 120), loading: "lazy" })),
      el("figcaption", {}, el("span", { class: "label" }, g.model + " · " + t("q" + g.quality[0].toUpperCase() + g.quality.slice(1)) + (g.refs && g.refs.length ? " · " + g.refs.length + " " + t("imgGuides") : "")),
        el("div", { class: "row2 img-acts" },
          el("button", { class: "btn sm" + (big ? " on" : ""), type: "button", onclick: () => imgToPost(g, canPost) }, canPost ? "＋ " + t("imgAddPost") : t("imgSaveFolder")),
          el("button", { class: "btn sm", type: "button", title: t("npFromImageHint"), onclick: () => openNewPost({ images: [g] }) }, "＋ " + t("npFromImage")),
          el("button", { class: "btn sm", type: "button", title: t("imgUseGuideHint"), onclick: () => { useAsGuide(g); } }, t("imgUseGuide")),
          el("button", { class: "btn sm", type: "button", title: t("imgAgainHint"), onclick: () => { Object.assign(IMG, { prompt: g.prompt, refs: [...(g.refs || [])], shape: g.shape, quality: g.quality, model: g.model }); redrawImage(); $("#modalBody").scrollTop = 0; } }, "↻ " + t("imgAgain")),
          el("a", { class: "btn sm", href: imgUrl(g), download: g.file }, "⤓"),
          el("button", { class: "btn sm danger-ghost", type: "button", "aria-label": t("remove"), onclick: () => imgDelete(g) }, "🗑"))));
    return fig;
  }

  async function useAsGuide(g) {
    const p = ".bps/images/" + g.file;
    if (!IMG.refs.includes(p)) IMG.refs = [...IMG.refs, p].slice(0, IMG.st.maxRefs);
    redrawImage(); $("#modalBody").scrollTop = 0; toast(t("imgAddedGuide"));
  }

  async function addRefFiles(files) {
    const imgs = files.filter((f) => /^image\/(png|jpeg|webp)$/.test(f.type));
    if (!imgs.length) { toast(t("imgBadFile")); return; }
    for (const f of imgs) {
      if (IMG.refs.length >= IMG.st.maxRefs) { toast(t("imgMaxRefs").replace("{n}", IMG.st.maxRefs)); break; }
      if (f.size > 20 * 1024 * 1024) { toast(t("imgTooBig")); continue; }
      const data = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
      try { const r = await imgApi({ op: "upload", name: f.name, data }); IMG.refs.push(r.path); } catch (e) { toast(e.message); }
    }
    redrawImage();
  }

  function pickRefs(which) { IMG.picker = IMG.picker === which ? null : which; redrawImage(); }
  function refPicker() {
    const st = IMG.st;
    const items = IMG.picker === "post" ? st.post.media.map((m) => ({ path: m.path, label: m.file }))
      : st.gallery.map((g) => ({ path: ".bps/images/" + g.file, label: g.prompt }));
    return el("div", { class: "img-picker" }, el("div", { class: "row2" }, el("span", { class: "label" }, t("imgPickHint")),
      el("button", { class: "btn sm", type: "button", onclick: () => { IMG.picker = null; redrawImage(); } }, t("imgPickDone"))),
      el("div", { class: "img-refs pick" }, ...items.map((it) => {
        const on = IMG.refs.includes(it.path);
        return el("button", { class: "pickref" + (on ? " on" : ""), type: "button", title: it.label, "aria-pressed": String(on), onclick: () => {
          IMG.refs = on ? IMG.refs.filter((x) => x !== it.path) : [...IMG.refs, it.path].slice(0, st.maxRefs); redrawImage(); } },
          el("img", { src: refUrl(it.path), alt: "", loading: "lazy" }), on ? el("i", {}, "✓") : null);
      })));
  }

  async function runImage() {
    if (IMG.busy) return;
    if (!IMG.prompt.trim()) { IMG.err = t("imgNeedPrompt"); redrawImage(); $(".img-prompt") && $(".img-prompt").focus(); return; }
    IMG.busy = true; IMG.err = ""; IMG.t0 = Date.now(); IMG.picker = null; redrawImage();
    try {
      const r = await imgApi({ op: "generate", prompt: IMG.prompt, refs: IMG.refs, model: IMG.model, shape: IMG.shape, quality: IMG.quality, n: IMG.n });
      IMG.last = r.images;
      if (r.errors && r.errors.length) IMG.err = r.errors[0];
      toast(t("imgDone").replace("{n}", r.images.length).replace("{s}", Math.round(r.secs)));
      await imgRefresh();
    } catch (e) { IMG.err = e.message; }
    finally { IMG.busy = false; redrawImage(); }
  }

  async function imgToPost(g, canPost) {
    let folder = "";
    if (!canPost) {
      folder = prompt(t("imgFolderAsk"), (IMG.st.post && IMG.st.post.folder) || "my-posts/new-post");
      if (!folder) return;
    }
    try {
      const r = await imgApi({ op: "copy", id: g.id, folder });
      toast(r.addedToPost ? t("imgAddedPost").replace("{f}", r.file) : t("imgSavedTo").replace("{f}", r.folder + "/" + r.file));
      lastSig = ""; load(false); await imgRefresh(); redrawImage();
    } catch (e) { toast(e.message); }
  }

  async function imgDelete(g) {
    if (!confirm(t("imgDelConfirm"))) return;
    try { await imgApi({ op: "delete", id: g.id }); IMG.last = IMG.last.filter((x) => x.id !== g.id); IMG.refs = IMG.refs.filter((p) => p !== ".bps/images/" + g.file); await imgRefresh(); redrawImage(); toast(t("removed")); }
    catch (e) { toast(e.message); }
  }

  async function saveImgDefaults() {
    try { const r = await imgApi({ op: "settings", model: IMG.model, shape: IMG.shape, quality: IMG.quality, n: IMG.n }); IMG.st.settings = r.settings; toast(t("imgDefSaved")); redrawImage(); }
    catch (e) { toast(e.message); }
  }

  async function askClaudePrompt() {
    const idea = IMG.prompt.trim();
    if (!idea) { IMG.err = t("imgAskNeed"); redrawImage(); return; }
    try { await imgApi({ op: "ask", text: idea, refs: IMG.refs }); IMG.askedAt = Math.floor(Date.now() / 1000) - 2; IMG.err = ""; flyToClaude(lastBtn); redrawImage(); pollSuggestion(); }
    catch (e) { toast(e.message); }
  }
  function pollSuggestion() {
    clearInterval(IMG.sugTick);
    IMG.sugTick = setInterval(async () => {
      if (modal.open !== "image" || !IMG.askedAt) return clearInterval(IMG.sugTick);
      try { const st = await imgApi(); const s = st.suggested; if (s && s.ts >= IMG.askedAt) { IMG.st = st; clearInterval(IMG.sugTick); redrawImage(); toast(t("imgSugArrived")); } } catch (e) {}
    }, 3000);
  }

  // Settings → OpenAI row: the default image model, one dropdown
  function imgModelRow() {
    const box = el("div", { class: "img-defrow" }, el("span", { class: "label" }, t("imgDefModel")));
    const fillRow = (st) => {
      const sel = el("select", { class: "img-model", "aria-label": t("imgDefModel") },
        el("optgroup", { label: t("imgModelsMain") }, ...st.models.main.map((m) => el("option", { value: m, selected: m === st.settings.model ? "" : null }, m))),
        st.models.pinned.length ? el("optgroup", { label: t("imgModelsPinned") }, ...st.models.pinned.map((m) => el("option", { value: m, selected: m === st.settings.model ? "" : null }, m))) : null);
      sel.addEventListener("change", async () => { try { const r = await imgApi({ op: "settings", model: sel.value }); IMG.st && (IMG.st.settings = r.settings); IMG.model = sel.value; toast(t("imgDefSaved")); } catch (e) { toast(e.message); } });
      put(box, sel, el("button", { class: "btn sm on", type: "button", onclick: () => { closeDrawer(); openImage(); } }, "✦ " + t("imgOpen")));
    };
    if (IMG.st) fillRow(IMG.st); else imgRefresh().then(fillRow).catch(() => {});
    return box;
  }

  /* ---------- New post: from computer files, made images, or a folder (no typing paths) ---------- */
  const NP = { items: [], name: "", caption: "", busy: "", err: "", pick: null, fs: null };
  const npThumb = (it) => it.image ? "/img?id=" + encodeURIComponent(it.image) : "/upl?p=" + encodeURIComponent(it.path);
  const npKey = (it) => it.image ? "image:" + it.image : it.path;
  async function npPost(body) {
    let r, j = {};
    try { r = await fetch("/api/newpost", { method: "POST", headers: { "Content-Type": "application/json", "X-BPS-Token": TOKEN }, body: JSON.stringify(body) }); }
    catch (e) { throw new Error(t("keyNoServer")); }
    try { j = await r.json(); } catch (e) {}
    if (!r.ok || !j.ok) throw new Error(j.error || ("HTTP " + r.status));
    return j;
  }
  function openNewPost(preset) {
    const today = new Date().toISOString().slice(0, 10);
    Object.assign(NP, { items: [], name: "post-" + today, caption: "", busy: "", err: "", pick: null, fs: null });
    (preset && preset.images || []).forEach((g) => NP.items.push({ image: g.id, name: g.prompt.slice(0, 40), kind: "image" }));
    if (preset && preset.pick) NP.pick = preset.pick;
    const build = (body) => drawNewPost(body);
    if (modal.open && modal.open !== "np") closeModal(() => showModal("np", build));
    else { modal.open = null; showModal("np", build); }
    if (preset && preset.pick === "mine" && !IMG.st) imgRefresh().then(redrawNP).catch(() => {});
  }
  function redrawNP() { if (modal.open === "np") { const b = $("#modalBody"), k = b.scrollTop; b.innerHTML = ""; drawNewPost(b); b.scrollTop = k; } }

  function drawNewPost(body) {
    const fileIn = el("input", { type: "file", accept: "image/png,image/jpeg,image/webp,video/mp4,video/quicktime,application/pdf", multiple: true, hidden: true });
    fileIn.addEventListener("change", () => npUpload([...fileIn.files]));
    const n = NP.items.length, kinds = NP.items.map((x) => x.kind);
    const typeLbl = !n ? "" : kinds.includes("video") && n === 1 ? t("npReel") : kinds.includes("document") ? "PDF" : n > 1 ? t("npCarousel").replace("{n}", n) : t("npSingle");
    put(body, el("div", { class: "label kicker", style: "color:var(--accent-ink)" }, t("newPost")),
      el("h2", { id: "mTitle" }, t("npTitle")), el("p", { class: "hint" }, t("npSub")), fileIn,
      el("div", { class: "np-ways" },
        el("button", { class: "np-way", type: "button", onclick: () => fileIn.click() }, el("b", {}, "🖼  " + t("npFromPc")), el("span", { class: "hint" }, t("npFromPcHint"))),
        el("button", { class: "np-way" + (NP.pick === "mine" ? " on" : ""), type: "button", onclick: async () => { NP.pick = NP.pick === "mine" ? null : "mine"; if (!IMG.st) { try { await imgRefresh(); } catch (e) {} } redrawNP(); } },
          el("b", {}, "✦  " + t("npFromMine")), el("span", { class: "hint" }, t("npFromMineHint"))),
        el("button", { class: "np-way", type: "button", onclick: npFolder }, el("b", {}, "📁  " + t("npFromFolder")), el("span", { class: "hint" }, t("npFromFolderHint")))));
    if (NP.pick === "mine") body.append(npMinePicker());
    if (NP.fs) body.append(npExplorer());
    const drop = el("div", { class: "np-drop" + (n ? " has" : "") },
      n ? el("ol", { class: "np-items" }, ...NP.items.map((it, i) => el("li", {},
        el("span", { class: "np-n" }, String(i + 1)),
        it.kind === "video" ? el("div", { class: "np-vid" }, "▶ " + (it.name || "video")) : it.kind === "document" ? el("div", { class: "np-vid" }, "PDF") : el("img", { src: npThumb(it), alt: "" }),
        el("div", { class: "np-ctl" },
          el("button", { class: "btn sm", type: "button", disabled: i === 0 ? "" : null, "aria-label": t("npEarlier"), onclick: () => { NP.items.splice(i - 1, 0, NP.items.splice(i, 1)[0]); redrawNP(); } }, "←"),
          el("button", { class: "btn sm", type: "button", disabled: i === n - 1 ? "" : null, "aria-label": t("npLater"), onclick: () => { NP.items.splice(i + 1, 0, NP.items.splice(i, 1)[0]); redrawNP(); } }, "→"),
          el("button", { class: "btn sm danger-ghost", type: "button", "aria-label": t("remove"), onclick: () => { NP.items.splice(i, 1); redrawNP(); } }, "×")))))
        : el("p", { class: "hint" }, t("npDrop")));
    drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
    drop.addEventListener("dragleave", () => drop.classList.remove("over"));
    drop.addEventListener("drop", (e) => { e.preventDefault(); drop.classList.remove("over"); npUpload([...e.dataTransfer.files]); });
    const nameIn = el("input", { type: "text", class: "np-name", value: NP.name, spellcheck: "false", "aria-label": t("npName") });
    nameIn.addEventListener("input", () => { NP.name = nameIn.value; });
    const cap = el("textarea", { rows: "4", class: "np-cap", placeholder: t("npCapPh"), "aria-label": t("npCap") });
    cap.value = NP.caption; cap.addEventListener("input", () => { NP.caption = cap.value; createBtn.textContent = NP.caption.trim() ? t("npCreateOpen") : t("npCreateClaude"); });
    const createBtn = el("button", { class: "btn on big", type: "button", disabled: !n || NP.busy ? "" : null, onclick: npCreate },
      NP.busy || (NP.caption.trim() ? t("npCreateOpen") : t("npCreateClaude")));
    put(body, el("div", { class: "img-step" }, el("b", {}, t("npMedia")), el("span", { class: "label" }, typeLbl)), drop,
      el("div", { class: "np-fields" },
        el("label", { class: "label" }, t("npName")), el("div", {}, nameIn, el("small", { class: "hint" }, t("npWhere").replace("{f}", "my-posts/" + (NP.name || "…")))),
        el("label", { class: "label" }, t("npCap")), el("div", {}, cap, el("small", { class: "hint" }, t("npCapHint")))),
      NP.err ? el("div", { class: "key-msg bad" }, "✗ " + NP.err) : null,
      el("div", { class: "actions" }, el("button", { class: "btn", type: "button", onclick: () => closeModal(renderQuestion) }, t("cancel")), createBtn),
      el("p", { class: "hint" }, t("npChat")));
  }

  function npMinePicker() {
    const g = (IMG.st && IMG.st.gallery) || [];
    const on = new Set(NP.items.filter((x) => x.image).map((x) => x.image));
    return el("div", { class: "img-picker" }, el("div", { class: "row2" }, el("span", { class: "label" }, g.length ? t("npMineHint") : t("imgNone")),
      el("button", { class: "btn sm", type: "button", onclick: () => { NP.pick = null; redrawNP(); } }, t("imgPickDone"))),
      el("div", { class: "img-refs pick" }, ...g.map((x) => el("button", { class: "pickref" + (on.has(x.id) ? " on" : ""), type: "button", title: x.prompt, "aria-pressed": String(on.has(x.id)),
        onclick: () => { if (on.has(x.id)) NP.items = NP.items.filter((y) => y.image !== x.id); else NP.items.push({ image: x.id, name: x.prompt.slice(0, 40), kind: "image" }); redrawNP(); } },
        el("img", { src: "/img?id=" + encodeURIComponent(x.id), alt: "", loading: "lazy" }), on.has(x.id) ? el("i", {}, String(NP.items.findIndex((y) => y.image === x.id) + 1)) : null))));
  }

  async function npUpload(files) {
    const ok = files.filter((f) => /^(image\/(png|jpeg|webp)|video\/(mp4|quicktime)|application\/pdf)$/.test(f.type));
    if (!ok.length) { NP.err = t("npBadFile"); redrawNP(); return; }
    NP.err = "";
    for (let i = 0; i < ok.length; i++) {
      NP.busy = t("npUploading").replace("{i}", i + 1).replace("{n}", ok.length); redrawNP();
      try {
        const r = await fetch("/api/upload", { method: "POST", headers: { "Content-Type": "application/octet-stream", "X-BPS-Token": TOKEN, "X-File-Name": encodeURIComponent(ok[i].name) }, body: ok[i] }).then((x) => x.json());
        if (!r.ok) throw new Error(r.error);
        NP.items.push({ path: r.path, name: r.name, kind: r.kind });
      } catch (e) { NP.err = e.message; }
    }
    NP.busy = ""; redrawNP();
  }

  async function npCreate() {
    if (!NP.items.length || NP.busy) return;
    NP.busy = t("npCreating"); NP.err = ""; redrawNP();
    try {
      const r = await npPost({ op: "create", files: NP.items.map(npKey), name: NP.name, caption: NP.caption });
      npDone(r);
    } catch (e) { NP.err = e.message; NP.busy = ""; redrawNP(); }
  }
  function npDone(r) {
    NP.busy = "";
    closeModal(async () => {
      lastSig = ""; await load(false);
      if (r.opened) { go("post"); window.scrollTo({ top: 0 }); toast(t("npOpened").replace("{f}", r.folder)); }
      else toast(t("npClaudeWrites").replace("{f}", r.folder));
    });
  }

  async function npFolder() {
    NP.busy = t("bBrowseWait"); NP.err = ""; redrawNP();
    try {
      const r = await npPost({ op: "pick" });
      const pk = r.pick || {};
      if (pk.ok && pk.folders && pk.folders.length) { NP.busy = t("npCreating"); redrawNP(); npDone(await npPost({ op: "folder", path: pk.folders[0] })); return; }
      if (pk.ok) { NP.busy = ""; redrawNP(); return; }           // cancelled
      NP.busy = ""; await npOpenFs("");                          // no system picker: built-in browser
    } catch (e) { NP.err = e.message; NP.busy = ""; redrawNP(); }
  }
  async function npOpenFs(path) {
    try { NP.fs = await fetch("/api/fs?path=" + encodeURIComponent(path || ""), { cache: "no-store" }).then((x) => x.json()); } catch (e) { NP.err = e.message; }
    redrawNP();
  }
  function npExplorer() {
    const d = NP.fs;
    const list = el("ul", { class: "bfs" });
    if (!d.dirs.length) list.append(el("li", { class: "empty" }, t("zNone")));
    d.dirs.forEach((x) => list.append(el("li", { class: x.post ? "post" : "" },
      el("span", { class: "bfico", "aria-hidden": "true" }, x.post ? "▣" : "▸"),
      el("button", { class: "lnk", type: "button", onclick: () => npOpenFs(x.path) }, x.name),
      x.post ? el("span", { class: "conf high" }, t("bPostTag")) : null)));
    return el("div", { class: "bexp" }, el("div", { class: "bexp-head" }, el("h3", {}, t("bExplorer")),
        el("span", { class: "row2" },
          el("button", { class: "btn", type: "button", disabled: d.parent ? null : "", onclick: () => npOpenFs(d.parent) }, "↑ " + t("bUp")),
          el("button", { class: "btn", type: "button", onclick: () => npOpenFs(d.home) }, t("bHome")),
          el("button", { class: "btn", type: "button", onclick: () => npOpenFs(d.workspace) }, t("bWs")))),
      el("div", { class: "mono hint" }, d.path), list,
      el("div", { class: "actions" }, el("button", { class: "btn", type: "button", onclick: () => { NP.fs = null; redrawNP(); } }, t("cancel")),
        el("button", { class: "btn on", type: "button", onclick: async () => { try { NP.busy = t("npCreating"); redrawNP(); npDone(await npPost({ op: "folder", path: d.path })); } catch (e) { NP.err = e.message; NP.busy = ""; redrawNP(); } } },
          t("npUseFolder"))));
  }

  /* ---------- settings drawer ---------- */
  const drawer = $("#drawer");
  const openDrawer = () => { drawer.hidden = false; overlay(); requestAnimationFrame(() => drawer.classList.add("open")); };
  const closeDrawer = () => { drawer.classList.remove("open"); setTimeout(() => { drawer.hidden = true; overlay(); }, reduced ? 0 : 260); };
  $("#drawerBtn").addEventListener("click", () => { openDrawer(); renderGuide(); });
  $("#drawerClose").addEventListener("click", closeDrawer);
  $("#drawerDim").addEventListener("click", closeDrawer);

  /* ---------- the full guide (Settings → About): every feature and how to use it ---------- */
  const GUIDE = {
    en: [
      ["Get started", [
        "Open Claude Code in your posts folder and type <code>/200bps-publish set me up</code>. This dashboard opens by itself.",
        "Paste your Zernio API key in the <b>Connect Zernio</b> card and press Save. It's tested right away and stays in this folder's .env file.",
        "Answer the one-time setup questions (accounts, keywords, words to avoid, goal…), or say \"defaults\".",
        "Connect Instagram or LinkedIn from <b>Posts → + Connect account</b>. You approve on the network's own site."]],
      ["Publish one post", [
        "Make one folder per post: <code>caption.txt</code> plus images, one video (Reel) or a PDF. Optional: <code>caption.linkedin.txt</code>, <code>cover.jpg</code>.",
        "Type <code>/200bps-publish posts/my-post</code> in Claude Code, or type the folder in the <b>New post</b> card.",
        "Follow the path at the top of the Post tab: <b>Check → Cover → Time → Gift → Go</b>. \"Next step\" always does the next thing.",
        "<b>Check:</b> red items block publishing. Click one and Claude shows a before/after; approve, edit or reject. Your original is kept.",
        "<b>Score (0-100):</b> how ready the post is, with the tips that raise it.",
        "<b>Cover</b> (Reels): a frame, your image, or a design by Claude. \"Grid view\" shows the profile crop.",
        "<b>Time:</b> your best time from your own data, or any day/hour you click.",
        "<b>Gift</b> (optional): people who comment a keyword get a DM, follow-gated if you like.",
        "<b>Go:</b> press Publish and type <b>go</b>. The dashboard uploads to Zernio, then reads the post back to prove it's there."]],
      ["Batch schedule (many posts at once)", [
        "Open it from <b>Plan → Batch schedule</b>, <b>Posts → Batch schedule</b>, or Ctrl+K.",
        "<b>1 Pick posts:</b> every post folder here appears as a card. Click to select, or \"Select all new\".",
        "<b>Browse…</b> opens your computer's folder window, for folders anywhere. <b>Folder browser</b> does the same inside the dashboard.",
        "<b>2 Set times:</b> choose the start day, how often (every day, every 2 days, or chosen weekdays) and the time (your best times or one fixed time). Days that already have a post are skipped.",
        "Each time shows why it was picked (e.g. \"best Wed · +96% · n=5\"). Drag ⋮⋮ or use ↑↓ to reorder; edit any time directly.",
        "<b>3 Go:</b> review the list, type <b>go</b> once. Every post is created in Zernio as <i>scheduled</i>, with a live tick per post. Nothing goes out now.",
        "Posts that can't be scheduled yet are listed apart, with \"Ask Claude to fix\"."]],
      ["Plan: calendar and best hours", [
        "The calendar shows exactly the posts in the Posts tab. Colours: <b>lime</b> published, <b>blue</b> scheduled, <b>red</b> needs attention, <b>outline</b> not uploaded.",
        "‹ and › change month; <b>Today</b> jumps back.",
        "Click a day to see its posts or plan it. Double-click an empty future day to schedule the current post at that day's best hour.",
        "<b>When your audience engages:</b> darker cells had more engagement. 1-2-3 mark your best slots; click any cell to schedule there.",
        "<b>Peak times by day:</b> each weekday's best hours with lift, number of posts (n) and confidence."]],
      ["Posts: everything in Zernio", [
        "Every post (scheduled, published, failed) plus local drafts. Filter at the top; switch Grid or List.",
        "Hover a video to see a muted preview. Click any post for links, per-platform status and errors.",
        "Failed post? \"Ask Claude to fix\". A draft? \"Continue this post\".",
        "\"Refresh from Zernio\" reloads everything now (it also refreshes every 5 minutes).",
        "<b>Cancel</b> any post: open it and press Cancel post (or use the calendar, the Post tab, or Ctrl+K → Cancel a post), then type <b>cancel</b>. Scheduled posts never go out and the draft stays; Instagram posts that are already live are deleted in the Instagram app."]],
      ["Growth", [
        "Reach, views, engagement and new follows for 7 days, compared with the 7 days before.",
        "<b>Goal:</b> progress from your Zernio follower count, with how many are left. \"How this goal works\" explains it; <b>Change goal</b> sets a new one in two clicks.",
        "Streak (last 14 days), top posts (ranked by follows, then saves + shares) and your audience.",
        "<b>Idea bank:</b> 5 ideas from your best posts. Click one for hook, outline, hashtags and best time; plan it on a day."]],
      ["Inbox", [
        "Comments waiting for a reply, your keyword → DM automations, and ice breakers."]],
      ["Working with Claude", [
        "The <b>Claude is listening</b> light: green means your clicks reach Claude Code right away.",
        "<b>Note to Claude</b>: tell Claude anything (\"use frame 4\", \"shorter hook\").",
        "When Claude needs you, a pop-up asks. Answer there or in the chat; the first answer wins.",
        "<b>Ctrl+K</b> (⌘K): the command bar. Type cover, fix, time, batch, dark, guide…"]],
      ["Look and settings", [
        "English and Arabic look and read the same; switch in Settings → Language.",
        "12h/24h time, light/dark theme, and <b>Hover tips</b> (these explanations) on or off.",
        "The quiet background of your mark and name follows the mouse with depth. It stops when your computer's \"reduce motion\" setting is on.",
        "API keys: Settings → Keys. Stored only in this folder's .env file and never shown in full."]],
      ["Safety", [
        "Nothing is published, scheduled or automated until you type <b>go</b> (or say yes in the chat).",
        "One go covers one post, or exactly one batch list you reviewed.",
        "Every change to a draft is recorded: use ↺ on a step, or revert one change under Changes.",
        "This dashboard runs only on your computer (127.0.0.1) and never sees your social passwords."]],
      ["From the chat", [
        "<code>/200bps-publish FOLDER</code>: check and publish one post. \"open my dashboard\", \"report on my last post\", \"give me post ideas\", \"set my ice breakers\".",
        "Batch from the chat: <code>bps.py batch scan</code>, <code>batch prepare FOLDERS</code>, <code>batch suggest --count N</code>, then <code>batch run --confirm</code> after your go."]],
    ],
    ar: [
      ["البداية", [
        "افتح Claude Code في مجلد البوستات واكتب <code>/200bps-publish set me up</code>. هاللوحة تنفتح بروحها.",
        "الصق مفتاح Zernio في بطاقة <b>اربط Zernio</b> واضغط حفظ. ينختبر على طول ويظل في ملف ‎.env‎ بهالمجلد.",
        "جاوب أسئلة الإعداد مرة وحدة (الحسابات، الكلمات، الكلمات الممنوعة، الهدف…)، أو قول «defaults».",
        "اربط Instagram أو LinkedIn من <b>المنشورات ← + اربط حساب</b>. توافق في موقع الشبكة نفسها."]],
      ["انشر بوست واحد", [
        "سوّ مجلد لكل بوست: <code>caption.txt</code> مع الصور، أو فيديو واحد (ريل)، أو PDF. اختياري: <code>caption.linkedin.txt</code> و<code>cover.jpg</code>.",
        "اكتب <code>/200bps-publish posts/my-post</code> في Claude Code، أو اكتب اسم المجلد في بطاقة <b>بوست جديد</b>.",
        "امشِ على المسار فوق تبويب البوست: <b>فحص ← غلاف ← وقت ← هدية ← نشر</b>. «التالي» دايماً يسوي الخطوة الجاية.",
        "<b>الفحص:</b> الأحمر يمنع النشر. اضغطه وClaude يوريك قبل/بعد؛ وافق، عدّل أو ارفض. النص الأصلي محفوظ.",
        "<b>التقييم (0-100):</b> قد إيش البوست جاهز، مع النصايح اللي ترفعه.",
        "<b>الغلاف</b> (للريلز): لقطة، صورتك، أو تصميم من Claude. «عرض الشبكة» يوريك القص بالبروفايل.",
        "<b>الوقت:</b> أفضل وقت من بياناتك، أو أي يوم/ساعة تضغطها.",
        "<b>الهدية</b> (اختياري): اللي يعلّق بكلمة يوصله رسالة بالخاص، وممكن بس للمتابعين.",
        "<b>نشر:</b> اضغط انشر واكتب <b>go</b>. اللوحة ترفعه على Zernio وبعدها تقراه منه عشان تتأكد إنه موجود."]],
      ["جدولة مجموعة (بوستات كثيرة مرة وحدة)", [
        "افتحها من <b>الخطة ← جدولة مجموعة</b>، أو <b>المنشورات ← جدولة مجموعة</b>، أو Ctrl+K.",
        "<b>1 اختار البوستات:</b> كل مجلد بوست هني يطلع كبطاقة. اضغط عشان تختار، أو «اختار كل الجديد».",
        "<b>تصفح…</b> يفتح نافذة المجلدات بجهازك، لمجلدات من أي مكان. <b>متصفح المجلدات</b> نفس الشي داخل اللوحة.",
        "<b>2 حدد الأوقات:</b> اختار يوم البداية، كم مرة (كل يوم، كل يومين، أو أيام تختارها) والوقت (أفضل أوقاتك أو وقت ثابت). الأيام اللي فيها بوست تنتجاهل.",
        "كل وقت يقول ليش انختار (مثلاً «أفضل وقت الأربعاء · +96% · n=5»). اسحب ⋮⋮ أو ↑↓ عشان ترتب؛ وعدّل أي وقت مباشرة.",
        "<b>3 نشر:</b> راجع القائمة واكتب <b>go</b> مرة وحدة. كل بوست ينسوى في Zernio <i>كمجدول</i>، مع علامة ✓ لكل واحد. ما ينزل شي الحين.",
        "البوستات اللي ما ينفع تنجدول تطلع لحالها، مع «اطلب من Claude يصلحه»."]],
      ["الخطة: التقويم وأفضل الساعات", [
        "التقويم يعرض نفس البوستات اللي في تبويب المنشورات. الألوان: <b>ليموني</b> منشور، <b>أزرق</b> مجدول، <b>أحمر</b> يحتاج انتباه، <b>إطار</b> ما انرفع.",
        "‹ و› يغيرون الشهر؛ <b>اليوم</b> يرجعك.",
        "اضغط يوم عشان تشوف بوستاته أو تخطط له. اضغط مرتين على يوم فاضي جاي عشان تجدول البوست الحالي بأفضل ساعة.",
        "<b>متى يتفاعل جمهورك:</b> الأغمق تفاعله أكثر. 1-2-3 أفضل أوقاتك؛ اضغط أي خانة عشان تجدول فيها.",
        "<b>أفضل الأوقات لكل يوم:</b> أفضل ساعات كل يوم مع الزيادة وعدد البوستات (n) ودرجة الثقة."]],
      ["المنشورات: كل شي في Zernio", [
        "كل البوستات (مجدولة، منشورة، فاشلة) والمسودات المحلية. فلتر من فوق؛ وبدّل بين شبكة وقائمة.",
        "حط الماوس على أي فيديو عشان تشوف معاينة بدون صوت. اضغط أي بوست للروابط والحالة والأخطاء.",
        "بوست فشل؟ «اطلب من Claude يصلحه». مسودة؟ «كمّل هالبوست».",
        "«تحديث من Zernio» يجيب كل شي الحين (ويتحدث بروحه كل 5 دقايق).",
        "<b>ألغِ</b> أي بوست: افتحه واضغط «ألغِ البوست» (أو من التقويم، أو تبويب البوست، أو Ctrl+K ← ألغِ بوست)، واكتب <b>cancel</b>. المجدول ما ينزل والمسودة تظل؛ وبوستات Instagram المنشورة تنحذف من تطبيق Instagram."]],
      ["النمو", [
        "الوصول والمشاهدات والتفاعل والمتابعين الجدد لآخر 7 أيام، مقارنة بالأسبوع اللي قبله.",
        "<b>الهدف:</b> تقدمك من عدد متابعينك في Zernio وكم باقي. «شلون يشتغل الهدف» يشرحه؛ و<b>غيّر الهدف</b> بضغطتين.",
        "الأيام المتواصلة (آخر 14 يوم)، أفضل البوستات (حسب المتابعين ثم الحفظ والمشاركة) وجمهورك.",
        "<b>بنك الأفكار:</b> 5 أفكار من أفضل بوستاتك. اضغط وحدة للافتتاحية والمخطط والهاشتاقات وأفضل وقت؛ وخطط لها بيوم."]],
      ["الرسائل", [
        "تعليقات تنتظر رد، الرسائل التلقائية بالكلمات، وأسئلة البداية."]],
      ["الشغل مع Claude", [
        "ضوء <b>Claude يسمعك</b>: الأخضر يعني ضغطاتك توصل Claude Code فوراً.",
        "<b>رسالة لـClaude</b>: قول له أي شي («استخدم اللقطة 4»، «قصّر الافتتاحية»).",
        "لما Claude يحتاجك، تطلع نافذة تسألك. جاوب فيها أو بالمحادثة؛ أول جواب يعتمد.",
        "<b>Ctrl+K</b> (⌘K): شريط الأوامر. اكتب غلاف، تصحيح، وقت، جدولة، دليل…"]],
      ["الشكل والإعدادات", [
        "العربي والإنجليزي نفس الشكل والمحتوى؛ بدّل من الإعدادات ← اللغة.",
        "12/24 ساعة، فاتح/داكن، و<b>الشروحات</b> (هالتوضيحات) تشغيل أو إطفاء.",
        "الخلفية الهادية لشعارك واسمك تتبع الماوس بعمق. تتوقف إذا إعداد «تقليل الحركة» بجهازك شغّال.",
        "مفاتيح API: الإعدادات ← المفاتيح. محفوظة بس في ملف ‎.env‎ بهالمجلد وما تنعرض كاملة."]],
      ["الأمان", [
        "ما ينزل أو ينجدول أو يشتغل أي شي إلا لما تكتب <b>go</b> (أو توافق بالمحادثة).",
        "كل go يغطي بوست واحد، أو قائمة مجموعة وحدة راجعتها بالضبط.",
        "كل تعديل على المسودة ينحفظ: استخدم ↺ على أي خطوة، أو رجّع تعديل واحد من التغييرات.",
        "هاللوحة تشتغل بس على جهازك (127.0.0.1) وما تشوف كلمات سر حساباتك."]],
      ["من المحادثة", [
        "<code>/200bps-publish FOLDER</code>: فحص ونشر بوست واحد. «افتح اللوحة»، «تقرير آخر بوست»، «عطني أفكار»، «حط أسئلة البداية».",
        "جدولة مجموعة من المحادثة: <code>bps.py batch scan</code>، <code>batch prepare FOLDERS</code>، <code>batch suggest --count N</code>، وبعدها <code>batch run --confirm</code> بعد موافقتك."]],
    ],
  };
  function renderGuide() {
    const host = $("#guide"); if (!host) return;
    const key = state.lang; if (host.dataset.lang === key) return; host.dataset.lang = key;
    host.innerHTML = "";
    (GUIDE[key] || GUIDE.en).forEach(([title, items], i) => {
      const d = el("details", { class: "gsec" }, el("summary", {}, el("span", { class: "gnum" }, String(i + 1).padStart(2, "0")), title));
      const ul = el("ul");
      items.forEach((x) => ul.append(el("li", { html: x })));      // our own fixed text, not user data
      d.append(ul); host.append(d);
    });
  }
  function openGuide() {
    openDrawer(); renderGuide();
    setTimeout(() => { const g = $("#guide"); if (g) { const f = g.querySelector("details"); if (f) f.open = true; g.scrollIntoView({ behavior: "smooth", block: "start" }); } }, 300);
  }

  /* ---------- command bar (Ctrl/Cmd + K) ---------- */
  function commands() {
    const p = state.data && state.data.plan;
    const list = [
      { k: "next", label: t("cNext"), hint: t("jTitle"), run: () => { const n = (journeySteps() || []).find((x) => !x.done); n && runStep(n.id); }, show: !!p },
      { k: "fix", label: t("cFix"), hint: "checks", run: () => runStep("check"), show: !!p },
      { k: "cover", label: t("cCover"), hint: "reel", run: () => runStep("cover"), show: !!(p && p.type === "reel") },
      { k: "time", label: t("cTime"), hint: t("tabPlan"), run: () => runStep("time") },
      { k: "gift", label: t("cGift"), hint: "DM", run: () => runStep("gift"), show: !!p },
      { k: "go", label: t("pubBtn"), hint: "go", run: openPublish, show: !!p },
      { k: "note", label: t("noteTitle"), hint: "Claude", run: () => $("#noteFab").click() },
      { k: "new", label: t("newPost"), hint: t("newPostKeepShort"), run: confirmNewPost },
      { k: "post", label: t("tabPost"), hint: "tab", run: () => go("post") },
      { k: "posts", label: t("tabPosts"), hint: "Zernio", run: () => go("posts") },
      { k: "plan", label: t("tabPlan"), hint: "tab", run: () => go("plan") },
      { k: "image", label: t("imgTitle"), hint: "OpenAI · gpt-image", run: () => openImage() },
      { k: "jobs", label: t("jobsTitle"), hint: "%", run: () => toggleJobs(true) },
      { k: "newfiles", label: t("npTitle"), hint: t("npPaletteHint"), run: () => openNewPost() },
      { k: "batch", label: t("bBtn"), hint: "Plan", run: () => openBatch() },
      { k: "guide", label: t("guideTitle"), hint: "?", run: () => openGuide() },
      { k: "cancel", label: t("cPickTitle"), hint: "Posts", run: () => openCancelChooser() },
      { k: "growth", label: t("tabGrowth"), hint: "tab", run: () => go("growth") },
      { k: "inbox", label: t("tabInbox"), hint: "tab", run: () => go("inbox") },
      { k: "back", label: t("back"), hint: "Esc", run: () => goBack(), show: !!state.navStack.length },
      { k: "theme", label: t("cTheme"), hint: "light / dark", run: () => $("#themeBtn").click() },
      { k: "time12", label: t("cClock"), hint: "12h / 24h", run: () => setH12(!state.h12) },
      { k: "lang", label: t("cLang"), hint: "EN / ع", run: () => $("#langBtn").click() },
      { k: "settings", label: t("settings"), hint: "", run: openDrawer },
      { k: "connect", label: t("accTitle"), hint: "Instagram · LinkedIn", run: openConnectChooser },
      { k: "keys", label: t("keysTitle"), hint: "Zernio", run: () => { openDrawer(); setTimeout(() => $(".keys-card").scrollIntoView(), 300); } },
      { k: "about", label: t("tabAbout"), hint: "200BPS.ai", run: () => { openDrawer(); setTimeout(() => $(".drawer-about").scrollIntoView(), 300); } },
    ];
    return list.filter((c) => c.show !== false);
  }
  const pal = { sel: 0, items: [] };
  function renderPalette() {
    const qv = $("#paletteInput").value.trim().toLowerCase();
    pal.items = commands().filter((c) => !qv || (c.label + " " + c.hint + " " + c.k).toLowerCase().includes(qv));
    pal.sel = Math.min(pal.sel, Math.max(pal.items.length - 1, 0));
    const ul = $("#paletteList"); ul.innerHTML = "";
    pal.items.forEach((c, i) => {
      const li = el("li", { role: "option", "aria-selected": String(i === pal.sel), class: i === pal.sel ? "sel" : "" }, el("span", {}, c.label), el("small", {}, c.hint));
      li.addEventListener("mouseenter", () => { pal.sel = i; renderPalette(); });
      li.addEventListener("click", () => runCmd(c));
      ul.append(li);
    });
    if (!pal.items.length) ul.append(el("li", { class: "empty" }, t("noMatch")));
  }
  function openPalette() { $("#palette").hidden = false; overlay(); const i = $("#paletteInput"); i.value = ""; i.placeholder = t("cPh"); pal.sel = 0; renderPalette(); setTimeout(() => i.focus(), 20); }
  function closePalette() { $("#palette").hidden = true; overlay(); }
  function runCmd(c) { closePalette(); setTimeout(c.run, 60); }
  $("#cmdBtn").addEventListener("click", openPalette);
  $("#paletteDim").addEventListener("click", closePalette);
  $("#paletteInput").addEventListener("input", () => { pal.sel = 0; renderPalette(); });
  $("#paletteInput").addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); pal.sel = Math.min(pal.sel + 1, pal.items.length - 1); renderPalette(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); pal.sel = Math.max(pal.sel - 1, 0); renderPalette(); }
    else if (e.key === "Enter") { e.preventDefault(); pal.items[pal.sel] && runCmd(pal.items[pal.sel]); }
    else if (e.key === "Escape") closePalette();
  });
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); $("#palette").hidden ? openPalette() : closePalette(); }
    else if (e.key === "Escape" && !drawer.hidden) closeDrawer();
  });
  if (/Mac|iPhone|iPad/.test(navigator.platform)) $("#cmdBtn kbd").textContent = "⌘K";

  /* ---------- click a check -> ask Claude for a fix ---------- */
  function openFixRequest(c) {
    const p = state.data && state.data.plan;
    const key = c.id + ":" + (c.platform || state.plat);
    const open_ = p && p.fixRequests && p.fixRequests[key];
    const q = state.data && state.data.question;
    if (open_ && open_.status === "suggested" && q && q.id === open_.questionId) {   // show the open suggestion instead
      delete state.dismissed[q.id];
      const go_ = () => showModal("q:" + q.id, (b) => questionUI(q, b));
      return modal.open ? closeModal(go_) : go_();
    }
    if (open_ && open_.status === "requested") {
      const build2 = (body) => body.append(el("div", { class: "label kicker", style: "color:var(--accent-ink)" }, t("fixKicker")),
        el("h2", { id: "mTitle" }, t("fixInProgress")), el("p", { class: "ctx" }, c.msg), el("p", { class: "hint" }, t("fixInProgressHint")),
        el("div", { class: "actions" }, el("button", { class: "btn", type: "button", onclick: () => closeModal(() => $("#noteTop").click()) }, t("noteFab")),
          el("button", { class: "btn on", type: "button", onclick: () => closeModal(renderQuestion) }, t("ok"))));
      return modal.open ? closeModal(() => showModal("fixwait", build2)) : showModal("fixwait", build2);
    }
    const build = (body) => {
      const err = el("div", { class: "err", role: "alert" });
      const note = el("textarea", { rows: 3, placeholder: t("fixNotePh") });
      body.append(el("div", { class: "label kicker", style: "color:var(--accent-ink)" }, t("fixKicker")),
        el("h2", { id: "mTitle" }, c.msg),
        el("div", { class: "chips" }, el("span", { class: "tag " + c.status }, c.status.toUpperCase()), el("span", { class: "chip ok" }, c.platform || state.plat), el("span", { class: "chip" }, c.id)),
        c.fix ? el("p", { class: "ctx" }, c.fix) : null,
        el("p", { class: "ctx" }, t("fixHow")),
        el("div", { class: "field" }, el("label", { class: "label" }, t("anythingElse")), note),
        state.data && state.data.listening ? null : el("p", { class: "empty" }, t("awayHint")),
        err,
        el("div", { class: "actions" },
          el("button", { class: "btn", type: "button", onclick: () => closeModal(renderQuestion) }, t("cancel")),
          el("button", { class: "btn on big", type: "button", onclick: async () => {
            try {
              const r = await post("/api/fixrequest", { check: c.id, platform: c.platform || state.plat, msg: c.msg, note: note.value });
              if (r.duplicate) { closeModal(() => toast(t("fixInProgress"))); return; }
              state.fixAsked[c.id + ":" + (c.platform || state.plat)] = true;
              closeModal(() => { toast(t("fixSent")); renderPost(); renderQuestion(); });
            } catch (e) { err.textContent = e.message; }
          } }, t("askFix"))));
    };
    modal.open ? closeModal(() => showModal("fixreq", build)) : showModal("fixreq", build);
  }

  /* ---------- calendar day panel ---------- */
  function weekdayBest(dow) {
    const bt = (state.z && state.z.besttime) || {};
    if (!bt.grid) return [];
    const row = bt.grid[dow] || [];
    return row.map((v, h) => ({ h, v })).filter((x) => x.v > 0).sort((a, b) => b.v - a.v).slice(0, 3);
  }
  async function quickSchedule(key) {
    const dow = new Date(key + "T12:00:00").getDay();
    const best = weekdayBest(dow)[0];
    const p = state.data && state.data.plan;
    if (!best || !p || ["published", "scheduled"].includes(p.status)) return openDay(key, []);
    try { await post("/api/slot", { date: key, hour: best.h, action: "plan" }); toast(t("slotPlanned")); load(false); }
    catch (e) { openDay(key, []); }
  }
  function openDay(key, evs) {
    const today = localDay();
    const past = key < today;
    const date = new Date(key + "T12:00:00");
    const dow = date.getDay();
    const z = state.z || {}, p = state.data && state.data.plan;
    const build = (body) => {
      const err = el("div", { class: "err", role: "alert" });
      const note = el("textarea", { rows: 2, placeholder: t("notePh") });
      let hour = null;
      const act = async (payload, msg) => {
        err.textContent = "";
        if (payload.action !== "report" && hour == null) { err.textContent = t("pickHour"); return; }
        try {
          if (payload.action === "report") await post("/api/report", { postId: payload.postId });
          else await post("/api/slot", { date: key, hour, note: note.value, ...payload });
          closeModal(() => { toast(msg); load(false); });
        } catch (e) { err.textContent = e.message; }
      };
      body.append(el("div", { class: "label kicker", style: "color:var(--accent-ink)" }, past ? t("dayPast") : t("dayPlan")),
        el("h2", { id: "mTitle" }, date.toLocaleDateString(loc(), { weekday: "long", day: "numeric", month: "long" })));

      // posts on this day
      const pub = evs.filter((e) => e.kind === "pub"), sch = evs.filter((e) => e.kind === "sched");
      if (pub.length) {
        const sec = el("div", { class: "slot-sec" }, el("h3", {}, t("dayPublished")));
        pub.forEach((e) => sec.append(el("div", { class: "daypost" },
          el("div", { style: "unicode-bidi:plaintext" }, (e.caption || "").split("\n")[0]),
          el("div", { class: "label" }, `${t("reach")} ${fmt(e.metrics && e.metrics.reach)} · ${t("saves")} ${fmt(e.metrics && e.metrics.saves)} · ${t("shares")} ${fmt(e.metrics && e.metrics.shares)}`),
          el("button", { class: "btn", type: "button", onclick: () => act({ action: "report", postId: e.id }, t("slotQueued")) }, t("getReport")))));
        body.append(sec);
      }
      if (sch.length) {
        const sec = el("div", { class: "slot-sec" }, el("h3", {}, t("dayScheduled")));
        sch.forEach((e) => sec.append(el("div", { class: "daypost" }, el("div", { style: "unicode-bidi:plaintext" }, (e.caption || "").split("\n")[0]), el("div", { class: "label" }, dt(e.scheduledFor)),
          e.row ? el("button", { class: "btn danger-ghost cancel-btn", type: "button", onclick: () => openCancel(e.row) }, e.row.local ? t("cDelShort") : t("cCancelShort")) : "")));
        body.append(sec);
      }
      if (past) {
        if (!pub.length) body.append(el("p", { class: "empty" }, t("dayNothing")));
        body.append(el("div", { class: "actions" }, el("button", { class: "btn", type: "button", onclick: () => closeModal(renderQuestion) }, t("cancel"))));
        return;
      }

      // pick an hour: best 3 for this weekday + any hour
      const hsec = el("div", { class: "slot-sec" }, el("h3", {}, t("pickTime")));
      const opts = el("div", { class: "opts" });
      const setHour = (h, btn) => { hour = h; opts.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", "false")); if (btn) btn.setAttribute("aria-pressed", "true"); };
      weekdayBest(dow).forEach((x, i) => {
        const b = el("button", { class: "btn", type: "button", "aria-pressed": "false" }, el("b", { class: "rkn" }, i + 1), " " + hourLabel(x.h));
        b.addEventListener("click", () => { setHour(x.h, b); any.value = ""; });
        opts.append(b);
      });
      const any = el("select", { "aria-label": t("anyHour") }, el("option", { value: "" }, t("anyHour")),
        ...Array.from({ length: 24 }, (_, h) => el("option", { value: h }, hourLabel(h))));
      any.addEventListener("change", () => { if (any.value !== "") setHour(+any.value, null); });
      opts.append(any);
      hsec.append(opts);
      if (!weekdayBest(dow).length) hsec.append(el("p", { class: "empty" }, t("noHistory")));
      body.append(hsec);

      const acts = el("div", { class: "slot-sec daygrid" });
      // schedule current post
      const canPlan = p && !["published", "scheduled"].includes(p.status);
      acts.append(el("div", {}, el("h3", {}, t("slotPlan")),
        canPlan ? el("button", { class: "btn on", type: "button", onclick: () => act({ action: "plan" }, t("slotPlanned")) }, t("slotPlanBtn"))
                : el("p", { class: "empty" }, t("slotNoPlan"))));
      // move a scheduled post
      const sched = z.scheduled || [];
      const sel = el("select", {}, el("option", { value: "" }, t("choosePost")), ...sched.map((x) => el("option", { value: x.id }, `${dt(x.scheduledFor)} · ${(x.caption || "").split("\n")[0].slice(0, 40)}`)));
      acts.append(el("div", {}, el("h3", {}, t("slotMove")),
        sched.length ? el("div", { class: "row2" }, sel, el("button", { class: "btn", type: "button", onclick: () => (sel.value ? act({ action: "reschedule", postId: sel.value }, t("slotQueued")) : (err.textContent = t("pickOne"))) }, t("slotMoveBtn")))
                     : el("p", { class: "empty" }, t("slotNoSched"))));
      // idea bank
      const ideas = (state.data && state.data.ideas) || [];
      const isel = el("select", {}, el("option", { value: "" }, t("chooseIdea")), ...ideas.map((i) => el("option", { value: i.title }, i.title)));
      acts.append(el("div", {}, el("h3", {}, t("dayIdea")),
        ideas.length ? el("div", { class: "row2" }, isel, el("button", { class: "btn", type: "button", onclick: () => (isel.value ? act({ action: "idea", idea: isel.value }, t("slotQueued")) : (err.textContent = t("pickOne"))) }, t("dayIdeaBtn")))
                     : el("p", { class: "empty" }, t("noData"))));
      // assign folder
      const folder = el("input", { type: "text", placeholder: "posts/my-next-reel" });
      acts.append(el("div", {}, el("h3", {}, t("slotAssign")), el("div", { class: "row2" }, folder,
        el("button", { class: "btn", type: "button", onclick: () => act({ action: "assign", folder: folder.value }, t("slotQueued")) }, t("slotAssignBtn")))));
      body.append(acts, el("div", { class: "field" }, el("label", { class: "label" }, t("anythingElse")), note), err,
        el("div", { class: "actions" }, el("button", { class: "btn", type: "button", onclick: () => closeModal(renderQuestion) }, t("cancel"))));
    };
    modal.open ? closeModal(() => showModal("day", build)) : showModal("day", build);
  }

  /* ---------- toggles: 12h / 24h, light / dark ---------- */
  const SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="8" width="8" height="8"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>';
  const MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/></svg>';
  function applyToggles() {
    $("#h12Btn").classList.toggle("on", state.h12);
    $("#h24Btn").classList.toggle("on", !state.h12);
    const light = document.documentElement.getAttribute("data-theme") === "light";
    $("#themeBtn").innerHTML = light ? MOON : SUN;
    $("#themeBtn").title = light ? t("toDark") : t("toLight");
    $("#tipsBtn").textContent = state.tips ? t("on") : t("off");
    $("#tipsBtn").classList.toggle("on", state.tips);
  }
  $("#tipsBtn").addEventListener("click", () => { state.tips = !state.tips; try { localStorage.setItem("bps.tips", state.tips ? "1" : "0"); } catch (e) {} if (!state.tips) tipHide(); applyToggles(); });
  const setH12 = (v) => { state.h12 = v; try { localStorage.setItem("bps.h12", v ? "1" : "0"); } catch (e) {} renderAll(); };
  $("#h12Btn").addEventListener("click", () => setH12(true));
  $("#h24Btn").addEventListener("click", () => setH12(false));
  $("#themeBtn").addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("bps.theme", next); } catch (e) {}
    applyToggles();
  });

  /* ---------- background jobs meter: what's working, and how far along ---------- */
  const JOBS = { data: null, open: false, timer: 0 };
  const jobsPanel = el("div", { class: "jobs-panel", role: "dialog", "aria-label": "Background jobs", hidden: true });
  document.body.append(jobsPanel);
  function fmtSecs(s) {
    s = Math.max(0, Math.round(s || 0));
    return s < 60 ? s + "s" : Math.floor(s / 60) + "m " + String(s % 60).padStart(2, "0") + "s";
  }
  async function loadJobs() {
    clearTimeout(JOBS.timer);
    try { JOBS.data = await (await fetch("/api/jobs", { cache: "no-store" })).json(); } catch (e) { /* keep the last view */ }
    drawJobs();
    JOBS.timer = setTimeout(loadJobs, JOBS.data && JOBS.data.running ? 1000 : 4000);
  }
  function jobLabel(j) {
    if (state.lang === "ar" && I18N.ar["jk_" + j.kind]) return t("jk_" + j.kind);
    return j.label;
  }
  function drawJobs() {
    const d = JOBS.data || { running: 0, items: [] }, pill = $("#jobsPill");
    const items = d.items || [];
    if (pill) {
      pill.hidden = !items.length;
      pill.classList.toggle("busy", d.running > 0);
      pill.classList.toggle("bad", !d.running && items.some((j) => j.state === "failed" || j.state === "lost"));
      pill.querySelector("span").textContent = d.running
        ? t("jobsRunning").replace("{n}", d.running) + (d.pct != null ? " · " + d.pct + "%" : "")
        : "✓ " + t("jobsDoneShort");
      const mini = pill.querySelector(".jobs-mini s");
      mini.style.width = (d.running ? (d.pct ?? 30) : 100) + "%";
      pill.querySelector(".jobs-mini").classList.toggle("ind", d.running > 0 && d.pct == null);
    }
    if (!JOBS.open) return;
    jobsPanel.innerHTML = "";
    jobsPanel.append(el("div", { class: "jobs-head" }, el("b", {}, t("jobsTitle")), el("span", {}, t("jobsSub"))));
    if (!items.length) { jobsPanel.append(el("p", { class: "jobs-none" }, t("jobsNone"))); return; }
    const list = el("ul", { class: "jobs-list" });
    for (const j of items) {
      const run = j.state === "running", ind = run && (j.pct == null || j.indeterminate);
      const icon = run ? el("i", { class: "jobs-spin" }) : el("i", { class: "jobs-ic " + j.state }, j.state === "done" ? "✓" : j.state === "lost" ? "‖" : "✕");
      const pct = run ? (ind ? "" : j.pct + "%") : j.state === "done" ? "100%" : t(j.state === "lost" ? "jobsLost" : "jobsFailed");
      const step = !run && j.error ? j.error : j.step || (j.text || "");
      list.append(el("li", { class: "job " + j.state },
        icon,
        el("div", { class: "job-main" },
          el("div", { class: "job-top" }, el("b", {}, jobLabel(j)), el("span", { class: "job-pct" }, pct)),
          el("div", { class: "job-bar" + (ind ? " ind" : "") }, el("s", { style: "width:" + (ind ? 35 : run ? j.pct : 100) + "%" })),
          el("div", { class: "job-sub" }, el("span", {}, step), el("span", { class: "job-time" }, fmtSecs(j.secs) + " · " + (run ? t("jobsWorking") : t("jobsFinished"))))
        )));
    }
    jobsPanel.append(list);
  }
  function placeJobs() {
    const pill = $("#jobsPill"), r = pill && !pill.hidden ? pill.getBoundingClientRect() : null;
    const w = Math.min(380, window.innerWidth - 24);
    jobsPanel.style.width = w + "px";
    jobsPanel.style.top = ((r ? r.bottom : 58) + 8) + "px";
    jobsPanel.style.left = Math.max(12, Math.min(window.innerWidth - w - 12, r ? r.right - w : window.innerWidth - w - 12)) + "px";
  }
  function toggleJobs(force) {
    JOBS.open = force ?? !JOBS.open;
    jobsPanel.hidden = !JOBS.open;
    if (JOBS.open) { placeJobs(); drawJobs(); loadJobs(); }
  }
  $("#jobsPill").addEventListener("click", (e) => { e.stopPropagation(); toggleJobs(); });
  document.addEventListener("click", (e) => { if (JOBS.open && !jobsPanel.contains(e.target)) toggleJobs(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && JOBS.open) toggleJobs(false); });
  window.addEventListener("resize", () => JOBS.open && placeJobs());

  /* ---------- data ---------- */
  // Redraw only when something actually changed; a redraw would otherwise
  // restart every entrance animation on the page (the "jumping" effect).
  let lastSig = "", lastZSig = "";
  async function load(first) {
    try {
      const r = await fetch("/api/state" + (first ? "?visit=1" : ""), { cache: "no-store" });
      const d = await r.json();
      if (d.boot) {
        if (state.boot && state.boot !== d.boot) { location.reload(); return; }   // dashboard restarted: load the new version
        state.boot = d.boot;
      }
      const sig = JSON.stringify({ ...d, previousVisit: undefined });
      if (!first && sig === lastSig) return;
      lastSig = sig;
      state.data = d;
      if (first && !state.langChosen && !localStorageLang() && state.data.config && state.data.config.language === "ar") state.lang = "ar";
    } catch (e) { state.data = state.data || { doctor: { checks: [] } }; }
    renderAll();
  }
  async function loadZernio() {
    try {
      const r = await fetch("/api/zernio", { cache: "no-store" });
      const z = await r.json();
      const sig = JSON.stringify({ ...z, _ts: undefined });
      if (sig === lastZSig) return;
      lastZSig = sig;
      state.z = z;
    } catch (e) { state.z = { ok: false, error: String(e) }; }
    renderAll();
  }
  function localStorageLang() { try { return localStorage.getItem("bps.lang"); } catch (e) { return null; } }

  document.querySelectorAll(".tab[data-view]").forEach((b) => b.addEventListener("click", () => go(b.dataset.view)));
  ["#noteTop", "#noteTab"].forEach((id) => $(id).addEventListener("click", () => $("#noteFab").click()));
  $("#langBtn").addEventListener("click", () => { state.langChosen = true; state.lang = state.lang === "ar" ? "en" : "ar"; try { localStorage.setItem("bps.lang", state.lang); } catch (e) {} renderAll(); });
  $("#calPrev").addEventListener("click", () => { state.calMonth = new Date(state.calMonth.getFullYear(), state.calMonth.getMonth() - 1, 1); renderCalendar(); });
  $("#calNext").addEventListener("click", () => { state.calMonth = new Date(state.calMonth.getFullYear(), state.calMonth.getMonth() + 1, 1); renderCalendar(); });
  ["#batchBtn", "#zBatch"].forEach((id) => $(id).addEventListener("click", openBatch));
  ["#imgTop", "#imgPreview"].forEach((id) => { const b = $(id); if (b) b.addEventListener("click", () => openImage()); });
  $("#calToday").addEventListener("click", () => { state.calMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1); renderCalendar(); });

  /* ---------- hover tips: rest the mouse (or keyboard focus) on anything to
     see what it is and how to use it. Settings → Preferences turns them off. ---------- */
  const HELP = {
    en: {
      brand: ["200bps.ai", "Opens 200bps.ai in a new tab."],
      listen: ["Claude is listening", "Green: anything you click here reaches Claude Code right away. Grey: Claude Code is closed, and your requests wait until it opens."],
      decision: ["A decision is waiting", "Claude asked you something. Click to answer here, or answer in the chat. The first answer wins."],
      streak: ["Posting streak", "Days in a row with at least one post. Keep it going to stay visible."],
      note: ["Note to Claude", "Type any instruction, e.g. \"use frame 4\" or \"make the hook shorter\". Claude reads it before the next step."],
      search: ["Command bar", "Press Ctrl+K (⌘K on Mac) and type: cover, fix, batch, dark… Then Enter. The fastest way to do anything here."],
      menu: ["Settings", "API keys, language, 12h/24h, light/dark, readiness, connected accounts, and the full guide."],
      tabPost: ["Post", "The post you're working on now: preview, checks, score, cover, time, gift and the Publish button."],
      tabPosts: ["Posts", "Every post in your Zernio account (scheduled, published, failed) plus drafts not uploaded yet. Hover a video to preview it."],
      tabPlan: ["Plan", "The calendar and your best hours. Click a day or an hour to schedule; use Batch schedule for many posts."],
      tabGrowth: ["Growth", "Reach, followers, your goal, top posts, audience and the idea bank."],
      tabInbox: ["Inbox", "Comments waiting for a reply, DM automations and ice breakers."],
      journey: ["Your post's path", "Check → Cover → Time → Gift → Go. Click any step to do it; ↺ undoes that step."],
      step_check: ["Check", "Caption, hashtags and media checks. Red items block publishing; click one and Claude writes a fix you approve."],
      step_cover: ["Cover", "Reels only: pick a video frame, your own image, or a cover Claude designs."],
      step_time: ["Time", "When it goes out. Pick the suggested best time, or click any calendar day or heatmap hour."],
      step_gift: ["DM gift (optional)", "People who comment a keyword get a DM, e.g. a link. Only switched on with your yes."],
      step_go: ["Go", "Press Publish and type go. Nothing goes live before that."],
      preview: ["Preview", "Your media in posting order. Hover a video to play it."],
      platSwitch: ["Platform", "Switch between Instagram and LinkedIn to see each caption and its checks."],
      caption: ["Caption", "Hashtags are highlighted. Claude suggests edits; your original is always kept."],
      checks: ["Checks", "Red blocks publishing, amber is a tip. Click a fixable check to ask Claude for a before/after."],
      fixable: ["Fix this", "Click: Claude writes an improved caption and shows a before/after with the score change. Approve, edit or reject."],
      score: ["Post score (0-100)", "How ready the post is: hook, keyword, question, hashtags, media and timing. The tips below raise it."],
      cover: ["Cover", "What people see in your profile grid. \"Grid view\" shows the square crop."],
      planCard: ["Plan", "Everything that will be sent: platforms, time, type, settings and gift."],
      bestTime: ["Best time", "From your own posts only: lift vs your average, number of posts and confidence. Never a generic guess."],
      changes: ["Changes", "Every edit to this draft. Revert any single one before publishing."],
      connect: ["Connect Zernio", "Paste your Zernio API key and press Save. It stays on this computer."],
      newPost: ["New post", "Type a post folder name and send it to Claude, or use Batch schedule for many at once."],
      refresh: ["Refresh from Zernio", "Reloads your posts, numbers and statuses from Zernio now."],
      batch: ["Batch schedule", "Schedule many posts at once: pick folders → set times → type go once. Each is created in Zernio as scheduled."],
      zfilter: ["Filter", "Show all posts, or only scheduled, published, needing attention, or not uploaded."],
      zview: ["Grid or list", "Thumbnails or a compact list. Your choice is remembered."],
      ztile: ["Post", "Click for details, links and errors. Hover a video to preview it."],
      connectAcc: ["Connect account", "Add Instagram or LinkedIn. You approve on the network's own site; your password never comes here."],
      account: ["Connected account", "Followers and connection status from Zernio."],
      calPrev: ["Previous month", ""], calNext: ["Next month", ""], calToday: ["Today", "Jump back to this month."],
      calDay: ["Calendar day", "Click: see posts and plan this day. Double-click an empty future day: schedule the current post at its best hour."],
      calEv: ["Post on this day", "Colour = status: lime published, blue scheduled, red needs attention, outline not uploaded."],
      calKey: ["Legend", "The same colours as the Posts tab badges."],
      heat: ["When your audience engages", "Darker = more engagement in your past posts at that hour. 1-2-3 are your best slots. Click a cell to schedule there."],
      peaks: ["Peak times by day", "Each weekday's two best hours, with lift, number of posts (n) and confidence."],
      kpi: ["Last 7 days", "Compared with the 7 days before (the % below)."],
      followers: ["Followers", "Your follower count over time, from Zernio."],
      goal: ["Follower goal", "Progress to your goal from your Zernio follower count. It updates with every refresh."],
      changeGoal: ["Change goal", "Pick a quick option or type any number above your current followers."],
      streakGrid: ["Last 14 days", "Filled = you posted that day."],
      topPosts: ["Top posts", "Ranked by follows they brought, then saves + shares. Claude uses these for new ideas."],
      audience: ["Audience", "Age, gender, cities and countries of your followers."],
      ideas: ["Idea bank", "5 post ideas based on your best posts. Click one for its hook, outline and best time; plan it on a day."],
      comments: ["Comments waiting", "Recent comments that haven't had a reply."],
      automations: ["DM automations", "Your keyword → DM gifts and ice breakers."],
      jobs: ["Background jobs", "What's working right now (making images, publishing, uploads, refreshing from Zernio, Claude writing for you) and how far along each one is. Click to see the list."],
      image: ["Create an image", "Describe a picture and OpenAI draws it. Add guide pictures to keep a style, a face or a product. Nothing is posted until you add it to a post."],
      imgDrop: ["Guide pictures", "Drop, paste or pick pictures. The new image follows them: style, people, products, layout."],
      imgModel: ["Image model", "Which OpenAI model draws the picture. The ★ one is your default (Settings → Keys → OpenAI)."],
      keys: ["API keys", "Stored only in this folder's .env file, readable by you. Never shown in full and never sent to the chat."],
      lang: ["Language", "Switch between English and Arabic."], clock: ["Time format", "12-hour or 24-hour times."],
      theme: ["Theme", "Light or dark."], version: ["Version", "The installed version of this skill."],
      tipsPref: ["Hover tips", "Turn these explanations on or off."],
      readiness: ["Readiness", "What's set up: Python, ffprobe, your key, Zernio and add-ons. Each problem shows its fix."],
      accounts: ["Connected accounts", "The Instagram and LinkedIn accounts posts go to."],
      bsteps: ["Three steps", "Pick posts → Set times → Go. Nothing is sent before you type go."],
      bbrowse: ["Browse…", "Opens your computer's folder window. Pick one post folder, several, or a folder that holds many posts."],
      bexp: ["Folder browser", "A simple folder list inside the dashboard. Tick folders and press Add."],
      bcard: ["Post folder", "Click to select or unselect. Greyed out = already sent."],
      bstart: ["Start", "The first day posts may go out."],
      brhythm: ["How often", "Every day, every 2 days, or only on the weekdays you pick."],
      bmode: ["Time", "\"My best times\" uses each weekday's best hour from your own data. \"Same time\" uses one hour you choose."],
      bskip: ["Skip busy days", "Days that already have a scheduled or published post are left free."],
      brow: ["Order", "Drag the ⋮⋮ handle (or ↑↓) to change which post goes first. Times stay in order."],
      bwhen: ["Time for this post", "Edit it directly. The line below says why this time was picked."],
      bgo: ["Confirm", "Type go to schedule exactly this list."],
      bblocked: ["Can't be scheduled yet", "Fix these first (Claude can help), or remove them from the batch."],
      cancelBtn: ["Cancel", "Scheduled: removed from Zernio so it never goes out (the draft stays). Published: removed where the network allows; Instagram posts are deleted in the Instagram app. You type cancel to confirm."],
    },
    ar: {
      brand: ["200bps.ai", "يفتح 200bps.ai في تبويب جديد."],
      listen: ["Claude يسمعك", "أخضر: أي شي تضغطه هني يوصل Claude Code فوراً. رمادي: Claude Code مسكّر، وطلباتك تنتظر لين ينفتح."],
      decision: ["في قرار ينتظرك", "Claude سألك شي. اضغط عشان تجاوب هني، أو جاوب بالمحادثة. أول جواب يعتمد."],
      streak: ["أيام النشر المتواصلة", "عدد الأيام ورا بعض اللي نشرت فيها. كمّل عشان تظل ظاهر."],
      note: ["رسالة لـClaude", "اكتب أي تعليمات، مثلاً «استخدم اللقطة 4» أو «قصّر الافتتاحية». Claude يقراها قبل الخطوة الجاية."],
      search: ["شريط الأوامر", "اضغط Ctrl+K (⌘K بالماك) واكتب: غلاف، تصحيح، جدولة… وبعدها Enter. أسرع طريقة لأي شي هني."],
      menu: ["الإعدادات", "مفاتيح API، اللغة، 12/24 ساعة، فاتح/داكن، الجاهزية، الحسابات، والدليل الكامل."],
      tabPost: ["البوست", "البوست اللي تشتغل عليه الحين: المعاينة، الفحوصات، التقييم، الغلاف، الوقت، الهدية وزر النشر."],
      tabPosts: ["المنشورات", "كل بوستاتك في Zernio (مجدولة، منشورة، فاشلة) والمسودات اللي ما انرفعت. حط الماوس على أي فيديو عشان تشوف معاينة."],
      tabPlan: ["الخطة", "التقويم وأفضل ساعاتك. اضغط يوم أو ساعة عشان تجدول، واستخدم «جدولة مجموعة» لبوستات كثيرة."],
      tabGrowth: ["النمو", "الوصول، المتابعين، هدفك، أفضل البوستات، الجمهور وبنك الأفكار."],
      tabInbox: ["الرسائل", "تعليقات تنتظر رد، الرسائل التلقائية وأسئلة البداية."],
      journey: ["مسار البوست", "فحص ← غلاف ← وقت ← هدية ← نشر. اضغط أي خطوة عشان تسويها؛ ↺ يتراجع عنها."],
      step_check: ["الفحص", "فحص الكابشن والهاشتاقات والميديا. الأحمر يمنع النشر؛ اضغطه وClaude يكتب تصحيح توافق عليه."],
      step_cover: ["الغلاف", "للريلز بس: اختار لقطة من الفيديو، أو صورتك، أو غلاف يصممه Claude."],
      step_time: ["الوقت", "متى ينزل. اختار أفضل وقت مقترح، أو اضغط أي يوم بالتقويم أو ساعة بالخريطة."],
      step_gift: ["هدية بالخاص (اختياري)", "اللي يعلّق بكلمة معينة يوصله رسالة بالخاص، مثلاً رابط. ما تشتغل إلا بموافقتك."],
      step_go: ["نشر", "اضغط انشر واكتب go. ما ينزل شي قبلها."],
      preview: ["المعاينة", "الصور أو الفيديو بترتيب النشر. حط الماوس على الفيديو عشان يشتغل."],
      platSwitch: ["المنصة", "بدّل بين Instagram وLinkedIn عشان تشوف كل كابشن وفحوصاته."],
      caption: ["الكابشن", "الهاشتاقات ملوّنة. Claude يقترح تعديلات، والنص الأصلي دايماً محفوظ."],
      checks: ["الفحوصات", "الأحمر يمنع النشر، والأصفر نصيحة. اضغط أي فحص قابل للتصحيح عشان Claude يوريك قبل/بعد."],
      fixable: ["صحّح هذا", "اضغط: Claude يكتب كابشن أحسن ويوريك قبل/بعد مع تغيّر التقييم. وافق، عدّل أو ارفض."],
      score: ["تقييم البوست (0-100)", "قد إيش البوست جاهز: الافتتاحية، الكلمة المفتاحية، السؤال، الهاشتاقات، الميديا والتوقيت. النصايح تحت ترفعه."],
      cover: ["الغلاف", "اللي يشوفونه الناس في شبكة بروفايلك. «عرض الشبكة» يوريك القص المربع."],
      planCard: ["الخطة", "كل شي بينرسل: المنصات، الوقت، النوع، الإعدادات والهدية."],
      bestTime: ["أفضل وقت", "من بوستاتك أنت بس: الزيادة مقارنة بمعدلك، عدد البوستات ودرجة الثقة. مو تخمين عام."],
      changes: ["التغييرات", "كل تعديل على المسودة. تقدر ترجع أي واحد قبل النشر."],
      connect: ["اربط Zernio", "الصق مفتاح Zernio واضغط حفظ. يظل على هالجهاز بس."],
      newPost: ["بوست جديد", "اكتب اسم مجلد البوست وأرسله لـClaude، أو استخدم «جدولة مجموعة» لبوستات كثيرة مرة وحدة."],
      refresh: ["تحديث من Zernio", "يجيب بوستاتك وأرقامك وحالاتها من Zernio الحين."],
      batch: ["جدولة مجموعة", "جدول بوستات كثيرة مرة وحدة: اختار المجلدات ← حدد الأوقات ← اكتب go مرة وحدة. كل واحد ينسوى في Zernio كمجدول."],
      zfilter: ["الفلتر", "اعرض الكل، أو المجدول بس، أو المنشور، أو اللي يحتاج انتباه، أو اللي ما انرفع."],
      zview: ["شبكة أو قائمة", "صور مصغرة أو قائمة مختصرة. اختيارك ينحفظ."],
      ztile: ["بوست", "اضغط للتفاصيل والروابط والأخطاء. حط الماوس على الفيديو عشان تشوف معاينة."],
      connectAcc: ["اربط حساب", "أضف Instagram أو LinkedIn. توافق في موقع الشبكة نفسها؛ كلمة السر ما توصل هني."],
      account: ["حساب مربوط", "عدد المتابعين وحالة الربط من Zernio."],
      calPrev: ["الشهر السابق", ""], calNext: ["الشهر الجاي", ""], calToday: ["اليوم", "يرجعك لهالشهر."],
      calDay: ["يوم بالتقويم", "اضغط: تشوف بوستات اليوم وتخطط له. اضغط مرتين على يوم فاضي جاي: يجدول البوست الحالي بأفضل ساعة."],
      calEv: ["بوست بهاليوم", "اللون = الحالة: ليموني منشور، أزرق مجدول، أحمر يحتاج انتباه، إطار بس ما انرفع."],
      calKey: ["دليل الألوان", "نفس ألوان شارات تبويب المنشورات."],
      heat: ["متى يتفاعل جمهورك", "الأغمق = تفاعل أكثر في بوستاتك السابقة بهالساعة. 1-2-3 أفضل أوقاتك. اضغط أي خانة عشان تجدول فيها."],
      peaks: ["أفضل الأوقات لكل يوم", "أفضل ساعتين لكل يوم، مع الزيادة وعدد البوستات (n) ودرجة الثقة."],
      kpi: ["آخر 7 أيام", "مقارنة بالـ7 أيام اللي قبلها (النسبة تحت)."],
      followers: ["المتابعين", "عدد متابعينك مع الوقت، من Zernio."],
      goal: ["هدف المتابعين", "تقدمك للهدف من عدد متابعينك في Zernio. يتحدث مع كل تحديث."],
      changeGoal: ["غيّر الهدف", "اختار من الخيارات السريعة أو اكتب أي رقم أكبر من متابعينك الحين."],
      streakGrid: ["آخر 14 يوم", "المربع المعبّى = نشرت بهاليوم."],
      topPosts: ["أفضل البوستات", "مرتبة حسب المتابعين اللي جابتهم، بعدها الحفظ والمشاركة. Claude يستخدمها للأفكار الجديدة."],
      audience: ["الجمهور", "أعمار متابعينك، الجنس، المدن والدول."],
      ideas: ["بنك الأفكار", "5 أفكار بوستات مبنية على أفضل بوستاتك. اضغط وحدة عشان تشوف الافتتاحية والمخطط وأفضل وقت؛ خطط لها بيوم."],
      comments: ["تعليقات تنتظر رد", "آخر التعليقات اللي ما انرد عليها."],
      automations: ["رسائل تلقائية", "هدايا الكلمات بالخاص وأسئلة البداية."],
      jobs: ["الشغل بالخلفية", "شنو قاعد يشتغل الحين (الصور، النشر، رفع الملفات، تحديث Zernio، Claude يكتب لك) ووين وصل كل واحد. اضغط تشوف القائمة."],
      image: ["سوّ صورة", "اوصف صورة وOpenAI يرسمها. أضف صور مرشدة عشان تحافظ على أسلوب أو وجه أو منتج. ما ينشر شي لين تضيفها لبوست."],
      imgDrop: ["صور مرشدة", "اسحب أو الصق أو اختار صور. الصورة الجديدة تمشي عليها: الأسلوب، الأشخاص، المنتجات، التصميم."],
      imgModel: ["موديل الصور", "أي موديل من OpenAI يرسم الصورة. اللي عليه ★ هو الافتراضي (الإعدادات ← المفاتيح ← OpenAI)."],
      keys: ["مفاتيح API", "محفوظة بس في ملف ‎.env‎ بهالمجلد، وأنت بس تقدر تقراه. ما تنعرض كاملة وما تروح للمحادثة."],
      lang: ["اللغة", "بدّل بين العربي والإنجليزي."], clock: ["صيغة الوقت", "12 ساعة أو 24 ساعة."],
      theme: ["المظهر", "فاتح أو داكن."], version: ["الإصدار", "نسخة السكل المثبتة."],
      tipsPref: ["الشروحات", "شغّل أو طفّي هالشروحات."],
      readiness: ["الجاهزية", "شنو جاهز: Python وffprobe ومفتاحك وZernio والإضافات. كل مشكلة معاها حلها."],
      accounts: ["الحسابات المربوطة", "حسابات Instagram وLinkedIn اللي تنزل عليها البوستات."],
      bsteps: ["ثلاث خطوات", "اختار البوستات ← حدد الأوقات ← نشر. ما ينرسل شي قبل ما تكتب go."],
      bbrowse: ["تصفح…", "يفتح نافذة المجلدات بجهازك. اختار مجلد بوست، أو كم واحد، أو مجلد فيه بوستات كثيرة."],
      bexp: ["متصفح المجلدات", "قائمة مجلدات بسيطة داخل اللوحة. علّم على المجلدات واضغط أضف."],
      bcard: ["مجلد بوست", "اضغط عشان تختاره أو تشيله. الباهت = انرسل قبل."],
      bstart: ["البداية", "أول يوم ممكن تنزل فيه البوستات."],
      brhythm: ["كم مرة", "كل يوم، كل يومين، أو بس بالأيام اللي تختارها."],
      bmode: ["الوقت", "«أفضل أوقاتي» ياخذ أفضل ساعة لكل يوم من بياناتك. «نفس الوقت» ساعة وحدة تختارها."],
      bskip: ["تجاهل الأيام المشغولة", "الأيام اللي فيها بوست مجدول أو منشور تظل فاضية."],
      brow: ["الترتيب", "اسحب ⋮⋮ (أو ↑↓) عشان تغيّر أي بوست ينزل أول. الأوقات تظل بالترتيب."],
      bwhen: ["وقت هالبوست", "عدّله مباشرة. السطر تحت يقول ليش انختار هالوقت."],
      bgo: ["التأكيد", "اكتب go عشان تجدول هالقائمة بالضبط."],
      bblocked: ["ما ينفع ينجدول للحين", "صلّحها أول (Claude يقدر يساعد)، أو شيلها من المجموعة."],
      cancelBtn: ["إلغاء", "المجدول: ينشال من Zernio وما ينزل (والمسودة تظل). المنشور: ينشال إذا المنصة تسمح؛ بوستات Instagram تنحذف من تطبيق Instagram. تكتب cancel للتأكيد."],
    },
  };
  // where each tip applies (first match wins, most specific first)
  const HELP_MAP = [
    [".steps-track .step[data-step]", (n) => "step_" + n.dataset.step], [".checks li.fixable", "fixable"],
    [".cal .ev", "calEv"], [".cal .d.click", "calDay"], [".cal-key", "calKey"], ["#calPrev", "calPrev"], ["#calNext", "calNext"], ["#calToday", "calToday"],
    [".heat", "heat"], [".toptimes", "peaks"],
    [".goal-info .btn", "changeGoal"], ["#goalRing, .goal-info", "goal"], ["#streakGrid", "streakGrid"],
    [".bsteps", "bsteps"], [".bbrowse", "bbrowse"], [".bexpbtn, .bexp", "bexp"], [".bcard", "bcard"], [".bctl input[type=date]", "bstart"],
    [".brhythm, .bdays", "brhythm"], [".bmode, .bctl input[type=time]", "bmode"], [".bskip", "bskip"], [".bwhen", "bwhen"], [".bgrip, .bmove", "brow"],
    [".bgo, .bconfirm", "bgo"], [".bblocked", "bblocked"],
    [".cancel-btn", "cancelBtn"], [".ztile, .zrow", "ztile"], [".zview", "zview"], ["#zFilter", "zfilter"], [".add-acc", "connectAcc"], ["#zAccounts .aud-z", "account"],
    ["#zRefresh", "refresh"], ["#zBatch, #batchBtn", "batch"], ["#imgTop, #imgPreview", "image"], ["#jobsPill, .jobs-panel", "jobs"], [".img-drop", "imgDrop"], [".img-model", "imgModel"],
    ["#listenPill", "listen"], ["#decisionPill", "decision"], ["#streakPill", "streak"], ["#noteTop, #noteTab, #noteFab", "note"], ["#cmdBtn", "search"],
    ["#drawerBtn", "menu"], [".topbar .brand", "brand"],
    [".tab[data-view=post]", "tabPost"], [".tab[data-view=posts]", "tabPosts"], [".tab[data-view=plan]", "tabPlan"], [".tab[data-view=growth]", "tabGrowth"], [".tab[data-view=inbox]", "tabInbox"],
    [".journey-head", "journey"], ["#mediaStrip", "preview"], ["#platSwitch", "platSwitch"], ["#captionBox", "caption"], ["#checkList", "checks"],
    ["#scoreRing, #tipList", "score"], ["#coverCard", "cover"], ["#planList", "planCard"], ["#bestTime", "bestTime"], ["#changes", "changes"],
    ["#connectCard", "connect"], ["#newPostCard", "newPost"],
    [".kpi", "kpi"], ["#folChart", "followers"], ["#topPosts", "topPosts"], ["#demo", "audience"], ["#ideas", "ideas"], ["#comments", "comments"], ["#automations", "automations"],
    [".keys-card", "keys"], ["#langBtn", "lang"], ["#h12Btn, #h24Btn", "clock"], ["#themeBtn", "theme"], ["#versionPill", "version"], ["#tipsBtn", "tipsPref"],
    ["#doctorList", "readiness"], ["#accounts", "accounts"],
  ];
  state.tips = (() => { try { return localStorage.getItem("bps.tips") !== "0"; } catch (e) { return true; } })();
  const tipBox = el("div", { class: "tip", role: "tooltip", id: "tipBox", hidden: true });
  document.body.append(tipBox);
  let tipFor = null, tipTimer = 0;
  function helpOf(node) {
    for (const [sel, key] of HELP_MAP) {
      const n = node.closest && node.closest(sel);
      if (n) { const k = typeof key === "function" ? key(n) : key; const h = (HELP[state.lang] || HELP.en)[k] || HELP.en[k]; if (h) return { n, h }; }
    }
    return null;
  }
  function tipShow(n, h) {
    tipFor = n;
    tipBox.innerHTML = "";
    tipBox.append(el("b", {}, h[0]), h[1] ? el("span", {}, h[1]) : "");
    tipBox.hidden = false; tipBox.classList.remove("in");
    const r = n.getBoundingClientRect(), tw = tipBox.offsetWidth, th = tipBox.offsetHeight, pad = 10;
    let top = r.bottom + 10, below = true;
    if (top + th > innerHeight - pad) { top = r.top - th - 10; below = false; }
    if (top < pad) { top = Math.min(innerHeight - th - pad, Math.max(pad, r.top + 8)); }
    let left = state.lang === "ar" ? r.right - tw : r.left;
    left = Math.max(pad, Math.min(innerWidth - tw - pad, left));
    tipBox.style.top = top + "px"; tipBox.style.left = left + "px";
    tipBox.dataset.side = below ? "below" : "above";
    if (n.hasAttribute("title")) { n.dataset.tipTitle = n.getAttribute("title"); n.removeAttribute("title"); }   // no double tooltip
    requestAnimationFrame(() => tipBox.classList.add("in"));
  }
  function tipHide() {
    clearTimeout(tipTimer); tipTimer = 0;
    if (tipFor && tipFor.dataset.tipTitle) { tipFor.setAttribute("title", tipFor.dataset.tipTitle); delete tipFor.dataset.tipTitle; }
    tipFor = null; tipBox.hidden = true; tipBox.classList.remove("in");
  }
  function tipAt(target) {
    if (!state.tips) return;
    const f = helpOf(target);
    if (!f) { if (tipFor && !tipFor.contains(target)) tipHide(); return; }
    if (f.n === tipFor) return;
    tipHide();
    tipTimer = setTimeout(() => { if (f.n.isConnected) tipShow(f.n, f.h); }, 450);
  }
  document.addEventListener("pointerover", (e) => { if (e.pointerType !== "touch") tipAt(e.target); });
  document.addEventListener("pointerdown", tipHide, true);
  document.addEventListener("focusin", (e) => { if (e.target.matches && e.target.matches(":focus-visible")) tipAt(e.target); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") tipHide(); });
  addEventListener("scroll", tipHide, { passive: true, capture: true });
  document.addEventListener("pointerout", (e) => { if (tipFor && !e.relatedTarget) tipHide(); });

  /* ---------- background: the mark, 200bps.ai and the founder's name as a
     faint pattern on the brand's 28deg slope, in three depth layers that
     follow the mouse (near layers move more) and lift under the cursor ---------- */
  (function bgfx() {
    const cv = $("#bgfx");
    if (!cv || !cv.getContext) return;
    const ctx = cv.getContext("2d");
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const SLOPE = -28 * Math.PI / 180;
    const LAYERS = [                    // far → near
      { gap: 120, scale: .5, alpha: .035, par: 10, kind: "mark" },
      { gap: 340, scale: .8, alpha: .038, par: 26, kind: "lockup" },
      { gap: 520, scale: 1, alpha: .045, par: 48, kind: "name" },
    ];
    const mark = new Image(); mark.src = "assets/200bps-mark.webp";
    let W = 0, H = 0, dpr = 1, sprites = [], tiles = [];
    const m = { x: .5, y: .5, tx: .5, ty: .5, px: -9999, py: -9999, on: false };
    let drift = 0, raf = 0, lastT = 0, scrollY = 0;
    const theme = () => document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";

    function sprite(kind, scale) {
      const light = theme() === "light";
      const ink = light ? "#08090A" : "#F4F5F2", lime = light ? "#08090A" : "#CCFF33";
      const s = document.createElement("canvas"), c = s.getContext("2d");
      const mk = Math.round(40 * scale);
      const font = (w, px, fam) => `${w} ${Math.round(px * scale)}px ${fam}`;
      const text = kind === "name" ? "Nasser Al-Ostath" : "200bps";
      c.font = kind === "name" ? font(500, 15, "'IBM Plex Sans Arabic', sans-serif") : font(700, 26, "'Space Grotesk', sans-serif");
      const tw = kind === "mark" ? 0 : c.measureText(text).width + (kind === "lockup" ? c.measureText(".ai").width : 0);
      s.width = Math.ceil((mk + (tw ? tw + 14 * scale : 0) + 8) * dpr); s.height = Math.ceil((mk + 8) * dpr);
      c.scale(dpr, dpr);
      // the mark, tinted (lime on dark, void on paper: the approved versions)
      const t = document.createElement("canvas"); t.width = mk; t.height = mk;
      const tc = t.getContext("2d"); if (mark.complete && mark.naturalWidth) tc.drawImage(mark, 0, 0, mk, mk);
      tc.globalCompositeOperation = "source-in"; tc.fillStyle = lime; tc.fillRect(0, 0, mk, mk);
      c.drawImage(t, 4, 4);
      if (tw) {
        c.font = kind === "name" ? font(500, 15, "'IBM Plex Sans Arabic', sans-serif") : font(700, 26, "'Space Grotesk', sans-serif");
        c.textBaseline = "middle"; c.fillStyle = ink;
        const x = mk + 14 * scale, y = 4 + mk / 2;
        c.fillText(text, x, y);
        if (kind === "lockup") { c.fillStyle = lime; c.fillText(".ai", x + c.measureText(text).width, y); }
      }
      return { img: s, w: s.width / dpr, h: s.height / dpr };
    }
    function build() {
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      W = innerWidth; H = innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = W + "px"; cv.style.height = H + "px";
      sprites = LAYERS.map((L) => sprite(L.kind, L.scale));
      // a staggered grid on the slope, generous margin so parallax never shows an edge
      tiles = LAYERS.map((L, li) => {
        const out = [], R = Math.hypot(W, H) / 2 + L.gap * 2;
        for (let gy = -R, row = 0; gy <= R; gy += L.gap * .62, row++)
          for (let gx = -R + (row % 2) * L.gap / 2; gx <= R; gx += L.gap)
            out.push({ gx: gx + li * L.gap * .37, gy: gy + li * L.gap * .21, lift: 0 });   // layers offset so words rarely collide
        return out;
      });
    }
    function frame(ts) {
      raf = 0;
      const dt = Math.min(64, ts - (lastT || ts)); lastT = ts;
      m.x += (m.tx - m.x) * .08; m.y += (m.ty - m.y) * .08;
      if (!still) drift = (drift + dt * .006) % 100000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2, cos = Math.cos(SLOPE), sin = Math.sin(SLOPE);
      LAYERS.forEach((L, li) => {
        const sp = sprites[li], ox = (.5 - m.x) * L.par * 2, oy = (.5 - m.y) * L.par * 2 - scrollY * L.par / 400;
        const d = still ? 0 : (drift * (li + 1) * .35) % L.gap;
        tiles[li].forEach((tl) => {
          const lx = tl.gx + d, ly = tl.gy;
          const x = cx + lx * cos - ly * sin + ox, y = cy + lx * sin + ly * cos + oy;
          if (x < -sp.w * 2 || x > W + sp.w || y < -sp.h * 2 || y > H + sp.h) return;
          // lift: brighter and slightly larger near the cursor, eased
          const dist = m.on ? Math.hypot(x + sp.w / 2 - m.px, y + sp.h / 2 - m.py) : 9999;
          const want = Math.max(0, 1 - dist / 240);
          tl.lift += (want - tl.lift) * .12;
          const k = 1 + tl.lift * .18 * (li + 1) / 3;
          ctx.globalAlpha = Math.min(.3, L.alpha + tl.lift * (.1 + li * .07));
          ctx.drawImage(sp.img, x - sp.w * (k - 1) / 2, y - sp.h * (k - 1) / 2, sp.w * k, sp.h * k);
        });
      });
      ctx.globalAlpha = 1;
      // 3D tilt of the whole field toward the cursor: depth without moving content
      cv.style.transform = still ? "" : `perspective(1200px) rotateX(${((m.y - .5) * -4).toFixed(2)}deg) rotateY(${((m.x - .5) * 5).toFixed(2)}deg) scale(1.06)`;
      if (!still && !document.hidden) raf = requestAnimationFrame(frame);   // slow drift keeps it alive; paused in hidden tabs
    }
    const kick = () => { if (!raf && !document.hidden) raf = requestAnimationFrame(frame); };
    addEventListener("pointermove", (e) => { m.tx = e.clientX / W; m.ty = e.clientY / H; m.px = e.clientX; m.py = e.clientY; m.on = true; kick(); }, { passive: true });
    document.addEventListener("pointerleave", () => { m.on = false; m.tx = .5; m.ty = .5; kick(); });
    addEventListener("scroll", () => { scrollY = window.scrollY; kick(); }, { passive: true });
    addEventListener("resize", () => { build(); kick(); });
    document.addEventListener("visibilitychange", () => { lastT = 0; kick(); });
    new MutationObserver(() => { sprites = LAYERS.map((L) => sprite(L.kind, L.scale)); kick(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const start = () => { build(); kick(); };
    Promise.all([new Promise((r) => { if (mark.complete) r(); else { mark.onload = r; mark.onerror = r; } }), (document.fonts ? document.fonts.ready : Promise.resolve())]).then(start);
  })();

  setView(state.view);
  load(true).then(loadZernio);
  setInterval(() => load(false), 2000);       // plan changes + questions as the agent works
  loadJobs();                                 // background jobs meter: 1s while something runs, else 4s
  setInterval(loadZernio, 5 * 60 * 1000);     // Zernio numbers refresh every 5 min
})();
