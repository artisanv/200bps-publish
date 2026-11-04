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
      kind_carousel: "Carousel", kind_reel: "Reel", kind_video: "Video", kind_short: "Short", kind_story: "Story", kind_document: "Document", kind_archive: "Zipped post",
      kind_article: "Article", kind_text: "Text", kind_post: "Post", kind_poll: "Poll", pollOpensWhen: "Opens when it's posted · open for {d}", pollLeft: "Open · {l} left · closes {c}", pollClosed: "Closed {c}", pollVotes: "See the votes on LinkedIn", pollNoVotes: "LinkedIn doesn't share poll votes with apps, so the votes are on LinkedIn itself.", pollStatImpr: "impressions", pollStatReact: "reactions", pollStatCom: "comments", pollStatShare: "reposts", pollDays: "{n} days", pollHours: "{n} hours", zOutside: "posted outside Zernio", zAccounts: "Accounts", zAllAccounts: "All accounts",
      accKicker: "Accounts", accTitle: "Connect a social account", accHint: "Sign in on the network's own site and approve. Zernio keeps the connection; this skill never sees your password.",
      accNotConnected: "Not connected", accConnect: "Connect", accReconnect: "Reconnect", accAddAnother: "Add another", accSoon: "Coming soon", accConnectShort: "Connect account",
      accWaiting: "Waiting for {n}…", accW1: "Opened the secure sign-in page", accW2: "Approve access on {n} (in the new tab)", accW3: "Saved and ready to post",
      accPrivacy: "Your password goes only to the network. Keep this window open; it updates by itself when you're done.", accOpenAgain: "Open the sign-in page again",
      accDone: "Connected: {a}. It's ready to post.",
      zGrid: "Grid", zList: "List", zViewLabel: "View", ideaGet: "Get ideas", ideaMore: "More ideas", ideaTopicPh: "Optional topic, e.g. AI Agents for beginners",
      ideaEmptyTitle: "No ideas yet", ideaEmptyHint: "Claude studies your best posts in Zernio (follows, saves, shares) and suggests 5 posts with a hook, outline and best time. It refills after every publish.",
      ideaComing: "Claude is on it. Ideas will appear here shortly.", ideaQueued: "Sent. Ideas will appear when Claude Code is open.",
      ideaSt_drafted: "Drafted", ibAll: "Select all", ibSel: "{n} selected", ibDel: "Delete", ibSaveMd: "Save as document (.md)", ibSaveJson: "Save backup (.json)", ibSaveHint: "Saves the selected ideas, or all of them if none are selected", ibAdd: "Add an idea", ibLoad: "Load ideas from a file", ibLoadHint: "Load a backup saved with Save backup (.json)", ibClear: "Clear all", ibClearAsk: "Delete all {n} ideas? You can undo right after.", ibDeleted: "{n} idea(s) deleted.", ibUndo: "Undo", ibRestored: "{n} idea(s) back.", ibSaved: "Saved: {f}", ibLoaded: "{a} idea(s) added, {s} already in the bank.", ibEdit: "Edit", ibEditTitle: "Edit idea", ibNewTitle: "New idea", ibSave: "Save idea", ibTitle: "Title", ibFormat: "Format", ibOutlineHint: "one step per line", ibTagsHint: "separated by spaces", ibSelectHint: "Select this idea", ideaSt_posted: "Posted", ideaTopicsBasis: "Not based on results yet",
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
      openPost: "Open", vPrev: "Previous", vNext: "Next", vFull: "Full screen", vOpenDoc: "Open the PDF", vNoMedia: "This media can't be shown here. Open the post to see it.", zContinue: "Continue this post", zOpenPlan: "Open plan", zAskFix: "Ask Claude to fix", zLocalHint: "local draft, only on this computer",
      zFromSkill: "sent by this skill", zFromZernio: "in your Zernio account",
      fixInProgress: "Claude is already working on this fix", fixInProgressHint: "You'll get a before/after to approve as soon as it's ready. No need to ask again.", ok: "OK",
      keysTitle: "API keys", keysLocal: "stored on this computer only", keyName: "Key name", keyValue: "Paste the key", show: "Show", hide: "Hide", showKey: "Show or hide the key",
      saveKey: "Save", saving: "Saving…", keySaved: "Key saved", keyOk: "Connected: {a}", accountsWord: "accounts", required: "Required", connected: "OK", check: "CHECK", missing: "MISSING",
      replace: "Replace", addKey: "Add key", test: "Test", remove: "Remove", removed: "Key removed", removeConfirm: "Remove {k} from this computer?", whereKey: "Get it at", addOther: "Add another API key",
      keysSafe: "Keys are saved in the .env file in this folder, readable only by you. They never go into the chat and are never shown in full again.",
      npStep1: "Media & caption", npStep2: "Check & improve", npStep3: "Time", npStep4: "Review & schedule", npStepOf: "Step {n} of 4", npNextCheck: "Next: check it", npNextClaude: "Next: Claude writes the caption", npNextTime: "Next: pick a time", npNextReview: "Next: review", npBack: "Back", npCloseKeep: "Close (the draft is kept)", npWriting: "Claude is writing your caption…", npWritingHint: "It appears here as soon as it's ready (Claude Code must be open). You can close this window; the post also opens in the Post tab.", npChecking: "Checking your post…", npCaptionAll: "Caption (all platforms)", npCaptionFor: "Caption for {p}", npSaveCheck: "Save and check again", npSavedCheck: "Saved and checked again", npPassed: "{n} checks passed", npToFix: "To fix", npAskFix: "Ask Claude to fix", npFixing: "Claude is on it…", npSugReady: "Claude's suggestion", npApprove: "Use it", npEditSug: "Edit", npReject: "No thanks", npSugSent: "Sent. Claude applies it and the checks update here.", npBlockedNext: "Red items must be fixed before you can schedule.", npAllGood: "All checks pass.", npBest: "Your best times", npBestHint: "From your own posts: lift vs your average, and how many posts back it.", npPickAny: "Or pick any day and time", npNow: "Post right after I confirm", npWhen: "When", npNoTime: "Pick a time first.", npGiftAdd: "Add a gift (optional)", npGiftEdit: "Change the gift", npCoverHint: "Reels: Instagram uses the first frame unless you set a cover in the Post tab.", npSchedule: "Schedule it", npPublishNow: "Publish now", npOpenPost: "Open in the Post tab", npNoBest: "Not enough of your own data yet to suggest a time. Pick one below.", npTitle: "New post", npSub: "Pick what goes in it. One photo = single post, several = carousel, one video = Reel.", npPaletteHint: "files · images · folder",
      npFromPc: "Photos or video", npFromPcHint: "photos, video, PDF or a .zip from your computer", npArchive: "Archive", npArchiveAlone: "An archive already holds the whole post, so add it on its own.", npArchiveMany: "That archive holds {n} posts. They're in Batch schedule now.", npFromMine: "My images", npFromMineHint: "made in Create an image", npFromFolder: "A post folder", npFromFolderHint: "already has the files",
      npFromImage: "New post", npFromImageHint: "Start a new post with this image", npCarouselFromMine: "Make a post or carousel from these",
      npMedia: "In this post", abOpen: "Test two hooks", abKicker: "Hook test", abTitle: "Test two hooks", abSub: "Both versions go out as Instagram Trial Reels at the same time: only people who don't follow you see them, so your followers aren't touched. After 2 days, compare them and share the winner to your followers.", abYours: "your post", abOther: "another hook", abFullCap: "Full caption", abCoverB: "Cover for B", abSameCover: "Same as A", abNoCovers: "Same cover as A (make more covers in the Cover step to test a different one).", abCapB: "B's caption (change the first line)", abAsk: "Ask Claude for hook B", abAsking: "Claude is writing… (it appears here)", abHookIn: "Hook B from Claude is in", abSame: "B is the same as A. Change the first line or the cover.", abWhen: "Both go out {t}.", abNow: "right away", abHow: "Instagram shows trials to non-followers first. After 48 hours, Check results compares skip rate, watch time and reach from your own numbers.", abOthers: "The test is Instagram only: {n} in this post won't be posted by it.", abType: "Type “go” to start the test", abStart: "Start the test", abStarting: "Creating both Reels…", abStarted: "Hook test started", abResults: "Hook test results", abChecking: "Reading both Reels from Zernio…", abViews: "Views", abLikes: "Likes", abSkip: "skip rate (lower is better)", abWatch: "avg watch time", abShareWin: "Share version {l} with your followers", abShareHow: "Instagram doesn't let apps do this: open it in the Instagram app → ··· → Share to followers. The other one stays a trial (non-followers only).", abOpenWin: "Open version {l}", abRule: "The rule: at least 100 views each and 48 hours. Skip rate decides first (5 points or more apart), then average watch time (10% or more). Otherwise it's too close to call.", abCheckAgain: "Check again", abCheck: "Check results", abTests: "Hook tests", abWinner: "{l} won", abNoWinner: "no winner yet", abRunning: "running", abNotReel: "Hook tests need an Instagram Reel that isn't scheduled yet.", rcKicker: "Recycle", rcTitle: "Recycle your best posts", rcOpen: "Recycle best posts", rcBtn: "Recycle", rcManage: "Manage", rcAll: "All best posts", rcSub: "Zernio re-posts a published post every few weeks or months, with a fresh hook each time. Ranked from your own results.", rcRanked: "Ranked by follows, then saves + shares, then reach. TikTok posts can't be recycled.", rcActive: "{a} of {b} recycling now (Zernio allows {b})", rcSavesShares: "saves + shares", rcRhythm: "How often", rcEvery: "Every", rcWeeks: "weeks", rcMonths: "months", rcEveryN: "every {n} {u}", rcEveryWeek: "every week", rcEveryMonth: "every month", rcStopAfter: "Stop after", rcTimes: "{n} reposts", rcUntilStop: "Until I stop it", rcFirst: "First repost", rcVersions: "New versions", rcVersionsHint: "Each repost uses the next version, in turn. Leave none to repost the same caption. Use 2 or more.", rcVersion: "Version {n}", rcAsk: "Ask Claude for new hooks", rcAsking: "Claude is writing… (they appear here)", rcHooksIn: "New versions from Claude are in", rcAdd: "Add a version", rcNeedTwo: "Add one more version, or remove it: Zernio needs 2 or more (or none).", rcSentence: "Zernio will re-post this {every}, {times}, {what}, starting {d}.", rcWithN: "rotating {n} new versions", rcSame: "with the same caption", rcIgNote: "Instagram shows each repost as a new post.", rcLimits: "Up to 10 posts can recycle at once. Stop it any time; reposts already made stay.", rcType: "Type “go” to start", rcStart: "Start recycling", rcUpdate: "Save changes", rcStarting: "Telling Zernio…", rcStarted: "Recycling is on in Zernio", rcCheck: "Saved, but Zernio shows something different. Check the post.", rcStop: "Stop recycling", rcStopped: "Recycling stopped", rcNext: "next", rcMade: "{a} made", rcMadeOf: "{a} of {b} made", npTextPost: "Text post", npTextHint: "No media? Just write the caption: it becomes a text post for LinkedIn and Facebook. Make it a LinkedIn poll or repost in step 2.", liKind: "Post type", liPost: "Normal post", liPoll: "Poll", liRepost: "Repost", liPostHint: "Your caption with the photos, video or PDF, as usual.", liPostTextHint: "Your caption as a text post. Or make it a poll or a repost.", liNoMedia: "LinkedIn polls and reposts can't have photos, video or a PDF. Remove the media, or pick Normal post.", liUrl: "Link of the LinkedIn post to repost", liRepostHint: "Your caption shows as your comment above the original post. Get the link from the post's ··· menu → Copy link to post.", liQ: "Question", liQPh: "Ask something your followers can answer in one tap", liOpts: "Choices (2 to 4)", liOptPh: "Choice {n}", liAddOpt: "Add a choice", liDur: "Open for", liD1: "1 day", liD3: "3 days", liD7: "1 week", liD14: "2 weeks", liPreview: "Preview", liPvFoot: "Poll · open for {d}", liPollHint: "Your caption shows above the poll. Only LinkedIn gets the poll; Facebook (if on) gets the caption as a text post.", npDrop: "Nothing yet. Drop files here or use the buttons above.", npSingle: "Single image", npCarousel: "Carousel · {n} slides", npReel: "Reel",
      npEarlier: "Move earlier", npLater: "Move later", npName: "Post name", npWhere: "Saved in {f}", npCap: "Caption",
      npCapPh: "Optional. Leave empty and Claude writes it in your voice.", npCapHint: "With a caption the post opens right away; without one, Claude writes it first.",
      npCreateOpen: "Create post", npCreateClaude: "Create post · Claude writes the caption", npCreating: "Creating…", npUploading: "Uploading {i} of {n}…",
      npBadFile: "Use photos (JPG, PNG, WEBP), a video (MP4, MOV), a PDF, or an archive (.zip, .7z, .rar, .tar.gz).", npMineHint: "Click images in the order you want them",
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
      imgAddPost: "Add to post", imgEdit: "Edit", imgEditHint: "Change this picture: describe what to change, the rest stays", imgSaveAs: "Save as…", imgSaveAsHint: "Choose where to save it with your file manager", imgSavedAs: "Saved: {f}", imgEditing: "Editing this picture", imgEditCancel: "Stop editing", imgEditStep: "What should change?", imgEditPh: "e.g. make the background plain white, remove the text, add a lime-green mug on the desk", imgEditGo: "Make the edited version", imgEditPc: "Edit a picture from my computer", annHint: "Pick a tool, mark the picture, and write a note for each mark. Add as many as you like.", annToolMark: "Pin / Area", annToolMarkHint: "Click to pin a note, drag to draw a box", annToolPaint: "Paint", annToolPaintHint: "Brush over the exact place to change", annToolLasso: "Surround", annToolLassoHint: "Draw a loop around what should change", annSize: "Brush", annNote: "What should change here?", annGeneral: "Anything else? (optional)", annMaskOn: "Only change the marked spots", annMaskHint: "Everything outside your marks stays pixel-for-pixel as it is", annKeeping: "Keeping everything outside your marks…", annKeptHint: "Only your marked areas changed; the rest is the original, untouched.", annNeedNote: "Write a note for mark {n}.", annNeed: "Mark a spot on the picture or write what should change.", annNone: "No marks yet. Click the picture.", annClear: "Clear marks", annResult: "Edited version", annResultHint: "Saved in Your images. Press Edit on it to keep changing it.", annWorking: "OpenAI is editing your picture…", annExit: "Exit full screen", imgEditKeep: "The original stays untouched; the edit is a new image.", imgEditNeed: "Write what should change.", npCreateImg: "Create an image", npCreateImgHint: "describe it, AI draws it", imgToNP: "Add to new post", imgNoPicker: "No file manager window on this computer; type a folder instead.", imgSaveFolder: "Save to folder", imgUseGuide: "Use as guide", imgUseGuideHint: "Add this image as a guide picture for the next one",
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
      gsHow: "How it works", gsWhen: "When it starts", gsWhenText: "Saving does nothing yet. The gift switches on together with the post, when you publish or schedule it (typing go). It runs on Instagram only; LinkedIn has no DMs.", gsNoIg: "This post isn't going to Instagram, so the gift won't run.", gsMatch: "Any comment that contains the word counts, in upper or lower case, small typos too.", gsSentence: "When someone comments “{k}” on this post, they get your DM{l}{g}.", gsWithLink: " with a button to your link", gsGated: ", but only after they follow you", gs1: "1 · They comment", gs2: "2 · You reply under it", gs3: "3 · Follow first", gs4: "4 · Your gift arrives", gs3Not: "If they tap before following:", gsSomeone: "someone", gsYou: "you", gsInDm: "in their DMs", gsOnPost: "on your post", gsGateMsg: "Message to people who don't follow yet", gsGateBtn: "Their button", gsNotMsg: "If they tap before following", gsEditGate: "Change these messages", gsDefGate: "Follow the account first, then tap the button.", gsDefBtn: "I'm following", gsDefNot: "Looks like you're not following yet. Follow, then tap again.", gsStep1: "The word to comment", gsStep2: "Your DM", gsStep3: "Options", gsOffHint: "Off: nothing happens when people comment.", giftTitle: "DM gift for this post", giftHint: "People who comment the keyword get your gift in their DMs. It goes live only after you publish and say yes.",
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
      chatYou: "You", chatSeen: "✓ Claude got it", chatWaiting: "Waiting for Claude…", chatWorking: "Working: {s}", chatWorkingNo: "Working on it…", chatDone: "✓ Done", chatFailed: "✗ Couldn't do it", chatHandled: "✓ Handled", chatResult: "Result", ntDone: "Claude finished", ntFailed: "Claude couldn't do it", ntView: "View", ntYour: "Your note", ntUpdated: "The dashboard is up to date.", actTitle: "Activity", actHint: "Your notes and requests to Claude, and what came of them.", actAll: "All", actOpen: "In progress", actDone: "Done", actFailed: "Couldn't", actEmpty: "Nothing here yet. Send Claude a note.", actNew: "new", actOpenChat: "Open in the chat",
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
      notePh2: "e.g. use frame 4, make the headline shorter, post on LinkedIn too", enterHint: "Enter sends · Shift+Enter or Ctrl+Enter for a new line", noteSent: "Note sent", cancel: "Cancel",
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
      cvMonth: "Month", cvWeek: "Week", cvDay: "Day", cvPrevWeek: "Previous", cvNextWeek: "Next", mvTitle: "Move this post?", mvFrom: "From", mvTo: "To", mvType: "Type “move” to change it in Zernio", mvBtn: "Move it", mvDone: "Moved to {t}", mvLocal: "Draft moved to {t}", mvNotAll: "Zernio kept the old time on: {p}. Check it in Zernio.", mvPast: "Pick a time at least 15 minutes from now.", mvPick: "New day and time", edTitle: "Edit the caption", edType: "Type “edit” to save it in Zernio", edBtn: "Save caption", edDone: "Caption saved in Zernio", slTitle: "Schedule at {t}", slCurrent: "Put my open draft here", slDrafts: "Or one of my drafts", slNoDrafts: "No drafts waiting.", slNew: "Start a new post for this time", slIdea: "Draft one from an idea", slIdeaSent: "Sent to Claude: a draft for {t}", slSet: "Scheduled for {t}. Publish it with go when it's ready.", pdMove: "Move…", pdEdit: "Edit caption…", tgDrag: "Drag a post to move it · click or drag on an empty time to plan one", tgNoChange: "Published posts can't be moved or edited.", ibxAll: "All", ibxWaiting: "Waiting", ibxDone: "Handled", ibxReply: "Reply", ibxGift: "Send gift", ibxPrivate: "Private message", ibxHide: "Hide", ibxShow: "Show", ibxDelete: "Delete…", ibxOpenPost: "Open post", ibxOnPost: "On", ibxGiftOf: "This post's gift", ibxNoGift: "No gift on this post", ibxReplyPh: "Write your public reply…", ibxSend: "Send reply", ibxGiftHint: "Sent to their DMs. One private message per comment, within 7 days of the comment.", ibxAsButton: "Send the link as a button", ibxBtnWarn: "Instagram may refuse buttons to people who don't follow you, and a refused try still uses up this comment's one message. The link in the text always works.", ibxConfirm: "Confirm: send to @{a}", ibxSent: "Reply sent", ibxGiftSent: "Gift sent to @{a}", ibxHidden: "Comment hidden", ibxShown: "Comment shown", ibxDelTitle: "Delete this comment?", ibxDelType: "Type “delete” to remove it from the post (can't be undone)", ibxDelBtn: "Delete comment", ibxDeleted: "Comment deleted", ibxSt_replied: "✓ Replied", ibxSt_gift: "✓ Gift sent", "ibxSt_gift-used": "Gift already used", "ibxSt_gift-unknown": "Gift probably sent", ibxSt_deleted: "✓ Deleted", ibxSt_marked: "✓ Marked handled", ibxSt_gated: "Gift sends when they follow", ibxSt_notfollower: "Not a follower · no gift", "ibxSt_auto-sent": "✓ Auto: gift sent", "ibxSt_auto-gated": "Auto: gift sends when they follow", "ibxSt_auto-skipped": "Auto: skipped by the automation", "ibxSt_auto-failed": "Auto gift failed", ibxAutoTip: "Zernio's DM automation already handled this comment. Nothing to do here; it moved to Handled by itself.", ibxAutoGatedTip: "Zernio sent them the follow-first message. When they follow and tap the button, the gift goes out by itself.", ibxAutoFailTip: "Zernio's automation tried and failed, so it stays in Waiting. You can send the gift yourself if the comment's one private message isn't used up.", ibxAutoUsed: "This comment's one private message is already used, so no gift can be sent by hand.", ibxDraftAll: "✨ Ask Claude to draft replies", ntAll: "All networks", nwBtn: "Networks…", nwKicker: "Networks for this post", nwHint: "Switch each network on or off. The post stays scheduled on the ones left on.", nwHintLocal: "Switch each network on or off for this draft.", nwHintPub: "Already published. You can take it off a network where the network allows it.", nwType: "Type “edit” to change it in Zernio", nwSave: "Save networks", nwKeepOne: "Keep at least one network on. To stop the whole post, use Cancel.", nwSaved: "Networks updated", nwCheck: "Saved, but Zernio shows something different. Check the post.", nwCant: "can't show a {k}", nwNotOn: "not on this post", nwRemove: "Remove from {p}…", nwRemoveTitle: "Remove it from {p}?", nwRemoveHint: "The post is deleted from that network only; the others stay. This can't be undone.", nwTypeRemove: "Type “remove” to confirm", nwRemoved: "Removed from {p}", nwAppOnly: "{p} doesn't let apps delete posts: delete it in the {p} app.", cpGift: "Also copy the gift (“{k}”)", cpGiftHint: "Same keyword, message, link and reply, on the copy. It works once the copy is published.", cpGiftDone: "gift copied", dayOpen: "Open this day", buildWord: "build", cpCopy: "Copy", cpCopied: "Copied. Click a day in Plan, then Paste here (or point at a day and press Ctrl+V).", cpOnClip: "Copied:", cpHow: "click a day → Paste here · or Ctrl+V on a day", cpClear: "Forget the copy", cpKicker: "Paste a copy", cpWhat: "Same photos or video, networks, accounts and settings. Pick the time; change the caption if you like.", cpWhatLocal: "A new local draft with the same files and settings. Nothing goes to Zernio until you publish it with go.", cpWhen: "Day and time", cpNets: "Networks", cpCaption: "Caption", cpSchedule: "Schedule it", cpDraft: "Save as a draft in Zernio", cpTypeGo: "Type “go” to schedule the copy", cpPasteBtn: "Schedule the copy", cpDraftBtn: "Save the draft", cpLocalBtn: "Make the copy", cpPickNet: "Pick at least one network.", cpDone: "Copy scheduled for {t}", cpDoneDraft: "Copy saved as a draft in Zernio for {t}", cpDoneLocal: "Copy made as a draft for {t}", cpPasteHere: "Paste here", tgAccounts: "Post to these accounts", tgHint: "Tick every account this post should go to. Same caption and settings on each.", tgLocked: "This post is already in Zernio; its accounts can't change now.", tgOne: "Keep at least one account.", tgSaved: "Accounts saved", vView: "View", ntPickNet: "Network", ntConnect: "Connect", ntAllAcc: "All {p} accounts ({n})", ntPin: "Pin to the top", ntUnpin: "Unpin", ntFind: "Find an account…", ntAccount: "Account", ntCh7: "7 days", ntCh30: "30 days", ntCompare: "Accounts side by side", ntCompareHint: "last 30 days · click a column to sort, a row to open", ntGoalPerAcc: "Goals are per account: open one account to set its goal.", ntBestPick: "Best times are per account: open one account to see its best times.", nsTitle2: "Where this post goes", nsWhen: "When", nsAccount: "Account", nsStatusOf: "Status", nsMore: "+{n}", nsOpen: "Open on {p} ↗", nsNoTime: "No time set yet", nsLocalNote: "Not uploaded to Zernio yet: it goes to these networks when you publish it with go.", nsOpenPost: "Open the post", ntSince: "{n} since {d}", ntSinceTip: "Zernio has follower history for this network only since that day, so a 30-day change isn't possible yet.", ibxTz: "Times in", ibxTzMine: "{c} (my time)", ibxTzLocal: "This computer's clock", ibxTzAud: "Where your audience is", ibxTzAll: "Every time zone", ntPosts: "Posts", ntImpr: "Impressions", ntReach: "Reach", ntEng: "Engagements", ntER: "Avg engagement rate", ntNewF: "New followers", ntLast30: "last 30 days vs the 30 before", ntWeek: "{n} this week", ntMonth: "{n} in 30 days", ntGoal: "Goal", ntSetGoal: "Set a goal", ntNoGoal: "No goal for this network yet.", ntBest: "Best times", ntBestNone: "No time stands out yet on this network (none beats your average). Every post improves this.", ntLift: "{l}% vs your average", ntRhythm: "Posting rhythm", ntRhythmHint: "posts per week · last 8 weeks", ntTop: "Top posts", ntTopHint: "most engagements · last 90 days", ntOpen: "Open", ntNoPosts: "No posts from the last 90 days on this network.", ntFollowers: "Followers", ntConf_high: "high confidence", ntConf_medium: "medium confidence", ntConf_low: "low confidence", ntN: "{n} posts", "ibxSt_ig-replied": "✓ You replied on Instagram", "ibxSt_ig-mentioned": "✓ You @mentioned them", "ibxSt_ig-dm": "✓ You answered in DMs", ibxIgTip: "You handled this in the Instagram app, so it moved to Handled by itself.", ibxYouWrote: "You wrote", ibxLiked: "♥ You liked it", ibxDraftSent: "Sent to Claude: drafts for {n} comments", ibxDraftNone: "Every waiting comment already has a draft.", ibxDraftOf: "Claude's draft", ibxSendAll: "Send all drafts ({n})", ibxSendAllTitle: "These replies will be posted publicly:", ibxSendAllGo: "✓ Post {n} replies", ibxSendAllDone: "{n} replies sent", ibxSendAllFail: "Couldn't send to @{a}: {e}", ibxCancel: "Cancel", ibxDraftUse: "Use it", ibxDraftNo: "No thanks", fnTriggered: "Commented the keyword", fnGate: "Got follow-first", fnPassed: "Followed + tapped", fnSent: "Gift DM sent", fnClicked: "Opened the link", fnNone: "No one has triggered it yet.", fnPost: "Open post", folFresh: "updated {t}", folFreshTip: "Zernio refreshes follower counts about once a day, so a new follower can take up to a day to show.", ibxUnmark: "Back to waiting", ibxAddLabel: "+ label", ibxLabelPh: "New label", ibxNone: "No comments waiting. Nice.", ibxLikes: "likes", ibxHiddenTag: "hidden", nsTitle: "Network settings", nsFB: "Facebook", nsFormat: "Format", nsFeed: "Feed post", nsReel: "Reel", nsFbStory: "Story", nsFeedHint: "Text, one photo, up to 10 photos, or a video. No mixing photos and video.", nsReelHint: "One vertical video (9:16), 3-90 seconds.", nsFbStoryHint: "One photo or video, gone after 24 hours. No caption.", nsReelTitle: "Reel title (optional)", nsFirst: "First comment (optional)", nsFbDraft: "Save as a draft in Facebook's Publishing Tools instead of posting", nsPage: "Facebook Page", nsDefaultPage: "My default Page", nsTT: "TikTok", nsSC: "Snapchat", nsWho: "Who can see it", nsComments: "Comments", nsDuet: "Duets", nsStitch: "Stitches", nsDisclose: "Promotional content", nsNone: "Not promotional", nsOwnBrand: "Your own brand", nsBranded: "Branded content (paid partnership)", nsAi: "Made with AI (label it on TikTok)", nsDraft: "Send to my TikTok inbox as a draft; I finish it in the app", nsConsent: "I previewed this post and agree to post it on TikTok", nsConsentHint: "TikTok requires this. If you change the caption or media, it asks again.", nsLimit: "TikTok says this account can't post more right now. Try later.", nsLoading: "Loading your TikTok choices…", nsStory: "Story", nsSaved: "Saved story", nsSpot: "Spotlight", nsStoryHint: "Disappears after 24 hours. Shows no caption.", nsSavedHint: "Stays on your Public Profile. Title up to 45 characters.", nsSpotHint: "The public video feed. Video only, caption up to 160 characters.", nsSkipped: "Skipped", nsChange: "Change…", nsPriv_PUBLIC_TO_EVERYONE: "Everyone", nsPriv_MUTUAL_FOLLOW_FRIENDS: "Friends", nsPriv_FOLLOWER_OF_CREATOR: "Followers", nsPriv_SELF_ONLY: "Only me", nsPick: "Choose…", calPrev: "Previous month", calNext: "Next month", calToday: "Today", calMore: "+{n} more",
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
      tipsLabel: "Hover tips", cbLabel: "Color-blind mode", cCb: "Color-blind mode on / off", guideTitle: "Guide: every feature", guideHint: "Rest the mouse on anything for a quick tip.",
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
      kind_carousel: "كاروسيل", kind_reel: "ريل", kind_video: "فيديو", kind_short: "شورت", kind_story: "ستوري", kind_document: "مستند", kind_archive: "بوست مضغوط",
      kind_article: "مقال", kind_text: "نص", kind_post: "بوست", kind_poll: "تصويت", pollOpensWhen: "يفتح لما ينتشر · مفتوح {d}", pollLeft: "مفتوح · باقي {l} · يسكّر {c}", pollClosed: "سكّر {c}", pollVotes: "شوف التصويت في LinkedIn", pollNoVotes: "LinkedIn ما يعطي نتايج التصويت للتطبيقات، فالأصوات تشوفها في LinkedIn نفسه.", pollStatImpr: "مشاهدة", pollStatReact: "تفاعل", pollStatCom: "تعليق", pollStatShare: "إعادة نشر", pollDays: "{n} أيام", pollHours: "{n} ساعات", zOutside: "انتشر برا Zernio", zAccounts: "الحسابات", zAllAccounts: "كل الحسابات",
      accKicker: "الحسابات", accTitle: "اربط حساب سوشال ميديا", accHint: "سجّل دخول في موقع الشبكة نفسها ووافق. Zernio يحفظ الربط، والسكل ما يشوف كلمة السر أبداً.",
      accNotConnected: "مو مربوط", accConnect: "اربط", accReconnect: "أعد الربط", accAddAnother: "أضف حساب ثاني", accSoon: "قريباً", accConnectShort: "اربط حساب",
      accWaiting: "بانتظار {n}…", accW1: "انفتحت صفحة الدخول الآمنة", accW2: "وافق على الصلاحية في {n} (بالتبويب الجديد)", accW3: "انحفظ وجاهز للنشر",
      accPrivacy: "كلمة السر تروح للشبكة بس. خل هالنافذة مفتوحة؛ بتتحدث بروحها أول ما تخلص.", accOpenAgain: "افتح صفحة الدخول مرة ثانية",
      accDone: "انربط: {a}. جاهز للنشر.",
      zGrid: "شبكة", zList: "قائمة", zViewLabel: "العرض", ideaGet: "اطلب أفكار", ideaMore: "أفكار أكثر", ideaTopicPh: "موضوع اختياري، مثلاً: AI Agents للمبتدئين",
      ideaEmptyTitle: "ما في أفكار للحين", ideaEmptyHint: "Claude يدرس أفضل بوستاتك في Zernio (المتابعات، الحفظ، المشاركة) ويقترح 5 بوستات مع افتتاحية ومخطط وأفضل وقت. وتتجدد بعد كل نشر.",
      ideaComing: "Claude قاعد يشتغل عليها. بتطلع الأفكار هني بعد شوي.", ideaQueued: "انرسلت. بتطلع الأفكار أول ما تفتح Claude Code.",
      ideaSt_drafted: "انكتبت", ibAll: "اختار الكل", ibSel: "{n} مختارة", ibDel: "احذف", ibSaveMd: "احفظ كمستند (.md)", ibSaveJson: "احفظ نسخة احتياطية (.json)", ibSaveHint: "يحفظ الأفكار المختارة، أو كلها إذا ما اخترت شي", ibAdd: "أضف فكرة", ibLoad: "حمّل أفكار من ملف", ibLoadHint: "حمّل نسخة انحفظت من احفظ نسخة احتياطية (.json)", ibClear: "امسح الكل", ibClearAsk: "تحذف كل الأفكار ({n})؟ تقدر تتراجع على طول.", ibDeleted: "انحذفت {n} فكرة.", ibUndo: "تراجع", ibRestored: "رجعت {n} فكرة.", ibSaved: "انحفظت: {f}", ibLoaded: "انضافت {a} فكرة، و{s} موجودة أصلاً.", ibEdit: "عدّل", ibEditTitle: "عدّل الفكرة", ibNewTitle: "فكرة جديدة", ibSave: "احفظ الفكرة", ibTitle: "العنوان", ibFormat: "النوع", ibOutlineHint: "كل خطوة بسطر", ibTagsHint: "بينها مسافة", ibSelectHint: "اختار هالفكرة", ideaSt_posted: "انتشرت", ideaTopicsBasis: "مو مبنية على نتائج للحين",
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
      openPost: "افتح", vPrev: "السابق", vNext: "التالي", vFull: "ملء الشاشة", vOpenDoc: "افتح الـPDF", vNoMedia: "ما نقدر نعرض هالملف هني. افتح البوست عشان تشوفه.", zContinue: "كمّل هالبوست", zOpenPlan: "افتح الخطة", zAskFix: "اطلب من Claude يصلحه", zLocalHint: "مسودة محلية، على هالجهاز بس",
      zFromSkill: "انرسل من السكل", zFromZernio: "في حسابك بـZernio",
      fixInProgress: "Claude قاعد يشتغل على هالتصحيح", fixInProgressHint: "بيوصلك قبل/بعد توافق عليه أول ما يجهز. لا تطلبه مرة ثانية.", ok: "تمام",
      keysTitle: "مفاتيح API", keysLocal: "محفوظة على هالجهاز بس", keyName: "اسم المفتاح", keyValue: "الصق المفتاح", show: "إظهار", hide: "إخفاء", showKey: "إظهار أو إخفاء المفتاح",
      saveKey: "حفظ", saving: "قاعد يحفظ…", keySaved: "انحفظ المفتاح", keyOk: "متصل: {a}", accountsWord: "حسابات", required: "مطلوب", connected: "تمام", check: "راجع", missing: "ناقص",
      replace: "استبدال", addKey: "أضف مفتاح", test: "اختبار", remove: "حذف", removed: "انحذف المفتاح", removeConfirm: "تحذف {k} من هالجهاز؟", whereKey: "تحصله من", addOther: "أضف مفتاح API ثاني",
      keysSafe: "المفاتيح تنحفظ في ملف ‎.env‎ بهالمجلد، وأنت بس تقدر تقراه. ما تروح للمحادثة وما تنعرض كاملة مرة ثانية.",
      npStep1: "الملفات والكابشن", npStep2: "افحص وحسّن", npStep3: "الوقت", npStep4: "راجع وجدول", npStepOf: "الخطوة {n} من 4", npNextCheck: "التالي: افحصه", npNextClaude: "التالي: Claude يكتب الكابشن", npNextTime: "التالي: اختار الوقت", npNextReview: "التالي: راجع", npBack: "رجوع", npCloseKeep: "سكّر (المسودة محفوظة)", npWriting: "Claude قاعد يكتب الكابشن…", npWritingHint: "يطلع هني أول ما يخلص (لازم Claude Code يكون مفتوح). تقدر تسكّر هالنافذة؛ والبوست بعد ينفتح في تبويب البوست.", npChecking: "قاعد نفحص البوست…", npCaptionAll: "الكابشن (كل المنصات)", npCaptionFor: "الكابشن لـ{p}", npSaveCheck: "احفظ وافحص من جديد", npSavedCheck: "انحفظ وانفحص من جديد", npPassed: "{n} فحص ناجح", npToFix: "يحتاج تصليح", npAskFix: "اطلب من Claude يصلحه", npFixing: "Claude قاعد يشتغل عليه…", npSugReady: "اقتراح Claude", npApprove: "استخدمه", npEditSug: "عدّل", npReject: "لا شكراً", npSugSent: "انرسل. Claude يطبّقه والفحص يتحدث هني.", npBlockedNext: "لازم تصلّح الأحمر قبل لا تجدول.", npAllGood: "كل الفحوصات ناجحة.", npBest: "أفضل أوقاتك", npBestHint: "من بوستاتك: الزيادة عن معدلك، وكم بوست وراها.", npPickAny: "أو اختار أي يوم ووقت", npNow: "انشره أول ما أأكد", npWhen: "متى", npNoTime: "اختار وقت أول.", npGiftAdd: "أضف هدية (اختياري)", npGiftEdit: "غيّر الهدية", npCoverHint: "الريلز: Instagram ياخذ أول لقطة إلا إذا حطيت غلاف من تبويب البوست.", npSchedule: "جدوله", npPublishNow: "انشر الحين", npOpenPost: "افتح في تبويب البوست", npNoBest: "ما في بيانات كافية من بوستاتك عشان نقترح وقت. اختار واحد تحت.", npTitle: "بوست جديد", npSub: "اختار شنو فيه. صورة وحدة = بوست عادي، كم صورة = كاروسيل، فيديو واحد = ريل.", npPaletteHint: "ملفات · صور · مجلد",
      npFromPc: "صور أو فيديو", npFromPcHint: "صور أو فيديو أو PDF أو ملف .zip من جهازك", npArchive: "ملف مضغوط", npArchiveAlone: "الملف المضغوط فيه البوست كامل، فضيفه بروحه.", npArchiveMany: "هالملف المضغوط فيه {n} بوستات. تلقاهم في الجدولة الجماعية.", npFromMine: "صوري", npFromMineHint: "اللي سويتها في سوّ صورة", npFromFolder: "مجلد بوست", npFromFolderHint: "فيه الملفات أصلاً",
      npFromImage: "بوست جديد", npFromImageHint: "ابدأ بوست جديد بهالصورة", npCarouselFromMine: "سوّ بوست أو كاروسيل منها",
      npMedia: "في هالبوست", abOpen: "جرّب هوكين", abKicker: "تجربة الهوك", abTitle: "جرّب هوكين", abSub: "النسختين ينزلون كـ Trial Reels بانستقرام بنفس الوقت: يشوفهم بس اللي ما يتابعونك، فمتابعينك ما يتأثرون. بعد يومين قارن بينهم وشارك الفايز مع متابعينك.", abYours: "بوستك", abOther: "هوك ثاني", abFullCap: "الكابشن كامل", abCoverB: "كفر النسخة B", abSameCover: "نفس A", abNoCovers: "نفس كفر A (سوّ كفرات أكثر بخطوة الكفر إذا تبي تجرب كفر ثاني).", abCapB: "كابشن B (غيّر أول سطر)", abAsk: "اطلب من Claude هوك B", abAsking: "Claude قاعد يكتب… (بيطلع هني)", abHookIn: "وصل هوك B من Claude", abSame: "B نفس A. غيّر أول سطر أو الكفر.", abWhen: "النسختين ينزلون {t}.", abNow: "على طول", abHow: "انستقرام يعرض التجارب لغير المتابعين أول. بعد 48 ساعة، «شوف النتايج» يقارن نسبة التخطي ووقت المشاهدة والوصول من أرقامك أنت.", abOthers: "التجربة لانستقرام بس: {n} بهالبوست ما راح تنشر منها.", abType: "اكتب «go» عشان تبدأ التجربة", abStart: "ابدأ التجربة", abStarting: "قاعد يسوي الريلين…", abStarted: "بدت تجربة الهوك", abResults: "نتايج تجربة الهوك", abChecking: "قاعد يقرا الريلين من Zernio…", abViews: "مشاهدات", abLikes: "لايكات", abSkip: "نسبة التخطي (الأقل أحسن)", abWatch: "متوسط المشاهدة", abShareWin: "شارك النسخة {l} مع متابعينك", abShareHow: "انستقرام ما يسمح للتطبيقات بهالشي: افتحها بتطبيق انستقرام ← ··· ← Share to followers. والثانية تظل تجربة (لغير المتابعين بس).", abOpenWin: "افتح النسخة {l}", abRule: "القاعدة: 100 مشاهدة على الأقل لكل وحدة و48 ساعة. نسبة التخطي تحسم أول (فرق 5 نقاط أو أكثر)، بعدين متوسط المشاهدة (10% أو أكثر). غير جذي متقاربين وما نقدر نحكم.", abCheckAgain: "شيّك مرة ثانية", abCheck: "شوف النتايج", abTests: "تجارب الهوك", abWinner: "فاز {l}", abNoWinner: "ما في فايز للحين", abRunning: "شغالة", abNotReel: "تجربة الهوك تبي ريل انستقرام مو مجدول للحين.", rcKicker: "إعادة تدوير", rcTitle: "أعد تدوير أفضل بوستاتك", rcOpen: "أعد تدوير الأفضل", rcBtn: "أعد تدويره", rcManage: "إدارة", rcAll: "كل أفضل البوستات", rcSub: "Zernio يعيد نشر البوست المنشور كل كم أسبوع أو شهر، بهوك جديد كل مرة. الترتيب من نتايجك أنت.", rcRanked: "الترتيب حسب المتابعين الجدد، بعدين الحفظ + المشاركة، بعدين الوصول. بوستات TikTok ما تنعاد.", rcActive: "{a} من {b} قاعدة تنعاد الحين (Zernio يسمح بـ {b})", rcSavesShares: "حفظ + مشاركة", rcRhythm: "كل قد إيش", rcEvery: "كل", rcWeeks: "أسابيع", rcMonths: "شهور", rcEveryN: "كل {n} {u}", rcEveryWeek: "كل أسبوع", rcEveryMonth: "كل شهر", rcStopAfter: "وقّف بعد", rcTimes: "{n} مرات", rcUntilStop: "لين أوقفه", rcFirst: "أول إعادة", rcVersions: "نسخ جديدة", rcVersionsHint: "كل إعادة تاخذ النسخة اللي بعدها بالدور. إذا ما حطيت نسخ ينعاد نفس الكابشن. حط 2 أو أكثر.", rcVersion: "نسخة {n}", rcAsk: "اطلب من Claude هوكات جديدة", rcAsking: "Claude قاعد يكتب… (بتطلع هني)", rcHooksIn: "وصلت النسخ الجديدة من Claude", rcAdd: "أضف نسخة", rcNeedTwo: "أضف نسخة ثانية أو شيلها: Zernio يبي 2 أو أكثر (أو ولا وحدة).", rcSentence: "Zernio بيعيد نشره {every}، {times}، {what}، من {d}.", rcWithN: "ويدوّر بين {n} نسخ جديدة", rcSame: "بنفس الكابشن", rcIgNote: "Instagram يطلّع كل إعادة كبوست جديد.", rcLimits: "لين 10 بوستات تنعاد بنفس الوقت. توقفه متى ما تبي؛ اللي انعاد يظل.", rcType: "اكتب «go» عشان تبدأ", rcStart: "ابدأ إعادة التدوير", rcUpdate: "احفظ التعديلات", rcStarting: "قاعد أبلغ Zernio…", rcStarted: "إعادة التدوير شغالة في Zernio", rcCheck: "انحفظ، بس Zernio يبيّن شي ثاني. شيّك البوست.", rcStop: "وقّف إعادة التدوير", rcStopped: "وقفت إعادة التدوير", rcNext: "الجاية", rcMade: "{a} انعادت", rcMadeOf: "{a} من {b} انعادت", npTextPost: "بوست نص", npTextHint: "ما عندك صور أو فيديو؟ اكتب الكابشن بس: يصير بوست نص لـ LinkedIn وFacebook. تقدر تخليه تصويت أو إعادة نشر في LinkedIn بالخطوة 2.", liKind: "نوع البوست", liPost: "بوست عادي", liPoll: "تصويت", liRepost: "إعادة نشر", liPostHint: "الكابشن مع الصور أو الفيديو أو الـ PDF، مثل العادة.", liPostTextHint: "الكابشن كبوست نص. أو خلّه تصويت أو إعادة نشر.", liNoMedia: "التصويت وإعادة النشر في LinkedIn ما ينفع معاهم صور أو فيديو أو PDF. شيل الملفات، أو اختار بوست عادي.", liUrl: "رابط بوست LinkedIn اللي تبي تعيد نشره", liRepostHint: "الكابشن مالك يطلع كتعليقك فوق البوست الأصلي. خذ الرابط من قائمة ··· في البوست ← Copy link to post.", liQ: "السؤال", liQPh: "اسأل شي يجاوبون عليه بضغطة وحدة", liOpts: "الخيارات (من 2 إلى 4)", liOptPh: "خيار {n}", liAddOpt: "أضف خيار", liDur: "مفتوح لمدة", liD1: "يوم", liD3: "3 أيام", liD7: "أسبوع", liD14: "أسبوعين", liPreview: "معاينة", liPvFoot: "تصويت · مفتوح {d}", liPollHint: "الكابشن يطلع فوق التصويت. التصويت بس في LinkedIn؛ وFacebook (إذا شغّال) ياخذ الكابشن كبوست نص.", npDrop: "ما في شي للحين. اسحب الملفات هني أو استخدم الأزرار فوق.", npSingle: "صورة وحدة", npCarousel: "كاروسيل · {n} شرائح", npReel: "ريل",
      npEarlier: "قدّمها", npLater: "أخّرها", npName: "اسم البوست", npWhere: "ينحفظ في {f}", npCap: "الكابشن",
      npCapPh: "اختياري. خله فاضي وClaude يكتبه بأسلوبك.", npCapHint: "إذا فيه كابشن البوست ينفتح على طول، وإذا لا Claude يكتبه أول.",
      npCreateOpen: "سوّ البوست", npCreateClaude: "سوّ البوست · Claude يكتب الكابشن", npCreating: "قاعد يسوي…", npUploading: "قاعد يرفع {i} من {n}…",
      npBadFile: "استخدم صور (JPG, PNG, WEBP) أو فيديو (MP4, MOV) أو PDF أو ملف مضغوط (.zip, .7z, .rar, .tar.gz).", npMineHint: "اضغط الصور بالترتيب اللي تبيه",
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
      imgAddPost: "أضفها للبوست", imgEdit: "عدّل", imgEditHint: "عدّل هالصورة: اكتب شنو يتغيّر، والباقي يبقى", imgSaveAs: "احفظ باسم…", imgSaveAsHint: "اختار وين تحفظها من مدير الملفات", imgSavedAs: "انحفظت: {f}", imgEditing: "قاعد تعدّل هالصورة", imgEditCancel: "وقّف التعديل", imgEditStep: "شنو يتغيّر؟", imgEditPh: "مثلاً: خل الخلفية بيضا، شيل الكتابة، حط كوب أخضر ليموني على المكتب", imgEditGo: "سوّ النسخة المعدّلة", imgEditPc: "عدّل صورة من جهازك", annHint: "اختار أداة، علّم على الصورة، واكتب ملاحظة لكل علامة. حط قد ما تبي.", annToolMark: "دبوس / مربع", annToolMarkHint: "اضغط عشان تحط ملاحظة، اسحب عشان ترسم مربع", annToolPaint: "لوّن", annToolPaintHint: "لوّن على المكان اللي تبيه يتغيّر بالضبط", annToolLasso: "حوّط", annToolLassoHint: "ارسم دايرة حول الشي اللي يتغيّر", annSize: "الفرشاة", annNote: "شنو يتغيّر هني؟", annGeneral: "شي ثاني؟ (اختياري)", annMaskOn: "غيّر بس الأماكن المحددة", annMaskHint: "كل شي برا علاماتك يبقى مثل ما هو بالضبط", annKeeping: "قاعد نثبّت كل شي برا علاماتك…", annKeptHint: "بس الأماكن اللي علّمتها تغيّرت؛ الباقي هو الأصلي بدون أي تغيير.", annNeedNote: "اكتب ملاحظة للعلامة {n}.", annNeed: "حدد مكان على الصورة أو اكتب شنو يتغيّر.", annNone: "ما في علامات للحين. اضغط على الصورة.", annClear: "امسح العلامات", annResult: "النسخة المعدّلة", annResultHint: "انحفظت في صوري. اضغط عدّل عليها عشان تكمل تغيّر فيها.", annWorking: "OpenAI قاعد يعدّل صورتك…", annExit: "اطلع من ملء الشاشة", imgEditKeep: "الأصلية ما تتغيّر؛ التعديل يطلع صورة جديدة.", imgEditNeed: "اكتب شنو يتغيّر.", npCreateImg: "سوّ صورة", npCreateImgHint: "توصفها والذكاء يرسمها", imgToNP: "أضفها للبوست الجديد", imgNoPicker: "ما في نافذة مدير ملفات على هالجهاز؛ اكتب المجلد بدالها.", imgSaveFolder: "احفظ بمجلد", imgUseGuide: "استخدمها كمرشدة", imgUseGuideHint: "أضف هالصورة كمرشدة للصورة الجاية",
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
      gsHow: "شلون تشتغل", gsWhen: "متى تبدأ", gsWhenText: "الحفظ ما يسوي شي للحين. الهدية تشتغل مع البوست نفسه، لما تنشره أو تجدوله (لما تكتب go). تشتغل على Instagram بس؛ LinkedIn ما فيه رسائل خاصة.", gsNoIg: "هالبوست مو رايح Instagram، فالهدية ما راح تشتغل.", gsMatch: "أي تعليق فيه الكلمة ينحسب، كابيتال أو سمول، وحتى لو فيه غلطة إملائية بسيطة.", gsSentence: "لما أحد يعلّق «{k}» على هالبوست، توصله رسالتك بالخاص{l}{g}.", gsWithLink: " مع زر لرابطك", gsGated: "، بس بعد ما يتابعك", gs1: "1 · يعلّق", gs2: "2 · ترد عليه تحت", gs3: "3 · يتابعك أول", gs4: "4 · توصله الهدية", gs3Not: "إذا ضغط قبل لا يتابع:", gsSomeone: "أحد", gsYou: "أنت", gsInDm: "بالخاص", gsOnPost: "على بوستك", gsGateMsg: "رسالة للي ما يتابعونك للحين", gsGateBtn: "الزر اللي يطلع لهم", gsNotMsg: "إذا ضغط قبل لا يتابع", gsEditGate: "غيّر هالرسايل", gsDefGate: "تابع الحساب أول، وبعدين اضغط الزر.", gsDefBtn: "تابعتك", gsDefNot: "شكلك للحين ما تابعت. تابع، وبعدين اضغط مرة ثانية.", gsStep1: "الكلمة اللي يعلقونها", gsStep2: "رسالتك بالخاص", gsStep3: "خيارات", gsOffHint: "مطفي: ما يصير شي لما الناس يعلقون.", giftTitle: "هدية بالخاص لهالبوست", giftHint: "اللي يكتب الكلمة بالتعليقات يوصله هديتك بالخاص. ما تشتغل إلا بعد النشر وموافقتك.",
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
      chatYou: "أنت", chatSeen: "✓ وصلت Claude", chatWaiting: "ينتظر Claude…", chatWorking: "قاعد يشتغل: {s}", chatWorkingNo: "قاعد يشتغل عليها…", chatDone: "✓ خلصت", chatFailed: "✗ ما قدر يسويها", chatHandled: "✓ انتهت", chatResult: "النتيجة", ntDone: "Claude خلّص", ntFailed: "Claude ما قدر يسويها", ntView: "شوف", ntYour: "ملاحظتك", ntUpdated: "اللوحة محدّثة.", actTitle: "النشاط", actHint: "ملاحظاتك وطلباتك لـClaude، وشنو صار فيها.", actAll: "الكل", actOpen: "قيد الشغل", actDone: "خلصت", actFailed: "ما قدر", actEmpty: "ما في شي للحين. أرسل ملاحظة لـClaude.", actNew: "جديد", actOpenChat: "افتح في المحادثة",
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
      notePh2: "مثلاً: استخدم اللقطة 4، قصّر العنوان، انشر على LinkedIn بعد", enterHint: "Enter يرسل · Shift+Enter أو Ctrl+Enter لسطر جديد", noteSent: "وصلت الرسالة", cancel: "إلغاء",
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
      cvMonth: "شهر", cvWeek: "أسبوع", cvDay: "يوم", cvPrevWeek: "السابق", cvNextWeek: "التالي", mvTitle: "تنقل هالبوست؟", mvFrom: "من", mvTo: "إلى", mvType: "اكتب «move» عشان يتغيّر في Zernio", mvBtn: "انقله", mvDone: "انتقل إلى {t}", mvLocal: "المسودة انتقلت إلى {t}", mvNotAll: "Zernio خلّى الوقت القديم على: {p}. شيّك عليه في Zernio.", mvPast: "اختار وقت بعد 15 دقيقة على الأقل.", mvPick: "اليوم والوقت الجديد", edTitle: "عدّل الكابشن", edType: "اكتب «edit» عشان ينحفظ في Zernio", edBtn: "احفظ الكابشن", edDone: "الكابشن انحفظ في Zernio", slTitle: "جدول على {t}", slCurrent: "حط المسودة المفتوحة هني", slDrafts: "أو وحدة من مسوداتي", slNoDrafts: "ما في مسودات تنتظر.", slNew: "ابدأ بوست جديد لهالوقت", slIdea: "خل Claude يكتب واحد من فكرة", slIdeaSent: "انرسلت لـClaude: مسودة لـ{t}", slSet: "انجدول على {t}. انشره بـgo لما يجهز.", pdMove: "انقل…", pdEdit: "عدّل الكابشن…", tgDrag: "اسحب بوست عشان تنقله · اضغط أو اسحب على وقت فاضي عشان تخطط واحد", tgNoChange: "البوستات المنشورة ما تنتقل ولا تتعدّل.", ibxAll: "الكل", ibxWaiting: "تنتظر", ibxDone: "انتهت", ibxReply: "رد", ibxGift: "أرسل الهدية", ibxPrivate: "رسالة خاصة", ibxHide: "اخفِ", ibxShow: "أظهر", ibxDelete: "احذف…", ibxOpenPost: "افتح البوست", ibxOnPost: "على", ibxGiftOf: "هدية هالبوست", ibxNoGift: "ما في هدية على هالبوست", ibxReplyPh: "اكتب ردك العام…", ibxSend: "أرسل الرد", ibxGiftHint: "توصله بالخاص. رسالة خاصة وحدة لكل تعليق، خلال 7 أيام من التعليق.", ibxAsButton: "أرسل الرابط كزر", ibxBtnWarn: "Instagram ممكن يرفض الأزرار للي ما يتابعونك، والمحاولة المرفوضة تستهلك الرسالة الوحيدة لهالتعليق. الرابط داخل النص يشتغل دايماً.", ibxConfirm: "أكّد: أرسل لـ@{a}", ibxSent: "انرسل الرد", ibxGiftSent: "انرسلت الهدية لـ@{a}", ibxHidden: "انخفى التعليق", ibxShown: "ظهر التعليق", ibxDelTitle: "تحذف هالتعليق؟", ibxDelType: "اكتب «delete» عشان ينشال من البوست (ما يرجع)", ibxDelBtn: "احذف التعليق", ibxDeleted: "انحذف التعليق", ibxSt_replied: "✓ انرد عليه", ibxSt_gift: "✓ انرسلت الهدية", "ibxSt_gift-used": "الهدية مستخدمة", "ibxSt_gift-unknown": "الهدية غالباً وصلت", ibxSt_deleted: "✓ انحذف", ibxSt_marked: "✓ تعلّمت منتهية", ibxSt_gated: "الهدية توصله لما يتابع", ibxSt_notfollower: "مو متابع · بدون هدية", "ibxSt_auto-sent": "✓ تلقائي: انرسلت الهدية", "ibxSt_auto-gated": "تلقائي: الهدية توصله لما يتابع", "ibxSt_auto-skipped": "تلقائي: الأتمتة تجاهلته", "ibxSt_auto-failed": "الهدية التلقائية فشلت", ibxAutoTip: "أتمتة الرسائل في Zernio تعاملت مع هالتعليق. ما عليك شي؛ انتقل لـ«انتهت» بروحه.", ibxAutoGatedTip: "Zernio أرسل له رسالة «تابع أول». لما يتابع ويضغط الزر، توصله الهدية بروحها.", ibxAutoFailTip: "الأتمتة حاولت وفشلت، عشان جذي يظل في «تنتظر». تقدر ترسل الهدية بنفسك إذا الرسالة الخاصة الوحيدة لهالتعليق ما انستخدمت.", ibxAutoUsed: "الرسالة الخاصة الوحيدة لهالتعليق انستخدمت، فما تقدر ترسل هدية يدوياً.", ibxDraftAll: "✨ خل Claude يكتب الردود", ntAll: "كل المنصات", nwBtn: "المنصات…", nwKicker: "منصات هالبوست", nwHint: "شغّل أو طفّ كل منصة. البوست يظل مجدول على اللي تظل شغّالة.", nwHintLocal: "شغّل أو طفّ كل منصة لهالمسودة.", nwHintPub: "انشر خلاص. تقدر تشيله من منصة إذا المنصة تسمح.", nwType: "اكتب «edit» عشان يتغيّر في Zernio", nwSave: "احفظ المنصات", nwKeepOne: "خلّ منصة وحدة شغّالة على الأقل. عشان توقف البوست كله، استخدم «ألغِ».", nwSaved: "انحدّثت المنصات", nwCheck: "انحفظ، بس Zernio يبين شي مختلف. شيّك على البوست.", nwCant: "ما تعرض {k}", nwNotOn: "مو على هالبوست", nwRemove: "شيله من {p}…", nwRemoveTitle: "تشيله من {p}؟", nwRemoveHint: "البوست ينحذف من هالمنصة بس؛ والباقي يظل. ما يرجع.", nwTypeRemove: "اكتب «remove» عشان تأكد", nwRemoved: "انشال من {p}", nwAppOnly: "{p} ما يسمح للتطبيقات تحذف البوستات: احذفه من تطبيق {p}.", cpGift: "انسخ الهدية بعد («{k}»)", cpGiftHint: "نفس الكلمة والرسالة والرابط والرد، على النسخة. تشتغل لما تنزل النسخة.", cpGiftDone: "انسخت الهدية", dayOpen: "افتح هاليوم", buildWord: "بناء", cpCopy: "انسخ", cpCopied: "انسخ. اضغط يوم في الخطة، وبعدين «الصق هني» (أو أشّر على يوم واضغط Ctrl+V).", cpOnClip: "منسوخ:", cpHow: "اضغط يوم ← الصق هني · أو Ctrl+V على يوم", cpClear: "انسَ النسخة", cpKicker: "الصق نسخة", cpWhat: "نفس الصور أو الفيديو والمنصات والحسابات والإعدادات. اختار الوقت؛ وعدّل الكابشن إذا تبي.", cpWhatLocal: "مسودة جديدة على جهازك بنفس الملفات والإعدادات. ما يروح شي لـZernio لين تنشره بـgo.", cpWhen: "اليوم والوقت", cpNets: "المنصات", cpCaption: "الكابشن", cpSchedule: "جدوله", cpDraft: "احفظه مسودة في Zernio", cpTypeGo: "اكتب «go» عشان تجدول النسخة", cpPasteBtn: "جدول النسخة", cpDraftBtn: "احفظ المسودة", cpLocalBtn: "سوّ النسخة", cpPickNet: "اختار منصة وحدة على الأقل.", cpDone: "انجدولت النسخة على {t}", cpDoneDraft: "انحفظت النسخة مسودة في Zernio على {t}", cpDoneLocal: "انسوت النسخة كمسودة على {t}", cpPasteHere: "الصق هني", tgAccounts: "انشر على هالحسابات", tgHint: "علّم كل حساب تبي البوست ينزل عليه. نفس الكابشن والإعدادات على كل واحد.", tgLocked: "هالبوست صار في Zernio؛ ما تقدر تغيّر حساباته الحين.", tgOne: "خلّ حساب واحد على الأقل.", tgSaved: "انحفظت الحسابات", vView: "شوفه", ntPickNet: "المنصة", ntConnect: "اربط حساب", ntAllAcc: "كل حسابات {p} ({n})", ntPin: "ثبّته فوق", ntUnpin: "شيل التثبيت", ntFind: "دوّر على حساب…", ntAccount: "الحساب", ntCh7: "7 أيام", ntCh30: "30 يوم", ntCompare: "الحسابات جنب بعض", ntCompareHint: "آخر 30 يوم · اضغط عمود عشان ترتّب، وصف عشان تفتحه", ntGoalPerAcc: "الأهداف لكل حساب: افتح حساب عشان تحط هدفه.", ntBestPick: "أفضل الأوقات لكل حساب: افتح حساب عشان تشوفها.", nsTitle2: "وين ينزل هالبوست", nsWhen: "متى", nsAccount: "الحساب", nsStatusOf: "الحالة", nsMore: "+{n}", nsOpen: "افتحه في {p} ↗", nsNoTime: "ما في وقت للحين", nsLocalNote: "ما انرفع لـZernio للحين: بينزل على هالمنصات لما تنشره بـgo.", nsOpenPost: "افتح البوست", ntSince: "{n} من {d}", ntSinceTip: "Zernio عنده سجل متابعين لهالمنصة بس من هاليوم، فما نقدر نحسب تغيّر 30 يوم للحين.", ibxTz: "الوقت حسب", ibxTzMine: "{c} (وقتي)", ibxTzLocal: "ساعة هالجهاز", ibxTzAud: "وين جمهورك", ibxTzAll: "كل المناطق الزمنية", ntPosts: "البوستات", ntImpr: "الظهور", ntReach: "الوصول", ntEng: "التفاعلات", ntER: "متوسط نسبة التفاعل", ntNewF: "متابعين جدد", ntLast30: "آخر 30 يوم مقارنة بالـ30 اللي قبلها", ntWeek: "{n} هالأسبوع", ntMonth: "{n} خلال 30 يوم", ntGoal: "الهدف", ntSetGoal: "حط هدف", ntNoGoal: "ما في هدف لهالمنصة للحين.", ntBest: "أفضل الأوقات", ntBestNone: "ما في وقت بارز للحين على هالمنصة (ولا وقت أحسن من متوسطك). كل بوست يحسّن هالشي.", ntLift: "{l}% عن متوسطك", ntRhythm: "إيقاع النشر", ntRhythmHint: "بوستات بالأسبوع · آخر 8 أسابيع", ntTop: "أفضل البوستات", ntTopHint: "أكثر تفاعل · آخر 90 يوم", ntOpen: "افتح", ntNoPosts: "ما في بوستات بآخر 90 يوم على هالمنصة.", ntFollowers: "المتابعين", ntConf_high: "ثقة عالية", ntConf_medium: "ثقة متوسطة", ntConf_low: "ثقة قليلة", ntN: "{n} بوستات", "ibxSt_ig-replied": "✓ رديت عليه في Instagram", "ibxSt_ig-mentioned": "✓ منشنته بتعليقك", "ibxSt_ig-dm": "✓ رديت عليه بالخاص", ibxIgTip: "تعاملت معاه من تطبيق Instagram، فانتقل لـ«انتهت» بروحه.", ibxYouWrote: "كتبت", ibxLiked: "♥ عجبك", ibxDraftSent: "انرسلت لـClaude: ردود لـ{n} تعليق", ibxDraftNone: "كل التعليقات اللي تنتظر عندها مسودة.", ibxDraftOf: "مسودة Claude", ibxSendAll: "أرسل كل المسودات ({n})", ibxSendAllTitle: "هالردود بتنتشر للكل:", ibxSendAllGo: "✓ انشر {n} ردود", ibxSendAllDone: "انرسلت {n} ردود", ibxSendAllFail: "ما قدرت أرسل لـ@{a}: {e}", ibxCancel: "إلغاء", ibxDraftUse: "استخدمها", ibxDraftNo: "لا، شكراً", fnTriggered: "علّق بالكلمة", fnGate: "وصلته «تابع أول»", fnPassed: "تابع وضغط", fnSent: "وصلته الهدية", fnClicked: "فتح الرابط", fnNone: "محد استخدمها للحين.", fnPost: "افتح البوست", folFresh: "تحدّث {t}", folFreshTip: "Zernio يحدّث عدد المتابعين تقريباً مرة باليوم، فالمتابع الجديد ممكن ياخذ لين يوم عشان يبين.", ibxUnmark: "رجّعه للانتظار", ibxAddLabel: "+ تصنيف", ibxLabelPh: "تصنيف جديد", ibxNone: "ما في تعليقات تنتظر. حلو.", ibxLikes: "لايك", ibxHiddenTag: "مخفي", nsTitle: "إعدادات المنصات", nsFB: "Facebook", nsFormat: "النوع", nsFeed: "بوست عادي", nsReel: "ريل", nsFbStory: "ستوري", nsFeedHint: "نص، صورة وحدة، لين 10 صور، أو فيديو. بدون خلط صور وفيديو.", nsReelHint: "فيديو واحد عمودي (9:16)، من 3 لين 90 ثانية.", nsFbStoryHint: "صورة أو فيديو واحد، تختفي بعد 24 ساعة. بدون كابشن.", nsReelTitle: "عنوان الريل (اختياري)", nsFirst: "أول تعليق (اختياري)", nsFbDraft: "احفظه كمسودة في أدوات النشر بفيسبوك بدال لا ينشر", nsPage: "صفحة Facebook", nsDefaultPage: "صفحتي الأساسية", nsTT: "TikTok", nsSC: "Snapchat", nsWho: "منو يشوفه", nsComments: "التعليقات", nsDuet: "الدويت", nsStitch: "الستيتش", nsDisclose: "محتوى ترويجي", nsNone: "مو ترويجي", nsOwnBrand: "براندك أنت", nsBranded: "محتوى مدفوع (شراكة)", nsAi: "مسوّى بالذكاء الاصطناعي (علّمه في TikTok)", nsDraft: "أرسله لصندوق TikTok كمسودة؛ وأكمله من التطبيق", nsConsent: "شفت البوست وأوافق أنشره على TikTok", nsConsentHint: "TikTok يطلبها. إذا غيّرت الكابشن أو الملفات، يسأل مرة ثانية.", nsLimit: "TikTok يقول هالحساب ما يقدر ينشر أكثر الحين. جرّب بعدين.", nsLoading: "قاعد نجيب خيارات TikTok مالتك…", nsStory: "ستوري", nsSaved: "ستوري محفوظة", nsSpot: "سبوتلايت", nsStoryHint: "تختفي بعد 24 ساعة. ما تبين الكابشن.", nsSavedHint: "تظل في بروفايلك العام. العنوان لين 45 حرف.", nsSpotHint: "فيد الفيديوهات العام. فيديو بس، والكابشن لين 160 حرف.", nsSkipped: "انتجاهل", nsChange: "غيّر…", nsPriv_PUBLIC_TO_EVERYONE: "الكل", nsPriv_MUTUAL_FOLLOW_FRIENDS: "الأصدقاء", nsPriv_FOLLOWER_OF_CREATOR: "المتابعين", nsPriv_SELF_ONLY: "أنا بس", nsPick: "اختار…", calPrev: "الشهر السابق", calNext: "الشهر الجاي", calToday: "اليوم", calMore: "+{n} ثانية",
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
      tipsLabel: "الشروحات", cbLabel: "وضع عمى الألوان", cCb: "شغّل / طفّ وضع عمى الألوان", guideTitle: "الدليل: كل الميزات", guideHint: "حط الماوس على أي شي عشان تطلع لك نصيحة سريعة.",
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
  // Notes to Claude: Enter sends; Shift+Enter or Ctrl+Enter adds a new line.
  // (Typing with an input method, e.g. while composing, never sends.)
  function enterSends(ta, send) {
    ta.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" || e.isComposing || e.keyCode === 229) return;
      if (e.shiftKey) return;                                    // browser adds the new line
      e.preventDefault();
      if (e.ctrlKey || e.metaKey || e.altKey) {                  // Ctrl/Cmd+Enter: new line too
        const a = ta.selectionStart, b = ta.selectionEnd;
        ta.setRangeText("\n", a, b, "end"); ta.dispatchEvent(new Event("input", { bubbles: true })); return;
      }
      if (ta.value.trim()) send();
    });
    ta.setAttribute("enterkeyhint", "send");
  }
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
      <div><span class="num">${label === "goal" ? Math.round(pct * 100) + "%" : value}</span><span class="of${label === "goal" && (fmt(value) + fmt(max)).length > 8 ? " long" : ""}">${label === "goal" ? esc(fmt(value)) + " / " + esc(fmt(max)) : "/ 100"}</span></div>`;
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
            el("span", { class: "bkind" }, kindChip({ kind: { single: "post", reel: "reel", carousel: "carousel", document: "document", text: "text", archive: "archive" }[f.type] || "post", count: f.count }),
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
  function openGoal(g, cur, pf, acc) {
    showModal("goal", (body) => {
      const inp = el("input", { type: "number", min: String(cur + 1), step: "1", inputmode: "numeric", placeholder: t("goalPh"), value: g || "" });
      const err = el("div", { class: "err", role: "alert" });
      const save = async (n) => {
        n = Math.round(Number(n));
        if (!n || n <= cur) { err.textContent = t("goalBad"); return; }
        try {
          const r = await fetch("/api/goal", { method: "POST", headers: { "Content-Type": "application/json", "X-BPS-Token": TOKEN }, body: JSON.stringify({ followers: n, platform: pf || "", account: acc || "" }) });
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
    renderTargets(p);
    const cap = (p.captions || {})[state.plat] ?? (p.captions || {}).default ?? "";
    $("#captionBox").innerHTML = highlight(cap);
    $("#captionBox").parentNode.querySelectorAll(":scope > .li-pv-main").forEach((x) => x.remove());
    if (state.plat === "linkedin") { const lx = liExtraPreview(p); if (lx) $("#captionBox").after(lx); }
    const pvh = $("#captionBox").closest(".card").querySelector("header"), abb = pvh.querySelector(".ab-open");
    if (abEligible(p) && !abb) pvh.insertBefore(el("button", { class: "btn sm ab-open", type: "button", onclick: () => openAbTest() }, "🅰🅱 " + t("abOpen")), $("#imgPreview"));
    else if (!abEligible(p) && abb) abb.remove();

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
    if (hasNetSettings(p) || Object.keys(p.skipped_reasons || {}).length) {
      const tt = (p.settings || {}).tiktok || {}, sc = (p.settings || {}).snapchat || {};
      const bits = [];
      if (plats.includes("tiktok")) bits.push("TikTok: " + (tt.privacyLevel ? t("nsPriv_" + tt.privacyLevel) : t("nsPick")));
      if (plats.includes("snapchat")) bits.push("Snapchat: " + t({ story: "nsStory", saved_story: "nsSaved", spotlight: "nsSpot" }[sc.contentType || "story"]));
      if (plats.includes("linkedin")) { const lk = ((p.settings || {}).linkedin || {}).kind || "post"; bits.push("LinkedIn: " + t({ post: "liPost", poll: "liPoll", repost: "liRepost" }[lk])); }
      if (plats.includes("facebook")) { const ff = (p.settings || {}).facebook || {}; bits.push("Facebook: " + t({ feed: "nsFeed", reel: "nsReel", story: "nsFbStory" }[ff.format || (p.type === "reel" ? "reel" : "feed")]) + (ff.draft ? " · draft" : "")); }
      Object.values(p.skipped_reasons || {}).forEach((r) => bits.push(t("nsSkipped") + ": " + r));
      row("nsTitle", el("span", {}, bits.join(" · ") + " ", editableNow() ? el("button", { class: "btn sm ns-open", type: "button", onclick: openNetSettings }, t("nsChange")) : null));
    }

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
    const W = Math.max(320, Math.round(host.clientWidth) || 640), H = 200, P = 30;
    const vs = series.map((d) => d.value), min = Math.min(...vs), max = Math.max(...vs), span = max - min || 1;
    const PR = 14 + 7.5 * Math.max(...[min, min + span / 2, max].map((v) => fmt(Math.round(v)).length));   // room for the y labels
    const x = (i) => P + (i * (W - P - PR)) / (series.length - 1);
    const y = (v) => H - P - ((v - min) * (H - P * 2)) / span;
    const pts = series.map((d, i) => `${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
    const area = `${x(0)},${H - P} ${pts} ${x(series.length - 1)},${H - P}`;
    const ticks = [min, min + span / 2, max].map((v) => `<line class="grid" x1="${P}" x2="${W - PR}" y1="${y(v)}" y2="${y(v)}"/><text x="${W - PR + 6}" y="${y(v) + 3}">${esc(fmt(Math.round(v)))}</text>`).join("");
    const lastI = series.length - 1;
    host.innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="followers over time">
      ${ticks}<polygon class="area" points="${area}"/><polyline class="line" points="${pts}"/>
      <rect x="${x(lastI) - 4}" y="${y(series[lastI].value) - 4}" width="8" height="8" fill="var(--bps-lime)"/>
      <text x="${P}" y="${H - 8}">${esc(series[0].date)}</text><text x="${W - PR}" y="${H - 8}" text-anchor="end">${esc(series[lastI].date)}</text></svg>`;
    $("#folRange").textContent = t("daysN").replace("{n}", fmt(series.length));
    folFresh();
  }

  function delta(cur, prev) {
    if (cur == null || prev == null || prev === 0) return null;
    return Math.round(((cur - prev) / prev) * 100);
  }

  state.net = (() => { try { return localStorage.getItem("bps.net") || "all"; } catch (e) { return "all"; } })();
  // Growth → network → account. Tabs list networks (with how many accounts), so 20 accounts
  // never crowd the bar; inside a network, pick "All accounts" or one account.
  state.netAcc = (() => { try { return JSON.parse(localStorage.getItem("bps.netAcc") || "{}"); } catch (e) { return {}; } })();
  state.netPins = (() => { try { return JSON.parse(localStorage.getItem("bps.netPins") || "[]"); } catch (e) { return []; } })();
  state.netQ = ""; state.netSort = { key: "followers", dir: -1 };
  const saveNet = () => { try { localStorage.setItem("bps.net", state.net); localStorage.setItem("bps.netAcc", JSON.stringify(state.netAcc)); localStorage.setItem("bps.netPins", JSON.stringify(state.netPins)); } catch (e) {} };
  const netGroups = () => {
    const g = {};
    ((state.z && state.z.networks) || []).forEach((n) => (g[n.platform] ||= []).push(n));
    Object.values(g).forEach((l) => l.sort((a, b) => (state.netPins.includes(b.accountId) - state.netPins.includes(a.accountId)) || ((b.followers || 0) - (a.followers || 0))));
    return g;
  };
  // Growth tabs: one per network that has accounts in Zernio ("LinkedIn · 3"). A network with
  // several accounts opens a dropdown of them (All accounts + each one, with pins and search);
  // one account opens straight away. "+ Connect" adds another network or account through Zernio.
  state.netMenu = null;
  function renderNetTabs() {
    const host = $("#netTabs"); if (!host) return;
    const groups = netGroups(), pfs = Object.keys(groups);
    host.innerHTML = "";
    if (!pfs.length) { host.hidden = true; return; }
    host.hidden = false;
    if (state.net !== "all" && !groups[state.net]) state.net = "all";
    const bar = el("div", { class: "net-tabrow", role: "tablist" });
    bar.append(el("button", { class: "net-tab" + (state.net === "all" ? " on" : ""), type: "button", role: "tab", "aria-selected": String(state.net === "all"),
      onclick: () => { state.net = "all"; state.netMenu = null; saveNet(); renderGrowth(); } }, t("ntAll")));
    pfs.forEach((pf) => {
      const list = groups[pf], many = list.length > 1, on = state.net === pf;
      const cur = state.netAcc[pf] || "all", curN = list.find((n) => n.accountId === cur);
      const lbl = (NET_NAME[pf] || pf) + (many ? (on && curN ? " · " + handle(curN.username || curN.name || "?") : " · " + list.length) : list[0].username ? " · " + handle(list[0].username) : "");
      const wrap = el("div", { class: "net-tabwrap" });
      wrap.append(el("button", { class: "net-tab" + (on ? " on" : ""), type: "button", role: "tab", "aria-selected": String(on), "aria-haspopup": many ? "listbox" : null, "aria-expanded": many ? String(state.netMenu === pf) : null,
        onclick: () => { if (!many) { state.net = pf; state.netMenu = null; saveNet(); renderGrowth(); return; } state.netMenu = state.netMenu === pf ? null : pf; renderNetTabs(); } },
        lbl, many ? el("span", { class: "net-caret", "aria-hidden": "true" }, "▾") : null));
      if (many && state.netMenu === pf) wrap.append(netMenu(pf, list));
      bar.append(wrap);
    });
    bar.append(el("button", { class: "net-tab net-add", type: "button", onclick: () => openConnectChooser() }, "+ " + t("ntConnect")));
    host.append(bar);
  }
  function netMenu(pf, list) {
    const cur = state.net === pf ? (state.netAcc[pf] || "all") : null;
    const pick = (id) => { state.net = pf; state.netAcc[pf] = id; state.netMenu = null; state.netQ = ""; saveNet(); renderGrowth(); };
    const menu = el("div", { class: "net-menu", role: "listbox" });
    const q = state.netQ.trim().toLowerCase();
    if (list.length > 8) {
      const inp = el("input", { type: "search", class: "acc-search", placeholder: t("ntFind"), value: state.netQ, "aria-label": t("ntFind") });
      inp.addEventListener("input", () => { state.netQ = inp.value; renderNetTabs(); const x = $("#netTabs .acc-search"); if (x) { x.focus(); x.setSelectionRange(x.value.length, x.value.length); } });
      menu.append(inp);
    }
    const row = (id, label, n) => {
      const pinned = n && state.netPins.includes(n.accountId);
      return el("div", { class: "net-opt" + (cur === id ? " on" : ""), role: "option", "aria-selected": String(cur === id) },
        el("button", { class: "net-opt-main", type: "button", onclick: () => pick(id) },
          n ? (n.picture ? el("img", { src: n.picture, alt: "", referrerpolicy: "no-referrer", loading: "lazy" }) : el("span", { class: "net-opt-ph" }, (n.username || "?")[0].toUpperCase())) : el("span", { class: "net-opt-ph all" }, "∑"),
          el("span", { class: "net-opt-txt" }, el("b", {}, label), n && n.followers != null ? el("small", {}, fmt(n.followers) + " " + t("followers")) : null)),
        n ? el("button", { class: "acc-pin" + (pinned ? " on" : ""), type: "button", "aria-label": t(pinned ? "ntUnpin" : "ntPin"), title: t(pinned ? "ntUnpin" : "ntPin"),
          onclick: () => { state.netPins = pinned ? state.netPins.filter((x) => x !== n.accountId) : [...state.netPins, n.accountId]; saveNet(); renderNetTabs(); } }, pinned ? "★" : "☆") : null);
    };
    menu.append(row("all", t("ntAllAcc").replace("{n}", list.length).replace("{p}", NET_NAME[pf] || pf)));
    list.filter((n) => !q || (n.username || "").toLowerCase().includes(q) || (n.name || "").toLowerCase().includes(q))
      .forEach((n) => menu.append(row(n.accountId, handle(n.username || n.name || "?"), n)));
    return menu;
  }
  document.addEventListener("click", (e) => { if (state.netMenu && !e.target.closest(".net-tabwrap")) { state.netMenu = null; renderNetTabs(); } });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && state.netMenu) { state.netMenu = null; renderNetTabs(); } });
  // the network dashboard for one account, or all accounts of a network added up
  function netView() {
    const list = netGroups()[state.net];
    if (!list) return null;
    const cur = state.netAcc[state.net] || "all";
    if (list.length === 1) return list[0];
    if (cur !== "all") { const one = list.find((n) => n.accountId === cur); if (one) return one; }
    const sum = (f) => { const v = list.map(f).filter((x) => x != null); return v.length ? v.reduce((a, b) => a + b, 0) : null; };
    const kp = (src) => { const o = {}; ["posts", "impressions", "reach", "views", "engagements", "comments", "shares", "saves", "followers"].forEach((k) => o[k] = sum((n) => (n[src] || {})[k]));
      const ers = list.map((n) => (n[src] || {}).er).filter((x) => x != null); o.er = ers.length ? Math.round(ers.reduce((a, b) => a + b, 0) / ers.length * 100) / 100 : null; return o; };
    const days = {}; list.forEach((n) => (n.series || []).forEach((r) => { days[r.date] = (days[r.date] || 0) + r.value; }));
    const full = Object.keys(days).sort().filter((d) => list.every((n) => (n.series || []).some((r) => r.date <= d)));
    const weeks = (list[0].weeks || []).map((w, i) => ({ from: w.from, posts: sum((n) => (n.weeks[i] || {}).posts), engagements: sum((n) => (n.weeks[i] || {}).engagements) }));
    return { platform: state.net, aggregate: true, accounts: list, name: t("ntAllAcc").replace("{n}", list.length).replace("{p}", NET_NAME[state.net] || state.net),
      followers: sum((n) => n.followers), change7: sum((n) => n.change7), change30: sum((n) => n.change30),
      series: full.map((d) => ({ date: d, value: days[d] })), kpis: kp("kpis"), kpisPrev: kp("kpisPrev"), weeks,
      top: list.flatMap((n) => (n.top || []).map((p) => ({ ...p, account: p.account || n.username }))).sort((a, b) =>
        ["likes", "comments", "shares", "saves"].reduce((s2, x) => s2 + (b.metrics[x] || 0), 0) - ["likes", "comments", "shares", "saves"].reduce((s2, x) => s2 + (a.metrics[x] || 0), 0)).slice(0, 5),
      bestTime: { basis: "pick" } };
  }
  // all accounts of a network side by side; click a row to open that account
  function accTable(list) {
    const S = state.netSort;
    const cols = [["account", "ntAccount"], ["followers", "ntFollowers"], ["change7", "ntCh7"], ["change30", "ntCh30"], ["posts", "ntPosts"], ["er", "ntER"], ["engagements", "ntEng"]];
    const val = (n, k) => k === "account" ? (n.username || "") : k === "posts" ? (n.kpis || {}).posts : k === "er" ? (n.kpis || {}).er : k === "engagements" ? (n.kpis || {}).engagements : n[k];
    const rows = list.slice().sort((a, b) => { const x = val(a, S.key), y = val(b, S.key); return (x == null) - (y == null) || (typeof x === "string" ? x.localeCompare(y) : (x - y)) * S.dir; });
    const sign = (v) => v == null ? "–" : (v > 0 ? "+" : "") + fmt(v);
    const tb = el("table", { class: "t acc-table" }, el("thead", {}, el("tr", {}, cols.map(([k, lbl], i) => el("th", { style: i ? "text-align:end" : "" },
      el("button", { class: "th-sort" + (S.key === k ? " on" : ""), type: "button", onclick: () => { state.netSort = { key: k, dir: S.key === k ? -S.dir : (k === "account" ? 1 : -1) }; renderGrowth(); } },
        t(lbl) + (S.key === k ? (S.dir > 0 ? " ↑" : " ↓") : "")))))));
    const body = el("tbody");
    rows.forEach((n) => { const go_ = () => { state.netAcc[state.net] = n.accountId; saveNet(); renderGrowth(); };
      const tr = el("tr", { class: "ntacc-row" },
      el("td", {}, el("button", { class: "acc-cell", type: "button", onclick: (e) => { e.stopPropagation(); go_(); } }, n.picture ? el("img", { src: n.picture, alt: "", referrerpolicy: "no-referrer", loading: "lazy" }) : null,
        el("b", {}, handle(n.username || n.name || "?")), state.netPins.includes(n.accountId) ? el("span", { class: "acc-star" }, "★") : null)),
      el("td", { class: "n" }, n.followers != null ? fmt(n.followers) : "–"), el("td", { class: "n" }, sign(n.change7)), el("td", { class: "n" }, sign(n.change30)),
      el("td", { class: "n" }, fmt((n.kpis || {}).posts)), el("td", { class: "n" }, (n.kpis || {}).er != null ? n.kpis.er + "%" : "–"), el("td", { class: "n" }, fmt((n.kpis || {}).engagements)));
      tr.addEventListener("click", go_);
      body.append(tr); });
    tb.append(body);
    return el("div", { class: "card" }, el("header", {}, el("h2", {}, t("ntCompare")), el("span", { class: "label" }, t("ntCompareHint"))), el("div", { class: "hscroll" }, tb));
  }
  const handle = (u) => /\s/.test(u) ? u : "@" + u;      // LinkedIn gives a name, not a handle
  function renderNetDash(n) {
    const host = $("#netDash"); host.innerHTML = "";
    const k = n.kpis || {}, kp = n.kpisPrev || {};
    const sign = (v) => v == null ? "–" : (v > 0 ? "+" : "") + fmt(v);
    // header
    host.append(el("div", { class: "card net-head" },
      n.picture ? el("img", { src: n.picture, alt: "", referrerpolicy: "no-referrer", loading: "lazy" }) : null,
      el("div", {}, el("div", { class: "label" }, NET_NAME[n.platform] || n.platform), el("h2", {}, [n.name, n.username && n.username !== n.name ? handle(n.username) : null].filter(Boolean).join(" "))),
      el("div", { class: "net-big" }, el("b", {}, n.followers != null ? fmt(n.followers) : "–"), el("span", { class: "label" }, t("ntFollowers"))),
      el("div", { class: "net-chips" },
        el("span", { class: "chip" + ((n.change7 || 0) > 0 ? " ok" : "") }, t("ntWeek").replace("{n}", sign(n.change7))),
        n.change30 != null ? el("span", { class: "chip" + (n.change30 > 0 ? " ok" : "") }, t("ntMonth").replace("{n}", sign(n.change30)))
          : n.changeSince != null ? el("span", { class: "chip" + (n.changeSince > 0 ? " ok" : ""), title: t("ntSinceTip") }, t("ntSince").replace("{n}", sign(n.changeSince)).replace("{d}", dt(n.since, { hour: undefined, minute: undefined, weekday: undefined }))) : null,
        n.followersUpdated ? el("span", { class: "label fol-fresh" }, t("folFresh").replace("{t}", ago(Date.parse(n.followersUpdated) / 1000))) : null)));
    if (n.aggregate) host.append(accTable(n.accounts));
    // KPIs: last 30 days vs the 30 before
    const tiles = [["ntPosts", "posts"], ["ntImpr", "impressions"], ["ntReach", "reach"], ["ntEng", "engagements"], ["ntER", "er"], ["ntNewF", "followers"]];
    const kg = el("div", { class: "grid g3 net-kpis" });
    tiles.forEach(([lbl, key]) => {
      const v = k[key], d = delta(v, kp[key]);
      kg.append(el("div", { class: "card kpi" }, el("div", { class: "label" }, t(lbl)),
        el("div", { class: "v" }, v == null ? "–" : key === "er" ? v + "%" : fmt(v)),
        el("div", { class: "d " + (d == null ? "" : d >= 0 ? "up" : "down") }, d == null ? " " : (d >= 0 ? "+" : "") + d + "%")));
    });
    host.append(el("p", { class: "label net-note" }, t("ntLast30")), kg);
    // followers + goal
    const chart = el("div", { class: "net-chart" }), ringHost = el("div", { class: "ring" });
    const goalBox = el("div", { class: "goal-info" });
    host.append(el("div", { class: "grid g-main" },
      el("div", { class: "card" }, el("header", {}, el("h2", {}, t("ntFollowers"))), chart),
      el("div", { class: "card net-goal" }, el("header", {}, el("h2", {}, t("ntGoal"))), ringHost, goalBox)));
    lineChart(chart, n.series);
    if (n.goal && n.followers != null) {
      ring(ringHost, n.followers, n.goal, "goal");
      goalBox.append(el("p", { class: "goal-now" + (n.followers >= n.goal ? " done" : "") }, n.followers >= n.goal ? t("goalReached")
        : t("goalNow").replace("{c}", fmt(n.followers)).replace("{r}", fmt(Math.max(0, n.goal - n.followers)))));
    } else { ringHost.innerHTML = ""; goalBox.append(el("p", { class: "hint" }, t(n.aggregate ? "ntGoalPerAcc" : "ntNoGoal"))); }
    if (n.followers != null && !n.aggregate) goalBox.append(el("button", { class: "btn", type: "button", onclick: () => openGoal(n.goal, n.followers, n.platform, n.accountId) }, n.goal ? t("goalEdit") : t("ntSetGoal")));
    // best times + rhythm
    const bt = n.bestTime || {}, bbox = el("div", { class: "net-best" });
    const good = (bt.slots || []).filter((sl) => sl.lift == null || sl.lift > 0);     // only times that beat your average
    if (bt.basis === "data" && good.length) good.forEach((sl, i) => bbox.append(el("div", { class: "net-slot" },
      el("b", { class: "mono" }, (i + 1) + " · " + t("days")[sl.day] + " " + hourLabel(sl.hour)),
      el("span", { class: "label" }, [sl.lift != null ? t("ntLift").replace("{l}", (sl.lift > 0 ? "+" : "") + sl.lift) : null, t("ntN").replace("{n}", sl.posts), t("ntConf_" + sl.confidence)].filter(Boolean).join(" · ")))));
    else bbox.append(el("p", { class: "hint" }, t(bt.basis === "pick" ? "ntBestPick" : "ntBestNone")));
    const wk = n.weeks || [], mx = Math.max(1, ...wk.map((w) => w.posts));
    const bars = el("div", { class: "net-bars" }, wk.map((w) => el("div", { class: "net-bar", title: `${w.from} · ${t("ntN").replace("{n}", w.posts)} · ${fmt(w.engagements)} ${t("ntEng").toLowerCase()}` },
      el("i", { style: `height:${Math.round(w.posts * 100 / mx)}%` }), el("small", {}, String(w.posts)))));
    host.append(el("div", { class: "grid g2" },
      el("div", { class: "card" }, el("header", {}, el("h2", {}, t("ntBest"))), bbox),
      el("div", { class: "card" }, el("header", {}, el("h2", {}, t("ntRhythm")), el("span", { class: "label" }, t("ntRhythmHint"))), bars)));
    // top posts
    const tp = el("div", {});
    if (!(n.top || []).length) tp.append(el("p", { class: "empty" }, t("ntNoPosts")));
    else {
      const tb = el("table", { class: "t" }, el("thead", {}, el("tr", {}, ["post", "ntImpr", "ntReach", "ntEng", "ntER"].map((h, i) => el("th", { style: i ? "text-align:end" : "" }, t(h))))));
      const body = el("tbody");
      n.top.forEach((p) => body.append(el("tr", {},
        el("td", {}, el("div", { class: "cap", style: "unicode-bidi:plaintext" }, (p.caption || "").split("\n")[0] || "—"),
          el("div", { class: "label tp-meta" }, (n.aggregate && p.account ? handle(p.account) + " · " : "") + (p.publishedAt || "").slice(0, 10), p.url ? el("a", { href: p.url, target: "_blank", rel: "noopener" }, " · " + t("ntOpen") + " ↗") : null, viewBtn(rowFor(p.url)))),
        el("td", { class: "n" }, fmt(p.metrics.impressions)), el("td", { class: "n" }, fmt(p.metrics.reach)),
        el("td", { class: "n" }, fmt(["likes", "comments", "shares", "saves"].reduce((a, x) => a + (p.metrics[x] || 0), 0))),
        el("td", { class: "n" }, p.metrics.engagementRate != null ? p.metrics.engagementRate + "%" : "–"))));
      tb.append(body); tp.append(el("div", { class: "hscroll" }, tb));
    }
    host.append(el("div", { class: "card" }, el("header", {}, el("h2", {}, t("ntTop")), el("span", { class: "label" }, t("ntTopHint"))), tp));
  }

  // Heatmap shade by rank, not by raw value: one viral hour must not wash every other hour out to the faintest step.
  function heatLevels(grid) {
    const vals = (grid || []).flat().filter((v) => v > 0).sort((a, b) => a - b);
    return (v) => {
      if (!(v > 0) || !vals.length) return 0;
      if (vals.length === 1) return 5;
      let lo = 0; while (lo < vals.length - 1 && vals[lo] < v) lo++;   // first index of this value
      return Math.min(5, 1 + Math.floor((lo / (vals.length - 1)) * 4.999));   // 5 clear steps
    };
  }

  // The Plan tab's heatmap: drawn on its own, so a network picked in Growth can't leave it empty.
  function renderHeat() {
    const z = state.z || {};
    const bt = z.besttime || {};
    const heat = $("#heat"); heat.innerHTML = "";
    $("#heatTz").textContent = (bt.tz || "") + (bt.sample ? ` · n=${bt.sample}` : "");
    if (bt.grid) {
      const flat = bt.grid.flat().filter((v) => v > 0), mx = Math.max(...flat, 0) || 1;
      const top = (bt.slots || []).slice(0, 3);
      const rank = new Map(top.map((s, i) => [s.day + ":" + s.hour, i + 1]));
      const level = heatLevels(bt.grid);   // 5 steps by rank
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
  }

  function renderGrowth() {
    const z = state.z;
    renderHeat();
    renderNetTabs();
    renderAbCard();
    const net = state.net !== "all" && netView();
    $("#netDash").hidden = !net; $("#growthAll").hidden = !!net;
    if (net) { renderNetDash(net); return; }
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
    const tph = tp.closest(".card").querySelector("header");
    if (tph && !tph.querySelector(".rc-open")) tph.append(el("button", { class: "btn sm rc-open", type: "button", onclick: () => openRecycle() }, "♻ " + t("rcOpen")));
    const posts = (z.posts || []).slice().sort((a, b) => (b.metrics.follows || 0) - (a.metrics.follows || 0) || ((b.metrics.saves || 0) + (b.metrics.shares || 0)) - ((a.metrics.saves || 0) + (a.metrics.shares || 0))).slice(0, 8);
    if (!posts.length) tp.innerHTML = `<p class="empty">${esc(t("noData"))}</p>`;
    else {
      const tb = el("table", { class: "t" }, el("thead", {}, el("tr", {}, ["post", "reach", "saves", "shares", "follows"].map((h, i) => el("th", { style: i ? "text-align:end" : "" }, t(h))))));
      const body = el("tbody");
      posts.forEach((p) => body.append(el("tr", {},
        el("td", {}, el("div", { class: "cap" }, (p.caption || "").split("\n")[0]), el("div", { class: "label tp-meta" }, `${p.platform} · ${(p.publishedAt || "").slice(0, 10)}`, viewBtn(rowFor(p.url)),
          p.zid && p.platform !== "tiktok" ? el("button", { class: "btn sm rc-row", type: "button", title: t("rcBtn"), onclick: () => openRecycle(p.zid) }, "♻ " + t("rcBtn")) : null)),
        el("td", { class: "n" }, fmt(p.metrics.reach)), el("td", { class: "n" }, fmt(p.metrics.saves)),
        el("td", { class: "n" }, fmt(p.metrics.shares)), el("td", { class: "n" }, fmt(p.metrics.follows)))));
      tb.append(body); tp.append(el("div", { class: "hscroll" }, tb));
    }


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
  // every dated post, as the Posts tab shows it; movable = can still change time
  const ZEDIT = ["scheduled", "draft", "failed", "partial", "cancelled"];
  function calEvents() {
    const z = state.z || {};
    const byUrl = Object.fromEntries((z.posts || []).filter((p) => p.url).map((p) => [p.url, p]));
    const out = [];
    postRows().forEach((r) => {
      const pubAt = (r.platforms || []).map((p) => p.publishedAt).filter(Boolean)[0];
      const when = r.status === "published" || r.status === "partial" ? (pubAt || r.scheduledFor) : (r.scheduledFor || pubAt);
      if (!when) return;
      const a = (r.platforms || []).map((p) => byUrl[p.url]).find(Boolean);
      const kind = ["published", "partial"].includes(r.status) ? "pub" : "sched";
      const future = Date.parse(when) > Date.now();
      const movable = future && (r.local ? !!r.planId : ZEDIT.includes(r.status) && !r.outside);
      out.push({ ...r, kind, at: when, scheduledFor: when, id: a ? a.id : r.id, metrics: a ? a.metrics : null, row: r, movable });
    });
    return out.sort((p, q) => Date.parse(p.at) - Date.parse(q.at));
  }
  state.calView = (() => { try { return localStorage.getItem("bps.calView") || "month"; } catch (e) { return "month"; } })();
  state.calDay = new Date(); state.calDay.setHours(0, 0, 0, 0);
  function renderCalViews() {
    const host = $("#calViews"); if (!host) return;
    host.innerHTML = "";
    [["month", t("cvMonth")], ["week", t("cvWeek")], ["day", t("cvDay")]].forEach(([v, lbl]) => host.append(el("button", { class: "btn" + (state.calView === v ? " on" : ""), type: "button", "aria-pressed": String(state.calView === v),
      onclick: () => { state.calView = v; try { localStorage.setItem("bps.calView", v); } catch (e) {} renderCalendar(); } }, lbl)));
  }
  function renderCalendar() {
    renderCalViews();
    if (state.calView !== "month") return renderTimeGrid();
    const m = state.calMonth, y = m.getFullYear(), mo = m.getMonth();
    $("#calTitle").textContent = m.toLocaleDateString(loc(), { month: "long", year: "numeric" });
    // same rows as the Posts tab, so both always agree; days in local time
    const events = {};
    calEvents().forEach((e) => (events[localDay(new Date(e.at))] ||= []).push(e));
    const cal = el("div", { class: "cal" });
    t("days").forEach((d) => cal.append(el("div", { class: "hd" }, state.lang === "ar" ? d : d.slice(0, 3))));
    const first = new Date(y, mo, 1).getDay(), days = new Date(y, mo + 1, 0).getDate();
    const today = localDay();
    for (let i = 0; i < first; i++) cal.append(el("div", { class: "d" }));
    for (let d = 1; d <= days; d++) {
      const key = `${y}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const past = key < today;
      const cell = el("div", { class: "d click" + (key === today ? " today" : "") + (past ? " past" : "") + (state.clip && !past ? " can-paste" : ""), role: "button", tabindex: "0", title: t("dayHint"), "data-day": key }, el("div", { class: "n" }, d));
      const openIt = (e) => { if (e) e.preventDefault(); openDay(key, events[key] || []); };
      cell.addEventListener("click", () => openIt());
      cell.addEventListener("dblclick", (e) => { e.preventDefault(); if (!past && !(events[key] || []).length) quickSchedule(key); else openIt(); });
      cell.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") openIt(e); });
      // drop a post here: same time of day, this day
      cell.addEventListener("dragover", (e) => { if (state.dragEv && !past) { e.preventDefault(); cell.classList.add("drop"); } });
      cell.addEventListener("dragleave", () => cell.classList.remove("drop"));
      cell.addEventListener("drop", (e) => {
        e.preventDefault(); cell.classList.remove("drop");
        const ev = state.dragEv; state.dragEv = null; if (!ev) return;
        const old = new Date(ev.at), to = new Date(key + "T00:00:00"); to.setHours(old.getHours(), old.getMinutes());
        if (localDay(old) !== key) confirmMove(ev, to);
      });
      const evs = events[key] || [];
      evs.slice(0, 3).forEach((e) => {
        const st = ZST[e.status] || ZST.draft;
        const net = (e.platforms || [])[0];
        const evEl = el("div", { class: "ev " + st.cls.replace("st-", "ev-") + (e.movable ? " movable" : ""), draggable: e.movable ? "true" : null,
          title: t(st.key) + " · " + (e.caption || "").split("\n")[0] },
          el("i", { class: "evdot", "aria-hidden": "true" }),
          netStack(e.row || e),
          el("span", { class: "evcap" }, (e.caption || "").split("\n")[0] || "—"), evCopyBtn(e));
        evEl._ev = e;
        if (e.movable) {
          evEl.addEventListener("dragstart", (x) => { state.dragEv = e; x.dataTransfer.effectAllowed = "move"; x.dataTransfer.setData("text/plain", e.id); x.stopPropagation(); });
          evEl.addEventListener("dragend", () => { state.dragEv = null; });
        }
        evEl.addEventListener("click", (x) => { x.stopPropagation(); openPostDetail(e.row); });
        cell.append(evEl);
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
    renderComments({ auto: true });
    const a = $("#automations"); a.innerHTML = "";
    const au = z.automations || [];
    if (!au.length) a.innerHTML = `<p class="empty">${esc(t("noData"))}</p>`;
    au.forEach((x) => {
      const po = (z.commentPosts || {})[x.postId] || {};
      const zp = (z.zposts || []).find((r) => r.id === x.zPostId) || {};
      const link = po.permalink || ((zp.platforms || []).find((p) => p.url) || {}).url;
      const cap = ((po.caption || zp.caption || "").split("\n")[0] || "").slice(0, 60);
      a.append(el("div", { class: "idea fn-card", style: "margin-bottom:8px" },
        el("h3", {}, `“${x.keyword || (x.keywords || []).join(", ")}”`),
        el("p", {}, `${x.active === false ? t("off") : t("on")}${x.followGate ? " · " + t("followGated") : ""}`),
        cap || link ? el("div", { class: "fn-post" }, cap ? el("span", { class: "fn-cap", dir: "auto" }, cap) : null,
          link ? el("a", { href: link, target: "_blank", rel: "noopener" }, t("fnPost") + " ↗") : null) : null,
        funnel(x)));
    });
    const ib = (z.iceBreakers || []);
    if (ib.length) {
      a.append(el("div", { class: "label", style: "margin:14px 0 6px" }, t("iceBreakers")));
      ib.forEach((q) => a.append(el("div", { class: "pill", style: "display:inline-block;margin:0 6px 6px 0;unicode-bidi:plaintext" }, q.question || q)));
    }
  }

  // A gift automation's funnel from Zernio's own counters: who commented the
  // keyword, got the follow-first message, followed and tapped, got the gift,
  // opened the link. Each bar is a share of the first step.
  function funnel(x) {
    const s = x.stats || {};
    const steps = [["fnTriggered", s.triggered], ...(x.followGate ? [["fnGate", s.followGateSent], ["fnPassed", s.followGatePassed]] : []),
      ["fnSent", s.dmsSent], ["fnClicked", s.uniqueClicks]].filter(([, v]) => v != null);
    const top = Number(s.triggered) || 0;
    if (!top) return el("p", { class: "label fn-none" }, t("fnNone"));
    return el("div", { class: "fn" }, steps.map(([k, v]) => {
      const pct = Math.max(0, Math.min(100, Math.round((Number(v) || 0) * 100 / top)));
      return el("div", { class: "fn-row" }, el("span", { class: "fn-l" }, t(k)),
        el("span", { class: "fn-bar" }, el("i", { style: `width:${pct}%` })),
        el("b", { class: "fn-n" }, fmt(Number(v) || 0)), el("small", { class: "fn-p" }, pct + "%"));
    }));
  }

  /* ---------- Inbox: every comment with its post and gift; reply, gift, hide, delete, labels ---------- */
  state.ibx = { filter: "waiting", label: null, open: null, draft: {}, asButton: {}, confirm: null };
  const inboxApi = (body) => post("/api/inbox", body);
  // Comment times on the clock of the country the user picks (default: their own timezone)
  const ibxTz = () => { let v = null; try { v = localStorage.getItem("bps.ibxTz"); } catch (e) {} return v || bTz(); };
  const regionName = (c) => { try { return new Intl.DisplayNames([loc() || "en"], { type: "region" }).of(c); } catch (e) { return c; } };
  function ibxTime(iso, full) {
    const tz = ibxTz(), o = full ? { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", hour12: state.h12, timeZoneName: "short" }
      : { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: state.h12 };
    if (tz !== "local") o.timeZone = tz;
    try { return new Date(iso).toLocaleString(loc(), o); } catch (e) { return iso; }
  }
  function ibxTzPicker() {
    const zones = ((state.z || {}).audience || {}).zones || [], mine = bTz(), cur = ibxTz();
    const zoneLabel = (z) => z.countries.slice(0, 2).map(regionName).join(state.lang === "ar" ? "، " : ", ") + (z.countries.length > 2 ? " +" + (z.countries.length - 2) : "") + (z.share ? ` · ${z.share < 0.005 ? "<1" : Math.round(z.share * 100)}%` : "");
    const myZone = zones.find((z) => z.tz === mine);
    const sel = el("select", { class: "ibx-tz", "aria-label": t("ibxTz") });
    const add = (host, v, lbl) => { const o = el("option", { value: v }, lbl); if (v === cur) o.selected = true; host.append(o); };
    add(sel, mine, t("ibxTzMine").replace("{c}", myZone ? regionName(myZone.countries[0]) : mine.split("/").pop().replace(/_/g, " ")));
    const aud = zones.filter((z) => z.tz !== mine);
    if (aud.length) { const g = el("optgroup", { label: t("ibxTzAud") }); aud.forEach((z) => add(g, z.tz, zoneLabel(z))); sel.append(g); }
    add(sel, "local", t("ibxTzLocal"));
    let all = []; try { all = Intl.supportedValuesOf("timeZone"); } catch (e) {}
    if (all.length) { const g = el("optgroup", { label: t("ibxTzAll") }); all.filter((z) => z !== mine && !aud.some((a) => a.tz === z)).forEach((z) => add(g, z, z.replace(/_/g, " "))); sel.append(g); }
    if (![...sel.options].some((o) => o.selected)) add(sel, cur, cur);
    sel.addEventListener("change", () => { try { localStorage.setItem("bps.ibxTz", sel.value); } catch (e) {} renderComments(); });
    return el("label", { class: "ibx-tzwrap" }, el("span", { class: "label" }, "🕒 " + t("ibxTz")), sel);
  }
  function renderComments(opts) {
    const z = state.z || {}, c = $("#comments"); if (!c) return;
    // A background refresh (every few seconds while Claude works) must not
    // rebuild the cards while a reply/gift box or a Confirm button is open:
    // that swallowed clicks and typing. User clicks always redraw.
    if (opts && opts.auto && (state.ibx.open || state.ibx.confirm || (document.activeElement && document.activeElement.classList.contains("ibx-tz")))) { state.ibx.stale = true; return; }
    state.ibx.stale = false;
    const S = state.ibx, ib = (state.data && state.data.inbox) || { labels: {}, catalog: [], handled: {} };
    const all = z.comments || [];
    const auto = z.autoLog || {};
    const handled = (x) => ib.handled[x.id] || (auto[x.id] && auto[x.id].how !== "auto-failed" ? auto[x.id] : null);
    const waiting = all.filter((x) => !handled(x));
    $("#cmtCount").textContent = waiting.length ? String(waiting.length) : "";
    c.innerHTML = "";
    if (!z.ok && !all.length) { c.append(el("p", { class: "empty" }, t("zernioOff"))); return; }
    const used = [...new Set(Object.values(ib.labels).flat())];
    const drafts = ib.drafts || {};
    const needDraft = waiting.filter((x) => !drafts[x.id] && (x.can || {}).reply !== false);
    const withDraft = waiting.filter((x) => drafts[x.id] && (x.can || {}).reply !== false);
    c.append(el("div", { class: "ibx-bar" },
      waiting.length ? el("button", { class: "btn sm ibx-draftall", type: "button", onclick: async (e) => {
        if (!needDraft.length) { toast(t("ibxDraftNone")); return; }
        e.target.disabled = true;
        const posts = z.commentPosts || {};
        try {
          const r = await inboxApi({ op: "ask_drafts", items: needDraft.map((x) => ({ id: x.id, author: x.author, text: x.text, postId: x.postId, platform: x.platform,
            post: ((posts[x.postId] || {}).caption || "").split("\n")[0] })) });
          toast(t("ibxDraftSent").replace("{n}", r.count)); lastSig = ""; load(false);
        } catch (er) { toast(er.message); e.target.disabled = false; }
      } }, t("ibxDraftAll")) : null,
      withDraft.length ? el("button", { class: "btn sm on ibx-sendall", type: "button", onclick: () => { S.open = S.open === "sendall" ? null : "sendall"; S.confirm = null; renderComments(); } },
        "↩ " + t("ibxSendAll").replace("{n}", withDraft.length)) : null,
      seg([["waiting", t("ibxWaiting") + " " + waiting.length], ["done", t("ibxDone") + " " + (all.length - waiting.length)], ["all", t("ibxAll") + " " + all.length]],
        S.filter, (v) => { S.filter = v; renderComments(); }),
      ibxTzPicker(),
      used.length ? el("div", { class: "ibx-labels" }, used.map((l) => el("button", { class: "chip" + (S.label === l ? " ok" : ""), type: "button",
        onclick: () => { S.label = S.label === l ? null : l; renderComments(); } }, "# " + l))) : null));
    if (S.open === "sendall" && withDraft.length) {
      const box = el("div", { class: "ibx-sendall-box" }, el("b", {}, t("ibxSendAllTitle")),
        el("ul", {}, withDraft.map((x) => el("li", { style: "unicode-bidi:plaintext" }, el("b", {}, "@" + (x.author || "?") + ": "), drafts[x.id].text))));
      box.append(el("div", { class: "row2" },
        el("button", { class: "btn sm on big", type: "button", onclick: async (e) => {
          e.target.disabled = true; let ok = 0;
          for (const x of withDraft) {
            try { await inboxApi({ op: "reply", postId: x.postId, accountId: x.accountId, commentId: x.id, text: drafts[x.id].text }); ok++; }
            catch (er) { toast(t("ibxSendAllFail").replace("{a}", x.author || "").replace("{e}", er.message)); }
          }
          toast(t("ibxSendAllDone").replace("{n}", ok)); S.open = null; lastSig = ""; await load(false); lastZSig = ""; loadZernio(); renderComments();
        } }, t("ibxSendAllGo").replace("{n}", withDraft.length)),
        el("button", { class: "btn sm", type: "button", onclick: () => { S.open = null; renderComments(); } }, t("ibxCancel"))));
      c.append(box);
    }
    const list = all.filter((x) => (S.filter === "all" || (S.filter === "done" ? handled(x) : !handled(x))) && (!S.label || (ib.labels[x.id] || []).includes(S.label)));
    if (!list.length) { c.append(el("p", { class: "empty" }, t("ibxNone"))); return; }
    list.slice(0, 40).forEach((x) => c.append(commentCard(x, ib)));
  }
  function commentCard(x, ib) {
    const z = state.z || {}, S = state.ibx;
    const po = (z.commentPosts || {})[x.postId] || {};
    const au = (z.automations || []).find((a) => a.postId === x.postId && a.active !== false);
    const am = (z.autoLog || {})[x.id];
    const done = ib.handled[x.id] || (am && am.how !== "auto-failed" ? am : null);
    const isAuto = !!(done && am && done === am);
    const labels = ib.labels[x.id] || [];
    const card = el("div", { class: "ibx-card" + (done ? " done" : "") + (x.hidden ? " hid" : "") });
    // the post it's on
    card.append(el("a", { class: "ibx-post", href: po.permalink || "#", target: "_blank", rel: "noopener", title: t("ibxOpenPost") },
      po.thumb ? el("img", { src: po.thumb, alt: "", loading: "lazy", referrerpolicy: "no-referrer" }) : el("span", { class: "ibx-noimg" }, "▢"),
      el("span", { style: "unicode-bidi:plaintext" }, t("ibxOnPost") + ": " + ((po.caption || "").split("\n")[0] || "—").slice(0, 70)), el("small", {}, t("ibxOpenPost") + " ↗")));
    { const vr = rowFor(po.permalink, x.postId); if (vr) card.append(el("div", { class: "ibx-view" }, viewBtn(vr))); }
    card.append(el("div", { class: "ibx-who" }, el("b", {}, "@" + (x.author || "?")),
      el("span", { class: "label ibx-when", title: x.createdAt ? ibxTime(x.createdAt, true) : "" }, (x.platform || "") + (x.createdAt ? " · " + ibxTime(x.createdAt) + " · " + ago(Date.parse(x.createdAt) / 1000) : "")),
      x.likes ? el("span", { class: "label" }, "♥ " + x.likes) : null, x.hidden ? el("span", { class: "chip bad" }, t("ibxHiddenTag")) : null,
      done ? el("span", { class: "chip ok", title: isAuto ? (String(done.how).startsWith("ig-") ? t("ibxIgTip") + (done.text ? " " + t("ibxYouWrote") + ": “" + done.text + "”" : "") : t(done.how === "auto-gated" ? "ibxAutoGatedTip" : "ibxAutoTip")) : "" }, t("ibxSt_" + done.how) || done.how) : null,
      x.liked && !done ? el("span", { class: "chip" }, t("ibxLiked")) : null,
      am && am.how === "auto-failed" ? el("span", { class: "chip bad", title: t("ibxAutoFailTip") + (am.error ? " · " + am.error : "") }, t("ibxSt_auto-failed")) : null),
      el("p", { class: "ibx-text", style: "unicode-bidi:plaintext" }, x.text || ""));
    // the post's gift
    card.append(el("div", { class: "ibx-gift" + (au ? "" : " none") }, au
      ? [el("b", {}, "🎁 " + t("ibxGiftOf") + ": “" + (au.keywords || []).join(", ") + "”"), au.message ? el("span", { style: "unicode-bidi:plaintext" }, au.message.replace(/\{\{\s*(first_name|name|username|full_name)\s*\}\}/gi, x.author || "").slice(0, 120)) : null]
      : t("ibxNoGift")));
    // Claude's reply draft (nothing is sent until the user presses Send reply)
    const dr = (ib.drafts || {})[x.id];
    if (dr && !done && S.open !== x.id + ":reply") {
      card.append(el("div", { class: "ibx-draft" }, el("b", {}, "✨ " + t("ibxDraftOf")),
        el("p", { style: "unicode-bidi:plaintext" }, dr.text),
        el("div", { class: "row2" },
          el("button", { class: "btn sm on", type: "button", onclick: () => { S.draft[x.id + ":reply"] = dr.text; S.open = x.id + ":reply"; S.confirm = null; renderComments(); } }, "↩ " + t("ibxDraftUse")),
          el("button", { class: "btn sm", type: "button", onclick: async () => { try { const r = await inboxApi({ op: "drop_draft", commentId: x.id }); state.data.inbox = r.inbox; renderComments(); } catch (e) { toast(e.message); } } }, t("ibxDraftNo")))));
    }
    // labels (this computer only)
    const lab = el("div", { class: "ibx-lab" });
    ((ib.catalog || []).filter((l) => labels.includes(l) || S.open === x.id + ":label")).concat(labels.filter((l) => !(ib.catalog || []).includes(l))).forEach((l) =>
      lab.append(el("button", { class: "chip" + (labels.includes(l) ? " ok" : ""), type: "button", "aria-pressed": String(labels.includes(l)),
        onclick: () => setLabel(x.id, l, !labels.includes(l)) }, "# " + l)));
    if (S.open === x.id + ":label") {
      const inp = el("input", { type: "text", class: "ibx-newlab", placeholder: t("ibxLabelPh"), maxlength: "24" });
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter" && inp.value.trim()) setLabel(x.id, inp.value.trim(), true); });
      lab.append(inp);
    } else lab.append(el("button", { class: "chip ibx-addlab", type: "button", onclick: () => { S.open = x.id + ":label"; renderComments(); } }, t("ibxAddLabel")));
    card.append(lab);
    // actions
    const can = x.can || { reply: true, delete: true, hide: true };
    if (isAuto) return card;   // Zernio's automation owns it: no local mark to undo, no gift to send
    if (done) {
      card.append(el("div", { class: "row2 ibx-acts" }, el("button", { class: "btn sm", type: "button", onclick: async () => { try { await inboxApi({ op: "unhandle", commentId: x.id }); lastSig = ""; load(false); } catch (e) { toast(e.message); } } }, "↶ " + t("ibxUnmark"))));
      return card;
    }
    const ids = { postId: x.postId, accountId: x.accountId, commentId: x.id };
    card.append(el("div", { class: "row2 ibx-acts" },
      can.reply ? el("button", { class: "btn sm" + (S.open === x.id + ":reply" ? " on" : ""), type: "button", onclick: () => { S.open = S.open === x.id + ":reply" ? null : x.id + ":reply"; S.confirm = null; renderComments(); } }, "↩ " + t("ibxReply")) : null,
      (x.platform === "instagram" || x.platform === "facebook") && !(am && am.consumed) ? el("button", { class: "btn sm" + (S.open === x.id + ":gift" ? " on" : ""), type: "button",
        onclick: () => { S.open = S.open === x.id + ":gift" ? null : x.id + ":gift"; S.confirm = null; renderComments(); } }, "🎁 " + (au ? t("ibxGift") : t("ibxPrivate"))) : null,
      can.hide ? el("button", { class: "btn sm", type: "button", onclick: async () => {
        try { await inboxApi({ op: x.hidden ? "show" : "hide", ...ids }); toast(x.hidden ? t("ibxShown") : t("ibxHidden")); lastZSig = ""; loadZernio(); } catch (e) { toast(e.message); } } }, x.hidden ? t("ibxShow") : t("ibxHide")) : null,
      can.delete ? el("button", { class: "btn sm danger-ghost", type: "button", onclick: () => deleteComment(x, ids) }, t("ibxDelete")) : null));
    if (am && am.consumed) card.append(el("p", { class: "hint" }, t("ibxAutoUsed")));
    // composers
    if (S.open === x.id + ":reply") {
      const ta = el("textarea", { rows: 2, placeholder: t("ibxReplyPh"), style: "unicode-bidi:plaintext" });
      ta.value = S.draft[x.id + ":reply"] || "";
      ta.addEventListener("input", () => { S.draft[x.id + ":reply"] = ta.value; });
      card.append(el("div", { class: "ibx-comp" }, ta, el("div", { class: "row2" }, el("button", { class: "btn sm on", type: "button", onclick: async (e) => {
        e.target.disabled = true;
        try { await inboxApi({ op: "reply", ...ids, text: ta.value }); toast(t("ibxSent")); delete S.draft[x.id + ":reply"]; S.open = null; lastSig = ""; await load(false); lastZSig = ""; loadZernio(); }
        catch (er) { toast(er.message); e.target.disabled = false; }
      } }, t("ibxSend")))));
      setTimeout(() => ta.focus(), 30);
    }
    if (S.open === x.id + ":gift") {
      const btn0 = ((au && au.buttons) || [])[0] || {};
      const ta = el("textarea", { rows: 3, style: "unicode-bidi:plaintext" });
      // the automation's {{first_name}} etc. only fill in automatically there: fill them here
      ta.value = S.draft[x.id + ":gift"] ?? ((au && au.message) || "").replace(/\{\{\s*(first_name|name|username|full_name)\s*\}\}/gi, x.author || "");
      ta.addEventListener("input", () => { S.draft[x.id + ":gift"] = ta.value; });
      const link = el("input", { type: "text", placeholder: "https://…", value: S.draft[x.id + ":link"] ?? (btn0.url || "") });
      link.addEventListener("input", () => { S.draft[x.id + ":link"] = link.value; });
      const asB = el("input", { type: "checkbox" }); asB.checked = !!S.asButton[x.id];
      asB.addEventListener("change", () => { S.asButton[x.id] = asB.checked; renderComments(); });
      const confirmBtn = S.confirm === x.id;
      card.append(el("div", { class: "ibx-comp gift" }, el("p", { class: "hint" }, t("ibxGiftHint")), ta, link,
        el("label", { class: "check-row" }, asB, el("span", {}, t("ibxAsButton"))), asB.checked ? el("p", { class: "warn-msg" }, t("ibxBtnWarn")) : null,
        el("div", { class: "row2" }, el("button", { class: "btn sm on" + (confirmBtn ? " big" : ""), type: "button", onclick: async (e) => {
          if (!confirmBtn) { S.confirm = x.id; renderComments(); return; }
          e.target.disabled = true;
          try {
            await inboxApi({ op: "gift", ...ids, text: ta.value, link: link.value, button: btn0.title || "", asButton: asB.checked });
            toast(t("ibxGiftSent").replace("{a}", x.author || "")); S.open = null; S.confirm = null; lastSig = ""; await load(false); lastZSig = ""; loadZernio();
          } catch (er) { toast(er.message); S.confirm = null; lastSig = ""; await load(false); renderComments(); }
        } }, confirmBtn ? "✓ " + t("ibxConfirm").replace("{a}", x.author || "") : "🎁 " + (au ? t("ibxGift") : t("ibxPrivate"))))));
    }
    return card;
  }
  async function setLabel(id, name, on) {
    try { const r = await inboxApi({ op: "label", commentId: id, name, on }); state.data.inbox = r.inbox; state.ibx.open = null; renderComments(); }
    catch (e) { toast(e.message); }
  }
  function deleteComment(x, ids) {
    const build = (body) => {
      const err = el("div", { class: "err", role: "alert" });
      const inp = el("input", { type: "text", class: "go-input", placeholder: "delete", autocomplete: "off", spellcheck: "false", "aria-label": t("ibxDelType") });
      const btn = el("button", { class: "btn on big danger", type: "button", disabled: true }, t("ibxDelBtn"));
      inp.addEventListener("input", () => { btn.disabled = inp.value.trim().toLowerCase() !== "delete"; });
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        try { await inboxApi({ op: "delete", ...ids, confirm: inp.value }); closeModal(async () => { toast(t("ibxDeleted")); lastSig = ""; await load(false); lastZSig = ""; loadZernio(); }); }
        catch (e) { err.textContent = e.message; btn.disabled = false; }
      });
      body.append(el("div", { class: "label kicker", style: "color:var(--bps-danger)" }, t("tabInbox")), el("h2", { id: "mTitle" }, t("ibxDelTitle")),
        el("div", { class: "daypost" }, el("b", {}, "@" + (x.author || "?")), el("div", { style: "unicode-bidi:plaintext" }, x.text || "")),
        el("div", { class: "field" }, el("label", { class: "label" }, t("ibxDelType")), inp), err,
        el("div", { class: "actions" }, el("button", { class: "btn", type: "button", onclick: () => closeModal(renderQuestion) }, t("cancel")), btn));
    };
    modal.open ? closeModal(() => showModal("delcmt", build)) : showModal("delcmt", build);
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
  state.ideaSel = new Set();
  const ideaApi = (body) => post("/api/ideas", body);
  function ideaToolbar(ideas) {
    const sel = [...state.ideaSel].filter((id) => ideas.some((i) => i.id === id));
    state.ideaSel = new Set(sel);
    const n = sel.length;
    const all = el("input", { type: "checkbox", "aria-label": t("ibAll"), checked: n && n === ideas.length ? "" : null });
    all.indeterminate = n > 0 && n < ideas.length;
    all.addEventListener("change", () => { state.ideaSel = new Set(all.checked ? ideas.map((i) => i.id) : []); renderIdeas(); });
    const loadIn = el("input", { type: "file", accept: ".json,application/json", hidden: true });
    loadIn.addEventListener("change", () => ideaImport(loadIn.files[0]));
    const u = state.data && state.data.ideasUndo;
    return el("div", { class: "ib-bar" },
      el("label", { class: "ib-all" }, all, el("span", {}, n ? t("ibSel").replace("{n}", n) : t("ibAll"))),
      n ? el("button", { class: "btn sm danger-ghost ib-del", type: "button", onclick: () => ideaDelete(sel) }, "🗑 " + t("ibDel")) : null,
      el("button", { class: "btn sm ib-md", type: "button", title: t("ibSaveHint"), onclick: () => ideaExport(sel, "md") }, "⤓ " + t("ibSaveMd")),
      el("button", { class: "btn sm ib-json", type: "button", title: t("ibSaveHint"), onclick: () => ideaExport(sel, "json") }, "⤓ " + t("ibSaveJson")),
      el("span", { class: "grow" }),
      el("button", { class: "btn sm on ib-add", type: "button", onclick: () => openIdeaForm(null) }, "＋ " + t("ibAdd")),
      el("button", { class: "btn sm ib-load", type: "button", title: t("ibLoadHint"), onclick: () => loadIn.click() }, t("ibLoad")), loadIn,
      ideas.length ? el("button", { class: "btn sm danger-ghost ib-clear", type: "button", onclick: () => ideaDelete(ideas.map((i) => i.id), true) }, t("ibClear")) : null,
      u && Date.now() / 1000 - u.ts < 600 ? el("div", { class: "ib-undo", role: "status" }, t("ibDeleted").replace("{n}", u.n),
        el("button", { class: "btn sm on", type: "button", onclick: ideaUndo }, "↶ " + t("ibUndo"))) : null);
  }
  function renderIdeas() {
    const h = $("#ideas"); h.innerHTML = "";
    const ideas = (state.data && state.data.ideas) || [];
    h.append(ideaToolbar(ideas));
    if (!ideas.length) {
      h.append(el("div", { class: "idea-empty" }, el("h3", {}, t("ideaEmptyTitle")), el("p", { class: "ctx" }, t("ideaEmptyHint")), ideaRequestForm(false)));
      return;
    }
    setTimeout(markIdeasShown, 600);
    const order = { new: 0, drafted: 1, posted: 2 };
    ideas.slice().sort((a, b) => (order[a.status || "new"] ?? 0) - (order[b.status || "new"] ?? 0)).forEach((i, n) => {
      const st = i.status || "new", on = state.ideaSel.has(i.id);
      const pick = el("input", { type: "checkbox", class: "ib-pick", "aria-label": t("ibSelectHint"), title: t("ibSelectHint"), checked: on ? "" : null });
      pick.addEventListener("click", (e) => e.stopPropagation());
      pick.addEventListener("change", () => { pick.checked ? state.ideaSel.add(i.id) : state.ideaSel.delete(i.id); renderIdeas(); });
      const card = el("div", { class: "idea click" + (state.ideasShown ? " seen" : "") + (st !== "new" ? " used" : "") + (on ? " picked" : ""), role: "button", tabindex: "0", title: t("ideaOpen"), style: `animation-delay:${n * 60}ms` },
        pick,
        el("div", { class: "label" }, (i.format || "") + (i.basedOn ? " · " + i.basedOn : "")),
        el("h3", { style: "unicode-bidi:plaintext" }, i.title),
        el("p", { style: "unicode-bidi:plaintext" }, i.why || ""),
        el("div", { class: "idea-tags" },
          st !== "new" ? el("span", { class: "conf " + (st === "posted" ? "high" : "medium") }, t("ideaSt_" + st)) : null,
          i.basis === "topics" ? el("span", { class: "conf low" }, t("ideaTopicsBasis")) : null,
          el("span", { class: "more" }, t("ideaOpen"))));
      card.addEventListener("click", () => openIdea(i));
      card.addEventListener("keydown", (e) => { if (e.target === card && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openIdea(i); } });
      h.append(card);
    });
    h.append(el("div", { class: "idea-more" }, ideaRequestForm(true)));
  }
  async function ideaRefresh() { lastSig = ""; await load(false); renderIdeas(); }
  async function ideaDelete(ids, all) {
    if (all && !confirm(t("ibClearAsk").replace("{n}", ids.length))) return;
    try { const r = await ideaApi(all ? { op: "clear" } : { op: "delete", ids }); state.ideaSel.clear(); toast(t("ibDeleted").replace("{n}", r.deleted)); await ideaRefresh(); }
    catch (e) { toast(e.message); }
  }
  async function ideaUndo() {
    try { const r = await ideaApi({ op: "undo" }); toast(t("ibRestored").replace("{n}", r.restored)); await ideaRefresh(); }
    catch (e) { toast(e.message); }
  }
  async function ideaExport(ids, format) {
    try {
      const r = await ideaApi({ op: "export", ids, format });
      if (r.cancelled) return;
      if (r.download) {                                     // no file manager window: the browser saves it
        const a = el("a", { href: URL.createObjectURL(new Blob([r.content], { type: format === "json" ? "application/json" : "text/markdown" })), download: r.name });
        document.body.append(a); a.click(); a.remove(); return;
      }
      toast(t("ibSaved").replace("{f}", r.path));
    } catch (e) { toast(e.message); }
  }
  async function ideaImport(f) {
    if (!f) return;
    let data;
    try { data = JSON.parse(await f.text()); } catch (e) { toast(t("ibLoadHint")); return; }
    try { const r = await ideaApi({ op: "import", data }); toast(t("ibLoaded").replace("{a}", r.added).replace("{s}", r.skipped)); await ideaRefresh(); }
    catch (e) { toast(e.message); }
  }
  function openIdeaForm(i) {
    const build = (body) => {
      const err = el("div", { class: "err", role: "alert" });
      const f = (k, v, ta, hint) => {
        const n = el(ta ? "textarea" : "input", ta ? { rows: ta, style: "unicode-bidi:plaintext" } : { type: "text", style: "unicode-bidi:plaintext" });
        n.value = v || ""; n.dataset.k = k;
        return el("div", { class: "field" }, el("label", { class: "label" }, t(k === "title" ? "ibTitle" : k === "format" ? "ibFormat" : k === "hook" ? "ideaHook" : k === "why" ? "ideaWhy" :
          k === "outline" ? "ideaOutline" : k === "cta" ? "ideaCta" : k === "hashtags" ? "ideaTags" : "ideaWhen") + (hint ? " · " + t(hint) : "")), n);
      };
      body.append(el("div", { class: "label kicker", style: "color:var(--accent-ink)" }, t("ideaKicker")),
        el("h2", { id: "mTitle" }, i ? t("ibEditTitle") : t("ibNewTitle")),
        el("div", { class: "ib-form" },
          f("title", i && i.title), f("format", i ? i.format : "reel"), f("hook", i && i.hook, 2), f("why", i && i.why, 2),
          f("outline", i && (i.outline || []).join("\n"), 5, "ibOutlineHint"), f("cta", i && i.cta),
          f("hashtags", i && (i.hashtags || []).join(" "), 0, "ibTagsHint"), f("bestTime", i && i.bestTime)), err,
        el("div", { class: "actions" },
          el("button", { class: "btn", type: "button", onclick: () => closeModal(() => (i ? openIdea(i) : null)) }, t("cancel")),
          el("button", { class: "btn on big", type: "button", onclick: async () => {
            const fields = {};
            body.querySelectorAll("[data-k]").forEach((n) => { fields[n.dataset.k] = n.value; });
            try {
              const r = await ideaApi(i ? { op: "edit", id: i.id, fields } : { op: "add", fields });
              await ideaRefresh(); closeModal(() => openIdea(r.idea));
            } catch (e) { err.textContent = e.message; }
          } }, t("ibSave"))));
    };
    modal.open ? closeModal(() => showModal("ideaform", build)) : showModal("ideaform", build);
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
          el("button", { class: "btn ib-editone", type: "button", onclick: () => openIdeaForm(i) }, "✎ " + t("ibEdit")),
          el("button", { class: "btn", type: "button", onclick: async () => { try { await post("/api/ideas", { op: "drop", id: i.id }); } catch (e) {} send(`Drop the idea '${i.title}'; it's not for me.`); } }, t("ideaDrop")),
          el("button", { class: "btn", type: "button", onclick: () => closeModal(() => { go("plan"); toast(t("ideaPickDay")); }) }, t("ideaPlan")),
          el("button", { class: "btn on big", type: "button", onclick: async () => { try { await post("/api/ideas", { op: "mark", id: i.id, status: "drafted" }); } catch (e) {} send(`Draft a post from the idea '${i.title}'.`); } }, t("dayIdeaBtn"))));
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
    const sig = thr.map((m) => m.id + (m.read ? 1 : 0) + (m.status || "") + (m.step || "")).join();
    if (modal.open === "note" && state.chatDraw && sig !== state.chatSig) { state.chatSig = sig; state.chatDraw(); }
    state.chatSig = sig;
    const unseen = thr.filter((m) => m.from === "claude" && !m.seen).length;
    ["#noteTop", "#noteFab"].forEach((id) => { const b_ = $(id); if (!b_) return; let dot = b_.querySelector(".msg-dot");
      if (unseen && !dot) { dot = el("b", { class: "msg-dot" }); b_.append(dot); }
      if (dot) { if (unseen) dot.textContent = unseen; else dot.remove(); } });
    const z = state.z || {};
    const s = (z.streak || {}).current;
    $("#streakPill").innerHTML = s != null ? `<b>${esc(s)}</b> ${esc(t("streak"))}` : "&nbsp;";
    const vb = "v" + ((state.data && state.data.version) || "") + ((state.data && state.data.build) ? " · " + t("buildWord") + " " + state.data.build : "");
    $("#versionPill").textContent = vb;
    const fv = $("#footVersion"); if (fv) fv.textContent = vb;
    const tv = $("#topVersion"); if (tv) tv.textContent = "v" + ((state.data && state.data.version) || "") + ((state.data && state.data.build) ? " · " + state.data.build : "");
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
    wrap.querySelector(".modal").classList.toggle("wide", key === "batch" || key === "zpost" || key === "gift");
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
    enterSends(ta, () => reply(ta.value));
    const opts = (m.options || []).length ? el("div", { class: "opts" }, ...(m.options || []).map((o) =>
      el("button", { class: "btn opt", type: "button", onclick: () => reply(o) }, o))) : null;
    body.append(el("div", { class: "label kicker claude-kicker" }, el("i", { class: "cdot" }), t("claudeSays")),
      el("div", { class: "claude-say", id: "mTitle", style: "unicode-bidi:plaintext" }, m.text), opts,
      el("div", { class: "field" }, el("label", { class: "label" }, t(m.expect ? "chatAnswer" : "chatReplyOpt")), ta, el("small", { class: "hint enter-hint" }, t("enterHint"))), err,
      el("div", { class: "actions" },
        el("button", { class: "btn", type: "button", onclick: async () => { try { await post("/api/chat", { op: "seen", id: m.id }); } catch (e) {} done(); closeModal(renderQuestion); } }, t("gotIt")),
        el("button", { class: "btn", type: "button", onclick: () => closeModal(() => openChat()) }, t("chatOpen")),
        el("button", { class: "btn on big", type: "button", onclick: () => reply(ta.value) }, t("send"))));
  }

  function renderQuestion() {
    const q = state.data && state.data.question;
    const pill = $("#decisionPill");
    const cm = state.data && state.data.claudeMsg;
    if (!q && cm && !cm.status && !modal.open && !state.dismissed["m:" + cm.id]) {
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

  // where Claude is with one of your notes
  function noteState(m) {
    const st = m.status || (m.read ? "received" : "");
    const txt = st === "done" ? t("chatDone") : st === "failed" ? t("chatFailed") : st === "handled" ? t("chatHandled")
      : st === "working" ? (m.step ? t("chatWorking").replace("{s}", m.step) : t("chatWorkingNo"))
      : st === "received" ? t("chatSeen") : t("chatWaiting");
    return el("div", { class: "chat-state st-" + (st || "new") }, st === "working" ? el("i", { class: "spin", "aria-hidden": "true" }) : null, txt);
  }
  // a notice when Claude finishes one of your notes; the dashboard refreshes itself
  const notices = el("div", { class: "notice-stack", role: "status", "aria-live": "polite" });
  document.body.append(notices);
  function showNotice(n) {
    const ok = n.status === "done";
    const card = el("div", { class: "notice " + (ok ? "ok" : "bad") },
      el("div", { class: "notice-head" }, el("b", {}, (ok ? "✓ " : "✗ ") + (ok ? t("ntDone") : t("ntFailed"))),
        el("button", { class: "x", type: "button", "aria-label": t("close"), onclick: () => card.remove() }, "×")),
      el("div", { class: "notice-note", style: "unicode-bidi:plaintext" }, t("ntYour") + ": “" + (n.text || "").slice(0, 90) + ((n.text || "").length > 90 ? "…" : "") + "”"),
      n.result ? el("div", { class: "notice-res", style: "unicode-bidi:plaintext" }, n.result) : null,
      el("div", { class: "row2" }, el("button", { class: "btn sm on", type: "button", onclick: () => { card.remove(); openChat(); } }, t("ntView"))));
    notices.prepend(card);
    let left = 12000;
    const tick = setInterval(() => { if (!card.matches(":hover")) left -= 500; if (left <= 0 || !card.isConnected) { clearInterval(tick); card.remove(); } }, 500);
    while (notices.children.length > 3) notices.lastChild.remove();
  }
  state.noteSt = null;
  function watchNotes() {
    const thr = (state.data && state.data.thread) || [];
    const now = {};
    thr.filter((m) => m.from === "you").forEach((m) => { now[m.id] = m.status || ""; });
    const before = state.noteSt;
    state.noteSt = now;
    if (!before) return;                                           // first load: no old news
    const finished = thr.filter((m) => m.from === "you" && ["done", "failed"].includes(now[m.id]) && before[m.id] !== now[m.id]);
    if (!finished.length) return;
    finished.forEach((m) => {
      showNotice(m);
      thr.filter((r) => r.from === "claude" && r.to === m.id && !r.seen).forEach((r) => { r.seen = true; post("/api/chat", { op: "seen", id: r.id }).catch(() => {}); });
    });
    setTimeout(() => { lastSig = ""; load(false); loadZernio(); }, 400);   // show what Claude changed
  }

  /* ---------- Activity bell: every note and request, with its status and result ---------- */
  const ACT = { open: false, filter: "all" };
  const actPanel = el("div", { class: "jobs-panel act-panel", role: "dialog", "aria-label": "Activity", hidden: true });
  document.body.append(actPanel);
  const actSeen = () => { try { return +localStorage.getItem("bps.actSeen") || 0; } catch (e) { return 0; } };
  const actRows = () => (state.data && state.data.activity) || [];
  const isOpenSt = (st) => ["waiting", "received", "working"].includes(st);
  function renderBell() {
    const b = $("#bellBtn"); if (!b) return;
    const seenTs = actSeen();
    const fresh = actRows().filter((a) => ["done", "failed"].includes(a.status) && (a.statusTs || 0) > seenTs).length;
    const busy = actRows().some((a) => a.status === "working");
    let dot = b.querySelector(".bell-n");
    if (fresh && !dot) { dot = el("b", { class: "bell-n" }); b.append(dot); }
    if (dot) { if (fresh) dot.textContent = fresh > 9 ? "9+" : String(fresh); else dot.remove(); }
    b.classList.toggle("busy", busy);
    b.title = t("actTitle");
    if (ACT.open) drawAct();
  }
  function drawAct() {
    const rows = actRows(), seenTs = ACT.seenAtOpen || 0;
    const pick = { all: () => true, open: (a) => isOpenSt(a.status), done: (a) => ["done", "handled"].includes(a.status), failed: (a) => a.status === "failed" }[ACT.filter];
    const n = (f) => rows.filter({ all: () => true, open: (a) => isOpenSt(a.status), done: (a) => ["done", "handled"].includes(a.status), failed: (a) => a.status === "failed" }[f]).length;
    actPanel.innerHTML = "";
    actPanel.append(el("div", { class: "jobs-head" }, el("b", {}, t("actTitle")), el("span", { class: "hint" }, t("actHint"))),
      seg([["all", t("actAll") + " " + n("all")], ["open", t("actOpen") + " " + n("open")], ["done", t("actDone") + " " + n("done")], ["failed", t("actFailed") + " " + n("failed")]],
        ACT.filter, (v) => { ACT.filter = v; drawAct(); }, "act-seg"));
    const list = rows.filter(pick);
    if (!list.length) { actPanel.append(el("p", { class: "hint" }, t("actEmpty"))); return; }
    list.forEach((a) => {
      const isNew = ["done", "failed"].includes(a.status) && (a.statusTs || 0) > seenTs;
      actPanel.append(el("button", { class: "act-card st-" + a.status, type: "button", title: t("actOpenChat"), onclick: () => { toggleAct(false); openChat(); } },
        el("div", { class: "act-top" }, noteState({ status: a.status === "waiting" ? "" : a.status, step: a.step }),
          isNew ? el("span", { class: "act-new" }, t("actNew")) : null, el("span", { class: "label" }, ago(a.statusTs || a.ts))),
        el("div", { class: "act-note", style: "unicode-bidi:plaintext" }, a.text),
        a.result ? el("div", { class: "act-res", style: "unicode-bidi:plaintext" }, a.result) : null));
    });
  }
  function placeAct() {
    const r = $("#bellBtn").getBoundingClientRect(), w = Math.min(400, window.innerWidth - 24);
    actPanel.style.width = w + "px"; actPanel.style.top = (r.bottom + 8) + "px";
    actPanel.style.left = Math.max(12, Math.min(window.innerWidth - w - 12, r.right - w)) + "px";
  }
  function toggleAct(force) {
    ACT.open = force ?? !ACT.open;
    actPanel.hidden = !ACT.open;
    if (ACT.open) {
      ACT.seenAtOpen = actSeen();                         // "new" marks stay while the panel is open
      try { localStorage.setItem("bps.actSeen", String(Math.floor(Date.now() / 1000))); } catch (e) {}
      placeAct(); drawAct(); renderBell();
    }
  }
  $("#bellBtn").addEventListener("click", (e) => { e.stopPropagation(); toggleAct(); });
  document.addEventListener("click", (e) => { if (ACT.open && !actPanel.contains(e.target)) toggleAct(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && ACT.open) toggleAct(false); });
  window.addEventListener("resize", () => ACT.open && placeAct());

  // "Note to Claude" is a chat: your notes and Claude's replies, newest at the bottom.
  function openChat() {
    const open = () => showModal("note", (body) => {
      const list = el("div", { class: "chat-list", role: "log", "aria-live": "polite" });
      const draw = () => {
        list.innerHTML = "";
        const rows = (state.data && state.data.thread) || [];
        if (!rows.length) list.append(el("p", { class: "empty" }, t("chatEmpty")));
        const mineIds = new Set(rows.filter((m) => m.from === "you").map((m) => m.id));
        const bubble = (m, reply) => {
          const mine = m.from === "you";
          const b_ = el("div", { class: "chat-msg " + (mine ? "me" : "claude") + (reply ? " reply" : "") },
            el("div", { class: "chat-who" }, mine ? t("chatYou") : "Claude", el("span", {}, " · " + ago(m.ts))),
            el("div", { class: "chat-text", style: "unicode-bidi:plaintext" }, m.text));
          if (!mine && (m.options || []).length && !m.answered) b_.append(el("div", { class: "opts" }, ...m.options.map((o) =>
            el("button", { class: "btn opt", type: "button", onclick: () => send(o, m.id) }, o))));
          if (mine) b_.append(noteState(m));
          return b_;
        };
        rows.forEach((m) => {
          if (m.from === "claude" && m.to && mineIds.has(m.to)) return;          // shown under its note
          list.append(bubble(m));
          if (m.from === "you") rows.filter((r) => r.from === "claude" && r.to === m.id).forEach((r) => list.append(bubble(r, true)));
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
      enterSends(ta, () => send(ta.value));
      body.append(el("div", { class: "label kicker", style: "color:var(--bps-lime)" }, t("noteKicker")),
        el("h2", { id: "mTitle" }, t("chatTitle")), el("p", { class: "ctx" }, t("chatHint")), list, ta, el("small", { class: "hint enter-hint" }, t("enterHint")), err,
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
      el("div", { class: "row2" }, newBtn, el("button", { class: "btn batch-btn post-batch", type: "button", onclick: () => openBatch() }, el("span", { "aria-hidden": "true" }, "▦ "), t("bBtn")), cta)), bar, track);
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
  // "updated 5 hours ago" by the follower count: Zernio refreshes it ~daily.
  function folFresh() {
    const z = state.z || {}, host = $("#folRange"); if (!host) return;
    const ig = (z.accounts || []).find((a) => a.platform === "instagram" && a.followersUpdated) || (z.accounts || []).find((a) => a.followersUpdated);
    const old = host.parentNode.querySelector(".fol-fresh"); if (old) old.remove();
    if (!ig) return;
    const ts = Date.parse(ig.followersUpdated) / 1000; if (!ts) return;
    host.after(el("span", { class: "label fol-fresh" + (Date.now() / 1000 - ts > 36 * 3600 ? " stale" : "") }, " · " + t("folFresh").replace("{t}", ago(ts))));
  }
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
  // one plain sentence for the whole gift: used in the window, the review step and the summary
  function giftSentence(dm) {
    if (!dm || !dm.enabled || !dm.keyword) return "";
    return t("gsSentence").replace("{k}", dm.keyword).replace("{l}", dm.link ? t("gsWithLink") : "").replace("{g}", dm.followGate ? t("gsGated") : "");
  }
  function openGift(after) {
    const p = state.data && state.data.plan;
    if (!p) return;
    const dm = p.dm || {};
    const acc = (state.data.config && state.data.config.accounts) || {};
    const me = "@" + ((acc.instagram && acc.instagram.username) || "you");
    const build = (body) => {
      const err = el("div", { class: "err", role: "alert" });
      let on = !!dm.enabled;
      const onB = el("button", { class: "btn", type: "button", "aria-pressed": String(on) }, t("giftOn"));
      const offB = el("button", { class: "btn", type: "button", "aria-pressed": String(!on) }, t("giftOff"));
      const kw = el("input", { type: "text", value: dm.keyword || "", placeholder: "Agent", maxlength: "40" });
      const msg = el("textarea", { rows: 3, placeholder: t("giftMsgPh") }); msg.value = dm.message || "";
      const link = el("input", { type: "text", value: dm.link || "", placeholder: "https://…" });
      const btnT = el("input", { type: "text", value: dm.buttonTitle || "", placeholder: t("giftBtnPh"), maxlength: "20" });
      const gate = el("input", { type: "checkbox" }); gate.checked = dm.followGate !== false;
      const reply = el("input", { type: "text", value: dm.commentReply || "", placeholder: t("giftReplyPh") });
      const gMsg = el("textarea", { rows: 2, placeholder: t("gsDefGate") }); gMsg.value = dm.followGateMessage || "";
      const gBtn = el("input", { type: "text", value: dm.followGateButton || "", placeholder: t("gsDefBtn"), maxlength: "20" });
      const gNot = el("textarea", { rows: 2, placeholder: t("gsDefNot") }); gNot.value = dm.notFollowingMessage || "";
      const gateBox = el("details", { class: "gs-gate" }, el("summary", {}, t("gsEditGate")),
        el("div", { class: "field" }, el("label", { class: "label" }, t("gsGateMsg")), gMsg),
        el("div", { class: "field" }, el("label", { class: "label" }, t("gsGateBtn")), gBtn),
        el("div", { class: "field" }, el("label", { class: "label" }, t("gsNotMsg")), gNot));
      const fields = el("div", { class: "gift-fields" },
        el("div", { class: "field" }, el("label", { class: "label" }, "1 · " + t("gsStep1")), kw, el("small", { class: "hint" }, t("gsMatch"))),
        el("div", { class: "field" }, el("label", { class: "label" }, "2 · " + t("gsStep2")), msg),
        el("div", { class: "row2 field" }, el("div", { style: "flex:2 1 200px" }, el("label", { class: "label" }, t("giftLink")), link), el("div", { style: "flex:1 1 120px" }, el("label", { class: "label" }, t("giftBtn")), btnT)),
        el("div", { class: "label" }, "3 · " + t("gsStep3")),
        el("label", { class: "check-row" }, gate, el("span", {}, t("giftGate"))), gateBox,
        el("div", { class: "field" }, el("label", { class: "label" }, t("giftReply")), reply));
      // the story, redrawn as you type
      const sentence = el("p", { class: "gs-sentence", style: "unicode-bidi:plaintext" });
      const story = el("div", { class: "gs-story" });
      const bubble = (who, text, cls) => el("div", { class: "gs-b " + (cls || "") }, el("small", {}, who), el("div", { style: "unicode-bidi:plaintext" }, text));
      const scene = (title, where, ...kids) => el("div", { class: "gs-scene" }, el("div", { class: "gs-h" }, el("b", {}, title), el("span", { class: "label" }, where)), ...kids);
      const draw = () => {
        const k = kw.value.trim() || "Agent";
        const d = { enabled: on, keyword: k, link: link.value.trim(), followGate: gate.checked };
        sentence.textContent = on ? giftSentence(d) : t("gsOffHint");
        story.innerHTML = "";
        if (!on) return;
        story.append(scene(t("gs1"), t("gsOnPost"), bubble("@" + t("gsSomeone"), k + " 🙌")));
        if (reply.value.trim()) story.append(scene(t("gs2"), t("gsOnPost"), bubble(me, reply.value.trim(), "me")));
        if (gate.checked) story.append(scene(t("gs3"), t("gsInDm"),
          bubble(me, gMsg.value.trim() || t("gsDefGate"), "me"), el("div", { class: "gs-btn" }, gBtn.value.trim() || t("gsDefBtn")),
          el("small", { class: "hint" }, t("gs3Not") + " “" + (gNot.value.trim() || t("gsDefNot")) + "”")));
        story.append(scene(t("gs4"), t("gsInDm"), bubble(me, msg.value.trim() || t("giftMsgPh"), "me"),
          link.value.trim() ? el("div", { class: "gs-btn" }, (btnT.value.trim() || t("giftBtnPh")) + " ↗") : null));
      };
      [kw, msg, link, btnT, reply, gMsg, gBtn, gNot].forEach((n) => n.addEventListener("input", draw));
      gate.addEventListener("change", () => { gateBox.hidden = !gate.checked; draw(); });
      const sync = () => { onB.setAttribute("aria-pressed", String(on)); offB.setAttribute("aria-pressed", String(!on)); fields.classList.toggle("off", !on); fields.inert = !on; draw(); };
      onB.addEventListener("click", () => { on = true; sync(); setTimeout(() => kw.focus(), 50); });
      offB.addEventListener("click", () => { on = false; sync(); });
      gateBox.hidden = !gate.checked;
      const noIg = !(p.platforms || []).includes("instagram");
      body.append(el("div", { class: "label kicker", style: "color:var(--accent-ink)" }, t("jGift")),
        el("h2", { id: "mTitle" }, t("giftTitle")), sentence,
        el("div", { class: "seg big-seg" }, onB, offB),
        el("div", { class: "gs-grid" }, fields,
          el("div", { class: "gs-side" }, el("div", { class: "label" }, t("gsHow")), story,
            el("div", { class: "gs-when" }, el("b", {}, t("gsWhen")), el("p", {}, t("gsWhenText")), noIg ? el("p", { class: "warn-msg" }, t("gsNoIg")) : null))),
        err,
        el("div", { class: "actions" },
          el("button", { class: "btn", type: "button", onclick: () => closeModal(after || renderQuestion) }, t("cancel")),
          el("button", { class: "btn on big", type: "button", onclick: async () => {
            err.textContent = "";
            try {
              await post("/api/plan", { op: "gift", dm: { enabled: on, keyword: kw.value, message: msg.value, link: link.value, buttonTitle: btnT.value, followGate: gate.checked, commentReply: reply.value,
                followGateMessage: gMsg.value, followGateButton: gBtn.value, notFollowingMessage: gNot.value } });
              closeModal(async () => { toast(on ? t("giftSavedOn") : t("giftSavedOff")); lastSig = ""; await load(false); if (after) after(); });
            } catch (e) { err.textContent = e.message; }
          } }, t("save"))));
      sync();
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
      el("div", { class: "np-head" }, el("h2", {}, t("newPostTitle")), el("button", { class: "btn batch-btn post-batch", type: "button", onclick: () => openBatch() }, el("span", { "aria-hidden": "true" }, "▦ "), t("bBtn"))),
      el("div", { class: "np-ways" },
        el("button", { class: "np-way", type: "button", onclick: () => openNewPost() }, el("b", {}, "🖼  " + t("npFromPc")), el("span", { class: "hint" }, t("npFromPcHint"))),
        el("button", { class: "np-way", type: "button", onclick: () => openNewPost({ pick: "mine" }) }, el("b", {}, "✦  " + t("npFromMine")), el("span", { class: "hint" }, t("npFromMineHint"))),
        el("button", { class: "np-way", type: "button", onclick: () => { openNewPost(); setTimeout(npFolder, 400); } }, el("b", {}, "📁  " + t("npFromFolder")), el("span", { class: "hint" }, t("npFromFolderHint"))),
        el("button", { class: "np-way np-createimg", type: "button", onclick: () => { openNewPost(); IMG.edit = ""; IMG.last = []; setTimeout(() => openImage({ forNP: true }), 50); } }, el("b", {}, "✎  " + t("npCreateImg")), el("span", { class: "hint" }, t("npCreateImgHint")))),
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

  /* ---------- Plan: week and day views with hours, drag to move, drag to plan ---------- */
  const HOUR_PX = 48, SNAP = 15;
  const snapMin = (m) => Math.max(0, Math.min(24 * 60 - SNAP, Math.round(m / SNAP) * SNAP));
  const atStr = (d) => d.toLocaleString(loc(), { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: state.h12 });
  function renderTimeGrid() {
    const day0 = new Date(state.calDay);
    if (state.calView === "week") day0.setDate(day0.getDate() - day0.getDay());
    const n = state.calView === "week" ? 7 : 1;
    const days = Array.from({ length: n }, (_, i) => { const d = new Date(day0); d.setDate(d.getDate() + i); return d; });
    const last = days[n - 1];
    $("#calTitle").textContent = n === 1 ? day0.toLocaleDateString(loc(), { weekday: "long", day: "numeric", month: "long" })
      : day0.toLocaleDateString(loc(), { day: "numeric", month: "short" }) + " – " + last.toLocaleDateString(loc(), { day: "numeric", month: "short", year: "numeric" });
    const bt = (state.z && state.z.besttime) || {};
    const lvl = heatLevels(bt.grid);   // same 5 steps as the heatmap
    const evs = calEvents();
    const wrap = el("div", { class: "tg" + (n === 1 ? " one" : "") });
    const head = el("div", { class: "tg-head" }, el("div", { class: "tg-gut" }));
    const today = localDay();
    days.forEach((d) => head.append(el("button", { class: "tg-dh" + (localDay(d) === today ? " today" : ""), type: "button",
      onclick: () => { state.calView = "day"; state.calDay = new Date(d); renderCalendar(); } },
      el("span", {}, d.toLocaleDateString(loc(), { weekday: "short" })), el("b", {}, d.getDate()))));
    const body = el("div", { class: "tg-body" });
    const gut = el("div", { class: "tg-gut" });
    for (let hr = 0; hr < 24; hr++) gut.append(el("div", { class: "tg-hl", style: `height:${HOUR_PX}px` }, hourLabel(hr, true)));
    body.append(gut);
    const cols = days.map((d) => {
      const key = localDay(d), row = (bt.grid || [])[d.getDay()] || [];
      const col = el("div", { class: "tg-col" + (key === today ? " today" : ""), "data-day": key });
      for (let hr = 0; hr < 24; hr++) col.append(el("div", { class: "tg-h" + (row[hr] ? " l" + lvl(row[hr]) : ""), style: `height:${HOUR_PX}px` }));
      const pastTo = key < today ? 24 * 60 : key === today ? new Date().getHours() * 60 + new Date().getMinutes() : 0;
      if (pastTo) col.append(el("div", { class: "tg-past", style: `height:${pastTo / 60 * HOUR_PX}px` }));
      if (key === today) col.append(el("div", { class: "tg-now", style: `top:${pastTo / 60 * HOUR_PX}px` }));
      evs.filter((e) => localDay(new Date(e.at)) === key).forEach((e) => col.append(tgEvent(e)));
      body.append(col);
      return col;
    });
    tgPointer(body, cols);
    wrap.append(head, body, el("p", { class: "hint tg-hint" }, t("tgDrag")));
    const key = el("div", { class: "cal-key" });
    [["ev-pub", "stPublished"], ["ev-sched", "stScheduled"], ["ev-fail", "zAttention"], ["ev-local", "stLocal"]].forEach(([c, k]) =>
      key.append(el("span", { class: c }, el("i", { class: "evdot", "aria-hidden": "true" }), t(k))));
    const host = $("#cal"); host.innerHTML = ""; host.append(wrap, key);
    if (!state.tgScrolled) { state.tgScrolled = true; body.scrollTop = 8 * HOUR_PX; } else body.scrollTop = state.tgScroll || 8 * HOUR_PX;
    body.addEventListener("scroll", () => { state.tgScroll = body.scrollTop; }, { passive: true });
  }
  function tgEvent(e) {
    const d = new Date(e.at), min = d.getHours() * 60 + d.getMinutes();
    const st = ZST[e.status] || ZST.draft, net = (e.platforms || [])[0];
    const b = el("div", { class: "tg-ev ev " + st.cls.replace("st-", "ev-") + (e.movable ? " movable" : ""), style: `top:${min / 60 * HOUR_PX}px`,
      title: t(st.key) + " · " + (e.caption || "").split("\n")[0] + (e.movable ? "" : " · " + t("tgNoChange")), tabindex: "0", role: "button" },
      el("i", { class: "evdot", "aria-hidden": "true" }),
      el("b", {}, d.toLocaleTimeString(loc(), { hour: "numeric", minute: "2-digit", hour12: state.h12 })),
      netStack(e.row || e),
      el("span", { class: "evcap" }, (e.caption || "").split("\n")[0] || "—"), evCopyBtn(e));
    b._ev = e;
    b.addEventListener("keydown", (x) => { if (x.key === "Enter") openPostDetail(e.row); });
    return b;
  }
  // one pointer handler for the grid: drag a post to move it; click / drag on empty time to plan
  function tgPointer(body, cols) {
    let drag = null;
    const colAt = (x, y) => { const n = document.elementFromPoint(x, y); return n && n.closest && n.closest(".tg-col"); };
    const minAt = (col, y) => snapMin((y - col.getBoundingClientRect().top) / HOUR_PX * 60);
    body.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      const evEl = e.target.closest(".tg-ev"), col = e.target.closest(".tg-col");
      if (!col) return;
      drag = { x0: e.clientX, y0: e.clientY, evEl, col, start: minAt(col, e.clientY), moved: false };
      if (evEl) { const r = evEl.getBoundingClientRect(); drag.grab = e.clientY - r.top; }
      body.setPointerCapture(e.pointerId);
    });
    body.addEventListener("pointermove", (e) => {
      if (!drag) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
      drag.moved = true;
      const col = colAt(e.clientX, e.clientY) || drag.col;
      if (drag.evEl) {
        if (!drag.evEl._ev.movable) return;
        if (!drag.ghost) { drag.ghost = drag.evEl.cloneNode(true); drag.ghost.classList.add("ghost"); drag.evEl.classList.add("dragging"); }
        const m = snapMin((e.clientY - drag.grab - col.getBoundingClientRect().top) / HOUR_PX * 60);
        drag.ghost.style.top = m / 60 * HOUR_PX + "px";
        drag.ghost.querySelector("b").textContent = hourMin(m);
        if (drag.ghost.parentNode !== col) col.append(drag.ghost);
        drag.to = { col, m };
      } else {
        if (col !== drag.col) return;
        const a = Math.min(drag.start, minAt(col, e.clientY)), b = Math.max(drag.start, minAt(col, e.clientY)) + SNAP;
        if (!drag.sel) { drag.sel = el("div", { class: "tg-sel" }); col.append(drag.sel); }
        drag.sel.style.top = a / 60 * HOUR_PX + "px"; drag.sel.style.height = (b - a) / 60 * HOUR_PX + "px";
        drag.sel.textContent = hourMin(a) + " – " + hourMin(b);
        drag.range = [a, b];
      }
    });
    const end = () => {
      const d = drag; drag = null; if (!d) return;
      if (d.ghost) d.ghost.remove(); if (d.evEl) d.evEl.classList.remove("dragging");
      if (d.evEl && !d.moved) return openPostDetail(d.evEl._ev.row);
      if (d.evEl && d.to) {
        const when = new Date(d.to.col.dataset.day + "T00:00:00"); when.setMinutes(d.to.m);
        if (when.getTime() !== new Date(d.evEl._ev.at).getTime()) confirmMove(d.evEl._ev, when);
        return;
      }
      if (d.evEl) return;
      const startM = d.range ? d.range[0] : d.start;
      if (d.sel) setTimeout(() => d.sel.remove(), 400);
      const when = new Date(d.col.dataset.day + "T00:00:00"); when.setMinutes(startM);
      openSlotMenu(when);
    };
    body.addEventListener("pointerup", end);
    body.addEventListener("pointercancel", () => { if (drag) { if (drag.ghost) drag.ghost.remove(); if (drag.sel) drag.sel.remove(); } drag = null; });
  }
  const hourMin = (m) => { const d = new Date(2000, 0, 1, Math.floor(m / 60), m % 60); return d.toLocaleTimeString(loc(), { hour: "numeric", minute: "2-digit", hour12: state.h12 }); };

  // move: local drafts at once; posts in Zernio after a typed "move"
  async function confirmMove(ev, when) {
    if (when.getTime() < Date.now() + 15 * 60000) { toast(t("mvPast")); return; }
    const at = localIso(when);
    if (ev.local) {
      try { await post("/api/plan", { op: "time", at, planId: ev.planId }); toast(t("mvLocal").replace("{t}", atStr(when))); lastSig = ""; await load(false); renderCalendar(); }
      catch (e) { toast(e.message); }
      return;
    }
    const build = (body) => {
      const err = el("div", { class: "err", role: "alert" });
      const pick = el("input", { type: "datetime-local", value: at, min: localIso(new Date(Date.now() + 16 * 60000)) });
      const inp = el("input", { type: "text", class: "go-input", placeholder: "move", autocomplete: "off", spellcheck: "false", "aria-label": t("mvType") });
      const btn = el("button", { class: "btn on big", type: "button", disabled: true }, t("mvBtn"));
      inp.addEventListener("input", () => { btn.disabled = inp.value.trim().toLowerCase() !== "move"; });
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter" && !btn.disabled) btn.click(); });
      btn.addEventListener("click", async () => {
        err.textContent = ""; btn.disabled = true;
        try {
          const r = await post("/api/zpost", { op: "move", postId: ev.id, at: pick.value, confirm: inp.value });
          closeModal(() => {
            toast(t("mvDone").replace("{t}", atStr(new Date(r.at))));
            if ((r.notMoved || []).length) toast(t("mvNotAll").replace("{p}", r.notMoved.join(", ")));
            lastSig = ""; lastZSig = ""; load(false); loadZernio();
          });
        } catch (e) { err.textContent = e.message; btn.disabled = false; }
      });
      body.append(el("div", { class: "label kicker", style: "color:var(--accent-ink)" }, t("tabPlan")), el("h2", { id: "mTitle" }, t("mvTitle")),
        el("div", { class: "daypost", style: "unicode-bidi:plaintext" }, (ev.caption || "").split("\n")[0] || "—"),
        el("dl", { class: "sum" }, el("dt", {}, t("mvFrom")), el("dd", {}, atStr(new Date(ev.at))), el("dt", {}, t("mvTo")), el("dd", {}, el("b", {}, atStr(when)))),
        el("div", { class: "field" }, el("label", { class: "label" }, t("mvPick")), pick),
        el("div", { class: "field" }, el("label", { class: "label" }, t("mvType")), inp), err,
        el("div", { class: "actions" }, el("button", { class: "btn", type: "button", onclick: () => closeModal(() => renderCalendar()) }, t("cancel")), btn));
    };
    modal.open ? closeModal(() => showModal("move", build)) : showModal("move", build);
  }
  function openEditCaption(r) {
    const build = (body) => {
      const err = el("div", { class: "err", role: "alert" });
      const ta = el("textarea", { rows: 9, style: "unicode-bidi:plaintext" }); ta.value = r.caption || "";
      const inp = el("input", { type: "text", class: "go-input", placeholder: "edit", autocomplete: "off", spellcheck: "false", "aria-label": t("edType") });
      const btn = el("button", { class: "btn on big", type: "button", disabled: true }, t("edBtn"));
      inp.addEventListener("input", () => { btn.disabled = inp.value.trim().toLowerCase() !== "edit"; });
      btn.addEventListener("click", async () => {
        err.textContent = ""; btn.disabled = true;
        try { await post("/api/zpost", { op: "edit", postId: r.id, text: ta.value, confirm: inp.value }); closeModal(() => { toast(t("edDone")); lastSig = ""; lastZSig = ""; load(false); loadZernio(); }); }
        catch (e) { err.textContent = e.message; btn.disabled = false; }
      });
      body.append(el("div", { class: "label kicker", style: "color:var(--accent-ink)" }, t("tabPlan")), el("h2", { id: "mTitle" }, t("edTitle")), ta,
        el("div", { class: "field" }, el("label", { class: "label" }, t("edType")), inp), err,
        el("div", { class: "actions" }, el("button", { class: "btn", type: "button", onclick: () => closeModal(renderQuestion) }, t("cancel")), btn));
    };
    modal.open ? closeModal(() => showModal("editcap", build)) : showModal("editcap", build);
  }
  // click or drag on an empty time: what goes there?
  // ---- Copy a post, paste it on another day ----
  state.clip = null;
  // a small ⧉ on each calendar post copies it in one click
  function evCopyBtn(e) {
    const b = el("span", { class: "ev-copy", role: "button", tabindex: "0", title: t("cpCopy"), "aria-label": t("cpCopy") }, "⧉");
    const go_ = (x) => { x.preventDefault(); x.stopPropagation(); copyPost(e.row || e); };
    b.addEventListener("click", go_); b.addEventListener("keydown", (x) => { if (x.key === "Enter" || x.key === " ") go_(x); });
    ["pointerdown", "mousedown", "dragstart"].forEach((k) => b.addEventListener(k, (x) => x.stopPropagation()));
    return b;
  }
  // right-click menu in Plan: on a post (view, copy, move, edit, cancel) or on a day / hour (paste, plan)
  function ctxMenu(x, y, items) {
    document.querySelectorAll(".ctx-menu").forEach((m) => m.remove());
    const m = el("div", { class: "ctx-menu", role: "menu" }, items.filter(Boolean).map(([label, fn, cls]) =>
      el("button", { class: "ctx-item" + (cls ? " " + cls : ""), type: "button", role: "menuitem", onclick: () => { m.remove(); fn(); } }, label)));
    document.body.append(m);
    const r = m.getBoundingClientRect();
    m.style.left = Math.max(8, Math.min(x, innerWidth - r.width - 8)) + "px";
    m.style.top = Math.max(8, Math.min(y, innerHeight - r.height - 8)) + "px";
    const first = m.querySelector("button"); if (first) first.focus();
    const close = (ev) => { if (!m.contains(ev.target)) { m.remove(); document.removeEventListener("pointerdown", close, true); } };
    setTimeout(() => document.addEventListener("pointerdown", close, true), 0);
    m.addEventListener("keydown", (ev) => { if (ev.key === "Escape") m.remove(); });
  }
  document.addEventListener("contextmenu", (e) => {
    const view = $("#view-plan"); if (!view || !view.contains(e.target)) return;
    const evEl = e.target.closest(".ev, .tg-ev");
    if (evEl && evEl._ev) {
      e.preventDefault();
      const ev = evEl._ev, r = ev.row || ev, future = ev.at && Date.parse(ev.at) > Date.now();
      ctxMenu(e.clientX, e.clientY, [
        ["▶ " + t("vView"), () => openPostDetail(r)],
        ["⧉ " + t("cpCopy"), () => copyPost(r)],
        !r.outside ? ["⇆ " + t("nwBtn"), () => openNetEdit(r)] : null,
        ev.movable ? ["⇄ " + t("pdMove"), () => confirmMove({ ...r, at: ev.at, row: r }, new Date(ev.at))] : null,
        ev.movable && !r.local ? ["✎ " + t("pdEdit"), () => openEditCaption(r)] : null,
        (r.local || future || ["failed", "partial"].includes(r.status)) ? [r.local ? t("cDelDraft") : t("cCancelBtn") + "…", () => openCancel(r), "danger"] : null]);
      return;
    }
    const day = e.target.closest("[data-day]");
    if (!day) return;
    e.preventDefault();
    const key = day.dataset.day, past = key < localDay();
    let hm = null;
    if (day.classList.contains("tg-col")) { const top = day.getBoundingClientRect().top; const m = Math.max(0, Math.round((e.clientY - top) / HOUR_PX * 60 / 15) * 15);
      hm = String(Math.min(23, Math.floor(m / 60))).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); }
    ctxMenu(e.clientX, e.clientY, [
      state.clip && !past ? ["📋 " + t("cpPasteHere") + (hm ? " · " + hm : ""), () => openPaste(key, hm)] : null,
      ["📅 " + t("dayOpen"), () => { const evs = calEvents().filter((x) => localDay(new Date(x.at)) === key); openDay(key, evs); }],
      state.clip ? ["✕ " + t("cpClear"), () => { state.clip = null; renderClipBar(); renderCalendar(); }] : null]);
  });
  function copyPost(r) {
    if (!r) return;
    const when = r.scheduledFor || (r.platforms || []).map((p) => p.publishedAt).filter(Boolean)[0] || null;
    state.clip = { row: r, at: when };
    toast(t("cpCopied")); renderClipBar(); renderCalendar();
  }
  function renderClipBar() {
    const host = $("#clipBar"); if (!host) return;
    host.innerHTML = ""; host.hidden = !state.clip;
    if (!state.clip) return;
    const r = state.clip.row;
    host.append(el("span", { class: "clip-ico", "aria-hidden": "true" }, "📋"),
      el("span", { class: "clip-txt" }, el("b", {}, t("cpOnClip")), " ", el("span", { dir: "auto" }, ((r.caption || "").split("\n")[0] || "—").slice(0, 60))),
      el("span", { class: "hint" }, t("cpHow")),
      el("button", { class: "btn sm", type: "button", "aria-label": t("cpClear"), title: t("cpClear"), onclick: () => { state.clip = null; renderClipBar(); renderCalendar(); } }, "✕"));
  }
  function openPaste(dayKey, hm) {
    const c = state.clip; if (!c) return;
    const r = c.row, local = !!r.local;
    const srcTime = c.at ? new Date(c.at) : null;
    let time0 = hm || (srcTime ? String(srcTime.getHours()).padStart(2, "0") + ":" + String(srcTime.getMinutes()).padStart(2, "0") : "20:00");
    if (dayKey === localDay() && new Date(`${dayKey}T${time0}`) < new Date(Date.now() + 15 * 60000)) {   // today, already past: the next full hour
      const n = new Date(Date.now() + 75 * 60000); time0 = String(n.getHours()).padStart(2, "0") + ":00";
    }
    const build = (body) => {
      const err = el("div", { class: "err", role: "alert" });
      const date = el("input", { type: "date", value: dayKey, min: localDay() });
      const time = el("input", { type: "time", value: time0, step: "300" });
      const cap = el("textarea", { rows: 5, dir: "auto" }); cap.value = r.caption || "";
      const nets = [...new Set((r.platforms || []).map((p) => p.platform))];
      const picks = {};
      const netBox = el("div", { class: "cp-nets" }, nets.map((pf) => { const cb = el("input", { type: "checkbox" }); cb.checked = true; picks[pf] = cb;
        const n = (r.platforms || []).filter((p) => p.platform === pf).length;
        return el("label", { class: "tg-acc" }, cb, el("span", {}, (NET_NAME[pf] || pf) + (n > 1 ? " ×" + n : ""))); }));
      let draft = false;
      // the source post's DM gift (opt-in: unticked until the user ticks it)
      const gift = local ? null : ((state.z || {}).automations || []).find((a) => a.active !== false && (a.zPostId === r.id || a.postId === r.id));
      const giftCb = el("input", { type: "checkbox" });
      const giftRow = gift ? el("label", { class: "tg-acc cp-gift" }, giftCb,
        el("span", {}, "🎁 " + t("cpGift").replace("{k}", (gift.keywords || [])[0] || ""))) : null;
      const word = el("input", { type: "text", class: "typed", placeholder: "go", autocomplete: "off", spellcheck: "false" });
      const wordRow = el("div", { class: "field" }, el("label", { class: "label" }, t("cpTypeGo")), word);
      const mode = local ? null : seg([["sched", t("cpSchedule")], ["draft", t("cpDraft")]], "sched", (v) => { draft = v === "draft"; wordRow.hidden = draft; go_.textContent = t(draft ? "cpDraftBtn" : "cpPasteBtn");
        mode.querySelectorAll("button").forEach((b, k) => { const on = (k === 1) === draft; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); }); }, "cp-mode");
      const go_ = el("button", { class: "btn on big", type: "button", onclick: async () => {
        err.textContent = "";
        const platforms = nets.filter((pf) => picks[pf].checked);
        if (!platforms.length) { err.textContent = t("cpPickNet"); return; }
        if (!date.value || !time.value) { err.textContent = t("mvPick"); return; }
        go_.disabled = true;
        try {
          const body = { op: "copy", at: `${date.value}T${time.value}`, platforms, draft, confirm: word.value, copyGift: !!(gift && giftCb.checked) };
          if (cap.value !== (r.caption || "")) body.text = cap.value;
          if (local) body.planId = r.planId; else body.postId = r.id;
          const res = await post("/api/zpost", body);
          closeModal(() => { toast(t(res.local ? "cpDoneLocal" : draft ? "cpDoneDraft" : "cpDone").replace("{t}", atStr(new Date(`${date.value}T${time.value}`))) + (res.gifts ? " · 🎁 " + t("cpGiftDone") : "")); lastSig = ""; lastZSig = ""; load(false); loadZernio(); });
        } catch (e) { err.textContent = e.message; go_.disabled = false; }
      } }, t(local ? "cpLocalBtn" : "cpPasteBtn"));
      word.addEventListener("keydown", (e) => { if (e.key === "Enter") go_.click(); });
      body.append(el("div", { class: "label kicker", style: "color:var(--accent-ink)" }, t("cpKicker")),
        el("h2", { id: "mTitle", dir: "auto" }, ((r.caption || "").split("\n")[0] || "—").slice(0, 80)),
        el("div", { class: "cp-src" }, el("div", { class: "cp-thumb" }, thumbEl(r)), el("p", { class: "hint" }, t(local ? "cpWhatLocal" : "cpWhat"))),
        el("div", { class: "cp-when" }, el("label", { class: "label" }, t("cpWhen")), el("div", { class: "row2" }, date, time)),
        el("div", { class: "field" }, el("label", { class: "label" }, t("cpNets")), netBox),
        el("div", { class: "field" }, el("label", { class: "label" }, t("cpCaption")), cap),
        giftRow ? el("div", { class: "field" }, giftRow, el("small", { class: "hint" }, t("cpGiftHint"))) : null,
        mode, local ? null : wordRow, err,
        el("div", { class: "actions" }, el("button", { class: "btn", type: "button", onclick: () => closeModal(renderQuestion) }, t("cancel")), go_));
    };
    modal.open ? closeModal(() => showModal("paste", build)) : showModal("paste", build);
  }
  // Ctrl+C on a post you're pointing at in Plan; Ctrl+V on a day
  state.hoverEv = null; state.hoverDay = null;
  document.addEventListener("mouseover", (e) => {
    const ev = e.target.closest && e.target.closest(".ev, .tg-ev"); state.hoverEv = ev && ev._ev ? ev._ev : null;
    const day = e.target.closest && e.target.closest("[data-day]");
    state.hoverDay = day ? { key: day.dataset.day, col: day.classList.contains("tg-col") ? day : null, y: e.clientY } : null;
  });
  document.addEventListener("mousemove", (e) => { if (state.hoverDay) state.hoverDay.y = e.clientY; }, { passive: true });
  document.addEventListener("keydown", (e) => {
    if (!(e.ctrlKey || e.metaKey) || modal.open) return;
    const a = document.activeElement;
    if (a && (a.matches("input, textarea, select, [contenteditable]") || String(window.getSelection() || ""))) return;
    if (e.key.toLowerCase() === "c" && state.hoverEv) { e.preventDefault(); copyPost(state.hoverEv.row || state.hoverEv); }
    else if (e.key.toLowerCase() === "v" && state.clip && state.hoverDay) {
      e.preventDefault();
      let hm = null;
      if (state.hoverDay.col) { const top = state.hoverDay.col.getBoundingClientRect().top; const m = Math.max(0, Math.round((state.hoverDay.y - top) / HOUR_PX * 60 / 15) * 15);
        hm = String(Math.min(23, Math.floor(m / 60))).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); }
      openPaste(state.hoverDay.key, hm);
    }
  });
  function openSlotMenu(when) {
    if (when.getTime() < Date.now() + 15 * 60000) { toast(t("mvPast")); return; }
    const at = localIso(when), p = state.data && state.data.plan;
    const drafts = ((state.data && state.data.plans) || []).filter((x) => !x.postId && !["published", "scheduled"].includes(x.status));
    const ideas = ((state.data && state.data.ideas) || []).filter((i) => (i.status || "new") === "new").slice(0, 6);
    const setTime = async (planId) => {
      try { await post("/api/plan", { op: "time", at, planId }); closeModal(async () => { toast(t("slSet").replace("{t}", atStr(when))); lastSig = ""; await load(false); renderCalendar(); }); }
      catch (e) { toast(e.message); }
    };
    const build = (body) => {
      body.append(el("div", { class: "label kicker", style: "color:var(--accent-ink)" }, t("tabPlan")), el("h2", { id: "mTitle" }, t("slTitle").replace("{t}", atStr(when))));
      const opts = el("div", { class: "sl-opts" });
      if (state.clip) opts.append(el("button", { class: "np-way cp-way", type: "button", onclick: () => closeModal(() => openPaste(localDay(when), String(when.getHours()).padStart(2, "0") + ":" + String(when.getMinutes()).padStart(2, "0"))) },
        el("b", {}, "📋 " + t("cpPasteHere")), el("span", { class: "hint", dir: "auto" }, ((state.clip.row.caption || "").split("\n")[0] || "").slice(0, 80))));
      if (p && editableNow()) opts.append(el("button", { class: "np-way", type: "button", onclick: () => setTime(p.id) },
        el("b", {}, "▶ " + t("slCurrent")), el("span", { class: "hint", style: "unicode-bidi:plaintext" }, (Object.values(p.captions || {})[0] || p.folder || "").split("\n")[0].slice(0, 80))));
      opts.append(el("button", { class: "np-way", type: "button", onclick: () => closeModal(() => { openNewPost(); NP.when = at; }) },
        el("b", {}, "＋ " + t("slNew")), el("span", { class: "hint" }, t("npStep1") + " → " + t("npStep4"))));
      body.append(opts, el("h3", {}, t("slDrafts")));
      const others = drafts.filter((x) => !p || x.id !== p.id);
      body.append(others.length ? el("div", { class: "sl-list" }, others.slice(0, 8).map((x) => el("button", { class: "daypost sl-item", type: "button", onclick: () => setTime(x.id) },
        el("div", { style: "unicode-bidi:plaintext" }, (x.caption || x.folder || "").split("\n")[0].slice(0, 90) || "—"),
        el("div", { class: "label" }, (x.kind || "") + (x.at ? " · " + dt(x.at) : ""))))) : el("p", { class: "hint" }, t("slNoDrafts")));
      if (ideas.length) body.append(el("h3", {}, t("slIdea")), el("div", { class: "sl-list" }, ideas.map((i) => el("button", { class: "daypost sl-item", type: "button", onclick: async () => {
        try { await post("/api/slot", { date: localDay(when), hour: when.getHours(), action: "idea", idea: i.title }); closeModal(() => toast(t("slIdeaSent").replace("{t}", atStr(when)))); }
        catch (e) { toast(e.message); }
      } }, el("div", { style: "unicode-bidi:plaintext" }, i.title), el("div", { class: "label" }, i.format || "")))));
      body.append(el("div", { class: "actions" }, el("button", { class: "btn", type: "button", onclick: () => closeModal(renderQuestion) }, t("close"))));
    };
    modal.open ? closeModal(() => showModal("slot", build)) : showModal("slot", build);
  }

  /* ---------- TikTok and Snapchat options for the open post ---------- */
  const TT_PRIV = ["PUBLIC_TO_EVERYONE", "FOLLOWER_OF_CREATOR", "MUTUAL_FOLLOW_FRIENDS", "SELF_ONLY"];
  async function ttInfo(kind) {
    const k = kind === "reel" ? "video" : "photo";
    if (state.tt && state.tt[k]) return state.tt[k];
    try { const r = await fetch("/api/tiktok?mediaType=" + k, { cache: "no-store" }); const j = await r.json(); (state.tt ||= {})[k] = j.ok ? j : { failed: true }; }
    catch (e) { (state.tt ||= {})[k] = { failed: true }; }
    return state.tt[k];
  }
  // the poll or repost under the LinkedIn caption, as it will look
  function liExtraPreview(p) {
    const ls = (p.settings || {}).linkedin || {}, kind = ls.kind || "post";
    if (kind === "repost") return el("div", { class: "li-poll-pv li-pv-main" }, el("small", { class: "label" }, "↻ " + t("liRepost")),
      el("span", { class: "hint", style: "word-break:break-all" }, ls.reshareUrl || "…"));
    if (kind !== "poll") return null;
    const poll = ls.poll || {}, filled = (poll.options || []).filter((o) => o.trim());
    const d = { ONE_DAY: "liD1", THREE_DAYS: "liD3", SEVEN_DAYS: "liD7", FOURTEEN_DAYS: "liD14" }[poll.duration || "SEVEN_DAYS"];
    return el("div", { class: "li-poll-pv li-pv-main" }, el("small", { class: "label" }, t("liPoll")),
      el("b", { style: "unicode-bidi:plaintext" }, poll.question || "…"),
      ...(filled.length ? filled : ["…", "…"]).map((o) => el("span", { class: "li-pv-opt", style: "unicode-bidi:plaintext" }, o)),
      el("small", { class: "hint" }, t("liPvFoot").replace("{d}", t(d))));
  }
  // A poll or repost already in Zernio (scheduled or live): the card, how long it's open, LinkedIn's numbers
  function liPostedCard(r) {
    const li = r.li || {};
    const card = liExtraPreview({ settings: { linkedin: { kind: li.kind, poll: li.poll, reshareUrl: li.reshareUrl } } });
    if (!card) return null;
    card.classList.add("li-posted");
    const lp = (r.platforms || []).find((p) => p.platform === "linkedin") || {};
    if (li.kind === "poll") {
      const days = { ONE_DAY: 1, THREE_DAYS: 3, SEVEN_DAYS: 7, FOURTEEN_DAYS: 14 }[(li.poll || {}).duration || "SEVEN_DAYS"];
      const d = t({ 1: "liD1", 3: "liD3", 7: "liD7", 14: "liD14" }[days]);
      const start = lp.status === "published" ? Date.parse(lp.publishedAt || r.scheduledFor || r.createdAt) : NaN;
      let line;
      if (isNaN(start)) line = t("pollOpensWhen").replace("{d}", d);
      else {
        const end = start + days * 864e5, left = end - Date.now();
        const lt = left > 864e5 ? t("pollDays").replace("{n}", Math.ceil(left / 864e5)) : t("pollHours").replace("{n}", Math.max(1, Math.ceil(left / 36e5)));
        line = left > 0 ? t("pollLeft").replace("{l}", lt).replace("{c}", dt(new Date(end).toISOString())) : t("pollClosed").replace("{c}", dt(new Date(end).toISOString()));
      }
      put(card, el("p", { class: "li-poll-when" }, "⏱ " + line));
    }
    const st = r.liStats;
    if (st) put(card, el("div", { class: "rc-metrics" }, ...[["impressions", "pollStatImpr"], ["likes", "pollStatReact"], ["comments", "pollStatCom"], ["shares", "pollStatShare"]]
      .map(([k, l]) => el("span", { class: "rc-chip" }, el("b", {}, fmt(st[k] || 0)), " " + t(l)))));
    if (li.kind === "poll") put(card, lp.url ? el("a", { class: "btn sm on", href: lp.url, target: "_blank", rel: "noopener" }, t("pollVotes") + " ↗") : null,
      el("small", { class: "hint" }, t("pollNoVotes")));
    return card;
  }
  function hasNetSettings(p) { return (p.platforms || []).some((x) => ["tiktok", "snapchat", "facebook", "linkedin"].includes(x)); }
  // LinkedIn: a normal post, a poll (question + 2-4 choices + how long) or a repost of a LinkedIn post link
  function liKindCard(p, set) {
    const ls = (p.settings || {}).linkedin || {};
    const kind = ls.kind || "post";
    const liMedia = ((p.types || {}).linkedin || p.type) !== "text";
    const card = el("div", { class: "ns-card li-kind" }, el("h3", {}, "in · LinkedIn"),
      el("label", { class: "label" }, t("liKind")),
      seg([["post", t("liPost")], ["poll", t("liPoll")], ["repost", t("liRepost")]], kind, (v) => v !== kind && set("linkedin.kind", v), "li-kind-seg"));
    if (kind === "post") { card.append(el("p", { class: "hint" }, t(liMedia ? "liPostHint" : "liPostTextHint"))); return card; }
    if (liMedia) card.append(el("p", { class: "warn-msg" }, t("liNoMedia")));
    if (kind === "repost") {
      const u = el("input", { type: "text", inputmode: "url", class: "li-url", value: ls.reshareUrl || "", placeholder: "https://www.linkedin.com/posts/…", spellcheck: "false" });
      u.addEventListener("change", () => set("linkedin.reshareUrl", u.value));
      card.append(el("div", { class: "field" }, el("label", { class: "label" }, t("liUrl")), u), el("p", { class: "hint" }, t("liRepostHint")));
      return card;
    }
    const poll = Object.assign({ question: "", options: ["", ""], duration: "SEVEN_DAYS" }, ls.poll || {});
    const opts = poll.options.length ? poll.options.slice() : ["", ""];
    const save = () => set("linkedin.poll", { question: poll.question, options: opts, duration: poll.duration });
    const count = (inp, max) => { const c = el("small", { class: "hint li-count" }, inp.value.length + " / " + max);
      inp.addEventListener("input", () => { c.textContent = inp.value.length + " / " + max; c.classList.toggle("over", inp.value.length > max); }); c.classList.toggle("over", inp.value.length > max); return c; };
    const q = el("input", { type: "text", class: "li-q", value: poll.question, placeholder: t("liQPh") });
    q.addEventListener("change", () => { poll.question = q.value; save(); });
    const rows = opts.map((o, i) => {
      const inp = el("input", { type: "text", value: o, placeholder: t("liOptPh").replace("{n}", i + 1) });
      inp.addEventListener("change", () => { opts[i] = inp.value; save(); });
      return el("div", { class: "li-opt" }, inp, count(inp, 30),
        opts.length > 2 ? el("button", { class: "btn sm danger-ghost", type: "button", "aria-label": t("remove"), onclick: () => { opts.splice(i, 1); save(); } }, "×") : null);
    });
    const durs = [["ONE_DAY", t("liD1")], ["THREE_DAYS", t("liD3")], ["SEVEN_DAYS", t("liD7")], ["FOURTEEN_DAYS", t("liD14")]];
    const filled = opts.filter((o) => o.trim());
    put(card, el("div", { class: "field" }, el("label", { class: "label" }, t("liQ")), q, count(q, 140)),
      el("label", { class: "label" }, t("liOpts")), ...rows,
      opts.length < 4 ? el("button", { class: "btn sm li-add", type: "button", onclick: () => { opts.push(""); save(); } }, "+ " + t("liAddOpt")) : null,
      el("label", { class: "label" }, t("liDur")), seg(durs, poll.duration, (v) => { poll.duration = v; save(); }),
      el("div", { class: "li-poll-pv", "aria-label": t("liPreview") }, el("small", { class: "label" }, t("liPreview")),
        el("b", { style: "unicode-bidi:plaintext" }, poll.question || "…"),
        ...(filled.length ? filled : ["…", "…"]).map((o) => el("span", { class: "li-pv-opt", style: "unicode-bidi:plaintext" }, o)),
        el("small", { class: "hint" }, t("liPvFoot").replace("{d}", (durs.find((d) => d[0] === poll.duration) || durs[2])[1]))),
      el("p", { class: "hint" }, t("liPollHint")));
    return card;
  }
  function netSettingsUI(p, redraw) {
    const box = el("div", { class: "ns" });
    const set = async (path, value) => {
      try { await post("/api/plan", { op: "setting", path, value }); lastSig = ""; await load(false); if (redraw) redraw(); }
      catch (e) { toast(e.message); }
    };
    const plats = p.platforms || [];
    if (plats.includes("linkedin")) box.append(liKindCard(p, set));
    if (plats.includes("tiktok")) {
      const s = (p.settings || {}).tiktok || {};
      const consentOk = !(p.checks || []).some((c) => c.id === "tiktok.consent");
      const info = state.tt && state.tt[p.type === "reel" ? "video" : "photo"];
      const privs = info && !info.failed && (info.privacyLevels || []).length ? info.privacyLevels.map((x) => x.value) : TT_PRIV;
      const sel = el("select", { "aria-label": t("nsWho") }, el("option", { value: "" }, t("nsPick")),
        ...privs.map((v) => el("option", { value: v, selected: s.privacyLevel === v ? "" : null }, t("nsPriv_" + v) || v)));
      sel.addEventListener("change", () => sel.value && set("tiktok.privacyLevel", sel.value));
      const tog = (key, label, on) => { const c = el("input", { type: "checkbox" }); c.checked = on; c.addEventListener("change", () => set("tiktok." + key, c.checked)); return el("label", { class: "check-row" }, c, el("span", {}, label)); };
      const disc = el("select", {}, [["none", "nsNone"], ["brand_organic", "nsOwnBrand"], ["brand_content", "nsBranded"]].map(([v, k]) =>
        el("option", { value: v, selected: (s.commercialContentType || "none") === v ? "" : null }, t(k))));
      disc.addEventListener("change", () => set("tiktok.commercialContentType", disc.value));
      const consent = el("input", { type: "checkbox" }); consent.checked = consentOk;
      consent.addEventListener("change", () => set("tiktok.consent", consent.checked));
      box.append(el("div", { class: "ns-card" }, el("h3", {}, "TT · " + t("nsTT")),
        info && info.creator && info.creator.canPostMore === false ? el("p", { class: "warn-msg" }, t("nsLimit")) : null,
        !info ? el("p", { class: "hint pulse" }, t("nsLoading")) : null,
        el("div", { class: "field" }, el("label", { class: "label" }, t("nsWho")), sel),
        el("div", { class: "ns-row" }, tog("allowComment", t("nsComments"), s.allowComment !== false),
          p.type === "reel" ? tog("allowDuet", t("nsDuet"), s.allowDuet !== false) : null,
          p.type === "reel" ? tog("allowStitch", t("nsStitch"), s.allowStitch !== false) : null),
        el("div", { class: "field" }, el("label", { class: "label" }, t("nsDisclose")), disc),
        tog("videoMadeWithAi", t("nsAi"), !!s.videoMadeWithAi), tog("draft", t("nsDraft"), !!s.draft),
        el("label", { class: "check-row ns-consent" + (consentOk ? " ok" : "") }, consent, el("span", {}, el("b", {}, t("nsConsent")), el("small", { class: "hint" }, t("nsConsentHint"))))));
      if (!info) ttInfo(p.type).then(() => redraw && redraw());
    }
    if (plats.includes("snapchat")) {
      const ct = ((p.settings || {}).snapchat || {}).contentType || "story";
      const opts = [["story", "nsStory"], ["saved_story", "nsSaved"]].concat(p.type === "reel" ? [["spotlight", "nsSpot"]] : []);
      box.append(el("div", { class: "ns-card" }, el("h3", {}, "SC · " + t("nsSC")),
        seg(opts.map(([v, k]) => [v, t(k)]), ct, (v) => set("snapchat.contentType", v)),
        el("p", { class: "hint" }, t({ story: "nsStoryHint", saved_story: "nsSavedHint", spotlight: "nsSpotHint" }[ct]))));
    }
    if (plats.includes("facebook")) {
      const fs = (p.settings || {}).facebook || {};
      const fmt = fs.format || (p.type === "reel" ? "reel" : "feed");
      const opts = [["feed", "nsFeed"]].concat(p.type === "reel" ? [["reel", "nsReel"]] : []).concat((p.media || []).length === 1 ? [["story", "nsFbStory"]] : []);
      const text = (key, label, val) => { const i = el("input", { type: "text", value: val || "" }); i.addEventListener("change", () => set("facebook." + key, i.value)); return el("div", { class: "field" }, el("label", { class: "label" }, label), i); };
      const draft = el("input", { type: "checkbox" }); draft.checked = !!fs.draft; draft.addEventListener("change", () => set("facebook.draft", draft.checked));
      const pages = state.fbPages;
      const pageSel = pages && pages.ok && pages.pages.length > 1 ? el("select", {}, el("option", { value: "" }, t("nsDefaultPage")),
        ...pages.pages.map((x) => el("option", { value: x.id, selected: fs.pageId === x.id ? "" : null }, x.name || x.id))) : null;
      if (pageSel) pageSel.addEventListener("change", () => set("facebook.pageId", pageSel.value));
      box.append(el("div", { class: "ns-card" }, el("h3", {}, "f · " + t("nsFB")),
        el("label", { class: "label" }, t("nsFormat")), seg(opts.map(([v, k]) => [v, t(k)]), fmt, (v) => set("facebook.format", v)),
        el("p", { class: "hint" }, t({ feed: "nsFeedHint", reel: "nsReelHint", story: "nsFbStoryHint" }[fmt])),
        fmt === "reel" ? text("title", t("nsReelTitle"), fs.title) : null,
        fmt !== "story" ? text("firstComment", t("nsFirst"), fs.firstComment) : null,
        fmt !== "story" ? el("label", { class: "check-row" }, draft, el("span", {}, t("nsFbDraft"))) : null,
        pageSel ? el("div", { class: "field" }, el("label", { class: "label" }, t("nsPage")), pageSel) : null));
      if (!pages) { state.fbPages = { loading: true }; fetch("/api/facebook-pages", { cache: "no-store" }).then((r) => r.json()).then((j) => { state.fbPages = j; if (redraw) redraw(); }).catch(() => { state.fbPages = { ok: false }; }); }
    }
    const sk = p.skipped_reasons || {};
    if (Object.keys(sk).length) box.append(el("p", { class: "hint" }, t("nsSkipped") + ": " + Object.values(sk).join(" · ")));
    return box;
  }
  function openNetSettings() {
    const p = state.data && state.data.plan;
    if (!p) return;
    const build = (body) => {
      const draw = () => { if (modal.open !== "netset") return; body.innerHTML = ""; fill(); };
      const fill = () => body.append(el("div", { class: "label kicker", style: "color:var(--accent-ink)" }, t("tabPost")), el("h2", { id: "mTitle" }, t("nsTitle")),
        netSettingsUI(state.data.plan, draw), el("div", { class: "actions" }, el("button", { class: "btn on", type: "button", onclick: () => closeModal(renderQuestion) }, t("close"))));
      fill();
    };
    modal.open ? closeModal(() => showModal("netset", build)) : showModal("netset", build);
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
        account: (((state.data.config || {}).accounts || {})[pl] || {}).username })), local: true, folder: p.folder, score: p.score, mediaList: p.mediaList }));
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
  const KIND_ICON = { poll: "☰", archive: "🗜", carousel: "▣", reel: "▶", video: "▶", short: "▶", story: "◔", document: "▤", article: "¶", text: "¶", post: "▢" };
  function kindLabel(r) {
    const k = r.kind || (r.videoLocal || r.video ? "video" : ((r.count || r.mediaCount || 0) > 1 ? "carousel" : "post"));
    const n = r.count || r.mediaCount || 0;
    return { k, text: t("kind_" + k) + (k === "carousel" && n > 1 ? " · " + n : "") };
  }
  function kindChip(r, cls) { const { k, text } = kindLabel(r); return el("span", { class: (cls || "kchip") + " k-" + k }, (KIND_ICON[k] || "▢") + " " + text); }
  const NET = { instagram: "IG", linkedin: "in", facebook: "f", threads: "@", twitter: "X", x: "X", tiktok: "TT", snapchat: "SC", youtube: "YT", pinterest: "P", bluesky: "BS", reddit: "R", telegram: "TG", googlebusiness: "G" };
  // A post's networks at a glance: the first network's icon, "+N" for the rest.
  // Click it for each network's account, status, time, link and error.
  function netStack(r) {
    const ps = r.platforms || [];
    if (!ps.length) return null;
    const b = el("span", { class: "netstack", role: "button", tabindex: "0", title: ps.map((p) => (NET_NAME[p.platform] || p.platform) + (p.account ? " @" + p.account : "")).join(" · ") },
      el("span", { class: "net n-" + ps[0].platform }, NET[ps[0].platform] || ps[0].platform),
      ps.length > 1 ? el("span", { class: "netmore" }, t("nsMore").replace("{n}", ps.length - 1)) : null);
    const open = (e) => { e.preventDefault(); e.stopPropagation(); openNets(r); };
    b.addEventListener("click", open);
    b.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") open(e); });
    ["pointerdown", "mousedown", "dragstart"].forEach((k) => b.addEventListener(k, (e) => e.stopPropagation()));
    return b;
  }
  // Turn networks (and accounts) on or off for one post.
  // Not published yet: switches, saved with the typed word "edit" (a local draft: no word).
  // Already published on a network: "Remove from …" (typed "remove"), where the network allows it.
  const NET_FITS = { instagram: ["reel", "single", "carousel"], tiktok: ["reel", "single", "carousel"], snapchat: ["reel", "single"], facebook: ["reel", "single", "carousel", "text"] };
  const NO_UNPUBLISH = ["instagram", "tiktok", "snapchat"];
  function postKind(r) {
    const k = r.kind || "";
    return k === "reel" || k === "video" || k === "short" ? "reel" : k === "carousel" ? "carousel" : k === "document" ? "document" : k === "text" || k === "article" ? "text" : "single";
  }
  function openNetEdit(r) {
    const accs = ((state.z || {}).accounts || []).filter((a) => a.active !== false && !a.needsReconnection);
    const cfgAcc = ((state.data && state.data.config) || {}).accounts || {};
    const local = !!r.local, kind = postKind(r);
    const ents = r.platforms || [];
    const isOn = (a) => ents.some((p) => p.platform === a.platform && (p.accountId ? p.accountId === a.id : (local ? ((cfgAcc[a.platform] || {}).id === a.id) : true)));
    const pubEnt = (a) => ents.find((p) => p.platform === a.platform && (!p.accountId || p.accountId === a.id) && ["published"].includes(p.status));
    const editable = local || ZEDIT.includes(r.status);
    const build = (body) => {
      const err = el("div", { class: "err", role: "alert" });
      const boxes = [];
      const list = el("div", { class: "netsw-list" });
      [...new Set(accs.map((a) => a.platform))].forEach((pf) => {
        accs.filter((a) => a.platform === pf).forEach((a) => {
          const fits = !NET_FITS[pf] || NET_FITS[pf].includes(kind);
          const pub = pubEnt(a);
          const row = el("div", { class: "netsw" + (fits ? "" : " off") },
            el("span", { class: "net n-" + pf }, NET[pf] || pf), el("b", {}, NET_NAME[pf] || pf), el("span", { class: "label", dir: "ltr" }, handle(a.username || "?")));
          if (pub) {
            row.append(badge("published"), NO_UNPUBLISH.includes(pf)
              ? el("small", { class: "hint" }, t("nwAppOnly").replace("{p}", NET_NAME[pf] || pf))
              : el("button", { class: "btn sm danger-ghost", type: "button", onclick: () => closeModal(() => openRemoveOne(r, pf, a)) }, t("nwRemove").replace("{p}", NET_NAME[pf] || pf)));
          } else if (editable) {
            const cb = el("input", { type: "checkbox", class: "switch", disabled: fits ? null : "" }); cb.checked = isOn(a) && fits;
            boxes.push([a, cb]);
            if (!fits) row.append(el("small", { class: "hint" }, t("nwCant").replace("{k}", t("kind_" + (kind === "single" ? "post" : kind)))));
            row.append(el("label", { class: "sw" }, cb, el("span", { class: "sw-track", "aria-hidden": "true" })));
          } else row.append(isOn(a) ? badge(r.status) : el("small", { class: "hint" }, t("nwNotOn")));
          list.append(row);
        });
      });
      const word = el("input", { type: "text", class: "typed", placeholder: "edit", autocomplete: "off", spellcheck: "false" });
      const save = el("button", { class: "btn on big", type: "button", onclick: async () => {
        err.textContent = "";
        const wanted = boxes.filter(([, cb]) => cb.checked).map(([a]) => ({ platform: a.platform, accountId: a.id }));
        if (!wanted.length) { err.textContent = t("nwKeepOne"); return; }
        save.disabled = true;
        try {
          if (local) await post("/api/plan", { op: "networks", planId: r.planId, platforms: wanted });
          else {
            const res = await post("/api/zpost", { op: "networks", postId: r.id, platforms: wanted, confirm: word.value });
            if (res.matches === false) toast(t("nwCheck"));
          }
          closeModal(() => { toast(t("nwSaved")); lastSig = ""; lastZSig = ""; load(false); loadZernio(); });
        } catch (e) { err.textContent = e.message; save.disabled = false; }
      } }, t("nwSave"));
      word.addEventListener("keydown", (e) => { if (e.key === "Enter") save.click(); });
      body.append(el("div", { class: "label kicker", style: "color:var(--accent-ink)" }, t("nwKicker")),
        el("h2", { id: "mTitle", dir: "auto" }, ((r.caption || "").split("\n")[0] || "—").slice(0, 80)),
        el("p", { class: "hint" }, t(editable ? (local ? "nwHintLocal" : "nwHint") : "nwHintPub")), list,
        editable && !local && boxes.length ? el("div", { class: "field" }, el("label", { class: "label" }, t("nwType")), word) : null, err,
        el("div", { class: "actions" }, el("button", { class: "btn", type: "button", onclick: () => closeModal(renderQuestion) }, t("cancel")), editable && boxes.length ? save : null));
    };
    modal.open ? closeModal(() => showModal("netedit", build)) : showModal("netedit", build);
  }
  function openRemoveOne(r, pf, a) {
    const build = (body) => {
      const err = el("div", { class: "err", role: "alert" });
      const word = el("input", { type: "text", class: "typed", placeholder: "remove", autocomplete: "off", spellcheck: "false" });
      const go_ = el("button", { class: "btn danger big", type: "button", onclick: async () => {
        err.textContent = ""; go_.disabled = true;
        try { await post("/api/zpost", { op: "unpublish", postId: r.id, platform: pf, accountId: a.id, confirm: word.value });
          closeModal(() => { toast(t("nwRemoved").replace("{p}", NET_NAME[pf] || pf)); lastSig = ""; lastZSig = ""; load(false); loadZernio(); }); }
        catch (e) { err.textContent = e.message; go_.disabled = false; }
      } }, t("nwRemove").replace("{p}", NET_NAME[pf] || pf));
      body.append(el("div", { class: "label kicker", style: "color:var(--bps-danger)" }, t("nwKicker")),
        el("h2", { id: "mTitle" }, t("nwRemoveTitle").replace("{p}", NET_NAME[pf] || pf)),
        el("p", { class: "hint" }, t("nwRemoveHint")),
        el("div", { class: "field" }, el("label", { class: "label" }, t("nwTypeRemove")), word), err,
        el("div", { class: "actions" }, el("button", { class: "btn", type: "button", onclick: () => closeModal(renderQuestion) }, t("cancel")), go_));
    };
    modal.open ? closeModal(() => showModal("netremove", build)) : showModal("netremove", build);
  }
  function openNets(r) {
    const build = (body) => {
      const postWhen = r.scheduledFor;
      body.append(el("div", { class: "label kicker", style: "color:var(--accent-ink)" }, t("nsTitle2")),
        el("h2", { id: "mTitle", style: "unicode-bidi:plaintext" }, ((r.caption || "").split("\n")[0] || "—").slice(0, 90)),
        el("div", { class: "zrow-head" }, badge(r.status), kindChip(r)));
      const list = el("div", { class: "nets-list" });
      (r.platforms || []).forEach((p) => {
        const when = p.publishedAt || postWhen;
        list.append(el("div", { class: "nets-row" },
          el("div", { class: "nets-name" }, el("span", { class: "net n-" + p.platform }, NET[p.platform] || p.platform), el("b", {}, NET_NAME[p.platform] || p.platform),
            p.trial ? el("small", { class: "conf medium" }, t("trialShort")) : null),
          el("dl", { class: "nets-facts" },
            el("dt", {}, t("nsAccount")), el("dd", {}, p.account ? "@" + p.account : "—"),
            el("dt", {}, t("nsStatusOf")), el("dd", {}, badge(p.status || r.status)),
            el("dt", {}, t("nsWhen")), el("dd", {}, when ? dtFull(when) : t("nsNoTime"))),
          p.url ? el("a", { href: p.url, target: "_blank", rel: "noopener" }, t("nsOpen").replace("{p}", NET_NAME[p.platform] || p.platform)) : null,
          p.error ? el("div", { class: "zerr" }, (p.errorCategory ? p.errorCategory + ": " : "") + p.error) : null));
      });
      body.append(list);
      if (r.local) body.append(el("p", { class: "hint" }, t("nsLocalNote")));
      body.append(el("div", { class: "actions" },
        el("button", { class: "btn", type: "button", onclick: () => closeModal(() => openPostDetail(r)) }, t("nsOpenPost")),
        !r.outside ? el("button", { class: "btn nw-btn", type: "button", onclick: () => openNetEdit(r) }, "⇆ " + t("nwBtn")) : null,
        el("button", { class: "btn on", type: "button", onclick: () => closeModal(renderQuestion) }, t("close"))));
    };
    modal.open ? closeModal(() => showModal("nets", build)) : showModal("nets", build);
  }
  const netTag = (p) => el("span", { class: "net n-" + p.platform, title: p.platform + (p.account ? " @" + p.account : "") }, NET[p.platform] || p.platform, p.account ? el("small", {}, "@" + p.account) : null);
  /* ---------- post viewer: every slide, the full video, or the PDF ---------- */
  let curViewer = null;
  function viewerItems(r) {
    if (r.local) return (r.mediaList || []).map((m) => ({ type: m.kind, url: planMedia(r.planId, m.file) }));
    return (r.items || []).map((m) => ({ ...m, type: m.type === "document" || /\.pdf($|\?)/i.test(m.url) ? "document" : m.type }));
  }
  // find a post's full row (media for the viewer) from its link or platform post id
  function rowFor(url, platformPostId) {
    const norm = (u) => String(u || "").replace(/[?#].*$/, "").replace(/\/+$/, "");
    const rows = postRows();
    return (url && rows.find((r) => (r.platforms || []).some((p) => p.url && norm(p.url) === norm(url)))) ||
      (platformPostId && rows.find((r) => (r.platforms || []).some((p) => p.url && p.url.includes(platformPostId)))) || null;
  }
  const viewBtn = (row) => row ? el("button", { class: "btn sm view-btn", type: "button", onclick: (e) => { e.stopPropagation(); openPostDetail(row); } }, "▶ " + t("vView")) : null;
  // Which accounts this post goes to, per network (only shown when a network has
  // more than one connected account in Zernio). Saved at once; recorded in Changes.
  function renderTargets(p) {
    const host = $("#accTargets"); if (!host) return;
    const accs = ((state.z || {}).accounts || []).filter((a) => a.active !== false && !a.needsReconnection);
    const cfgAcc = ((state.data && state.data.config) || {}).accounts || {};
    const multi = (p.platforms || []).filter((pf) => accs.filter((a) => a.platform === pf).length > 1);
    host.innerHTML = "";
    if (!multi.length) { host.hidden = true; return; }
    host.hidden = false;
    const locked = ["published", "scheduled"].includes(p.status);
    host.append(el("div", { class: "label" }, t("tgAccounts")));
    multi.forEach((pf) => {
      const mine = accs.filter((a) => a.platform === pf);
      const chosen = ((p.targets || {})[pf] || []).length ? p.targets[pf] : [(cfgAcc[pf] || {}).id].filter(Boolean);
      const row = el("div", { class: "tg-row" }, el("b", {}, NET_NAME[pf] || pf));
      mine.forEach((a) => {
        const cb = el("input", { type: "checkbox", disabled: locked ? "" : null }); cb.checked = chosen.includes(a.id);
        cb.addEventListener("change", async () => {
          const next = mine.filter((x) => x.id === a.id ? cb.checked : chosen.includes(x.id)).map((x) => x.id);
          if (!next.length) { cb.checked = true; toast(t("tgOne")); return; }
          try { await post("/api/plan", { op: "targets", targets: { [pf]: next } }); toast(t("tgSaved")); lastSig = ""; load(false); }
          catch (e) { cb.checked = !cb.checked; toast(e.message); }
        });
        row.append(el("label", { class: "tg-acc" }, cb, el("span", {}, handle(a.username || "?")),
          a.followers != null ? el("small", {}, fmt(a.followers)) : null));
      });
      host.append(row);
    });
    host.append(el("small", { class: "hint" }, t(locked ? "tgLocked" : "tgHint")));
  }
  function postViewer(r) {
    const items = viewerItems(r);
    if (!items.length) return thumbEl(r, true);
    let i = 0;
    const stage = el("div", { class: "pv-stage" });
    const count = el("span", { class: "pv-count mono" });
    const dots = el("div", { class: "pv-dots" });
    const rtl = () => document.documentElement.dir === "rtl";
    const show = (n) => {
      stage.querySelectorAll("video").forEach((v) => v.pause());
      i = (n + items.length) % items.length;
      const m = items[i];
      stage.innerHTML = "";
      let node;
      const fail = () => { node.remove(); stage.append(el("div", { class: "pv-none" }, t("vNoMedia"))); };
      if (m.type === "video") node = el("video", { src: m.url, controls: true, playsinline: true, preload: "metadata", poster: m.thumb || null });
      else if (m.type === "document") node = el("div", { class: "pv-doc" }, el("iframe", { src: m.url, title: "PDF" }),
        el("a", { class: "btn", href: m.url, target: "_blank", rel: "noopener" }, t("vOpenDoc") + " ↗"));
      else node = el("img", { src: m.url, alt: "", referrerpolicy: "no-referrer" });
      if (node.tagName === "IMG" || node.tagName === "VIDEO") node.addEventListener("error", () => {
        if (m.thumb && node.src !== m.thumb && node.tagName === "IMG") node.src = m.thumb; else fail(); });
      stage.append(node);
      count.textContent = items.length > 1 ? `${i + 1} / ${items.length}` : "";
      dots.querySelectorAll("button").forEach((d, k) => d.classList.toggle("on", k === i));
    };
    const box = el("div", { class: "pv" }, stage);
    if (items.length > 1) {
      items.forEach((m, k) => dots.append(el("button", { type: "button", "aria-label": `${k + 1}`, onclick: () => show(k) })));
      box.append(
        el("button", { class: "pv-nav prev", type: "button", "aria-label": t("vPrev"), title: t("vPrev"), onclick: () => show(i - 1) }, "‹"),
        el("button", { class: "pv-nav next", type: "button", "aria-label": t("vNext"), title: t("vNext"), onclick: () => show(i + 1) }, "›"));
    }
    const bar = el("div", { class: "pv-bar" }, count, items.length > 1 ? dots : el("span"),
      el("button", { class: "btn icon-btn", type: "button", title: t("vFull"), "aria-label": t("vFull"),
        html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
        onclick: () => (document.fullscreenElement ? document.exitFullscreen() : box.requestFullscreen && box.requestFullscreen()) }));
    let x0 = null;
    stage.addEventListener("pointerdown", (e) => { x0 = e.clientX; });
    stage.addEventListener("pointerup", (e) => {
      if (x0 == null || items.length < 2) return; const dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) show(i + ((dx < 0) !== rtl() ? 1 : -1));
    });
    curViewer = { step: (d) => items.length > 1 && show(i + (rtl() ? -d : d)) };
    show(0);
    return el("div", { class: "pv-wrap" }, box, bar);
  }
  document.addEventListener("keydown", (e) => {
    if (modal.open !== "zpost" || !curViewer || /INPUT|TEXTAREA/.test((e.target || {}).tagName || "")) return;
    if (e.key === "ArrowRight") { e.preventDefault(); curViewer.step(1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); curViewer.step(-1); }
  });
  function openPostDetail(r) {
    const build = (body) => {
      const pollLeft = r.li && !(r.items || []).length && !r.media;     // a text poll/repost: the poll is the picture
      body.append(el("div", { class: "zdetail" }, pollLeft ? liPostedCard(r) : postViewer(r),
        el("div", {}, el("div", { class: "zrow-head" }, badge(r.status), kindChip(r),
            el("span", { class: "label" }, r.local ? t("zLocalHint") : r.outside ? t("zOutside") : (r.fromSkill ? t("zFromSkill") : t("zFromZernio")))),
          el("div", { class: "zfullcap", style: "unicode-bidi:plaintext" }, r.caption || "—"),
          r.li && !pollLeft ? liPostedCard(r) : null,
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
      const future = r.scheduledFor && Date.parse(r.scheduledFor) > Date.now();
      if (future && (r.local ? r.planId : ZEDIT.includes(r.status) && !r.outside)) {
        acts.append(el("button", { class: "btn", type: "button", onclick: () => confirmMove({ ...r, at: r.scheduledFor, row: r }, new Date(r.scheduledFor)) }, "⇄ " + t("pdMove")));
        if (!r.local) acts.append(el("button", { class: "btn", type: "button", onclick: () => openEditCaption(r) }, "✎ " + t("pdEdit")));
      }
      if (!r.local && ["failed", "partial"].includes(r.status)) acts.append(el("button", { class: "btn", type: "button",
        onclick: () => closeModal(() => sendNote(`Post ${r.id} ${r.status} in Zernio. Explain the error and help me fix and retry it.`)) }, t("zAskFix")));
      if (r.planId) acts.append(el("button", { class: "btn on", type: "button", onclick: () => closeModal(async () => {
        try { await post("/api/plan", { op: "select", id: r.planId }); lastSig = ""; await load(false); go("post"); } catch (e) { toast(e.message); } }) }, r.local ? t("zContinue") : t("zOpenPlan")));
      if (!r.outside && (r.local || ZEDIT.includes(r.status) || ["published", "partial"].includes(r.status)))
        acts.append(el("button", { class: "btn nw-btn", type: "button", onclick: () => openNetEdit(r) }, "⇆ " + t("nwBtn")));
      acts.append(el("button", { class: "btn cp-btn", type: "button", onclick: () => closeModal(() => { copyPost(r); go("plan"); }) }, "⧉ " + t("cpCopy")));
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
      el("small", {}, (a.needsReconnection || a.active === false) ? t("reconnect") : (a.followers != null ? fmt(a.followers) + " " + t("followers") : t("connected"))),
      a.followersUpdated && Date.parse(a.followersUpdated) ? el("small", { class: "fol-fresh" }, t("folFresh").replace("{t}", ago(Date.parse(a.followersUpdated) / 1000))) : null)));
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
            el("span", { class: "ztile-meta" }, netStack(r),
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
          netStack(r), when ? el("span", { class: "zwhen" }, dtFull(when)) : null),
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
    tiktok: "TikTok", snapchat: "Snapchat", youtube: "YouTube", pinterest: "Pinterest", bluesky: "Bluesky" };
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
  const IMG = { st: null, prompt: "", refs: [], edit: "", marks: [], maskOn: true, tool: "mark", brush: .06, forNP: false, shape: null, quality: null, n: null, model: null, busy: false, t0: 0, last: [], err: "", askedAt: 0, note: "" };
  async function imgApi(body) {
    let r, j = {};
    try { r = body ? await fetch("/api/images", { method: "POST", headers: { "Content-Type": "application/json", "X-BPS-Token": TOKEN }, body: JSON.stringify(body) })
                   : await fetch("/api/images", { cache: "no-store" }); }
    catch (e) { throw new Error(t("keyNoServer")); }
    try { j = await r.json(); } catch (e) {}
    if (!r.ok || !j.ok) throw new Error(j.error || ("HTTP " + r.status));
    return j;
  }
  const imgUrl = (g) => "/img?id=" + encodeURIComponent(g.id) + (g.v ? "&v=" + g.v : "");
  const refUrl = (p) => "/img?p=" + encodeURIComponent(p);
  async function imgRefresh() { IMG.st = await imgApi(); return IMG.st; }

  async function openImage(preset) {
    try { await imgRefresh(); } catch (e) { toast(e.message); return; }
    IMG.forNP = !!(preset && preset.forNP);
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

    // editing one picture: show it on top, the prompt says what changes
    const editIn = el("input", { type: "file", accept: "image/png,image/jpeg,image/webp", hidden: true });
    editIn.addEventListener("change", () => editFromPc(editIn.files[0]));
    if (IMG.edit) put(left, annotator());
    else put(left, el("div", { class: "row2" }, editIn,
      el("button", { class: "btn sm img-editpc-btn", type: "button", title: t("imgEditHint"), onclick: () => editIn.click() }, "✎ " + t("imgEditPc"))));

    // 1 · describe
    const ta = el("textarea", { rows: "5", class: "img-prompt", placeholder: IMG.edit ? t("imgEditPh") : t("imgPh"), "aria-label": IMG.edit ? t("imgEditStep") : t("imgStep1") });
    ta.value = IMG.prompt;
    ta.addEventListener("input", () => { IMG.prompt = ta.value; });
    ta.addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); runImage(); } });
    const sug = st.suggested && st.suggested.ts >= IMG.askedAt && IMG.askedAt ? st.suggested : null;
    if (!IMG.edit) put(left, el("div", { class: "img-step" }, el("span", { class: "n1" }, "1"), el("b", {}, t("imgStep1"))), ta,
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
        IMG.edit ? null : el("label", { class: "label" }, t("imgShape")),
        IMG.edit ? null : seg([["square", "■ " + t("shapeSquare")], ["tall", "▮ " + t("shapeTall")], ["wide", "▬ " + t("shapeWide")]], IMG.shape, (v) => { IMG.shape = v; redrawImage(); }),
        el("label", { class: "label" }, t("imgQuality")), seg([["draft", t("qDraft")], ["standard", t("qStandard")], ["best", t("qBest")]], IMG.quality, (v) => { IMG.quality = v; redrawImage(); }),
        el("label", { class: "label" }, t("imgCount")), seg([1, 2, 4].map((n) => [n, String(n)]), +IMG.n, (v) => { IMG.n = v; redrawImage(); }),
        el("label", { class: "label" }, t("imgModel")), sel),
      el("p", { class: "hint img-shapehint" }, IMG.edit ? "" : t("shapeHint_" + IMG.shape) + " · ", t("qHint_" + IMG.quality)),
      !isDefault ? el("button", { class: "btn sm ghost", type: "button", onclick: saveImgDefaults }, "★ " + t("imgMakeDefault")) : null);

    // go
    const go = el("button", { class: "btn on img-go", type: "button", disabled: IMG.busy ? "" : null, onclick: runImage },
      IMG.busy ? el("span", { class: "img-timer" }, t("imgMaking")) : IMG.edit ? "✎ " + t("imgEditGo") : (IMG.refs.length ? t("imgGoRefs").replace("{n}", IMG.refs.length) : t("imgGo")));
    put(left, go, IMG.err ? el("div", { class: "key-msg bad" }, "✗ " + IMG.err) : null,
      el("p", { class: "hint" }, t("imgWhere")));
    if (IMG.busy) tickTimer(go);

    // results + your images
    if (IMG.busy) put(right, el("div", { class: "img-step" }, el("b", {}, t("imgMakingN").replace("{n}", IMG.n))),
      el("div", { class: "img-tiles" }, ...Array.from({ length: +IMG.n }, () => el("div", { class: "img-tile ghost shape-" + (IMG.edit ? "square" : IMG.shape) }))));
    if (IMG.last.length) put(right, el("div", { class: "img-step" }, el("b", {}, t("imgNew"))), el("div", { class: "img-tiles" }, ...IMG.last.map((g) => imgTile(g, true))));
    const older = st.gallery.filter((g) => !IMG.last.some((x) => x.id === g.id));
    put(right, el("div", { class: "img-step" }, el("b", {}, t("imgMine")), el("span", { class: "label" }, String(st.gallery.length))),
      st.gallery.length > 1 ? el("button", { class: "btn sm", type: "button", onclick: () => openNewPost({ pick: "mine" }) }, "▦ " + t("npCarouselFromMine")) : null,
      older.length ? el("div", { class: "img-tiles small" }, ...older.slice(0, 24).map((g) => imgTile(g))) : el("p", { class: "hint" }, t("imgNone")));
  }

  /* ---------- edit with marks: pins and areas on the picture, a note each ---------- */
  function startEdit(path) {
    Object.assign(IMG, { edit: path, prompt: "", last: [], marks: [], err: "" });
    redrawImage(); $("#modalBody").scrollTop = 0;
  }
  const pct = (v) => Math.round(v * 100) + "%";
  const bounds = (pts) => { const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
    return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }; };
  function markWhere(m) {
    if (m.pts) {
      const b = bounds(m.pts);
      return markWhere({ type: "box", ...b }).replace("In the marked area", m.type === "paint" ? "In the painted area" : "Inside the circled area");
    }
    const cx = m.type === "box" ? m.x + m.w / 2 : m.x, cy = m.type === "box" ? m.y + m.h / 2 : m.y;
    const words = (cy < .34 ? "top" : cy > .66 ? "bottom" : "middle") + "-" + (cx < .34 ? "left" : cx > .66 ? "right" : "center");
    return m.type === "box"
      ? `In the marked area ${pct(m.x)}-${pct(m.x + m.w)} from the left and ${pct(m.y)}-${pct(m.y + m.h)} from the top (${words})`
      : `At the marked spot about ${pct(m.x)} from the left and ${pct(m.y)} from the top (${words})`;
  }
  function editRequest() {
    const bad = IMG.marks.findIndex((m) => !m.note.trim());
    if (bad >= 0) return { err: t("annNeedNote").replace("{n}", bad + 1) };
    const gen = IMG.prompt.trim();
    if (!IMG.marks.length && !gen) return { err: t("annNeed") };
    const notes = IMG.marks.map((m, i) => `${i + 1}. ${markWhere(m)}: ${m.note.trim()}`);
    const prompt = (notes.length ? "Make these changes at the marked places:\n" + notes.join("\n") : "") + (gen ? (notes.length ? "\nAlso: " : "") + gen : "");
    return { prompt, notes };
  }
  // the marks as filled shapes on a W×H canvas context (pad grows each shape a little)
  function paintMarks(g, W, H, pad) {
    const r = Math.min(W, H) * .09;
    IMG.marks.forEach((m) => {
      g.beginPath();
      if (m.pts) {
        m.pts.forEach((p, k) => (k ? g.lineTo(p.x * W, p.y * H) : g.moveTo(p.x * W, p.y * H)));
        g.lineCap = g.lineJoin = "round";
        if (m.type === "lasso") { g.closePath(); g.fill(); g.lineWidth = 2 * pad; g.stroke(); }
        else { if (m.pts.length === 1) g.lineTo(m.pts[0].x * W + .1, m.pts[0].y * H); g.lineWidth = m.size * Math.min(W, H) + 2 * pad; g.stroke(); }
        return;
      }
      if (m.type === "box") g.rect(m.x * W - pad, m.y * H - pad, m.w * W + 2 * pad, m.h * H + 2 * pad);
      else g.arc(m.x * W, m.y * H, r + pad, 0, Math.PI * 2);
      g.fill();
    });
  }
  const loadImg = (src) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error("A picture couldn't be read.")); im.src = src; });
  // Guarantee: the edited pixels only inside the marks (soft edge), the original everywhere else.
  async function keepOutside(g) {
    const [orig, edited] = await Promise.all([loadImg(refUrl(IMG.edit)), loadImg(imgUrl(g))]);
    const W = orig.naturalWidth, H = orig.naturalHeight, mn = Math.min(W, H);
    const soft = document.createElement("canvas"); soft.width = W; soft.height = H;
    const sg = soft.getContext("2d");
    sg.filter = `blur(${Math.max(2, Math.round(mn * .008))}px)`;
    sg.fillStyle = sg.strokeStyle = "#fff";
    paintMarks(sg, W, H, mn * .015);
    const ed = document.createElement("canvas"); ed.width = W; ed.height = H;
    const eg = ed.getContext("2d");
    eg.drawImage(edited, 0, 0, W, H);                        // same framing, original size
    eg.globalCompositeOperation = "destination-in"; eg.drawImage(soft, 0, 0);
    const out = document.createElement("canvas"); out.width = W; out.height = H;
    const og = out.getContext("2d");
    og.drawImage(orig, 0, 0); og.drawImage(ed, 0, 0);
    const r = await imgApi({ op: "keep_outside", id: g.id, data: out.toDataURL("image/png") });
    return r.image;
  }
  // OpenAI answers in 3 sizes; send the picture at the nearest one so the
  // answer lines up exactly with the original when it's scaled back
  const EDIT_SIZES = { square: [1024, 1024], tall: [1024, 1536], wide: [1536, 1024] };
  async function editSource() {
    const im = await loadImg(refUrl(IMG.edit));
    const r = im.naturalWidth / im.naturalHeight, shape = r < .83 ? "tall" : r > 1.2 ? "wide" : "square";
    const [W, H] = EDIT_SIZES[shape], c = document.createElement("canvas");
    c.width = W; c.height = H; c.getContext("2d").drawImage(im, 0, 0, W, H);
    const up = await imgApi({ op: "upload", name: "edit-source.png", data: c.toDataURL("image/png") });
    return { path: up.path, shape, W, H };
  }
  // transparent where the marks are = the only places OpenAI may change
  function editMask(size) {
    return new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => {
        const W = size ? size.W : im.naturalWidth, H = size ? size.H : im.naturalHeight, c = document.createElement("canvas");
        c.width = W; c.height = H;
        const g = c.getContext("2d");
        g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
        g.globalCompositeOperation = "destination-out";
        g.fillStyle = g.strokeStyle = "#000";
        paintMarks(g, W, H, Math.min(W, H) * .02);
        res(c.toDataURL("image/png"));
      };
      im.onerror = () => rej(new Error("The picture couldn't be read for the mask."));
      im.src = refUrl(IMG.edit);
    });
  }
  function annotator() {
    const img = el("img", { src: refUrl(IMG.edit), alt: "", draggable: "false" });
    const layer = el("div", { class: "ann-layer" });
    const stage = el("div", { class: "ann-stage", title: t("annHint") }, img, layer);
    const list = el("ol", { class: "ann-list" });
    const wrap = el("div", { class: "ann" });
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "ann-svg"); svg.setAttribute("preserveAspectRatio", "none");
    const dims = () => { const W = img.naturalWidth || 1000, H = img.naturalHeight || 1000; svg.setAttribute("viewBox", `0 0 ${W} ${H}`); return { W, H }; };
    const pathFor = (m, cls) => {
      const { W, H } = dims(), d = m.pts.map((p, k) => (k ? "L" : "M") + (p.x * W).toFixed(1) + " " + (p.y * H).toFixed(1)).join(" ");
      const n = document.createElementNS(NS, "path");
      n.setAttribute("d", d + (m.type === "lasso" ? " Z" : (m.pts.length === 1 ? " l0.1 0" : "")));
      n.setAttribute("class", "ann-path " + m.type + (cls ? " " + cls : ""));
      if (m.type === "paint") n.setAttribute("stroke-width", String(m.size * Math.min(W, H)));
      return n;
    };
    const drawMarks = () => {
      layer.innerHTML = ""; svg.innerHTML = ""; layer.append(svg);
      IMG.marks.forEach((m, i) => {
        const tag = el("button", { class: "ann-n", type: "button", "aria-label": String(i + 1), onclick: (e) => { e.stopPropagation(); focusNote(i); } }, String(i + 1));
        if (m.pts) {
          svg.append(pathFor(m));
          layer.append(el("div", { class: "ann-pin tagonly", style: `left:${pct(m.pts[0].x)};top:${pct(m.pts[0].y)}` }, tag));
          return;
        }
        layer.append(m.type === "box"
          ? el("div", { class: "ann-box", style: `left:${pct(m.x)};top:${pct(m.y)};width:${pct(m.w)};height:${pct(m.h)}` }, tag)
          : el("div", { class: "ann-pin", style: `left:${pct(m.x)};top:${pct(m.y)}` }, tag));
      });
    };
    const focusNote = (i) => { const ta = list.querySelectorAll("textarea")[i]; if (ta) ta.focus(); };
    const drawList = () => {
      list.innerHTML = "";
      if (!IMG.marks.length) list.append(el("li", { class: "hint ann-empty" }, t("annNone")));
      IMG.marks.forEach((m, i) => {
        const ta = el("textarea", { rows: "2", placeholder: t("annNote"), "aria-label": t("annNote") + " " + (i + 1) });
        ta.value = m.note;
        ta.addEventListener("input", () => { m.note = ta.value; });
        ta.addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); runImage(); } });
        list.append(el("li", {}, el("span", { class: "ann-n" }, String(i + 1)), ta,
          el("button", { class: "btn sm danger-ghost", type: "button", "aria-label": t("remove"), onclick: () => { IMG.marks.splice(i, 1); drawMarks(); drawList(); } }, "×")));
      });
      clearBtn.hidden = !IMG.marks.length;
    };
    // click = pin, drag = area (positions are 0..1 of the picture)
    let start = null, ghost = null;
    const at = (e) => { const r = img.getBoundingClientRect(); return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) }; };
    let stroke = null, live = null;
    stage.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || e.target.closest(".ann-n")) return;
      e.preventDefault(); stage.setPointerCapture(e.pointerId); start = at(e);
      if (IMG.tool !== "mark") { stroke = { type: IMG.tool, pts: [start], size: IMG.brush, note: "" }; live = pathFor(stroke, "live"); svg.append(live); }
    });
    stage.addEventListener("pointermove", (e) => {
      if (!start) return;
      if (stroke) {
        const p = at(e), q = stroke.pts[stroke.pts.length - 1];
        if (Math.hypot(p.x - q.x, p.y - q.y) < .004) return;
        stroke.pts.push(p); const n = pathFor(stroke, "live"); live.replaceWith(n); live = n;
        return;
      }
      const p = at(e), x = Math.min(start.x, p.x), y = Math.min(start.y, p.y), w = Math.abs(p.x - start.x), h = Math.abs(p.y - start.y);
      if (w < .02 && h < .02) return;
      if (!ghost) { ghost = el("div", { class: "ann-box ghost" }); layer.append(ghost); }
      Object.assign(ghost.style, { left: pct(x), top: pct(y), width: pct(w), height: pct(h) });
    });
    stage.addEventListener("pointerup", (e) => {
      if (!start) return;
      if (stroke) {
        const ok = stroke.type === "paint" || stroke.pts.length > 4;    // a loop needs a real shape
        if (ok) IMG.marks.push(stroke);
        start = null; stroke = null; live = null;
        drawMarks(); drawList(); if (ok) focusNote(IMG.marks.length - 1);
        return;
      }
      const p = at(e), w = Math.abs(p.x - start.x), h = Math.abs(p.y - start.y);
      IMG.marks.push(w < .02 && h < .02 ? { type: "pin", x: start.x, y: start.y, note: "" }
        : { type: "box", x: Math.min(start.x, p.x), y: Math.min(start.y, p.y), w, h, note: "" });
      start = null; ghost = null;
      drawMarks(); drawList(); focusNote(IMG.marks.length - 1);
    });
    stage.addEventListener("pointercancel", () => { start = null; stroke = null; if (live) live.remove(); live = null; if (ghost) ghost.remove(); ghost = null; });
    img.addEventListener("load", drawMarks);
    // tools
    const tools = el("div", { class: "ann-tools" });
    const drawTools = () => {
      tools.innerHTML = "";
      tools.append(seg([["mark", "● " + t("annToolMark")], ["paint", "🖌 " + t("annToolPaint")], ["lasso", "◯ " + t("annToolLasso")]], IMG.tool,
        (v) => { IMG.tool = v; stage.dataset.tool = v; drawTools(); }));
      if (IMG.tool === "paint") tools.append(el("span", { class: "label" }, t("annSize")),
        seg([[.03, "S"], [.06, "M"], [.12, "L"]], IMG.brush, (v) => { IMG.brush = v; drawTools(); }));
      tools.append(el("small", { class: "hint" }, t({ mark: "annToolMarkHint", paint: "annToolPaintHint", lasso: "annToolLassoHint" }[IMG.tool])));
    };
    stage.dataset.tool = IMG.tool; drawTools();
    const general = el("textarea", { rows: "2", class: "img-prompt", placeholder: t("imgEditPh"), "aria-label": t("annGeneral") });
    general.value = IMG.prompt;
    general.addEventListener("input", () => { IMG.prompt = general.value; });
    general.addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); runImage(); } });
    const maskBox = el("input", { type: "checkbox", checked: IMG.maskOn ? "" : null });
    maskBox.addEventListener("change", () => { IMG.maskOn = maskBox.checked; });
    const clearBtn = el("button", { class: "btn sm ann-clear", type: "button", onclick: () => { IMG.marks = []; drawMarks(); drawList(); } }, t("annClear"));
    const fsBtn = el("button", { class: "btn sm ann-fs", type: "button", onclick: () => (document.fullscreenElement ? document.exitFullscreen() : wrap.requestFullscreen && wrap.requestFullscreen()) }, "⛶ " + t("vFull"));
    wrap.addEventListener("fullscreenchange", () => { fsBtn.textContent = document.fullscreenElement ? t("annExit") : "⛶ " + t("vFull"); });
    wrap.append(
      el("div", { class: "ann-head" }, el("b", {}, "✎ " + t("imgEditing")), el("span", { class: "grow" }),
        fsBtn, el("button", { class: "btn sm", type: "button", onclick: () => { IMG.edit = ""; IMG.marks = []; redrawImage(); } }, t("imgEditCancel"))),
      el("p", { class: "hint" }, t("annHint")), tools,
      el("div", { class: "ann-body" }, stage,
        el("div", { class: "ann-side" }, list, clearBtn,
          el("label", { class: "label" }, t("annGeneral")), general,
          el("label", { class: "ann-mask" }, maskBox, el("span", {}, el("b", {}, t("annMaskOn")), el("small", { class: "hint" }, t("annMaskHint")))),
          el("button", { class: "btn on ann-go", type: "button", disabled: IMG.busy ? "" : null, onclick: runImage },
            IMG.keeping ? t("annKeeping") : IMG.busy ? el("span", { class: "img-timer" }, t("annWorking")) : "✎ " + t("imgEditGo")),
          IMG.err ? el("div", { class: "key-msg bad", role: "alert" }, "✗ " + IMG.err) : null,
          IMG.last.length && IMG.lastFor === IMG.edit ? el("div", { class: "ann-result" },
            el("b", {}, "✓ " + t("annResult")),
            IMG.last.some((g) => g.kept === "outside") ? el("p", { class: "hint" }, t("annKeptHint")) : null,
            el("p", { class: "hint" }, t("annResultHint")),
            el("div", { class: "img-tiles" }, ...IMG.last.map((g) => imgTile(g, true)))) : null,
          el("p", { class: "hint" }, t("imgEditKeep")))));
    drawMarks(); drawList();
    return wrap;
  }

  function tickTimer(btn) {
    clearInterval(IMG.tick);
    IMG.tick = setInterval(() => {
      if (!IMG.busy || modal.open !== "image") return clearInterval(IMG.tick);
      const s = Math.round((Date.now() - IMG.t0) / 1000);
      document.querySelectorAll("#modalBody .img-timer").forEach((sp) => { sp.textContent = (IMG.edit ? t("annWorking") : t("imgMaking")) + " " + s + " s"; });
    }, 500);
  }

  function imgTile(g, big) {
    const st = IMG.st, canPost = st.post && st.post.editable;
    const fig = el("figure", { class: "img-tile shape-" + g.shape + (big ? " big" : "") },
      el("a", { href: imgUrl(g), target: "_blank", rel: "noopener", title: g.prompt }, el("img", { src: imgUrl(g), alt: g.prompt.slice(0, 120), loading: "lazy" })),
      el("figcaption", {}, el("span", { class: "label" }, g.model + " · " + t("q" + g.quality[0].toUpperCase() + g.quality.slice(1)) + (g.refs && g.refs.length ? " · " + g.refs.length + " " + t("imgGuides") : "")),
        el("div", { class: "row2 img-acts" },
          IMG.forNP ? el("button", { class: "btn sm on keep img-tonp-btn", type: "button", onclick: () => imgToNewPost(g) }, "＋ " + t("imgToNP")) : null,
          el("button", { class: "btn sm img-folder-btn" + (big && !IMG.forNP ? " on" : ""), type: "button", onclick: () => imgToPost(g, canPost) }, canPost ? "＋ " + t("imgAddPost") : t("imgSaveFolder")),
          el("button", { class: "btn sm keep img-edit-btn", type: "button", title: t("imgEditHint"), onclick: () => startEdit(".bps/images/" + g.file) }, "✎ " + t("imgEdit")),
          el("button", { class: "btn sm img-saveas-btn", type: "button", title: t("imgSaveAsHint"), onclick: () => imgSaveAs(g) }, t("imgSaveAs")),
          IMG.forNP ? null : el("button", { class: "btn sm", type: "button", title: t("npFromImageHint"), onclick: () => openNewPost({ images: [g] }) }, "＋ " + t("npFromImage")),
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
    let ed = null;
    if (IMG.edit) {
      ed = editRequest();
      if (ed.err) { IMG.err = ed.err; redrawImage(); return; }
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    } else if (!IMG.prompt.trim()) { IMG.err = t("imgNeedPrompt"); redrawImage(); $(".img-prompt") && $(".img-prompt").focus(); return; }
    IMG.busy = true; IMG.err = ""; IMG.t0 = Date.now(); IMG.picker = null; redrawImage();
    try {
      const masked = ed && IMG.maskOn && IMG.marks.length;
      const src = masked ? await editSource() : null;
      const mask = masked ? await editMask(src) : "";
      const r = await imgApi({ op: "generate", prompt: ed ? ed.prompt : IMG.prompt, refs: IMG.refs, model: IMG.model,
                               shape: src ? src.shape : IMG.edit ? "auto" : IMG.shape,
                               quality: IMG.quality, n: IMG.n, editOf: src ? src.path : IMG.edit || "", mask, notes: ed ? ed.notes : [] });
      if (mask && r.images.length) {
        IMG.keeping = true; redrawImage();
        r.images = await Promise.all(r.images.map((g) => keepOutside(g).catch((e) => { IMG.err = e.message; return g; })));
      }
      IMG.last = r.images; IMG.lastFor = IMG.edit;
      if (r.errors && r.errors.length) IMG.err = r.errors[0];
      toast(t("imgDone").replace("{n}", r.images.length).replace("{s}", Math.round(r.secs)));
      await imgRefresh();
    } catch (e) { IMG.err = e.message; }
    finally {
      IMG.busy = false; IMG.keeping = false; redrawImage();
      const hit = $(".ann-result") || ($(".ann .key-msg.bad"));
      if (hit) hit.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
    }
  }

  async function imgToPost(g, canPost) {
    let folder = "", r;
    try {
      if (!canPost) {
        try { r = await imgApi({ op: "copy", id: g.id, pick: true }); }
        catch (e) {
          if (e.message !== "no-native-picker") throw e;
          toast(t("imgNoPicker"));
          folder = prompt(t("imgFolderAsk"), (IMG.st.post && IMG.st.post.folder) || "my-posts/new-post");
          if (!folder) return;
        }
        if (r && r.cancelled) return;
      }
      r = r || await imgApi({ op: "copy", id: g.id, folder });
      toast(r.addedToPost ? t("imgAddedPost").replace("{f}", r.file) : t("imgSavedTo").replace("{f}", r.folder + "/" + r.file));
      lastSig = ""; load(false); await imgRefresh(); redrawImage();
    } catch (e) { toast(e.message); }
  }

  async function imgSaveAs(g) {
    try {
      const r = await imgApi({ op: "saveas", id: g.id });
      if (!r.cancelled) toast(t("imgSavedAs").replace("{f}", r.path));
    } catch (e) {
      if (e.message !== "no-native-picker") return toast(e.message);
      const a = el("a", { href: imgUrl(g), download: g.file }); document.body.append(a); a.click(); a.remove();   // browser download instead
    }
  }

  async function editFromPc(f) {
    if (!f) return;
    if (!/^image\/(png|jpeg|webp)$/.test(f.type)) { toast(t("imgBadFile")); return; }
    if (f.size > 20 * 1024 * 1024) { toast(t("imgTooBig")); return; }
    const data = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
    try { const r = await imgApi({ op: "upload", name: f.name, data }); startEdit(r.path); }
    catch (e) { toast(e.message); }
  }

  // New post → "Create an image": make it, then bring it back into the new post
  function imgToNewPost(g) {
    IMG.forNP = false;
    if (!NP.items.some((x) => x.image === g.id)) NP.items.push({ image: g.id, name: g.prompt.slice(0, 40), kind: "image" });
    closeModal(() => showModal("np", (b) => drawNewPost(b)));
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

  /* ---------- Hook A/B test: two Instagram Trial Reels (non-followers only), compare, share the winner ---------- */
  const AB = { word: "", busy: "", err: "", asked: 0, timer: 0, capB: null, tests: null };
  async function abApi(body) {
    let r, j = {};
    try { r = await fetch("/api/abtest", { method: "POST", headers: { "Content-Type": "application/json", "X-BPS-Token": TOKEN }, body: JSON.stringify(body) }); }
    catch (e) { throw new Error(t("keyNoServer")); }
    try { j = await r.json(); } catch (e) {}
    if (!r.ok || !j.ok) throw new Error(j.error || ("HTTP " + r.status));
    return j;
  }
  function abEligible(p) { return !!(p && (p.platforms || []).includes("instagram") && ((p.types || {}).instagram || p.type) === "reel" && !["published", "scheduled"].includes(p.status)); }
  function openAbTest() {
    const p = state.data && state.data.plan;
    if (!abEligible(p)) { toast(t("abNotReel")); return; }
    Object.assign(AB, { word: "", busy: "", err: "", capB: null });
    const build = (body) => drawAbTest(body);
    modal.open ? closeModal(() => showModal("abtest", build)) : showModal("abtest", build);
  }
  function redrawAB() { if (modal.open === "abtest") { const b = $("#modalBody"), k = b.scrollTop; b.innerHTML = ""; drawAbTest(b); b.scrollTop = k; } }
  function abWaitHook() {
    clearInterval(AB.timer);
    const before = ((state.data.plan || {}).abtest || {}).captionB || "", until = Date.now() + 5 * 60000;
    AB.timer = setInterval(async () => {
      if (modal.open !== "abtest" || Date.now() > until) { clearInterval(AB.timer); return; }
      lastSig = ""; await load(false);
      const ab = (state.data.plan || {}).abtest || {};
      if (ab.via === "claude" && (ab.captionB || "") !== before) { AB.capB = null; AB.asked = 0; clearInterval(AB.timer); redrawAB(); toast(t("abHookIn")); }
    }, 4000);
  }
  function drawAbTest(body) {
    const p = state.data.plan, ab = p.abtest || {};
    const capA = (p.captions || {}).instagram || "";
    if (AB.capB === null) AB.capB = ab.captionB || capA;
    const cands = p.coverCandidates || [];
    const coverA = p.cover ? el("img", { src: planMedia(p.id, "cover"), alt: "" }) : el("div", { class: "np-vid" }, "▶");
    const ta = el("textarea", { rows: "7", class: "ab-cap", style: "unicode-bidi:plaintext", "aria-label": t("abCapB") }); ta.value = AB.capB;
    const isSame = () => AB.capB.trim() === capA.trim() && !ab.coverB;
    const sync = () => { goBtn.disabled = AB.word.trim().toLowerCase() !== "go" || isSame() || !!AB.busy; sameMsg.hidden = !isSame(); };
    ta.addEventListener("input", () => { AB.capB = ta.value; sync(); });
    ta.addEventListener("change", () => abApi({ op: "setup", captionB: ta.value }).catch((e) => toast(e.message)));
    const same = AB.capB.trim() === capA.trim() && !ab.coverB;
    const sameMsg = el("p", { class: "warn-msg", hidden: same ? null : "" }, t("abSame"));
    const asking = AB.asked && Date.now() - AB.asked < 5 * 60000;
    const coverPick = el("div", { class: "ab-covers" },
      el("button", { class: "btn sm" + (!ab.coverB ? " on" : ""), type: "button", onclick: async () => { await abApi({ op: "setup", coverB: "" }); lastSig = ""; await load(false); redrawAB(); } }, t("abSameCover")),
      ...cands.map((c) => { const k = c.kind + ":" + c.n; return el("button", { class: "ab-cv" + (ab.coverB === k ? " on" : ""), type: "button", title: k,
        onclick: async () => { try { await abApi({ op: "setup", coverB: k }); lastSig = ""; await load(false); redrawAB(); } catch (e) { toast(e.message); } } }, el("img", { src: planMedia(p.id, k), alt: k })); }));
    const sched = (p.schedule || {}).at;
    const others = (p.platforms || []).filter((x) => x !== "instagram");
    const word = el("input", { type: "text", class: "ab-word", value: AB.word, placeholder: "go", spellcheck: "false", autocomplete: "off" });
    const goBtn = el("button", { class: "btn on big ab-go", type: "button", disabled: AB.word.trim().toLowerCase() !== "go" || same || AB.busy ? "" : null, onclick: async () => {
      AB.busy = t("abStarting"); AB.err = ""; redrawAB();
      try {
        await abApi({ op: "setup", captionB: AB.capB });
        const r = await abApi({ op: "start", confirm: AB.word });
        AB.busy = ""; AB.word = ""; AB.tests = null; toast(t("abStarted")); lastSig = ""; await load(false);
        closeModal(() => openAbResults(r.test.id));
      } catch (e) { AB.err = e.message; AB.busy = ""; redrawAB(); } } }, AB.busy || t("abStart"));
    word.addEventListener("input", () => { AB.word = word.value; sync(); });
    put(body, el("div", { class: "label kicker", style: "color:var(--accent-ink)" }, "🅰🅱 " + t("abKicker")),
      el("h2", { id: "mTitle" }, t("abTitle")), el("p", { class: "hint" }, t("abSub")),
      el("div", { class: "ab-cols" },
        el("div", { class: "ab-col" }, el("h3", {}, "A · " + t("abYours")), el("div", { class: "ab-cover" }, coverA),
          el("div", { class: "ab-hook", style: "unicode-bidi:plaintext" }, capA.split("\n")[0] || "—"),
          el("details", {}, el("summary", {}, t("abFullCap")), el("div", { class: "zfullcap", style: "unicode-bidi:plaintext" }, capA))),
        el("div", { class: "ab-col" }, el("h3", {}, "B · " + t("abOther")),
          el("label", { class: "label" }, t("abCoverB")), cands.length ? coverPick : el("p", { class: "hint" }, t("abNoCovers")),
          el("label", { class: "label" }, t("abCapB")), ta,
          el("button", { class: "btn sm ab-ask", type: "button", disabled: asking ? "" : null, onclick: async (e) => {
            try { await abApi({ op: "ask_hook" }); flyToClaude(e.target); AB.asked = Date.now(); abWaitHook(); redrawAB(); } catch (x) { toast(x.message); } } },
            asking ? t("abAsking") : "✨ " + t("abAsk")))),
      sameMsg,
      el("div", { class: "rc-sum" }, el("p", {}, t("abWhen").replace("{t}", sched ? dt(sched) : t("abNow"))),
        el("p", { class: "hint" }, t("abHow")),
        others.length ? el("p", { class: "hint" }, t("abOthers").replace("{n}", others.join(", "))) : null),
      el("label", { class: "label" }, t("abType")), word,
      AB.err ? el("div", { class: "key-msg bad" }, "✗ " + AB.err) : null,
      el("div", { class: "actions" }, el("button", { class: "btn", type: "button", onclick: () => closeModal(renderQuestion) }, t("close")), goBtn));
  }
  // results: side by side, the rule in plain words, and how to share the winner
  async function openAbResults(id) {
    let test = null, err = "";
    const build = (body) => {
      put(body, el("div", { class: "label kicker", style: "color:var(--accent-ink)" }, "🅰🅱 " + t("abKicker")), el("h2", { id: "mTitle" }, t("abResults")));
      if (!test) { body.append(err ? el("div", { class: "key-msg bad" }, "✗ " + err) : el("p", { class: "hint pulse" }, t("abChecking"))); return; }
      const ms = test.metrics || [{}, {}], v = test.verdict || {};
      const rows = [["views", "abViews", (x) => fmt(x)], ["reach", "reach", (x) => fmt(x)], ["reelsSkipRate", "abSkip", (x) => x == null ? "–" : Math.round(x * 100) + "%"],
        ["igReelsAvgWatchTime", "abWatch", (x) => x ? (x / 1000).toFixed(1) + "s" : "–"], ["likes", "abLikes", fmt], ["shares", "shares", fmt], ["saves", "saves", fmt], ["follows", "follows", fmt]];
      const tb = el("table", { class: "t ab-table" }, el("thead", {}, el("tr", {}, el("th", {}), ...["A", "B"].map((l) => el("th", { class: "n" + (v.winner === l ? " ab-win" : "") }, l + (v.winner === l ? " ★" : ""))))),
        el("tbody", {}, ...rows.map(([k, lbl, f]) => el("tr", {}, el("td", {}, t(lbl) || lbl), ...ms.map((m) => el("td", { class: "n" }, f(m[k])))))));
      const win = v.winner ? test.variants.find((x) => x.label === v.winner) : null, wm = win ? ms[v.winner === "A" ? 0 : 1] : null;
      put(body, el("div", { class: "ab-hooks" }, ...test.variants.map((x) => el("p", { style: "unicode-bidi:plaintext" }, el("b", {}, x.label + ": "), (x.caption || "").split("\n")[0]))),
        el("div", { class: "hscroll" }, tb),
        el("p", { class: v.winner ? "ok-msg" : "hint" }, (v.winner ? "★ " : "") + (v.why || "")),
        win ? el("div", { class: "rc-sum" }, el("p", {}, el("b", {}, t("abShareWin").replace("{l}", win.label))), el("p", { class: "hint" }, t("abShareHow")),
          wm && wm.url ? el("a", { class: "btn sm on", href: wm.url, target: "_blank", rel: "noopener" }, t("abOpenWin").replace("{l}", win.label) + " ↗") : null) : null,
        el("p", { class: "hint" }, t("abRule")),
        el("div", { class: "actions" }, el("button", { class: "btn", type: "button", onclick: () => { test = null; redraw(); fetchIt(); } }, "↻ " + t("abCheckAgain")),
          el("button", { class: "btn on", type: "button", onclick: () => closeModal(renderQuestion) }, t("close"))));
    };
    const redraw = () => { if (modal.open === "abres") { const b = $("#modalBody"); b.innerHTML = ""; build(b); } };
    const fetchIt = async () => { try { test = (await abApi({ op: "results", test: id })).test; AB.tests = null; } catch (e) { err = e.message; } redraw(); renderAbCard(); };
    modal.open ? closeModal(() => showModal("abres", build)) : showModal("abres", build);
    fetchIt();
  }
  async function renderAbCard() {
    const card = $("#abCard"), box = $("#abTests");
    if (!card) return;
    if (!AB.tests) { try { AB.tests = (await abApi({ op: "list" })).tests || []; } catch (e) { AB.tests = []; } }
    card.hidden = !AB.tests.length; box.innerHTML = "";
    AB.tests.slice(0, 6).forEach((x) => box.append(el("div", { class: "ab-row" },
      el("div", {}, el("b", { style: "unicode-bidi:plaintext" }, (x.variants[0].caption || "").split("\n")[0].slice(0, 70) || x.id),
        el("div", { class: "label" }, (x.at ? dt(x.at) : dt(new Date(x.created * 1000).toISOString())) + " · " +
          (x.verdict && x.verdict.winner ? t("abWinner").replace("{l}", x.verdict.winner) : x.verdict ? t("abNoWinner") : t("abRunning")))),
      el("button", { class: "btn sm ab-check", type: "button", onclick: () => openAbResults(x.id) }, t("abCheck")))));
  }

  /* ---------- Recycle your best posts: Zernio re-posts a published post every N weeks/months with new hooks ---------- */
  const RC = { list: null, pid: "", gap: 1, freq: "month", times: 3, start: "", vs: null, word: "", busy: "", err: "", done: null, asked: 0, timer: 0 };
  async function rcApi(body) {
    let r, j = {};
    try { r = await fetch("/api/recycle", { method: "POST", headers: { "Content-Type": "application/json", "X-BPS-Token": TOKEN }, body: JSON.stringify(body) }); }
    catch (e) { throw new Error(t("keyNoServer")); }
    try { j = await r.json(); } catch (e) {}
    if (!r.ok || !j.ok) throw new Error(j.error || ("HTTP " + r.status));
    return j;
  }
  const rcDay = (d) => { const z = new Date(d); z.setMinutes(z.getMinutes() - z.getTimezoneOffset()); return z.toISOString().slice(0, 10); };
  function rcDefaultStart() { const d = new Date(); RC.freq === "week" ? d.setDate(d.getDate() + 7 * RC.gap) : d.setMonth(d.getMonth() + RC.gap); return rcDay(d); }
  const rcEveryTxt = (n, u) => n === 1 ? t(u === "week" ? "rcEveryWeek" : "rcEveryMonth") : t("rcEveryN").replace("{n}", n).replace("{u}", t(u === "week" ? "rcWeeks" : "rcMonths"));
  function rcStateLine(s) {
    if (!s || !s.enabled) return "";
    const every = rcEveryTxt(s.gap || 1, s.gapFreq);
    const made = s.expireCount ? t("rcMadeOf").replace("{a}", s.recycleCount || 0).replace("{b}", s.expireCount) : t("rcMade").replace("{a}", s.recycleCount || 0);
    return "♻ " + every + " · " + made + (s.nextRecycleAt ? " · " + t("rcNext") + " " + dt(s.nextRecycleAt) : "");
  }
  async function openRecycle(pid) {
    Object.assign(RC, { pid: pid || "", word: "", busy: "", err: "", done: null, vs: null });
    const build = (body) => drawRecycle(body);
    modal.open ? closeModal(() => showModal("recycle", build)) : showModal("recycle", build);
    try { RC.list = await rcApi({ op: "list", n: 8 }); } catch (e) { RC.err = e.message; }
    if (RC.pid) await rcLoad();
    redrawRC();
  }
  async function rcLoad() {
    const row = rcRow();
    if (!row) return;
    try { const st = await rcApi({ op: "state", postId: RC.pid }); row.state = { ...(st.recycling || {}), status: st.status }; } catch (e) { RC.err = e.message; }
    const s = row.state || {};
    if (s.enabled) Object.assign(RC, { gap: s.gap || 1, freq: s.gapFreq || "month", times: s.expireCount || 0 });
    RC.vs = (row.draft && row.draft.variations && row.draft.variations.length) ? row.draft.variations.slice() : (s.contentVariations || []).slice();
    RC.start = rcDefaultStart();
  }
  const rcRow = () => ((RC.list || {}).posts || []).find((r) => r.postId === RC.pid);
  function redrawRC() { if (modal.open === "recycle") { const b = $("#modalBody"), k = b.scrollTop; b.innerHTML = ""; drawRecycle(b); b.scrollTop = k; } }
  function rcSaveVs() { rcApi({ op: "variations", postId: RC.pid, variations: RC.vs }).catch((e) => toast(e.message)); }
  function rcWaitHooks() {
    clearInterval(RC.timer);
    const since = RC.asked, until = Date.now() + 5 * 60000;
    RC.timer = setInterval(async () => {
      if (modal.open !== "recycle" || Date.now() > until) { clearInterval(RC.timer); return; }
      try {
        const l = await rcApi({ op: "list", n: 8 }); const r = (l.posts || []).find((x) => x.postId === RC.pid);
        if (r && r.draft && r.draft.ts * 1000 > since && r.draft.via === "claude") { RC.list = l; RC.vs = r.draft.variations.slice(); RC.asked = 0; clearInterval(RC.timer); redrawRC(); toast(t("rcHooksIn")); }
      } catch (e) {}
    }, 4000);
  }
  function rcMetrics(m) {
    return el("div", { class: "rc-metrics" }, ...[["follows", m.follows], ["rcSavesShares", (m.saves || 0) + (m.shares || 0)], ["reach", m.reach]]
      .map(([k, v]) => el("span", { class: "rc-chip" }, el("b", {}, fmt(v)), " " + t(k))));
  }
  function drawRecycle(body) {
    put(body, el("div", { class: "label kicker", style: "color:var(--accent-ink)" }, "♻ " + t("rcKicker")));
    const L = RC.list;
    if (!L) { body.append(el("h2", { id: "mTitle" }, t("rcTitle")), el("p", { class: "hint pulse" }, "…")); return; }
    if (!RC.pid) return drawRecycleList(body, L);
    const r = rcRow();
    if (!r) { RC.pid = ""; return drawRecycleList(body, L); }
    const s = r.state || {};
    const on = !!s.enabled;
    put(body, el("div", { class: "rc-head" }, r.thumb ? el("img", { src: r.thumb, alt: "", referrerpolicy: "no-referrer", loading: "lazy" }) : null,
        el("div", {}, el("h2", { id: "mTitle", style: "unicode-bidi:plaintext" }, (r.caption || "").split("\n")[0].slice(0, 90) || t("rcTitle")),
          el("div", { class: "label" }, r.platforms.join(" · ") + " · " + (r.publishedAt || "").slice(0, 10)), rcMetrics(r.metrics))),
      on ? el("p", { class: "ok-msg rc-on" }, rcStateLine(s)) : null,
      el("button", { class: "btn sm", type: "button", onclick: () => { RC.pid = ""; redrawRC(); } }, "← " + t("rcAll")));
    // rhythm
    const gapSel = el("select", { "aria-label": t("rcEvery") }, ...Array.from({ length: 12 }, (_, i) => el("option", { value: i + 1, selected: RC.gap === i + 1 ? "" : null }, String(i + 1))));
    gapSel.addEventListener("change", () => { RC.gap = +gapSel.value; RC.start = rcDefaultStart(); redrawRC(); });
    const timesSel = el("select", { "aria-label": t("rcStopAfter") }, el("option", { value: 0, selected: !RC.times ? "" : null }, t("rcUntilStop")),
      ...Array.from({ length: 12 }, (_, i) => el("option", { value: i + 1, selected: RC.times === i + 1 ? "" : null }, t("rcTimes").replace("{n}", i + 1))));
    timesSel.addEventListener("change", () => { RC.times = +timesSel.value; redrawRC(); });
    const startIn = el("input", { type: "date", value: RC.start, min: rcDay(new Date()) });
    startIn.addEventListener("change", () => { RC.start = startIn.value; redrawRC(); });
    put(body, el("h3", {}, t("rcRhythm")),
      el("div", { class: "rc-rhythm" }, el("span", {}, t("rcEvery")), gapSel, seg([["week", t("rcWeeks")], ["month", t("rcMonths")]], RC.freq, (v) => { RC.freq = v; RC.start = rcDefaultStart(); redrawRC(); }, "rc-freq")),
      el("div", { class: "rc-rhythm" }, el("span", {}, t("rcStopAfter")), timesSel),
      el("div", { class: "rc-rhythm" }, el("span", {}, t("rcFirst")), startIn));
    // versions
    const vs = RC.vs || [];
    const rows = vs.map((v, i) => {
      const ta = el("textarea", { rows: "4", style: "unicode-bidi:plaintext", "aria-label": t("rcVersion").replace("{n}", i + 1) }); ta.value = v;
      ta.addEventListener("change", () => { vs[i] = ta.value; rcSaveVs(); });
      return el("div", { class: "rc-v" }, el("div", { class: "row2" }, el("b", {}, t("rcVersion").replace("{n}", i + 1)),
        el("button", { class: "btn sm danger-ghost", type: "button", "aria-label": t("remove"), onclick: () => { vs.splice(i, 1); rcSaveVs(); redrawRC(); } }, "×")), ta);
    });
    const asking = RC.asked && Date.now() - RC.asked < 5 * 60000;
    put(body, el("h3", {}, t("rcVersions") + (vs.length ? " · " + vs.length : "")),
      el("p", { class: "hint" }, t("rcVersionsHint")),
      r.draft && r.draft.note ? el("p", { class: "hint" }, "Claude: " + r.draft.note) : null,
      ...rows,
      el("div", { class: "row2 rc-vbtns" },
        el("button", { class: "btn sm rc-ask", type: "button", disabled: asking ? "" : null, onclick: async (e) => {
          try { await rcApi({ op: "ask_hooks", postId: RC.pid }); flyToClaude(e.target); RC.asked = Date.now(); rcWaitHooks(); redrawRC(); } catch (x) { toast(x.message); } } },
          asking ? t("rcAsking") : "✨ " + t("rcAsk")),
        vs.length < 20 ? el("button", { class: "btn sm", type: "button", onclick: () => { vs.push(""); RC.vs = vs; redrawRC(); } }, "+ " + t("rcAdd")) : null),
      vs.filter((v) => v.trim()).length === 1 ? el("p", { class: "warn-msg" }, t("rcNeedTwo")) : null);
    // summary + go
    const nv = vs.filter((v) => v.trim()).length;
    const sentence = t("rcSentence").replace("{every}", rcEveryTxt(RC.gap, RC.freq))
      .replace("{times}", RC.times ? t("rcTimes").replace("{n}", RC.times) : t("rcUntilStop").toLowerCase())
      .replace("{what}", nv >= 2 ? t("rcWithN").replace("{n}", nv) : t("rcSame")).replace("{d}", RC.start || "…");
    const word = el("input", { type: "text", class: "rc-word", value: RC.word, placeholder: "go", spellcheck: "false", autocomplete: "off" });
    const goBtn = el("button", { class: "btn on big rc-go", type: "button", disabled: RC.word.trim().toLowerCase() !== "go" || RC.busy ? "" : null, onclick: async () => {
      RC.busy = t("rcStarting"); RC.err = ""; redrawRC();
      try {
        const res = await rcApi({ op: "enable", postId: RC.pid, gap: RC.gap, freq: RC.freq, times: RC.times || null, variations: vs.filter((v) => v.trim()), start: RC.start ? new Date(RC.start + "T09:00").toISOString() : "", confirm: RC.word });
        r.state = { ...(res.recycling || {}), status: res.status }; RC.word = ""; RC.busy = "";
        toast(res.verified ? t("rcStarted") : t("rcCheck")); RC.list = await rcApi({ op: "list", n: 8 }); redrawRC();
      } catch (e) { RC.err = e.message; RC.busy = ""; redrawRC(); } } }, RC.busy || (on ? t("rcUpdate") : t("rcStart")));
    word.addEventListener("input", () => { RC.word = word.value; goBtn.disabled = word.value.trim().toLowerCase() !== "go" || !!RC.busy; });
    put(body, el("div", { class: "rc-sum" }, el("p", {}, sentence),
        r.platforms.includes("instagram") ? el("p", { class: "hint" }, t("rcIgNote")) : null,
        el("p", { class: "hint" }, t("rcLimits"))),
      el("label", { class: "label" }, t("rcType")), word,
      RC.err ? el("div", { class: "key-msg bad" }, "✗ " + RC.err) : null,
      el("div", { class: "actions" },
        on ? el("button", { class: "btn danger-ghost rc-stop", type: "button", onclick: async () => {
          try { const res = await rcApi({ op: "disable", postId: RC.pid }); r.state = { ...(res.recycling || {}), status: res.status }; toast(res.verified ? t("rcStopped") : t("rcCheck")); RC.list = await rcApi({ op: "list", n: 8 }); redrawRC(); }
          catch (e) { RC.err = e.message; redrawRC(); } } }, t("rcStop")) : null,
        el("button", { class: "btn", type: "button", onclick: () => closeModal(renderQuestion) }, t("close")), goBtn));
  }
  function drawRecycleList(body, L) {
    put(body, el("h2", { id: "mTitle" }, t("rcTitle")), el("p", { class: "hint" }, t("rcSub")),
      RC.err ? el("div", { class: "key-msg bad" }, "✗ " + RC.err) : null,
      !L.posts.length ? el("p", { class: "empty" }, L.note || t("noData")) : null,
      el("p", { class: "label" }, t("rcActive").replace("{a}", (L.active || []).length).replaceAll("{b}", L.max || 10)),
      el("ol", { class: "rc-list" }, ...L.posts.map((r, i) => el("li", {},
        r.thumb ? el("img", { src: r.thumb, alt: "", referrerpolicy: "no-referrer", loading: "lazy" }) : el("div", { class: "np-vid" }, "—"),
        el("div", { class: "rc-li" }, el("b", { style: "unicode-bidi:plaintext" }, (r.caption || "").split("\n")[0].slice(0, 80)),
          el("span", { class: "label" }, r.platforms.join(" · ") + " · " + (r.publishedAt || "").slice(0, 10)), rcMetrics(r.metrics),
          r.state && r.state.enabled ? el("span", { class: "ok-msg" }, rcStateLine(r.state)) : null),
        el("button", { class: "btn sm on", type: "button", onclick: async () => { RC.pid = r.postId; await rcLoad(); redrawRC(); } }, r.state && r.state.enabled ? t("rcManage") : "♻ " + t("rcBtn"))))),
      el("p", { class: "hint" }, t("rcRanked")),
      el("div", { class: "actions" }, el("button", { class: "btn", type: "button", onclick: () => closeModal(renderQuestion) }, t("close"))));
  }

  /* ---------- New post: from computer files, made images, or a folder (no typing paths) ---------- */
  const NP = { items: [], name: "", caption: "", busy: "", err: "", pick: null, fs: null, step: 1, folder: null, sig: "", when: null };
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
    Object.assign(NP, { items: [], name: "post-" + today, caption: "", busy: "", err: "", pick: null, fs: null, step: 1, folder: null, sig: "", when: null });
    (preset && preset.images || []).forEach((g) => NP.items.push({ image: g.id, name: g.prompt.slice(0, 40), kind: "image" }));
    if (preset && preset.pick) NP.pick = preset.pick;
    const build = (body) => drawNewPost(body);
    if (modal.open && modal.open !== "np") closeModal(() => showModal("np", build));
    else { modal.open = null; showModal("np", build); }
    if (preset && preset.pick === "mine" && !IMG.st) imgRefresh().then(redrawNP).catch(() => {});
  }
  function redrawNP() { if (modal.open === "np") { const b = $("#modalBody"), k = b.scrollTop; b.innerHTML = ""; drawNewPost(b); b.scrollTop = k; } }

  function drawNewPost(body) {
    body.append(npTrack());
    if (NP.step > 1) return drawNpStep(body);
    const fileIn = el("input", { type: "file", accept: "image/png,image/jpeg,image/webp,video/mp4,video/quicktime,application/pdf," + ARCHIVE_EXT.join(","), multiple: true, hidden: true });
    fileIn.addEventListener("change", () => npUpload([...fileIn.files]));
    const n = NP.items.length, kinds = NP.items.map((x) => x.kind);
    const typeLbl = !n ? (NP.caption.trim() ? t("npTextPost") : "") : kinds.includes("archive") ? t("npArchive") : kinds.includes("video") && n === 1 ? t("npReel") : kinds.includes("document") ? "PDF" : n > 1 ? t("npCarousel").replace("{n}", n) : t("npSingle");
    put(body, el("div", { class: "label kicker", style: "color:var(--accent-ink)" }, t("newPost")),
      el("h2", { id: "mTitle" }, t("npTitle")), el("p", { class: "hint" }, t("npSub")), fileIn,
      el("div", { class: "np-ways" },
        el("button", { class: "np-way", type: "button", onclick: () => fileIn.click() }, el("b", {}, "🖼  " + t("npFromPc")), el("span", { class: "hint" }, t("npFromPcHint"))),
        el("button", { class: "np-way" + (NP.pick === "mine" ? " on" : ""), type: "button", onclick: async () => { NP.pick = NP.pick === "mine" ? null : "mine"; if (!IMG.st) { try { await imgRefresh(); } catch (e) {} } redrawNP(); } },
          el("b", {}, "✦  " + t("npFromMine")), el("span", { class: "hint" }, t("npFromMineHint"))),
        el("button", { class: "np-way", type: "button", onclick: npFolder }, el("b", {}, "📁  " + t("npFromFolder")), el("span", { class: "hint" }, t("npFromFolderHint"))),
        el("button", { class: "np-way np-createimg", type: "button", onclick: () => { IMG.edit = ""; IMG.last = []; openImage({ forNP: true }); } }, el("b", {}, "✎  " + t("npCreateImg")), el("span", { class: "hint" }, t("npCreateImgHint")))));
    if (NP.pick === "mine") body.append(npMinePicker());
    if (NP.fs) body.append(npExplorer());
    const drop = el("div", { class: "np-drop" + (n ? " has" : "") },
      n ? el("ol", { class: "np-items" }, ...NP.items.map((it, i) => el("li", {},
        el("span", { class: "np-n" }, String(i + 1)),
        it.kind === "archive" ? el("div", { class: "np-vid" }, "🗜 " + (it.name || "archive")) : it.kind === "video" ? el("div", { class: "np-vid" }, "▶ " + (it.name || "video")) : it.kind === "document" ? el("div", { class: "np-vid" }, "PDF") : el("img", { src: npThumb(it), alt: "" }),
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
    cap.value = NP.caption; cap.addEventListener("input", () => { NP.caption = cap.value; createBtn.textContent = (NP.caption.trim() ? t("npNextCheck") : t("npNextClaude")) + " →";
      createBtn.disabled = (!n && !NP.caption.trim()) || !!NP.busy; const tl = body.querySelector(".np-typelbl"); if (tl && !n) tl.textContent = NP.caption.trim() ? t("npTextPost") : ""; });
    const createBtn = el("button", { class: "btn on big", type: "button", disabled: (!n && !NP.caption.trim()) || NP.busy ? "" : null, onclick: npCreate },
      NP.busy || (NP.caption.trim() ? t("npNextCheck") + " →" : t("npNextClaude") + " →"));
    put(body, el("div", { class: "img-step" }, el("b", {}, t("npMedia")), el("span", { class: "label np-typelbl" }, typeLbl)), drop,
      !n ? el("p", { class: "hint np-texthint" }, t("npTextHint")) : null,
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

  const ARCHIVE_EXT = [".zip", ".tar", ".tar.gz", ".tgz", ".tar.bz2", ".tbz2", ".tbz", ".tar.xz", ".txz", ".7z", ".rar", ".iso", ".cab", ".xar", ".lzh", ".cpio"];
  async function npUpload(files) {
    const isArc = (f) => ARCHIVE_EXT.some((e) => f.name.toLowerCase().endsWith(e));
    const ok = files.filter((f) => isArc(f) || /^(image\/(png|jpeg|webp)|video\/(mp4|quicktime)|application\/pdf)$/.test(f.type));
    if (!ok.length) { NP.err = t("npBadFile"); redrawNP(); return; }
    if ((ok.some(isArc) && (ok.length > 1 || NP.items.length)) || NP.items.some((x) => x.kind === "archive")) { NP.err = t("npArchiveAlone"); redrawNP(); return; }
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
    if ((!NP.items.length && !NP.caption.trim()) || NP.busy) return;
    NP.busy = t("npCreating"); NP.err = ""; redrawNP();
    try {
      const r = await npPost({ op: "create", files: NP.items.map(npKey), name: NP.name, caption: NP.caption });
      npDone(r);
    } catch (e) { NP.err = e.message; NP.busy = ""; redrawNP(); }
  }
  async function npDone(r) {
    if (r.posts && r.posts.length > 1) { NP.busy = ""; toast(t("npArchiveMany").replace("{n}", r.posts.length)); closeModal(() => openBatch()); return; }
    NP.busy = ""; NP.folder = r.folder; NP.step = 2; NP.sig = "";
    lastSig = ""; await load(false);
    redrawNP();
  }

  /* ---------- New post steps 2-4: check & improve → time → review & schedule ---------- */
  function npTrack() {
    const names = ["npStep1", "npStep2", "npStep3", "npStep4"];
    return el("ol", { class: "np-track" }, names.map((k, i) => el("li", { class: (i + 1 < NP.step ? "done" : i + 1 === NP.step ? "current" : "") },
      el("span", { class: "dot" }, i + 1 < NP.step ? "✓" : String(i + 1)), el("span", {}, t(k)))));
  }
  const npPlan = () => {
    const p = state.data && state.data.plan, f = (NP.folder || "").replace(/\/+$/, "");
    return p && f && String(p.folder || "").replace(/\/+$/, "").endsWith(f) ? p : null;
  };
  // the window follows the plan live (checks, Claude's fixes, score) without losing what you type
  function npLive() {
    if (modal.open !== "np" || NP.step < 2 || NP.step > 4) return;     // 5 = publishing / result on screen
    const p = npPlan(), q = state.data && state.data.question;
    const sig = JSON.stringify([p && [p.captions, p.checks, p.score, p.schedule, p.dm, p.fixRequests, p.status, p.cover], q && q.id]);
    if (sig === NP.sig) return;
    const a = document.activeElement;
    if (NP.sig && a && $("#modalBody").contains(a) && /TEXTAREA|INPUT/.test(a.tagName) && a.dataset.dirty) return;
    redrawNP();
  }
  const npHead = (n, title) => [el("div", { class: "label kicker", style: "color:var(--accent-ink)" }, t("newPost") + " · " + t("npStepOf").replace("{n}", n)), el("h2", { id: "mTitle" }, title)];
  function drawNpStep(body) {
    const p = npPlan();
    const q = state.data && state.data.question;
    NP.sig = JSON.stringify([p && [p.captions, p.checks, p.score, p.schedule, p.dm, p.fixRequests, p.status, p.cover], q && q.id]);
    const closeBtn = el("button", { class: "btn", type: "button", onclick: () => closeModal(renderQuestion) }, t("npCloseKeep"));
    if (!p) {
      body.append(...npHead(2, t("npStep2")), el("div", { class: "np-wait" }, el("b", { class: "pulse" }, NP.items.length && !NP.caption.trim() ? t("npWriting") : t("npChecking")),
        el("p", { class: "hint" }, t("npWritingHint"))), el("div", { class: "actions" }, closeBtn));
      return;
    }
    if (["published", "scheduled"].includes(p.status)) { NP.step = 4; }
    if (NP.step === 2) return npChecks(body, p, q, closeBtn);
    if (NP.step === 3) return npTime(body, p, closeBtn);
    return npReview(body, p, closeBtn);
  }

  function npChecks(body, p, q, closeBtn) {
    body.append(...npHead(2, t("npStep2")));
    // media strip + scores
    const strip = el("div", { class: "np-strip" }, (p.media || []).slice(0, 10).map((m) =>
      m.kind === "image" ? el("img", { src: planMedia(p.id, m.file), alt: "" }) : el("div", { class: "np-vid" }, m.kind === "video" ? "▶" : "PDF")));
    const scores = el("div", { class: "chips" }, Object.entries(p.score || {}).map(([pl, v]) =>
      el("span", { class: "chip " + (v.value >= 80 ? "ok" : v.value >= 60 ? "" : "bad") }, `${pl} ${v.value}/100`)));
    body.append(strip, scores);
    // caption: one box when all platforms share it
    const caps = p.captions || {}, plats = p.platforms || [];
    const same = new Set(plats.map((pl) => caps[pl] || "")).size <= 1;
    const err = el("div", { class: "err", role: "alert" });
    const boxes = (same ? [null] : plats).map((pl) => {
      const ta = el("textarea", { rows: 7, class: "np-cap np-cap2", style: "unicode-bidi:plaintext", "aria-label": pl ? t("npCaptionFor").replace("{p}", pl) : t("npCaptionAll") });
      ta.value = pl ? caps[pl] || "" : caps[plats[0]] || "";
      ta.addEventListener("input", () => { ta.dataset.dirty = "1"; });
      return { pl, ta };
    });
    body.append(...boxes.map(({ pl, ta }) => el("div", { class: "field" }, el("label", { class: "label" }, pl ? t("npCaptionFor").replace("{p}", pl) : t("npCaptionAll")), ta)),
      el("div", { class: "row2" }, el("button", { class: "btn", type: "button", onclick: async () => {
        err.textContent = "";
        try {
          for (const { pl, ta } of boxes) if (ta.dataset.dirty) await post("/api/plan", { op: "caption", text: ta.value, ...(pl ? { platform: pl } : {}) });
          boxes.forEach(({ ta }) => delete ta.dataset.dirty);
          toast(t("npSavedCheck")); lastSig = ""; NP.sig = ""; await load(false);
        } catch (e) { err.textContent = e.message; }
      } }, "↻ " + t("npSaveCheck"))), err);
    // Claude's suggestion, right here (the pop-up waits while this window is open)
    if (q && q.kind === "fix") body.append(npSuggestion(q));
    // what to fix
    const bad = (p.checks || []).filter((c) => c.status === "fail" || c.status === "warn").sort((a, b) => (a.status === "fail" ? -1 : 1) - (b.status === "fail" ? -1 : 1));
    const good = (p.checks || []).filter((c) => c.status === "pass");
    if (bad.length) {
      const ul = el("ul", { class: "np-checks" });
      bad.forEach((c) => {
        const key = c.id + ":" + (c.platform || "");
        const fr = (p.fixRequests || {})[key];
        const busy = fr && fr.status === "requested";
        ul.append(el("li", { class: c.status },
          el("span", { class: "tag " + c.status }, c.status.toUpperCase()),
          el("div", {}, el("b", {}, c.msg), c.fix ? el("div", { class: "hint" }, c.fix) : null, el("small", { class: "label" }, c.platform || "")),
          /^(tiktok|snapchat)\./.test(c.id) ? el("span", { class: "hint" }, "↓ " + t("nsTitle"))
          : busy ? el("span", { class: "hint pulse" }, t("npFixing"))
            : el("button", { class: "btn sm", type: "button", onclick: async (e) => {
              e.target.disabled = true;
              try { await post("/api/fixrequest", { check: c.id, platform: c.platform || "", msg: c.msg }); flyToClaude(e.target); lastSig = ""; NP.sig = ""; await load(false); }
              catch (x) { toast(x.message); e.target.disabled = false; }
            } }, "✨ " + t("npAskFix"))));
      });
      body.append(el("h3", {}, t("npToFix") + " · " + bad.length), ul);
    } else body.append(el("p", { class: "ok-msg" }, "✓ " + t("npAllGood")));
    if (hasNetSettings(p)) body.append(el("h3", {}, t("nsTitle")), netSettingsUI(p, () => { NP.sig = ""; npLive(); }));
    if (good.length) body.append(el("details", { class: "np-passed" }, el("summary", {}, "✓ " + t("npPassed").replace("{n}", good.length)),
      el("ul", {}, good.map((c) => el("li", {}, (c.platform ? c.platform + ": " : "") + c.msg)))));
    const blocking = (p.checks || []).some((c) => c.status === "fail");
    put(body, blocking ? el("p", { class: "warn-msg" }, t("npBlockedNext")) : null,
      el("div", { class: "actions" }, closeBtn,
        el("button", { class: "btn on big", type: "button", onclick: () => { NP.step = 3; redrawNP(); } }, t("npNextTime") + " →")));
  }

  function npSuggestion(q) {
    const s = q.suggestion || {}, r0 = (s.rows || [])[0] || {};
    const d = diff(r0.before || "", s.after || "");
    const editor = el("textarea", { rows: 7, style: "display:none;unicode-bidi:plaintext" }); editor.value = s.after || "";
    editor.addEventListener("input", () => { editor.dataset.dirty = "1"; });
    const after = el("div", { class: "fixcol after", html: d.after });
    const err = el("div", { class: "err", role: "alert" });
    const send = async (answer, extra = {}) => {
      try { await post("/api/answer", { id: q.id, answer, ...extra }); toast(t("npSugSent")); state.data.question = null; lastSig = ""; NP.sig = ""; await load(false); redrawNP(); }
      catch (e) { err.textContent = e.message; }
    };
    let editing = false;
    return el("div", { class: "np-sug" },
      el("div", { class: "row2" }, el("b", {}, "✨ " + t("npSugReady")),
        el("span", { class: "scorejump sm" }, el("span", { class: "from" }, r0.scoreBefore), el("span", { class: "arrow" }), el("span", { class: "to" }, r0.scoreAfter))),
      s.reasons && s.reasons.length ? el("ul", { class: "reasons" }, s.reasons.map((x) => el("li", {}, x))) : null,
      el("div", { class: "fixrow" }, el("div", {}, el("div", { class: "label" }, t("before")), el("div", { class: "fixcol", html: d.before })),
        el("div", {}, el("div", { class: "label" }, t("after")), after, editor)), err,
      el("div", { class: "actions" },
        el("button", { class: "btn", type: "button", onclick: () => send("reject") }, t("npReject")),
        el("button", { class: "btn", type: "button", onclick: (e) => {
          if (!editing) { editing = true; after.style.display = "none"; editor.style.display = "block"; editor.focus(); e.target.textContent = t("saveEdit"); }
          else send("edit", { edited: editor.value });
        } }, t("npEditSug")),
        el("button", { class: "btn on", type: "button", onclick: () => (editing ? send("edit", { edited: editor.value }) : send("approve")) }, "✓ " + t("npApprove"))));
  }

  function npNextAt(day, hour) {         // the next time this weekday + hour comes round, at least 15 min ahead
    const d = new Date(); d.setSeconds(0, 0); d.setMinutes(0); d.setHours(hour);
    let add = (day - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + add);
    if (d.getTime() < Date.now() + 15 * 60000) d.setDate(d.getDate() + 7);
    return d;
  }
  const localIso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  function npTime(body, p, closeBtn) {
    body.append(...npHead(3, t("npStep3")));
    const sch = p.schedule || {};
    if (!NP.when) NP.when = sch.mode === "now" ? "now" : sch.at ? localIso(new Date(sch.at)) : null;
    const err = el("div", { class: "err", role: "alert" });
    const slots = ((p.bestTime && p.bestTime.slots) || []).slice(0, 3);
    const pick = (v) => { NP.when = v; redrawNP(); };
    if (slots.length) {
      body.append(el("h3", {}, t("npBest")), el("p", { class: "hint" }, t("npBestHint")),
        el("div", { class: "np-slots" }, slots.map((sl, i) => {
          const at = npNextAt(sl.day, sl.hour), v = localIso(at);
          return el("button", { class: "np-slot" + (NP.when === v ? " on" : ""), type: "button", "aria-pressed": String(NP.when === v), onclick: () => pick(v) },
            el("span", { class: "rk" }, String(i + 1)),
            el("b", {}, at.toLocaleDateString(loc(), { weekday: "short", day: "numeric", month: "short" }) + " · " + hourLabel(sl.hour)),
            el("small", {}, (sl.lift >= 0 ? "+" : "") + sl.lift + "% · n=" + sl.posts + " · " + sl.confidence));
        })));
    } else body.append(el("p", { class: "hint" }, t("npNoBest")));
    const any = el("input", { type: "datetime-local", min: localIso(new Date(Date.now() + 16 * 60000)), value: NP.when && NP.when !== "now" ? NP.when : "" });
    any.addEventListener("change", () => { NP.when = any.value || null; });
    const now = el("label", { class: "check-row" }, el("input", { type: "radio", name: "npnow", checked: NP.when === "now" ? "" : null, onchange: () => pick("now") }), el("span", {}, t("npNow")));
    body.append(el("h3", {}, t("npPickAny")), el("div", { class: "row2" }, any), now, err,
      el("div", { class: "actions" },
        el("button", { class: "btn", type: "button", onclick: () => { NP.step = 2; redrawNP(); } }, "← " + t("npBack")),
        el("button", { class: "btn on big", type: "button", onclick: async () => {
          err.textContent = "";
          if (!NP.when) { err.textContent = t("npNoTime"); return; }
          try {
            await post("/api/plan", NP.when === "now" ? { op: "time", now: true } : { op: "time", at: NP.when });
            NP.step = 4; lastSig = ""; NP.sig = ""; await load(false); redrawNP();
          } catch (e) { err.textContent = e.message; }
        } }, t("npNextReview") + " →")));
  }

  function npReview(body, p, closeBtn) {
    body.append(...npHead(4, t("npStep4")));
    if (["published", "scheduled"].includes(p.status)) {
      body.append(el("p", { class: "ok-msg" }, "✓ " + (p.status === "published" ? t("published") : t("jScheduled"))),
        el("div", { class: "actions" }, el("button", { class: "btn on", type: "button", onclick: () => closeModal(() => { state.zfilter = "all"; go("posts"); }) }, t("seeInPosts"))));
      return;
    }
    const acc = (state.data.config && state.data.config.accounts) || {};
    const sch = p.schedule || {};
    const sum = el("dl", { class: "sum" });
    const add = (k, v) => sum.append(el("dt", {}, t(k)), el("dd", {}, v));
    add("platforms", (p.platforms || []).map((pl) => pl + (acc[pl] && acc[pl].username ? " @" + acc[pl].username : "")).join(" · "));
    add("when", sch.mode === "now" ? t("pubNow") : sch.at ? dt(sch.at) : "—");
    add("score", Object.entries(p.score || {}).map(([k, v]) => `${k} ${v.value}`).join(" · "));
    add("dmGift", p.dm && p.dm.enabled ? giftSentence(p.dm) : t("off"));
    const capOne = (p.captions || {})[(p.platforms || [])[0]] || "";
    put(body, el("div", { class: "np-strip" }, (p.media || []).slice(0, 10).map((m) =>
      m.kind === "image" ? el("img", { src: planMedia(p.id, m.file), alt: "" }) : el("div", { class: "np-vid" }, m.kind === "video" ? "▶" : "PDF"))),
      el("div", { class: "np-capview", style: "unicode-bidi:plaintext" }, capOne), sum,
      hasNetSettings(p) ? netSettingsUI(p, () => { NP.sig = ""; npLive(); }) : null,
      p.type === "reel" && !p.cover ? el("p", { class: "hint" }, t("npCoverHint")) : null,
      el("div", { class: "row2" }, el("button", { class: "btn sm", type: "button", onclick: () => openGift(() => showModal("np", (b) => drawNewPost(b))) },
        "🎁 " + (p.dm && p.dm.enabled ? t("npGiftEdit") : t("npGiftAdd")))));
    const blocking = (p.checks || []).filter((c) => c.status === "fail");
    const back = el("button", { class: "btn", type: "button", onclick: () => { NP.step = blocking.length ? 2 : 3; redrawNP(); } }, "← " + t("npBack"));
    if (blocking.length || !(sch.mode === "now" || sch.at)) {
      if (blocking.length) body.append(el("div", { class: "pub-block" }, el("b", {}, t("pubBlocked")), el("ul", {}, blocking.map((c) => el("li", {}, `${c.platform}: ${c.msg}`)))));
      body.append(el("div", { class: "actions" }, back));
      return;
    }
    const inp = el("input", { type: "text", class: "go-input", placeholder: "go", autocomplete: "off", spellcheck: "false", "aria-label": t("typeGo").replace("{w}", "go") });
    const btn = el("button", { class: "btn on big", type: "button", disabled: true }, sch.mode === "now" ? t("npPublishNow") : t("npSchedule"));
    inp.addEventListener("input", () => { inp.dataset.dirty = "1"; btn.disabled = inp.value.trim().toLowerCase() !== "go"; });
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter" && !btn.disabled) btn.click(); });
    btn.addEventListener("click", () => { NP.step = 5; doPublish($("#modalBody"), inp.value); });
    body.append(el("div", { class: "field" }, el("label", { class: "label" }, t("typeGo").replace("{w}", "go")), inp),
      el("div", { class: "actions" }, back, btn));
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
        "Connect Instagram, LinkedIn, <b>Facebook</b>, <b>TikTok</b> or <b>Snapchat</b> from <b>Posts → + Connect account</b>. You approve on the network's own site.",
        "A post goes to every connected network that can show it: TikTok takes videos and photo posts (no PDFs); Snapchat takes one photo or one video. Skipped networks are listed with the reason.",
        "<b>TikTok</b> needs two things from you before it can be scheduled: who can see it, and your OK that you previewed the post and agree to post it (asked again if the caption or media change). You can also set comments, duets, stitches, a promotional label, an AI label, or send it to your TikTok inbox as a draft.",
        "<b>Facebook</b> (a Page): Feed post (text, a photo, up to 10 photos, or a video; no mixing), Reel (one vertical video, 3-90 s, optional title) or Story (one item, 24 hours, no caption). Add a first comment, save it as a draft in Facebook's Publishing Tools, and pick the Page if you have several.",
        "<b>Snapchat</b>: choose Story (24 hours, no caption), Saved story (stays on your Public Profile, title up to 45 characters) or Spotlight (video only, caption up to 160). Snapchat needs a Public Profile."]],
      ["Publish one post", [
        "Make one folder per post: <code>caption.txt</code> plus images, one video (Reel) or a PDF. Optional: <code>caption.linkedin.txt</code>, <code>cover.jpg</code>.",
        "Type <code>/200bps-publish posts/my-post</code> in Claude Code, or use the <b>New post</b> card: photos or video from your computer, your images, a post folder, or <b>Create an image</b>.",
        "<b>Archive (.zip, .7z, .rar…):</b> add it like a photo, or pick a folder that holds it. It's unpacked and opened as the post.",
        "<b>PDF + photos:</b> LinkedIn gets the PDF; the other networks get the photos.",
        "<b>Instagram Reels</b> can be up to 15 minutes long.",
        "<b>Text post, LinkedIn poll or repost:</b> in <b>New post</b>, add no media and just write the caption. In step 2 (or Post tab → Network settings → LinkedIn) pick <b>Poll</b> (a question, 2-4 choices up to 30 characters, open 1 day to 2 weeks) or <b>Repost</b> (paste a LinkedIn post link; your caption becomes your comment). Facebook, if on, gets the caption as a text post.",
        "<b>See your poll any time:</b> before scheduling, in the Post tab's Preview; after scheduling or posting, open it in Posts or Plan: the poll card, how long it's open (time left once live), LinkedIn's impressions, reactions and comments, and <b>See the votes on LinkedIn ↗</b> (LinkedIn doesn't share votes with apps).",
        "<b>Several accounts on one network?</b> Tick them under <b>Post to these accounts</b>. Same caption on each.",
        "<b>New post in 4 steps:</b> pick the media and type a caption (or leave it to Claude), then <b>Check & improve</b> (edit the caption yourself or ask Claude to fix each item; its before/after appears right there), <b>Time</b> (your best slots, any day and minute, or right away) and <b>Review & schedule</b> (add a gift, type <b>go</b>).",
        "Follow the path at the top of the Post tab: <b>Check → Cover → Time → Gift → Go</b>. \"Next step\" always does the next thing.",
        "<b>Check:</b> red items block publishing. Click one and Claude shows a before/after; approve, edit or reject. Your original is kept.",
        "<b>Score (0-100):</b> how ready the post is, with the tips that raise it.",
        "<b>Cover</b> (Reels): a frame, your image, or a design by Claude. \"Grid view\" shows the profile crop.",
        "<b>Time:</b> your best time from your own data, or any day/hour you click.",
        "<b>Gift</b> (optional): people who comment a keyword on Instagram get your DM (with a link button if you like), and you can require them to follow you first. The gift window says it in one sentence and shows each scene people will see, live as you type; it starts only when the post goes live.",
        "<b>Go:</b> press Publish and type <b>go</b>. The dashboard uploads to Zernio, then reads the post back to prove it's there."]],
      ["Create and edit images", [
        "Open it from <b>Image</b> at the top, <b>+ Create image</b> in the Post tab, <b>New post → Create an image</b>, or Ctrl+K. It needs your OpenAI key (Settings → Keys).",
        "<b>Create:</b> describe the picture (or press \"Ask Claude to improve it\"), add guide pictures to keep a style, face or product, pick shape, quality and how many.",
        "<b>Edit:</b> press <b>✎ Edit</b> on any image, or <b>Edit a picture from my computer</b>. Mark the picture with <b>Pin / Area</b> (click or drag), <b>Paint</b> (brush S, M, L) or <b>Surround</b> (draw a loop), and write a note for each numbered mark.",
        "<b>Only change the marked spots</b> (on by default): only your marks change, and everything else stays pixel-for-pixel the original. The edit keeps the original's size.",
        "<b>Full screen</b> shows the picture large with your notes beside it. The edited version appears right in the editor; the original is never changed.",
        "<b>Save to folder</b> and <b>Save as…</b> open your computer's own file manager, so you choose where it goes. <b>Add to post</b> puts it in the open draft.",
        "In <b>New post → Create an image</b>, press <b>Add to new post</b> on the result to drop it into the post you're making."]],
      ["Batch schedule (many posts at once)", [
        "Open it from <b>Post</b>, <b>Plan</b> or <b>Posts</b> → <b>Batch schedule</b>, or Ctrl+K.",
        "<b>1 Pick posts:</b> every post folder here appears as a card. Click to select, or \"Select all new\".",
        "<b>Browse…</b> opens your computer's folder window, for folders anywhere. <b>Folder browser</b> does the same inside the dashboard.",
        "<b>2 Set times:</b> choose the start day, how often (every day, every 2 days, or chosen weekdays) and the time (your best times or one fixed time). Days that already have a post are skipped.",
        "Each time shows why it was picked (e.g. \"best Wed · +96% · n=5\"). Drag ⋮⋮ or use ↑↓ to reorder; edit any time directly.",
        "<b>3 Go:</b> review the list, type <b>go</b> once. Every post is created in Zernio as <i>scheduled</i>, with a live tick per post. Nothing goes out now.",
        "Posts that can't be scheduled yet are listed apart, with \"Ask Claude to fix\"."]],
      ["Plan: calendar and best hours", [
        "The calendar shows exactly the posts in the Posts tab. Colours: <b>lime</b> published, <b>blue</b> scheduled, <b>red</b> needs attention, <b>outline</b> not uploaded.",
        "‹ and › change month (or week, or day); <b>Today</b> jumps back. Switch <b>Month · Week · Day</b> at the top.",
        "<b>Week and Day</b> show the hours, with your best hours shaded and a red line for now. <b>Drag a post</b> to another time to move it (in Month, drag it to another day). Posts already in Zernio ask you to type <b>move</b>; drafts move at once.",
        "<b>Click or drag on an empty time</b> to plan it: put your open draft or any draft there, start a new post for that time, or have Claude draft one from an idea.",
        "<b>Copy a post:</b> press <b>⧉</b> on it (or right-click → Copy, or Ctrl+C). Click a day → <b>Paste here</b> (or Ctrl+V). Pick the time and type go, or save it as a Zernio draft. Tick 🎁 to copy its gift too.",
        "<b>Right-click</b> a post for View, Copy, Move, Edit or Cancel; right-click a day or hour to Paste or plan it.",
        "Click a post for <b>Move…</b>, <b>Edit caption…</b> (type <b>edit</b>) and <b>Cancel…</b> (type <b>cancel</b>). Published posts can't be moved or edited.",
        "Click a day to see its posts or plan it. Double-click an empty future day to schedule the current post at that day's best hour.",
        "<b>When your audience engages:</b> darker cells had more engagement. 1-2-3 mark your best slots; click any cell to schedule there.",
        "<b>Peak times by day:</b> each weekday's best hours with lift, number of posts (n) and confidence."]],
      ["Posts: everything in Zernio", [
        "Every post (scheduled, published, failed) plus local drafts. Filter at the top; switch Grid or List.",
        "Hover a video to see a muted preview. Click any post to see all of it: swipe every carousel slide (arrows, dots or ← →), play the full video with sound, or read the PDF; full screen too. Links, per-platform status and errors are there as well.",
        "<b>Networks:</b> each post shows its first network's icon and <b>+N</b>. Click it for every network's account, status and time.",
        "<b>⇆ Networks…</b> (in a post's window, or right-click it in Plan): switch any network on or off. Type edit to save; at least one stays on.",
        "<b>Copy</b> in a post's window: paste it on another day in Plan.",
        "Failed post? \"Ask Claude to fix\". A draft? \"Continue this post\".",
        "\"Refresh from Zernio\" reloads everything now (it also refreshes every 5 minutes).",
        "<b>Cancel</b> any post: open it and press Cancel post (or use the calendar, the Post tab, or Ctrl+K → Cancel a post), then type <b>cancel</b>. Scheduled posts never go out and the draft stays; Instagram posts that are already live are deleted in the Instagram app."]],
      ["Growth", [
        "<b>🅰🅱 Test two hooks</b> (an Instagram Reel, Post tab → Preview → Test two hooks, or Ctrl+K): B gets a different first line (write it, or <b>✨ Ask Claude for hook B</b>) and optionally a different cover. Type <b>go</b>: both go out as Trial Reels at the same time, seen only by non-followers. After 48 hours, Growth → <b>Hook tests</b> → Check results compares views, reach, skip rate and watch time; a winner only with 100+ views each and a clear gap. Share the winner to your followers in the Instagram app (··· → Share to followers).",
        "<b>♻ Recycle best posts</b> (Top posts card, a ♻ on each row, or Ctrl+K): Zernio re-posts a published post every few weeks or months. Pick how often, how many times and the first date; add 2 or more new versions (or press <b>✨ Ask Claude for new hooks</b>) and each repost uses the next one. Type <b>go</b> to start; it's read back from Zernio with the next repost date. <b>Stop recycling</b> any time. Up to 10 at once; TikTok posts can't be recycled.",
        "Reach, views, engagement and new follows for 7 days, compared with the 7 days before.",
        "<b>Tabs = networks</b> (Instagram · 6). Click one with several accounts to pick <b>All accounts</b> or one account.",
        "<b>All accounts</b> adds them up and lists them side by side; click a column to sort. ☆ pins an account to the top.",
        "<b>+ Connect</b> adds a network or account through Zernio.",
        "Each network shows followers, its own goal, the last 30 days, best times, posting rhythm and top posts. <b>▶ View</b> plays a top post here.",
        "<b>updated …</b> next to followers: when Zernio last refreshed them (about once a day).",
        "<b>Goal:</b> progress from your Zernio follower count, with how many are left. \"How this goal works\" explains it; <b>Change goal</b> sets a new one in two clicks.",
        "Streak (last 14 days), top posts (ranked by follows, then saves + shares) and your audience.",
        "<b>Idea bank:</b> ideas from your best posts. Click one for hook, outline, hashtags and best time; plan it on a day, or <b>✎ Edit</b> it.",
        "<b>Idea bank tools:</b> tick ideas (or Select all) to <b>Delete</b> them (Undo brings them back) or save them as a readable document (.md) or a backup (.json) wherever you choose. <b>Add an idea</b> writes your own; <b>Load ideas from a file</b> brings a backup back; <b>Clear all</b> empties the bank (with Undo)."]],
      ["Inbox", [
        "<b>Comments waiting:</b> each comment shows the post it's on (click to open it) and that post's gift. Filter Waiting · Handled · All, or by label.",
        "<b>Reply</b> answers publicly under the comment. <b>Send gift</b> sends the post's gift (or any message) privately: one per comment, within 7 days. The link goes in the text; a link button is optional, because Instagram may refuse buttons to non-followers and a refused try uses up the message.",
        "<b>Labels</b> (Question, Lead, Spam… or your own) stay on this computer. <b>Hide</b> keeps a comment from others; <b>Delete</b> removes it for good after you type <b>delete</b>. Handled comments move to Handled; \"Back to waiting\" undoes the mark.",
        "<b>🕒 Times in:</b> comment times on your clock, an audience country's, or any time zone.",
        "<b>Auto-handled:</b> comments your DM gift already answered move to Handled by themselves.",
        "<b>✨ Ask Claude to draft replies</b> → <b>Use it</b> → <b>Send reply</b>, or <b>Send all drafts</b> at once. Nothing sends without your click.",
        "<b>Gift funnel</b> (DM automations): commented → followed → got the gift → opened the link.",
        "Answered in the Instagram app (a reply, an @mention or a DM)? It moves to Handled too. <b>▶ View</b> opens the post a comment is on.",
        "Below: your keyword → DM automations and ice breakers."]],
      ["Working with Claude", [
        "<b>Enter</b> sends your note; <b>Shift+Enter</b> or <b>Ctrl+Enter</b> adds a new line.",
        "The <b>Claude is listening</b> light: green means your clicks reach Claude Code right away.",
        "<b>Note to Claude</b>: tell Claude anything (\"use frame 4\", \"shorter hook\"). Each note shows where Claude is: waiting → Claude got it → working (with the current step) → <b>done</b> or <b>couldn't do it</b>. Claude's answer appears right under your note.",
        "When Claude finishes a note, a <b>notice</b> slides in with the result and the dashboard refreshes itself, so you see the change without reloading.",
        "The <b>Activity</b> bell (top bar) lists every note and request with its status and result; filter by In progress, Done or Couldn't. Its number counts new results.",
        "When Claude needs you, a pop-up asks. Answer there or in the chat; the first answer wins.",
        "<b>Ctrl+K</b> (⌘K): the command bar. Type cover, fix, time, batch, dark, guide…"]],
      ["Look and settings", [
        "<b>Version and build</b> (top bar, footer, Settings): \"v1.18.0 · build YYYYMMDD.HHMM\", updated by itself with every change. Tell Claude this number when reporting a problem.",
        "English and Arabic look and read the same; switch in Settings → Language.",
        "12h/24h time, light/dark theme, and <b>Hover tips</b> (these explanations) on or off.",
        "<b>Color-blind mode</b> (Settings, or Ctrl+K → color): safer colors plus shapes, so no status relies on color alone. Badges get ✓ → ! ×, calendar dots become ■ ○ ✕ ▲, changes get ▲▼ arrows, and the heatmap turns blue-to-yellow.",
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
        "اربط Instagram أو LinkedIn أو <b>Facebook</b> أو <b>TikTok</b> أو <b>Snapchat</b> من <b>المنشورات ← + اربط حساب</b>. توافق في موقع الشبكة نفسها.",
        "البوست يروح لكل منصة مربوطة تقدر تعرضه: TikTok ياخذ فيديو وبوستات صور (بدون PDF)؛ وSnapchat ياخذ صورة وحدة أو فيديو واحد. المنصات اللي انتجاهلت تطلع مع السبب.",
        "<b>TikTok</b> يحتاج منك شيئين قبل الجدولة: منو يشوفه، وموافقتك إنك شفت البوست وتبي تنشره (تنطلب مرة ثانية إذا تغيّر الكابشن أو الملفات). وتقدر بعد تحدد التعليقات والدويت والستيتش، علامة ترويج، علامة ذكاء اصطناعي، أو ترسله لصندوق TikTok كمسودة.",
        "<b>Facebook</b> (صفحة): بوست عادي (نص، صورة، لين 10 صور، أو فيديو؛ بدون خلط)، ريل (فيديو عمودي واحد، 3-90 ثانية، وعنوان اختياري) أو ستوري (عنصر واحد، 24 ساعة، بدون كابشن). أضف أول تعليق، احفظه كمسودة في أدوات النشر بفيسبوك، واختار الصفحة إذا عندك أكثر من وحدة.",
        "<b>Snapchat</b>: اختار ستوري (24 ساعة، بدون كابشن)، ستوري محفوظة (تظل في بروفايلك العام، العنوان لين 45 حرف) أو سبوتلايت (فيديو بس، الكابشن لين 160). Snapchat يحتاج بروفايل عام."]],
      ["انشر بوست واحد", [
        "سوّ مجلد لكل بوست: <code>caption.txt</code> مع الصور، أو فيديو واحد (ريل)، أو PDF. اختياري: <code>caption.linkedin.txt</code> و<code>cover.jpg</code>.",
        "اكتب <code>/200bps-publish posts/my-post</code> في Claude Code، أو استخدم بطاقة <b>بوست جديد</b>: صور أو فيديو من جهازك، صورك، مجلد بوست، أو <b>سوّ صورة</b>.",
        "<b>ملف مضغوط (.zip, .7z, .rar…):</b> ضيفه مثل الصورة، أو اختار المجلد اللي فيه. ينفك وينفتح كبوست.",
        "<b>PDF وصور:</b> LinkedIn ياخذ الـPDF؛ والمنصات الثانية ياخذون الصور.",
        "<b>ريلز Instagram</b> تقدر توصل لين 15 دقيقة.",
        "<b>بوست نص، تصويت أو إعادة نشر في LinkedIn:</b> في <b>بوست جديد</b> لا تضيف صور، اكتب الكابشن بس. بالخطوة 2 (أو تبويب البوست ← إعدادات المنصات ← LinkedIn) اختار <b>تصويت</b> (سؤال، و2 إلى 4 خيارات كل واحد لين 30 حرف، مفتوح من يوم لين أسبوعين) أو <b>إعادة نشر</b> (الصق رابط بوست LinkedIn؛ الكابشن مالك يصير تعليقك). وFacebook إذا شغّال ياخذ الكابشن كبوست نص.",
         "<b>شوف تصويتك أي وقت:</b> قبل الجدولة في معاينة تبويب البوست؛ وبعد الجدولة أو النشر افتحه من المنشورات أو الخطة: كرت التصويت، وكم يظل مفتوح (والوقت الباقي لما ينتشر)، ومشاهدات وتفاعل وتعليقات LinkedIn، وزر <b>شوف التصويت في LinkedIn ↗</b> (LinkedIn ما يعطي الأصوات للتطبيقات).",
        "<b>عندك كذا حساب على نفس المنصة؟</b> علّمهم في <b>انشر على هالحسابات</b>. نفس الكابشن على كل واحد.",
        "<b>بوست جديد بـ4 خطوات:</b> اختار الملفات واكتب الكابشن (أو خله على Claude)، بعدين <b>افحص وحسّن</b> (عدّل الكابشن بنفسك أو اطلب من Claude يصلّح كل نقطة؛ قبل/بعد يطلع هني)، <b>الوقت</b> (أفضل أوقاتك، أي يوم ودقيقة، أو على طول) و<b>راجع وجدول</b> (أضف هدية، واكتب <b>go</b>).",
        "امشِ على المسار فوق تبويب البوست: <b>فحص ← غلاف ← وقت ← هدية ← نشر</b>. «التالي» دايماً يسوي الخطوة الجاية.",
        "<b>الفحص:</b> الأحمر يمنع النشر. اضغطه وClaude يوريك قبل/بعد؛ وافق، عدّل أو ارفض. النص الأصلي محفوظ.",
        "<b>التقييم (0-100):</b> قد إيش البوست جاهز، مع النصايح اللي ترفعه.",
        "<b>الغلاف</b> (للريلز): لقطة، صورتك، أو تصميم من Claude. «عرض الشبكة» يوريك القص بالبروفايل.",
        "<b>الوقت:</b> أفضل وقت من بياناتك، أو أي يوم/ساعة تضغطها.",
        "<b>الهدية</b> (اختياري): اللي يعلّق بكلمة على Instagram توصله رسالتك بالخاص (مع زر لرابطك إذا تبي)، وتقدر تشترط إنه يتابعك أول. نافذة الهدية تقولها بجملة وحدة وتوريك كل مشهد بيشوفونه الناس وأنت تكتب؛ وما تبدأ إلا لما البوست ينزل.",
        "<b>نشر:</b> اضغط انشر واكتب <b>go</b>. اللوحة ترفعه على Zernio وبعدها تقراه منه عشان تتأكد إنه موجود."]],
      ["سوّ وعدّل صور", [
        "افتحها من <b>صورة</b> فوق، أو <b>+ سوّ صورة</b> في تبويب البوست، أو <b>بوست جديد ← سوّ صورة</b>، أو Ctrl+K. تحتاج مفتاح OpenAI (الإعدادات ← المفاتيح).",
        "<b>سوّ:</b> اوصف الصورة (أو اضغط «خل Claude يحسّنه»)، أضف صور مرشدة عشان تحافظ على أسلوب أو وجه أو منتج، واختار الشكل والجودة والعدد.",
        "<b>عدّل:</b> اضغط <b>✎ عدّل</b> على أي صورة، أو <b>عدّل صورة من جهازك</b>. علّم على الصورة بـ<b>دبوس / مربع</b> (ضغطة أو سحب)، <b>لوّن</b> (فرشاة S، M، L) أو <b>حوّط</b> (ارسم دايرة)، واكتب ملاحظة لكل علامة مرقّمة.",
        "<b>غيّر بس الأماكن المحددة</b> (شغّال من البداية): بس علاماتك تتغيّر، وكل شي ثاني يبقى نفس الأصلية بالضبط. والتعديل يحافظ على مقاس الأصلية.",
        "<b>ملء الشاشة</b> يكبّر الصورة وملاحظاتك جنبها. النسخة المعدّلة تطلع داخل المحرر نفسه؛ والأصلية ما تتغيّر أبداً.",
        "<b>احفظ بمجلد</b> و<b>احفظ باسم…</b> يفتحون مدير الملفات بجهازك، فتختار وين تروح. <b>أضفها للبوست</b> تحطها بالمسودة المفتوحة.",
        "في <b>بوست جديد ← سوّ صورة</b>، اضغط <b>أضفها للبوست الجديد</b> على النتيجة عشان تنحط بالبوست اللي تسويه."]],
      ["جدولة مجموعة (بوستات كثيرة مرة وحدة)", [
        "افتحها من <b>البوست</b> أو <b>الخطة</b> أو <b>المنشورات</b> ← <b>جدولة مجموعة</b>، أو Ctrl+K.",
        "<b>1 اختار البوستات:</b> كل مجلد بوست هني يطلع كبطاقة. اضغط عشان تختار، أو «اختار كل الجديد».",
        "<b>تصفح…</b> يفتح نافذة المجلدات بجهازك، لمجلدات من أي مكان. <b>متصفح المجلدات</b> نفس الشي داخل اللوحة.",
        "<b>2 حدد الأوقات:</b> اختار يوم البداية، كم مرة (كل يوم، كل يومين، أو أيام تختارها) والوقت (أفضل أوقاتك أو وقت ثابت). الأيام اللي فيها بوست تنتجاهل.",
        "كل وقت يقول ليش انختار (مثلاً «أفضل وقت الأربعاء · +96% · n=5»). اسحب ⋮⋮ أو ↑↓ عشان ترتب؛ وعدّل أي وقت مباشرة.",
        "<b>3 نشر:</b> راجع القائمة واكتب <b>go</b> مرة وحدة. كل بوست ينسوى في Zernio <i>كمجدول</i>، مع علامة ✓ لكل واحد. ما ينزل شي الحين.",
        "البوستات اللي ما ينفع تنجدول تطلع لحالها، مع «اطلب من Claude يصلحه»."]],
      ["الخطة: التقويم وأفضل الساعات", [
        "التقويم يعرض نفس البوستات اللي في تبويب المنشورات. الألوان: <b>ليموني</b> منشور، <b>أزرق</b> مجدول، <b>أحمر</b> يحتاج انتباه، <b>إطار</b> ما انرفع.",
        "‹ و› يغيرون الشهر (أو الأسبوع أو اليوم)؛ <b>اليوم</b> يرجعك. بدّل <b>شهر · أسبوع · يوم</b> من فوق.",
        "<b>الأسبوع واليوم</b> يعرضون الساعات، مع تظليل أفضل ساعاتك وخط أحمر للحين. <b>اسحب أي بوست</b> لوقت ثاني عشان تنقله (في الشهر اسحبه ليوم ثاني). بوستات Zernio تطلب تكتب <b>move</b>؛ والمسودات تنتقل على طول.",
        "<b>اضغط أو اسحب على وقت فاضي</b> عشان تخطط له: حط المسودة المفتوحة أو أي مسودة، أو ابدأ بوست جديد لهالوقت، أو خل Claude يكتب واحد من فكرة.",
        "<b>انسخ بوست:</b> اضغط <b>⧉</b> عليه (أو كلك يمين ← انسخ، أو Ctrl+C). اضغط يوم ← <b>الصق هني</b> (أو Ctrl+V). اختار الوقت واكتب go، أو احفظه مسودة في Zernio. علّم 🎁 عشان تنسخ الهدية بعد.",
        "<b>كلك يمين</b> على بوست: شوفه، انسخ، انقل، عدّل أو ألغِ؛ وعلى يوم أو ساعة: الصق أو خطّط له.",
        "اضغط أي بوست لـ<b>انقل…</b> و<b>عدّل الكابشن…</b> (اكتب <b>edit</b>) و<b>ألغِ…</b> (اكتب <b>cancel</b>). المنشور ما ينقل ولا يتعدّل.",
        "اضغط يوم عشان تشوف بوستاته أو تخطط له. اضغط مرتين على يوم فاضي جاي عشان تجدول البوست الحالي بأفضل ساعة.",
        "<b>متى يتفاعل جمهورك:</b> الأغمق تفاعله أكثر. 1-2-3 أفضل أوقاتك؛ اضغط أي خانة عشان تجدول فيها.",
        "<b>أفضل الأوقات لكل يوم:</b> أفضل ساعات كل يوم مع الزيادة وعدد البوستات (n) ودرجة الثقة."]],
      ["المنشورات: كل شي في Zernio", [
        "كل البوستات (مجدولة، منشورة، فاشلة) والمسودات المحلية. فلتر من فوق؛ وبدّل بين شبكة وقائمة.",
        "حط الماوس على أي فيديو عشان تشوف معاينة بدون صوت. اضغط أي بوست عشان تشوفه كامل: قلّب كل شرائح الكاروسيل (الأسهم أو النقاط أو ← →)، شغّل الفيديو كامل بالصوت، أو اقرا الـPDF، وبملء الشاشة بعد. والروابط والحالة والأخطاء موجودة هناك.",
        "<b>المنصات:</b> كل بوست يبين أيقونة أول منصة و<b>+N</b>. اضغطها عشان تشوف حساب كل منصة وحالتها ووقتها.",
        "<b>⇆ المنصات…</b> (من نافذة البوست، أو كلك يمين في الخطة): شغّل أو طفّ أي منصة. اكتب edit عشان تحفظ؛ ومنصة وحدة لازم تظل.",
        "<b>انسخ</b> من نافذة البوست: والصقه على يوم ثاني في الخطة.",
        "بوست فشل؟ «اطلب من Claude يصلحه». مسودة؟ «كمّل هالبوست».",
        "«تحديث من Zernio» يجيب كل شي الحين (ويتحدث بروحه كل 5 دقايق).",
        "<b>ألغِ</b> أي بوست: افتحه واضغط «ألغِ البوست» (أو من التقويم، أو تبويب البوست، أو Ctrl+K ← ألغِ بوست)، واكتب <b>cancel</b>. المجدول ما ينزل والمسودة تظل؛ وبوستات Instagram المنشورة تنحذف من تطبيق Instagram."]],
      ["النمو", [
        "<b>🅰🅱 جرّب هوكين</b> (ريل انستقرام، تبويب البوست ← المعاينة ← جرّب هوكين، أو Ctrl+K): B ياخذ أول سطر مختلف (اكتبه، أو <b>✨ اطلب من Claude هوك B</b>) وكفر مختلف إذا تبي. اكتب <b>go</b>: النسختين ينزلون كـ Trial Reels بنفس الوقت ويشوفهم بس اللي ما يتابعونك. بعد 48 ساعة، النمو ← <b>تجارب الهوك</b> ← شوف النتايج يقارن المشاهدات والوصول ونسبة التخطي ووقت المشاهدة؛ وما في فايز إلا مع 100 مشاهدة لكل وحدة وفرق واضح. شارك الفايز مع متابعينك من تطبيق انستقرام (··· ← Share to followers).",
        "<b>♻ أعد تدوير الأفضل</b> (كرت أفضل البوستات، أو ♻ جنب كل بوست، أو Ctrl+K): Zernio يعيد نشر البوست المنشور كل كم أسبوع أو شهر. اختار كل قد إيش، وكم مرة، وأول تاريخ؛ وأضف نسختين أو أكثر (أو اضغط <b>✨ اطلب من Claude هوكات جديدة</b>) وكل إعادة تاخذ النسخة اللي بعدها. اكتب <b>go</b> عشان يبدأ؛ ونقرا اللي انحفظ في Zernio مع تاريخ الإعادة الجاية. <b>وقّف إعادة التدوير</b> متى ما تبي. لين 10 بوستات مرة وحدة؛ بوستات TikTok ما تنعاد.",
        "الوصول والمشاهدات والتفاعل والمتابعين الجدد لآخر 7 أيام، مقارنة بالأسبوع اللي قبله.",
        "<b>التبويبات = المنصات</b> (Instagram · 6). اضغط منصة فيها كذا حساب واختار <b>كل الحسابات</b> أو حساب واحد.",
        "<b>كل الحسابات</b> يجمعهم ويعرضهم جنب بعض؛ اضغط عمود عشان ترتّب. ☆ تثبّت الحساب فوق.",
        "<b>+ اربط حساب</b> يضيف منصة أو حساب عن طريق Zernio.",
        "كل منصة تبين متابعينها وهدفها وآخر 30 يوم وأفضل أوقاتها وإيقاع نشرك وأفضل بوستاتها. <b>▶ شوفه</b> يشغّل البوست هني.",
        "<b>تحدّث …</b> جنب المتابعين: متى آخر مرة Zernio حدّثهم (تقريباً مرة باليوم).",
        "<b>الهدف:</b> تقدمك من عدد متابعينك في Zernio وكم باقي. «شلون يشتغل الهدف» يشرحه؛ و<b>غيّر الهدف</b> بضغطتين.",
        "الأيام المتواصلة (آخر 14 يوم)، أفضل البوستات (حسب المتابعين ثم الحفظ والمشاركة) وجمهورك.",
        "<b>بنك الأفكار:</b> أفكار من أفضل بوستاتك. اضغط وحدة للافتتاحية والمخطط والهاشتاقات وأفضل وقت؛ خطط لها بيوم، أو <b>✎ عدّلها</b>.",
        "<b>أدوات بنك الأفكار:</b> علّم على الأفكار (أو اختار الكل) عشان <b>تحذفها</b> («تراجع» يرجعها) أو تحفظها كمستند مقروء (‎.md‎) أو نسخة احتياطية (‎.json‎) وين ما تبي. <b>أضف فكرة</b> تكتب فكرتك؛ <b>حمّل أفكار من ملف</b> يرجّع نسخة؛ <b>امسح الكل</b> يفضي البنك (مع تراجع)."]],
      ["الرسائل", [
        "<b>تعليقات تنتظر:</b> كل تعليق يوريك البوست اللي عليه (اضغط عشان تفتحه) وهدية البوست. فلتر تنتظر · انتهت · الكل، أو حسب التصنيف.",
        "<b>رد</b> يجاوب علناً تحت التعليق. <b>أرسل الهدية</b> يرسل هدية البوست (أو أي رسالة) بالخاص: وحدة لكل تعليق، خلال 7 أيام. الرابط ينحط في النص؛ والزر اختياري، لأن Instagram ممكن يرفض الأزرار للي ما يتابعونك والمحاولة المرفوضة تستهلك الرسالة.",
        "<b>التصنيفات</b> (سؤال، عميل، سبام… أو تصنيفك) تظل على هالجهاز. <b>اخفِ</b> يخفي التعليق عن الناس؛ <b>احذف</b> يشيله نهائياً بعد ما تكتب <b>delete</b>. اللي خلصت تروح لـ«انتهت»؛ و«رجّعه للانتظار» يلغي العلامة.",
        "<b>🕒 الوقت حسب:</b> وقت التعليقات على ساعتك، أو دولة من جمهورك، أو أي منطقة زمنية.",
        "<b>تلقائي:</b> التعليقات اللي ردّت عليها هدية الرسائل تنتقل لـ«انتهت» بروحها.",
        "<b>✨ خل Claude يكتب الردود</b> ← <b>استخدمها</b> ← <b>أرسل الرد</b>، أو <b>أرسل كل المسودات</b> مرة وحدة. ما ينرسل شي بدون ضغطتك.",
        "<b>مسار الهدية</b> (الرسائل التلقائية): علّق ← تابع ← وصلته الهدية ← فتح الرابط.",
        "رديت من تطبيق Instagram (رد، أو منشن، أو بالخاص)؟ ينتقل لـ«انتهت» بعد. <b>▶ شوفه</b> يفتح البوست اللي عليه التعليق.",
        "تحت: الرسائل التلقائية بالكلمات وأسئلة البداية."]],
      ["الشغل مع Claude", [
        "<b>Enter</b> يرسل رسالتك؛ و<b>Shift+Enter</b> أو <b>Ctrl+Enter</b> لسطر جديد.",
        "ضوء <b>Claude يسمعك</b>: الأخضر يعني ضغطاتك توصل Claude Code فوراً.",
        "<b>رسالة لـClaude</b>: قول له أي شي («استخدم اللقطة 4»، «قصّر الافتتاحية»). كل ملاحظة توريك وين وصل Claude: ينتظر ← وصلت Claude ← قاعد يشتغل (مع الخطوة) ← <b>خلصت</b> أو <b>ما قدر</b>. وجواب Claude يطلع تحت ملاحظتك على طول.",
        "لما Claude يخلّص ملاحظة، يطلع <b>تنبيه</b> فيه النتيجة واللوحة تتحدث بروحها، فتشوف التغيير بدون ما تعيد التحميل.",
        "جرس <b>النشاط</b> (فوق) يعرض كل ملاحظة وطلب مع حالته ونتيجته؛ فلتر حسب قيد الشغل أو خلصت أو ما قدر. والرقم يعد النتايج الجديدة.",
        "لما Claude يحتاجك، تطلع نافذة تسألك. جاوب فيها أو بالمحادثة؛ أول جواب يعتمد.",
        "<b>Ctrl+K</b> (⌘K): شريط الأوامر. اكتب غلاف، تصحيح، وقت، جدولة، دليل…"]],
      ["الشكل والإعدادات", [
        "<b>الإصدار والبِلد</b> (الشريط العلوي، أسفل الصفحة، الإعدادات): \"v1.18.0 · build YYYYMMDD.HHMM\"، يتحدّث بروحه مع كل تعديل. عطه Claude إذا بلّغت عن مشكلة.",
        "العربي والإنجليزي نفس الشكل والمحتوى؛ بدّل من الإعدادات ← اللغة.",
        "12/24 ساعة، فاتح/داكن، و<b>الشروحات</b> (هالتوضيحات) تشغيل أو إطفاء.",
        "<b>وضع عمى الألوان</b> (الإعدادات، أو Ctrl+K ← color): ألوان أوضح مع أشكال، عشان ما تعتمد أي حالة على اللون بس. الشارات تاخذ ✓ → ! ×، ونقاط التقويم تصير ■ ○ ✕ ▲، والتغييرات تاخذ أسهم ▲▼، والخريطة الحرارية تصير من أزرق لأصفر.",
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
      { k: "linkedin poll repost tiktok snapchat facebook network settings", label: t("nsTitle"), hint: "LinkedIn poll/repost · TikTok · Snapchat · Facebook", run: openNetSettings, show: !!(p && hasNetSettings(p)) },
      { k: "activity notes results bell", label: t("actTitle"), hint: t("actHint"), run: () => setTimeout(() => toggleAct(true), 50) },
      { k: "cancel", label: t("cPickTitle"), hint: "Posts", run: () => openCancelChooser() },
      { k: "hook a/b test ab trial reels two hooks", label: "🅰🅱 " + t("abOpen"), hint: "Instagram Reel", run: () => openAbTest(), show: abEligible(p) },
      { k: "recycle repost best posts again evergreen", label: "♻ " + t("rcOpen"), hint: "Growth", run: () => openRecycle() },
      { k: "growth", label: t("tabGrowth"), hint: "tab", run: () => go("growth") },
      { k: "inbox", label: t("tabInbox"), hint: "tab", run: () => go("inbox") },
      { k: "back", label: t("back"), hint: "Esc", run: () => goBack(), show: !!state.navStack.length },
      { k: "theme", label: t("cTheme"), hint: "light / dark", run: () => $("#themeBtn").click() },
      { k: "color blind colorblind cb", label: t("cCb"), hint: "colors", run: () => $("#cbBtn").click() },
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
      enterSends(note, () => note.closest(".modal").querySelector(".actions .btn.on.big").click());
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
  // View + Copy for a post listed in the day window
  const dayActs = (e) => e.row ? [
    el("button", { class: "btn", type: "button", onclick: () => closeModal(() => openPostDetail(e.row)) }, "▶ " + t("vView")),
    el("button", { class: "btn cp-btn", type: "button", onclick: () => closeModal(() => copyPost(e.row)) }, "⧉ " + t("cpCopy"))] : [];
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

      if (state.clip && !past) body.append(el("div", { class: "slot-sec" }, el("button", { class: "btn on", type: "button", onclick: () => closeModal(() => openPaste(key)) }, "📋 " + t("cpPasteHere")),
        el("p", { class: "hint", dir: "auto" }, ((state.clip.row.caption || "").split("\n")[0] || "").slice(0, 80))));
      // posts on this day
      const pub = evs.filter((e) => e.kind === "pub"), sch = evs.filter((e) => e.kind === "sched");
      if (pub.length) {
        const sec = el("div", { class: "slot-sec" }, el("h3", {}, t("dayPublished")));
        pub.forEach((e) => sec.append(el("div", { class: "daypost" },
          el("div", { style: "unicode-bidi:plaintext" }, (e.caption || "").split("\n")[0]),
          el("div", { class: "label" }, `${t("reach")} ${fmt(e.metrics && e.metrics.reach)} · ${t("saves")} ${fmt(e.metrics && e.metrics.saves)} · ${t("shares")} ${fmt(e.metrics && e.metrics.shares)}`),
          el("div", { class: "row2" }, dayActs(e),
            el("button", { class: "btn", type: "button", onclick: () => act({ action: "report", postId: e.id }, t("slotQueued")) }, t("getReport"))))));
        body.append(sec);
      }
      if (sch.length) {
        const sec = el("div", { class: "slot-sec" }, el("h3", {}, t("dayScheduled")));
        sch.forEach((e) => sec.append(el("div", { class: "daypost" }, el("div", { style: "unicode-bidi:plaintext" }, (e.caption || "").split("\n")[0]), el("div", { class: "label" }, dt(e.scheduledFor)),
          el("div", { class: "row2" }, dayActs(e),
            e.row ? el("button", { class: "btn danger-ghost cancel-btn", type: "button", onclick: () => openCancel(e.row) }, e.row.local ? t("cDelShort") : t("cCancelShort")) : null))));
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
    const cb = document.documentElement.getAttribute("data-cb") === "on";
    $("#cbBtn").textContent = cb ? t("on") : t("off");
    $("#cbBtn").classList.toggle("on", cb);
  }
  $("#cbBtn").addEventListener("click", () => {
    const on = document.documentElement.getAttribute("data-cb") !== "on";
    if (on) document.documentElement.setAttribute("data-cb", "on"); else document.documentElement.removeAttribute("data-cb");
    try { localStorage.setItem("bps.cb", on ? "1" : "0"); } catch (e) {}
    applyToggles();
  });
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
      setTimeout(npLive, 0);
      setTimeout(watchNotes, 0);
      setTimeout(renderBell, 0);
      setTimeout(() => { const k = JSON.stringify(d.inbox || {}); if (k !== state.ibxSig) { state.ibxSig = k; renderComments({ auto: true }); } }, 0);
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
  const calStep = (d) => {
    if (state.calView === "month") state.calMonth = new Date(state.calMonth.getFullYear(), state.calMonth.getMonth() + d, 1);
    else { const x = new Date(state.calDay); x.setDate(x.getDate() + d * (state.calView === "week" ? 7 : 1)); state.calDay = x; }
    renderCalendar();
  };
  $("#calPrev").addEventListener("click", () => calStep(-1));
  $("#calNext").addEventListener("click", () => calStep(1));
  ["#batchBtn", "#zBatch"].forEach((id) => $(id).addEventListener("click", openBatch));
  ["#imgTop", "#imgPreview"].forEach((id) => { const b = $(id); if (b) b.addEventListener("click", () => openImage()); });
  $("#calToday").addEventListener("click", () => { state.calMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1); state.calDay = new Date(); state.calDay.setHours(0, 0, 0, 0); renderCalendar(); });

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
      tabPosts: ["Posts", "Every post in your Zernio account (scheduled, published, failed) plus drafts not uploaded yet. Hover a video to preview it; click a post to see all of it: every slide, the full video, or the PDF."],
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
      heat: ["When your audience engages", "Hours are shaded in 5 steps by rank: darker = more engagement in your past posts at that hour. 1-2-3 are your best slots. Click a cell to schedule there."],
      peaks: ["Peak times by day", "Each weekday's two best hours, with lift, number of posts (n) and confidence."],
      kpi: ["Last 7 days", "Compared with the 7 days before (the % below)."],
      followers: ["Followers", "Your follower count over time, from Zernio."],
      goal: ["Follower goal", "Progress to your goal from your Zernio follower count. It updates with every refresh."],
      changeGoal: ["Change goal", "Pick a quick option or type any number above your current followers."],
      streakGrid: ["Last 14 days", "Filled = you posted that day."],
      topPosts: ["Top posts", "Ranked by follows they brought, then saves + shares. Claude uses these for new ideas."],
      audience: ["Audience", "Age, gender, cities and countries of your followers."],
      ideas: ["Idea bank", "Post ideas based on your best posts. Click one for its hook, outline and best time, or edit it. Tick ideas to delete or save them; add your own; load a backup."],
      comments: ["Comments waiting", "Recent comments you haven't answered, each with the post it's on and that post's gift. Reply, send the gift, label, hide or delete."],
      abOpen: ["Test two hooks", "Post this Reel twice as Instagram Trial Reels (non-followers only) with two different first lines or covers. After 2 days, compare skip rate and watch time and share the winner to your followers."],
      abAsk: ["Hook B from Claude", "Claude writes a different first line (a new angle, not a rewording) in your voice. It appears in B's caption to edit."],
      abGo: ["Start the test", "Type go to create both Trial Reels in Zernio at the same time. Your other networks in this post aren't posted by the test."],
      abCheck: ["Hook test results", "A vs B from your own Zernio numbers: views, reach, skip rate, watch time. A winner only with 100+ views each, 48 hours and a clear gap."],
      rcOpen: ["Recycle best posts", "Zernio re-posts your best published posts every few weeks or months, with new hooks Claude writes (you review them). Starts only after you type go."],
      rcRow: ["Recycle this post", "Open the Recycle window for this post: how often, how many times, and new caption versions."],
      rcAsk: ["New hooks from Claude", "Claude writes 3-5 new versions of this post: same message, a fresh first line, your voice. They appear here to edit or remove."],
      rcGo: ["Start recycling", "Type go to turn it on in Zernio. It's read back, so you see what Zernio really has, including the next repost date."],
      liPosted: ["Your LinkedIn poll", "The poll as it goes out: question, choices, how long it's open (time left once it's live), and LinkedIn's impressions, reactions and comments. The votes themselves are on LinkedIn."],
      liPreviewMain: ["LinkedIn poll / repost", "How the poll (question, choices, how long it's open) or the reposted link will show under your caption. Change it in Network settings → LinkedIn."],
      liKind: ["LinkedIn post type", "Normal post (caption + photos, video or PDF), Poll (question, 2-4 choices, open 1 day to 2 weeks) or Repost (a LinkedIn post link; your caption becomes your comment). Polls and reposts can't have media."],
      npTextPost: ["Text post", "No photos or video needed: write the caption and it becomes a text post for LinkedIn and Facebook. Make it a LinkedIn poll or repost in step 2."],
      ns: ["Network settings", "LinkedIn: normal post, poll or repost. Facebook: feed post, Reel or Story, Reel title, first comment, save as a Facebook draft, which Page. TikTok: who can see it, comments/duets/stitches, promotional label, AI label, send as a draft, and TikTok's required OK (asked again after any change). Snapchat: Story, Saved story or Spotlight."],
      ibxPost: ["The post", "The post this comment is on. Click to open it on Instagram."],
      ibxGift: ["This post's gift", "The keyword DM set up for this post. Send gift sends it to this person now, as a private message."],
      cpBtn: ["Copy this post", "Copies it so you can paste it on another day in Plan. Same media, networks, accounts and settings; you pick the time."],
      clipBar: ["Copied post", "Click a day (or point at one and press Ctrl+V) and choose Paste here. ✕ forgets the copy."],
      accTargets: ["Post to these accounts", "Shown when a network has more than one account in Zernio. Tick each account this post goes to; it's saved at once and listed in Changes (undo there)."],
      nwBtn: ["Networks on or off", "Switch each network (or account) on or off for this post. Scheduled posts change in Zernio after you type edit; a published post can be taken off one network where it allows it."],
      viewBtn: ["View the whole post", "Opens it here: every carousel slide, the full video with sound, or the PDF, with full screen."],
      netStack: ["Networks for this post", "The first network's icon; +N means it also goes to N more. Click to see each network: account, status, time, link and any error."],
      postBatch: ["Batch schedule", "Pick several posts and schedule them at once (the same window as in Plan and Posts)."],
      ibxTz: ["Times in…", "Shows every comment's time on the clock you pick: your own country (default), a country where your audience is, this computer's clock, or any time zone. Remembered on this computer."],
      ibxWhen: ["When they commented", "Day and time on the clock picked above, then how long ago. Hover for the full date and time zone."],
      accPick: ["Accounts in this network", "Your accounts on this network in Zernio. All accounts adds them up; pick one for its own dashboard. ☆ pins an account to the top. With many accounts a search box appears."],
      netAdd: ["Connect", "Add another network or account. It opens Zernio's sign-in for that network; it shows up here once connected."],
      accTable: ["Accounts side by side", "Each account's followers, change, posts, engagement rate and engagements for the last 30 days. Click a column to sort, a row to open that account."],
      netTabs: ["One dashboard per network", "All networks shows the overview. Pick a network for its own followers, goal, last 30 days, best times, posting rhythm and top posts."],
      netKpis: ["Last 30 days", "From this network's own posts and follower count, compared with the 30 days before (the % below). Engagements = likes + comments + shares + saves."],
      netGoal: ["This network's goal", "Each network has its own follower goal. Set or change it here."],
      netBest: ["Best times on this network", "From this network's own past posts: lift vs your average, number of posts and confidence."],
      netRhythm: ["Posting rhythm", "How many posts you published each week (last 8 weeks). Hover a bar for that week's engagements."],
      ibxDraftAll: ["Ask Claude to draft replies", "Claude writes a reply in your voice for every waiting comment. Nothing is sent: each draft waits on its comment until you press Use it, then Send reply."],
      ibxSendAll: ["Send all drafts", "Posts every draft as a public reply under its comment. You see the full list first and press Post to confirm."],
      ibxDraft: ["Claude's draft", "A suggested public reply. Use it opens the reply box with this text (edit it if you like), then Send reply posts it. No thanks drops it."],
      funnel: ["Gift funnel", "Zernio's own counts for this automation: commented the keyword → got the follow-first message → followed and tapped → got the gift → opened the link. % = share of everyone who commented the keyword."],
      folFresh: ["When the follower count was updated", "Zernio refreshes follower counts about once a day, so a new follower can take up to a day to show here."],
      ibxLab: ["Labels", "Your own tags (Question, Lead, Spam…), saved on this computer only. Filter by them at the top."],
      ibxActs: ["Answer it", "Reply: a public answer under the comment. Send gift: a private message (one per comment, within 7 days). Hide: only you and them see it. Delete: removes it for good (type delete)."],
      automations: ["DM automations", "Your keyword → DM gifts and ice breakers."],
      jobs: ["Background jobs", "What's working right now (making images, publishing, uploads, refreshing from Zernio, Claude writing for you) and how far along each one is. Click to see the list."],
      image: ["Create an image", "Describe a picture and OpenAI draws it, or edit any picture by marking the places to change. Add guide pictures to keep a style, a face or a product. Nothing is posted until you add it to a post."],
      imgDrop: ["Guide pictures", "Drop, paste or pick pictures. The new image follows them: style, people, products, layout."],
      imgModel: ["Image model", "Which OpenAI model draws the picture. The ★ one is your default (Settings → Keys → OpenAI)."],
      keys: ["API keys", "Stored only in this folder's .env file, readable by you. Never shown in full and never sent to the chat."],
      lang: ["Language", "Switch between English and Arabic."], clock: ["Time format", "12-hour or 24-hour times."],
      theme: ["Theme", "Light or dark."], version: ["Version", "The installed version of this skill and its build time (updates by itself with every change)."],
      tipsPref: ["Hover tips", "Turn these explanations on or off."],
      cbPref: ["Color-blind mode", "Safer colors for red-green and blue-yellow color blindness, plus shapes and marks so no status relies on color alone."],
      viewer: ["Post viewer", "The whole post: swipe a carousel (‹ › arrows, dots, or ← → keys), play the full video with sound, or read the PDF. The full-screen button opens it large."],
      imgEditBtn: ["Edit this picture", "Mark the places to change (pin, box, paint or loop), write a note for each, and get a new version. The original is never changed."],
      imgEditPc: ["Edit a picture from your computer", "Pick any PNG, JPG or WEBP and edit it the same way: mark it, write notes, make the edited version."],
      imgSaveAs: ["Save as…", "Your computer's own Save window opens: choose any folder and file name."],
      imgFolder: ["Save to folder / Add to post", "With a draft open, the image is added to that post. Otherwise your computer's folder window opens and you choose where it goes."],
      imgToNP: ["Add to new post", "Puts this image into the New post you were making and takes you back there."],
      npCreateImg: ["Create an image", "Describe a picture, OpenAI draws it, then press Add to new post to use it here."],
      annTools: ["Marking tools", "Pin / Area: click for a pin, drag for a box. Paint: brush over the exact place (S, M, L). Surround: draw a loop around something."],
      annStage: ["Your picture", "Mark it with the tool above. Every mark gets a number and its own note. Click a number to jump to its note."],
      annList: ["Notes per mark", "Say what should change at each numbered mark. × removes a mark. Ctrl+Enter makes the edit."],
      annMask: ["Only change the marked spots", "On: OpenAI may only change your marks, and the dashboard pastes just those areas onto the original, so everything else stays pixel-for-pixel the same. Off: the whole picture may be redrawn."],
      annFs: ["Full screen", "The picture large on the left, your notes on the right. Esc or Exit full screen returns."],
      annResult: ["Edited version", "The result, saved in Your images. Edit it again, save it anywhere, or add it to a post."],
      ibAll: ["Select", "Tick ideas to delete or save several at once. This box selects or clears all."],
      ibPick: ["Select this idea", "Tick it to include it in Delete or Save."],
      ibDel: ["Delete selected", "Removes the ticked ideas. Undo brings them back; they're also kept in .bps/trash."],
      ibMd: ["Save as document", "A readable Markdown file of the selected ideas (or all), saved where you choose."],
      ibJson: ["Save backup", "A .json backup of the selected ideas (or all). Load it back any time with Load ideas from a file."],
      ibAdd: ["Add an idea", "Write your own idea: title, hook, outline, call to action, hashtags, time."],
      ibLoad: ["Load ideas from a file", "Load a .json backup. Ideas already in the bank are skipped."],
      ibClear: ["Clear all", "Deletes every idea. You can undo right after."],
      ibUndo: ["Undo", "Brings back the ideas you just deleted, in their places."],
      ibEditOne: ["Edit this idea", "Change any part of it: title, hook, why, outline, call to action, hashtags, time."],
      npTrack: ["New post in 4 steps", "1 Media & caption → 2 Check & improve → 3 Time → 4 Review & schedule. Close any time: the draft is kept in the Post tab."],
      npChecks: ["What to fix", "Red blocks scheduling, amber is advice. Ask Claude to fix one: its suggestion appears right here with before/after, and you choose Use it, Edit or No thanks."],
      npCapEdit: ["Your caption", "Edit it yourself and press Save and check again: the score and checks update at once."],
      npSlots: ["Your best times", "The next date of each of your best slots, from your own results. Or pick any day and minute below, or post right after you confirm."],
      npSug: ["Claude's suggestion", "Before and after, with the score change. Use it, edit it first, or say no thanks."],
      noteState: ["Where Claude is", "Waiting → Claude got it → Working (with the current step) → Done or Couldn't do it. Claude's answer appears right under your note."],
      gsSentence: ["The gift in one sentence", "Exactly what will happen, updated as you type."],
      gsStory: ["What people will see", "The scenes in order: their comment, your public reply, the follow-first step, and your DM with its button. It changes as you type."],
      gsWhen: ["When it starts", "Nothing runs until the post goes live with your go. Instagram only."],
      gsGate: ["Follow-first messages", "What non-followers get first, the button they tap once they follow, and the message if they tap too early."],
      calViews: ["Month · Week · Day", "Week and Day show the hours: your best hours are shaded, the red line is now. Click a day's name to open that day."],
      tgCol: ["Plan a time", "Click or drag on an empty time (15-minute steps) to put a draft there, start a new post for that time, or have Claude draft one from an idea."],
      tgEv: ["A post", "Click to see it, move it, edit its caption or cancel it. Drag it to another time to move it: posts in Zernio ask you to type move; drafts move at once. Published posts can't change."],
      bell: ["Activity", "Every note and request you sent Claude, with where it is (waiting, working, done, couldn't) and the result. The number counts new results."],
      notice: ["Claude finished", "Shown when Claude completes one of your notes, with the result. The dashboard refreshes itself so you see the change. View opens the conversation."],
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
      tabPosts: ["المنشورات", "كل بوستاتك في Zernio (مجدولة، منشورة، فاشلة) والمسودات اللي ما انرفعت. حط الماوس على أي فيديو عشان تشوف معاينة؛ واضغط أي بوست عشان تشوفه كامل: كل الشرائح، الفيديو كامل، أو الـPDF."],
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
      heat: ["متى يتفاعل جمهورك", "الساعات متدرجة على 5 درجات حسب الترتيب: الأغمق = تفاعل أكثر في بوستاتك السابقة بهالساعة. 1-2-3 أفضل أوقاتك. اضغط أي خانة عشان تجدول فيها."],
      peaks: ["أفضل الأوقات لكل يوم", "أفضل ساعتين لكل يوم، مع الزيادة وعدد البوستات (n) ودرجة الثقة."],
      kpi: ["آخر 7 أيام", "مقارنة بالـ7 أيام اللي قبلها (النسبة تحت)."],
      followers: ["المتابعين", "عدد متابعينك مع الوقت، من Zernio."],
      goal: ["هدف المتابعين", "تقدمك للهدف من عدد متابعينك في Zernio. يتحدث مع كل تحديث."],
      changeGoal: ["غيّر الهدف", "اختار من الخيارات السريعة أو اكتب أي رقم أكبر من متابعينك الحين."],
      streakGrid: ["آخر 14 يوم", "المربع المعبّى = نشرت بهاليوم."],
      topPosts: ["أفضل البوستات", "مرتبة حسب المتابعين اللي جابتهم، بعدها الحفظ والمشاركة. Claude يستخدمها للأفكار الجديدة."],
      audience: ["الجمهور", "أعمار متابعينك، الجنس، المدن والدول."],
      ideas: ["بنك الأفكار", "أفكار بوستات مبنية على أفضل بوستاتك. اضغط وحدة للافتتاحية والمخطط وأفضل وقت، أو عدّلها. علّم على الأفكار عشان تحذفها أو تحفظها؛ أضف فكرتك؛ أو حمّل نسخة."],
      comments: ["تعليقات تنتظر رد", "آخر التعليقات اللي ما رديت عليها، كل وحدة مع البوست اللي عليه وهدية البوست. رد، أرسل الهدية، صنّف، اخفِ أو احذف."],
      abOpen: ["جرّب هوكين", "ينزل هالريل مرتين كـ Trial Reels بانستقرام (لغير المتابعين بس) بسطرين أول مختلفين أو كفرين. بعد يومين قارن نسبة التخطي ووقت المشاهدة وشارك الفايز مع متابعينك."],
      abAsk: ["هوك B من Claude", "Claude يكتب أول سطر مختلف (زاوية جديدة، مو إعادة صياغة) بأسلوبك. يطلع بكابشن B تعدله."],
      abGo: ["ابدأ التجربة", "اكتب go عشان ينسوون الريلين في Zernio بنفس الوقت. المنصات الثانية بهالبوست ما تنشر من التجربة."],
      abCheck: ["نتايج تجربة الهوك", "A ضد B من أرقامك في Zernio: مشاهدات، وصول، نسبة التخطي، وقت المشاهدة. ما في فايز إلا مع 100 مشاهدة لكل وحدة و48 ساعة وفرق واضح."],
      rcOpen: ["أعد تدوير الأفضل", "Zernio يعيد نشر أفضل بوستاتك المنشورة كل كم أسبوع أو شهر، بهوكات جديدة يكتبها Claude (وأنت تراجعها). ما يبدأ إلا لما تكتب go."],
      rcRow: ["أعد تدوير هالبوست", "يفتح نافذة إعادة التدوير لهالبوست: كل قد إيش، كم مرة، ونسخ جديدة من الكابشن."],
      rcAsk: ["هوكات جديدة من Claude", "Claude يكتب 3-5 نسخ جديدة من البوست: نفس الرسالة، أول سطر جديد، وبأسلوبك. تطلع هني تعدلها أو تشيلها."],
      rcGo: ["ابدأ إعادة التدوير", "اكتب go عشان يشتغل في Zernio. ونقرا اللي انحفظ فعلياً، فتشوف اللي عند Zernio بالضبط مع تاريخ الإعادة الجاية."],
      liPosted: ["تصويتك في LinkedIn", "التصويت مثل ما بينشر: السؤال والخيارات وكم يظل مفتوح (والوقت الباقي لما ينتشر)، ومشاهدات وتفاعل وتعليقات LinkedIn. الأصوات نفسها تشوفها في LinkedIn."],
      liPreviewMain: ["تصويت / إعادة نشر LinkedIn", "كذا بيطلع التصويت (السؤال والخيارات ومدته) أو رابط إعادة النشر تحت الكابشن. غيّره من إعدادات المنصات ← LinkedIn."],
      liKind: ["نوع بوست LinkedIn", "بوست عادي (كابشن مع صور أو فيديو أو PDF)، تصويت (سؤال و2 إلى 4 خيارات، مفتوح من يوم لين أسبوعين)، أو إعادة نشر (رابط بوست LinkedIn؛ الكابشن يصير تعليقك). التصويت وإعادة النشر بدون ملفات."],
      npTextPost: ["بوست نص", "ما تحتاج صور أو فيديو: اكتب الكابشن ويصير بوست نص لـ LinkedIn وFacebook. تقدر تخليه تصويت أو إعادة نشر في LinkedIn بالخطوة 2."],
      ns: ["إعدادات المنصات", "LinkedIn: بوست عادي أو تصويت أو إعادة نشر. Facebook: بوست عادي أو ريل أو ستوري، عنوان الريل، أول تعليق، حفظه كمسودة في فيسبوك، وأي صفحة. TikTok: منو يشوفه، التعليقات/الدويت/الستيتش، علامة الترويج، علامة الذكاء الاصطناعي، إرساله كمسودة، وموافقة TikTok المطلوبة (تنطلب مرة ثانية بعد أي تغيير). Snapchat: ستوري، ستوري محفوظة، أو سبوتلايت."],
      ibxPost: ["البوست", "البوست اللي عليه التعليق. اضغط عشان تفتحه في Instagram."],
      ibxGift: ["هدية هالبوست", "رسالة الكلمة اللي مسويها لهالبوست. «أرسل الهدية» يرسلها لهالشخص الحين، كرسالة خاصة."],
      cpBtn: ["انسخ هالبوست", "ينسخه عشان تلصقه على يوم ثاني في الخطة. نفس الملفات والمنصات والحسابات والإعدادات؛ وأنت تختار الوقت."],
      clipBar: ["بوست منسوخ", "اضغط يوم (أو أشّر عليه واضغط Ctrl+V) واختار «الصق هني». ✕ تنسى النسخة."],
      accTargets: ["انشر على هالحسابات", "يبين لما يكون للمنصة أكثر من حساب في Zernio. علّم كل حساب ينزل عليه البوست؛ ينحفظ على طول ويبين في التغييرات (تقدر ترجعه من هناك)."],
      nwBtn: ["شغّل أو طفّ المنصات", "شغّل أو طفّ كل منصة (أو حساب) لهالبوست. المجدول يتغيّر في Zernio بعد ما تكتب edit؛ والمنشور تقدر تشيله من منصة إذا تسمح."],
      viewBtn: ["شوف البوست كامل", "يفتحه هني: كل شرائح الكاروسيل، أو الفيديو كامل بالصوت، أو الـPDF، مع ملء الشاشة."],
      netStack: ["منصات هالبوست", "أيقونة أول منصة؛ و+N يعني بينزل على N منصات ثانية بعد. اضغط عشان تشوف كل منصة: الحساب والحالة والوقت والرابط وأي خطأ."],
      postBatch: ["جدولة جماعية", "اختار كذا بوست وجدولهم مرة وحدة (نفس النافذة اللي في الخطة والمنشورات)."],
      ibxTz: ["الوقت حسب…", "يعرض وقت كل تعليق على الساعة اللي تختارها: دولتك (الافتراضي)، أو دولة فيها جمهورك، أو ساعة هالجهاز، أو أي منطقة زمنية. ينحفظ على هالجهاز."],
      ibxWhen: ["متى علّق", "اليوم والساعة حسب الوقت المختار فوق، وبعدها من متى. مرّر الماوس عشان تشوف التاريخ كامل والمنطقة الزمنية."],
      accPick: ["حسابات هالمنصة", "حساباتك على هالمنصة في Zernio. «كل الحسابات» يجمعهم؛ واختار حساب عشان تشوف لوحته. ☆ تثبّت الحساب فوق. ولما تكثر الحسابات يطلع مربع بحث."],
      netAdd: ["اربط حساب", "ضيف منصة أو حساب ثاني. يفتح تسجيل الدخول من Zernio لهالمنصة؛ ويبين هني بعد ما ينربط."],
      accTable: ["الحسابات جنب بعض", "متابعين كل حساب وتغيّره وبوستاته ونسبة تفاعله وتفاعلاته بآخر 30 يوم. اضغط عمود عشان ترتّب، وصف عشان تفتح الحساب."],
      netTabs: ["لوحة لكل منصة", "«كل المنصات» تعرض الملخص. اختار منصة عشان تشوف متابعينها وهدفها وآخر 30 يوم وأفضل أوقاتها وإيقاع نشرك وأفضل بوستاتها."],
      netKpis: ["آخر 30 يوم", "من بوستات هالمنصة وعدد متابعينها، مقارنة بالـ30 يوم اللي قبلها (النسبة تحت). التفاعلات = لايكات + تعليقات + مشاركات + حفظ."],
      netGoal: ["هدف هالمنصة", "كل منصة لها هدف متابعين خاص فيها. حطه أو غيّره من هني."],
      netBest: ["أفضل الأوقات على هالمنصة", "من بوستاتك السابقة على هالمنصة: الفرق عن متوسطك، وعدد البوستات، ومستوى الثقة."],
      netRhythm: ["إيقاع النشر", "كم بوست نشرت كل أسبوع (آخر 8 أسابيع). مرّر على العمود عشان تشوف تفاعلات هالأسبوع."],
      ibxDraftAll: ["خل Claude يكتب الردود", "Claude يكتب رد بأسلوبك لكل تعليق ينتظر. ما ينرسل شي: كل مسودة تنتظر على تعليقها لين تضغط «استخدمها» وبعدين «أرسل الرد»."],
      ibxSendAll: ["أرسل كل المسودات", "ينشر كل مسودة كرد عام تحت تعليقها. تشوف القائمة كاملة أول وتضغط «انشر» عشان تأكد."],
      ibxDraft: ["مسودة Claude", "رد عام مقترح. «استخدمها» يفتح خانة الرد بهالنص (عدّله إذا تبي)، وبعدين «أرسل الرد» ينشره. «لا، شكراً» يشيلها."],
      funnel: ["مسار الهدية", "أرقام Zernio لهالأتمتة: علّق بالكلمة ← وصلته «تابع أول» ← تابع وضغط ← وصلته الهدية ← فتح الرابط. النسبة = من كل اللي علّقوا بالكلمة."],
      folFresh: ["متى تحدّث عدد المتابعين", "Zernio يحدّث عدد المتابعين تقريباً مرة باليوم، فالمتابع الجديد ممكن ياخذ لين يوم عشان يبين هني."],
      ibxLab: ["التصنيفات", "تصنيفاتك (سؤال، عميل، سبام…)، محفوظة على هالجهاز بس. فلتر فيها من فوق."],
      ibxActs: ["رد عليه", "رد: جواب عام تحت التعليق. أرسل الهدية: رسالة خاصة (وحدة لكل تعليق، خلال 7 أيام). اخفِ: تشوفه أنت وهو بس. احذف: ينشال نهائياً (اكتب delete)."],
      automations: ["رسائل تلقائية", "هدايا الكلمات بالخاص وأسئلة البداية."],
      jobs: ["الشغل بالخلفية", "شنو قاعد يشتغل الحين (الصور، النشر، رفع الملفات، تحديث Zernio، Claude يكتب لك) ووين وصل كل واحد. اضغط تشوف القائمة."],
      image: ["سوّ صورة", "اوصف صورة وOpenAI يرسمها، أو عدّل أي صورة بتعليم الأماكن اللي تتغيّر. أضف صور مرشدة عشان تحافظ على أسلوب أو وجه أو منتج. ما ينشر شي لين تضيفها لبوست."],
      imgDrop: ["صور مرشدة", "اسحب أو الصق أو اختار صور. الصورة الجديدة تمشي عليها: الأسلوب، الأشخاص، المنتجات، التصميم."],
      imgModel: ["موديل الصور", "أي موديل من OpenAI يرسم الصورة. اللي عليه ★ هو الافتراضي (الإعدادات ← المفاتيح ← OpenAI)."],
      keys: ["مفاتيح API", "محفوظة بس في ملف ‎.env‎ بهالمجلد، وأنت بس تقدر تقراه. ما تنعرض كاملة وما تروح للمحادثة."],
      lang: ["اللغة", "بدّل بين العربي والإنجليزي."], clock: ["صيغة الوقت", "12 ساعة أو 24 ساعة."],
      theme: ["المظهر", "فاتح أو داكن."], version: ["الإصدار", "نسخة السكل المثبتة ووقت البِلد (يتحدّث بروحه مع كل تعديل)."],
      tipsPref: ["الشروحات", "شغّل أو طفّي هالشروحات."],
      cbPref: ["وضع عمى الألوان", "ألوان أوضح لعمى الأحمر والأخضر والأزرق والأصفر، مع أشكال وعلامات عشان ما تعتمد أي حالة على اللون بس."],
      viewer: ["عارض البوست", "البوست كامل: قلّب الكاروسيل (الأسهم ‹ › أو النقاط أو ← →)، شغّل الفيديو كامل بالصوت، أو اقرا الـPDF. زر ملء الشاشة يكبّره."],
      imgEditBtn: ["عدّل هالصورة", "علّم الأماكن اللي تبيها تتغيّر (دبوس، مربع، تلوين أو تحويط)، اكتب ملاحظة لكل وحدة، وتطلع لك نسخة جديدة. الأصلية ما تتغيّر أبداً."],
      imgEditPc: ["عدّل صورة من جهازك", "اختار أي PNG أو JPG أو WEBP وعدّلها بنفس الطريقة: علّم، اكتب ملاحظات، وسوّ النسخة المعدّلة."],
      imgSaveAs: ["احفظ باسم…", "تنفتح نافذة الحفظ بجهازك: اختار أي مجلد وأي اسم."],
      imgFolder: ["احفظ بمجلد / أضفها للبوست", "إذا في مسودة مفتوحة، الصورة تنضاف لها. غير جذي تنفتح نافذة المجلدات وتختار وين تروح."],
      imgToNP: ["أضفها للبوست الجديد", "تحط الصورة بالبوست الجديد اللي كنت تسويه وترجعك له."],
      npCreateImg: ["سوّ صورة", "اوصف صورة، OpenAI يرسمها، واضغط «أضفها للبوست الجديد» عشان تستخدمها هني."],
      annTools: ["أدوات التعليم", "دبوس / مربع: اضغط لدبوس، اسحب لمربع. لوّن: لوّن على المكان بالضبط (S، M، L). حوّط: ارسم دايرة حول الشي."],
      annStage: ["صورتك", "علّم عليها بالأداة اللي فوق. كل علامة ياخذ رقم وملاحظة خاصة فيه. اضغط الرقم عشان تروح لملاحظته."],
      annList: ["ملاحظة لكل علامة", "قول شنو يتغيّر عند كل علامة. × تشيل العلامة. Ctrl+Enter يسوي التعديل."],
      annMask: ["غيّر بس الأماكن المحددة", "شغّال: OpenAI يغيّر بس علاماتك، واللوحة تلصق هالأماكن بس على الأصلية، فكل شي ثاني يبقى نفسه بالضبط. طافي: ممكن تنرسم الصورة كلها من جديد."],
      annFs: ["ملء الشاشة", "الصورة كبيرة على جنب وملاحظاتك على الجنب الثاني. Esc أو «اطلع من ملء الشاشة» يرجعك."],
      annResult: ["النسخة المعدّلة", "النتيجة، محفوظة في صوري. عدّلها مرة ثانية، احفظها وين ما تبي، أو أضفها لبوست."],
      ibAll: ["اختيار", "علّم على الأفكار عشان تحذف أو تحفظ أكثر من وحدة مرة وحدة. هالمربع يختار الكل أو يلغي."],
      ibPick: ["اختار هالفكرة", "علّم عليها عشان تدخل بالحذف أو الحفظ."],
      ibDel: ["احذف المختار", "يشيل الأفكار المعلّمة. «تراجع» يرجعها؛ وتظل محفوظة في ‎.bps/trash‎."],
      ibMd: ["احفظ كمستند", "ملف Markdown مقروء للأفكار المختارة (أو كلها)، ينحفظ وين ما تختار."],
      ibJson: ["احفظ نسخة احتياطية", "نسخة ‎.json‎ للأفكار المختارة (أو كلها). رجّعها أي وقت من «حمّل أفكار من ملف»."],
      ibAdd: ["أضف فكرة", "اكتب فكرتك: العنوان، الافتتاحية، المخطط، الدعوة، الهاشتاقات، الوقت."],
      ibLoad: ["حمّل أفكار من ملف", "حمّل نسخة ‎.json‎. الأفكار الموجودة أصلاً تنتجاهل."],
      ibClear: ["امسح الكل", "يحذف كل الأفكار. تقدر تتراجع على طول."],
      ibUndo: ["تراجع", "يرجّع الأفكار اللي حذفتها الحين، بنفس أماكنها."],
      ibEditOne: ["عدّل هالفكرة", "غيّر أي جزء: العنوان، الافتتاحية، ليش، المخطط، الدعوة، الهاشتاقات، الوقت."],
      npTrack: ["بوست جديد بـ4 خطوات", "1 الملفات والكابشن ← 2 افحص وحسّن ← 3 الوقت ← 4 راجع وجدول. سكّر أي وقت: المسودة محفوظة في تبويب البوست."],
      npChecks: ["شنو يحتاج تصليح", "الأحمر يمنع الجدولة، والبرتقالي نصيحة. اطلب من Claude يصلّح وحدة: اقتراحه يطلع هني قبل/بعد، وتختار استخدمه أو عدّل أو لا شكراً."],
      npCapEdit: ["الكابشن مالك", "عدّله بنفسك واضغط «احفظ وافحص من جديد»: التقييم والفحوصات تتحدث على طول."],
      npSlots: ["أفضل أوقاتك", "أقرب تاريخ لكل وقت من أفضل أوقاتك، من نتايجك. أو اختار أي يوم ودقيقة تحت، أو انشره أول ما تأكد."],
      npSug: ["اقتراح Claude", "قبل وبعد، مع تغيّر التقييم. استخدمه، عدّله أول، أو قول لا شكراً."],
      noteState: ["وين وصل Claude", "ينتظر ← وصلت Claude ← قاعد يشتغل (مع الخطوة الحالية) ← خلصت أو ما قدر. جواب Claude يطلع تحت ملاحظتك على طول."],
      gsSentence: ["الهدية بجملة وحدة", "شنو بيصير بالضبط، ويتحدث وأنت تكتب."],
      gsStory: ["شنو بيشوفون الناس", "المشاهد بالترتيب: تعليقهم، ردك العام، خطوة المتابعة، ورسالتك بالخاص مع الزر. تتغيّر وأنت تكتب."],
      gsWhen: ["متى تبدأ", "ما يشتغل شي لين البوست ينزل بموافقتك (go). على Instagram بس."],
      gsGate: ["رسايل المتابعة أول", "شنو يوصل اللي ما يتابعونك أول، والزر اللي يضغطونه بعد ما يتابعون، والرسالة إذا ضغطوا بدري."],
      calViews: ["شهر · أسبوع · يوم", "الأسبوع واليوم يعرضون الساعات: أفضل ساعاتك مظللة، والخط الأحمر هو الحين. اضغط اسم اليوم عشان تفتحه."],
      tgCol: ["خطط وقت", "اضغط أو اسحب على وقت فاضي (كل 15 دقيقة) عشان تحط مسودة فيه، أو تبدأ بوست جديد لهالوقت، أو تخلي Claude يكتب واحد من فكرة."],
      tgEv: ["بوست", "اضغط عشان تشوفه أو تنقله أو تعدّل الكابشن أو تلغيه. اسحبه لوقت ثاني عشان تنقله: بوستات Zernio تطلب تكتب move؛ والمسودات تنتقل على طول. المنشور ما يتغيّر."],
      bell: ["النشاط", "كل ملاحظة وطلب أرسلته لـClaude، وين وصل (ينتظر، يشتغل، خلصت، ما قدر) والنتيجة. الرقم يعد النتايج الجديدة."],
      notice: ["Claude خلّص", "يطلع لما Claude يخلّص وحدة من ملاحظاتك، مع النتيجة. واللوحة تتحدث بروحها عشان تشوف التغيير. «شوف» يفتح المحادثة."],
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
    [".pv-wrap", "viewer"], [".img-edit-btn", "imgEditBtn"], [".img-editpc-btn", "imgEditPc"], [".img-saveas-btn", "imgSaveAs"], [".img-folder-btn", "imgFolder"],
    [".img-tonp-btn", "imgToNP"], [".np-createimg", "npCreateImg"], [".ann-tools", "annTools"], [".ann-stage", "annStage"], [".ann-list", "annList"],
    [".ann-mask", "annMask"], [".ann-fs", "annFs"], [".ann-result", "annResult"],
    [".ib-all", "ibAll"], [".ib-pick", "ibPick"], [".ib-del", "ibDel"], [".ib-md", "ibMd"], [".ib-json", "ibJson"], [".ib-add", "ibAdd"],
    [".ib-load", "ibLoad"], [".ib-clear", "ibClear"], [".ib-undo", "ibUndo"], [".ib-editone", "ibEditOne"],
    [".ab-open", "abOpen"], [".ab-ask", "abAsk"], [".ab-go, .ab-word", "abGo"], [".ab-check, .ab-table", "abCheck"], [".rc-open", "rcOpen"], [".rc-row", "rcRow"], [".rc-ask", "rcAsk"], [".rc-go, .rc-word", "rcGo"], [".li-posted", "liPosted"], [".li-pv-main", "liPreviewMain"], [".li-kind", "liKind"], [".np-texthint, .np-typelbl", "npTextPost"], [".ns", "ns"], ["#clipBar", "clipBar"], [".cp-btn, .ev-copy", "cpBtn"], ["#accTargets", "accTargets"], [".nw-btn", "nwBtn"], [".view-btn", "viewBtn"], [".netstack", "netStack"], [".post-batch", "postBatch"], [".ibx-tzwrap", "ibxTz"], [".ibx-when", "ibxWhen"], [".ibx-draftall", "ibxDraftAll"], [".net-menu", "accPick"], [".net-add", "netAdd"], [".acc-table", "accTable"], ["#netTabs", "netTabs"], [".net-kpis", "netKpis"], [".net-goal", "netGoal"], [".net-best", "netBest"], [".net-bars", "netRhythm"], [".ibx-sendall", "ibxSendAll"], [".ibx-draft", "ibxDraft"], [".fn", "funnel"], [".fol-fresh", "folFresh"], [".ibx-post", "ibxPost"], [".ibx-gift", "ibxGift"], [".ibx-lab", "ibxLab"], [".ibx-acts", "ibxActs"], ["#calViews", "calViews"], [".tg-ev", "tgEv"], [".tg-col", "tgCol"], [".gs-sentence", "gsSentence"], [".gs-story", "gsStory"], [".gs-when", "gsWhen"], [".gs-gate", "gsGate"], ["#bellBtn", "bell"], [".chat-state", "noteState"], [".notice", "notice"], [".np-track", "npTrack"], [".np-sug", "npSug"], [".np-checks", "npChecks"], [".np-slots", "npSlots"], [".np-cap2", "npCapEdit"],
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
    [".keys-card", "keys"], ["#langBtn", "lang"], ["#h12Btn, #h24Btn", "clock"], ["#themeBtn", "theme"], ["#versionPill", "version"], ["#tipsBtn", "tipsPref"], ["#cbBtn", "cbPref"],
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
      if (!tiles.length) return;                  // not built yet (fonts still loading)
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
