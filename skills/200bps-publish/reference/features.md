# 200BPS.ai | Publish: every feature (for PIX)

Generated from the dashboard's Guide by `tools/gen_features.py`. Answer users from this, in their language.

## English

### Get started

- Open Claude Code in your posts folder and type `/200bps-publish set me up`. This dashboard opens by itself.
- **The top of the dashboard**: the curve is your growth (lime is steady work, the red dot is the breakthrough). The strip under it rolls your own numbers from Zernio: followers, streak, 7-day reach, engagement, follows, the post score and your best slot (hover to pause). A post score of 100 gets the red breakthrough dot. Move the mouse to light up the grid.
- **PIX, your assistant**: PIX (the 200bps screen mascot) in the bottom corner is always there. Click it or press **N** to write to PIX. **Drop files anywhere** on the page (or **📎 Attach**, or paste) to send them with the note. PIX is a live 3D figure: it follows your mouse, blinks, bounces when you press it, and shows what PIX is doing (listening, typing, thinking, thumbs-up, shrug). PIX's replies pop up right next to it; questions still open a window. Anything running can be stopped: **■ Stop** in the jobs list or under your note. A short splash plays when you open the dashboard; click it to skip.
- **Talk to PIX like a person**: ask how anything here works ("how do I recycle a post?"), or ask it to do things ("fit this caption for LinkedIn", "make a carousel cover", "move Friday's post to 7 PM"). It does them and tells you the result; anything public still waits for your yes or a typed go. Hover PIX for a trick, wiggle the mouse over it, or press it.
- **Post to** (Post tab): tap a network to switch it on or off for this post. **Posts**: ▶ on a video plays it with sound inside the dashboard, with its results (reach, likes, saves…). **Inbox**: **⊘ Ignore** a comment that needs no reply (or **Ignore all**); Undo is right there.
- **Heatmap verdict**: point at any hour for a small card: **Good / OK / Weak time** compared with a typical hour, and how carousels, videos and photos did there, per network. From your own posts only.
- **Quick moves**: press **1-5** to switch tabs (Post, Posts, Plan, Growth, Inbox); click any number in the strip to jump to it. In **Checks**, passed checks fold into one line so what needs you stands out. In the **heatmap**, the two lines on top say what it means; point at an hour to read its numbers.
- Paste your Zernio API key in the **Connect Zernio** card and press Save. It's tested right away and stays in this folder's .env file.
- Answer the one-time setup questions (accounts, keywords, words to avoid, goal…), or say "defaults".
- Connect Instagram, LinkedIn, **Facebook**, **TikTok** or **Snapchat** from **Posts → + Connect account**. You approve on the network's own site.
- A post goes to every connected network that can show it: TikTok takes videos and photo posts (no PDFs); Snapchat takes one photo or one video. Skipped networks are listed with the reason.
- **TikTok** needs two things from you before it can be scheduled: who can see it, and your OK that you previewed the post and agree to post it (asked again if the caption or media change). You can also set comments, duets, stitches, a promotional label, an AI label, or send it to your TikTok inbox as a draft.
- **Facebook** (a Page): Feed post (text, a photo, up to 10 photos, or a video; no mixing), Reel (one vertical video, 3-90 s, optional title) or Story (one item, 24 hours, no caption). Add a first comment, save it as a draft in Facebook's Publishing Tools, and pick the Page if you have several.
- **Snapchat**: choose Story (24 hours, no caption), Saved story (stays on your Public Profile, title up to 45 characters) or Spotlight (video only, caption up to 160). Snapchat needs a Public Profile.

### Publish one post

- Make one folder per post: `caption.txt` plus images, one video (Reel) or a PDF. Optional: `caption.linkedin.txt`, `cover.jpg`.
- Type `/200bps-publish posts/my-post` in Claude Code, or use the **New post** card: photos or video from your computer, your images, a post folder, or **Create an image**.
- **Archive (.zip, .7z, .rar…):** add it like a photo, or pick a folder that holds it. It's unpacked and opened as the post.
- **PDF + photos:** LinkedIn gets the PDF; the other networks get the photos.
- **Instagram Reels** can be up to 15 minutes long.
- **🧪 Trial Reel** (an Instagram Reel: Post tab → Network settings → Instagram, or New post step 2): tick **Trial Reel** and Instagram shows it to non-followers first. **After the trial**: **Automatic** shares it to your followers if it does well; **Manual** lets you share it yourself in the Instagram app. Only when it's first posted: a Reel already live can't become a trial. The default for new Reels is in Settings → Preferences (Off unless you change it). Posts shows a **Trial** badge.
- **Text post, LinkedIn poll or repost:** in **New post**, add no media and just write the caption. In step 2 (or Post tab → Network settings → LinkedIn) pick **Poll** (a question, 2-4 choices up to 30 characters, open 1 day to 2 weeks) or **Repost** (paste a LinkedIn post link; your caption becomes your comment). Facebook, if on, gets the caption as a text post.
- **See your poll any time:** before scheduling, in the Post tab's Preview; after scheduling or posting, open it in Posts or Plan: the poll card, how long it's open (time left once live), LinkedIn's impressions, reactions and comments, and **See the votes on LinkedIn ↗** (LinkedIn doesn't share votes with apps).
- **Fix = one version per network**: on a post with 2+ networks, **Ask PIX to fix** on any check writes a caption for each network (its own length, hook, tone and hashtags) and the same Fix button opens them side by side: use all, some, edit, or no thanks.
- **The gift is Instagram only**: people follow you, comment your keyword, and the link comes in their DM (the follow is checked inside the DM). The Instagram caption must say so (a check warns if it doesn't); other networks don't ask for the keyword, because nothing is sent there: on LinkedIn and Facebook the link goes right in the caption, with a follow line and a question; TikTok and Snapchat say “link in bio”. Checks warn if a caption gets this wrong.
- **✨ Fit it for every network** (Post tab under the caption, New post step 2, or Ctrl+K; a post with 2+ networks): PIX writes one version per network (hook placement, tone, length and hashtag limits), same message in your voice. **Review** shows each next to the current caption with the score change; edit, **Use this**, **Use all** or **No thanks**. Undo from Changes.
- **Several accounts on one network?** Tick them under **Post to these accounts**. Same caption on each.
- **New post in 4 steps:** pick the media and type a caption (or leave it to PIX), then **Check & improve** (edit the caption yourself or ask PIX to fix each item; its before/after appears right there), **Time** (your best slots, any day and minute, or right away) and **Review & schedule** (add a gift, type **go**).
- Follow the path at the top of the Post tab: **Check → Cover → Time → Gift → Go**. "Next step" always does the next thing.
- **Check:** red items block publishing. Click one and PIX shows a before/after; approve, edit or reject. Your original is kept.
- **Score (0-100):** how ready the post is, with the tips that raise it.
- **Cover** (Reels): a frame, your image, or a design by PIX. "Grid view" shows the profile crop.
- **Time:** your best time from your own data, or any day/hour you click.
- **Gift** (optional): people who comment a keyword on Instagram get your DM (with a link button if you like), and you can require them to follow you first. The gift window says it in one sentence and shows each scene people will see, live as you type; it starts only when the post goes live.
- **Go:** press Publish and type **go**. The dashboard uploads to Zernio, then reads the post back to prove it's there.

### Create and edit images

- Open it from **Image** at the top, **+ Create image** in the Post tab, **New post → Create an image**, or Ctrl+K.
- **Two engines:** **OpenAI image** paints photos and illustrations (needs your OpenAI key, uses its credit). **PIX designs it** builds the picture in code (text, carousel slides, quote cards, charts) at the exact post size (square, tall 4:5, wide or story), free. Claude Code must be open; the design appears in the window by itself. **✦ Ask PIX to change** edits a PIX design.
- **New models:** the OpenAI model list refreshes by itself once a day. A new model shows a notice: **Try it**, **Make it my default** or **Got it**. **↻ Check now** (in the window and in Settings → Keys → OpenAI) asks OpenAI right away.
- **Create:** describe the picture (or press "Ask PIX to improve it"), add guide pictures to keep a style, face or product, pick shape, quality and how many.
- **Edit:** press **✎ Edit** on any image, or **Edit a picture from my computer**. Mark the picture with **Pin / Area** (click or drag), **Paint** (brush S, M, L) or **Surround** (draw a loop), and write a note for each numbered mark.
- **Only change the marked spots** (on by default): only your marks change, and everything else stays pixel-for-pixel the original. The edit keeps the original's size.
- **Full screen** shows the picture large with your notes beside it. The edited version appears right in the editor; the original is never changed.
- **Save to folder** and **Save as…** open your computer's own file manager, so you choose where it goes. **Add to post** puts it in the open draft.
- In **New post → Create an image**, press **Add to new post** on the result to drop it into the post you're making.

### Batch schedule (many posts at once)

- Open it from **Post**, **Plan** or **Posts** → **Batch schedule**, or Ctrl+K.
- **1 Pick posts:** every post folder here appears as a card. Click to select, or "Select all new".
- **Browse…** opens your computer's folder window, for folders anywhere. **Folder browser** does the same inside the dashboard.
- **2 Set times:** choose the start day, how often (every day, every 2 days, or chosen weekdays) and the time (your best times or one fixed time). Days that already have a post are skipped.
- Each time shows why it was picked (e.g. "best Wed · +96% · n=5"). Drag ⋮⋮ or use ↑↓ to reorder; edit any time directly.
- **3 Go:** review the list, type **go** once. Every post is created in Zernio as scheduled, with a live tick per post. Nothing goes out now.
- Posts that can't be scheduled yet are listed apart, with "Ask PIX to fix".

### Plan: calendar and best hours

- The calendar shows exactly the posts in the Posts tab. Colours: **lime** published, **blue** scheduled, **red** needs attention, **outline** not uploaded.
- ‹ and › change month (or week, or day); **Today** jumps back. Switch **Month · Week · Day** at the top.
- **Week and Day** show the hours, with your best hours shaded and a red line for now. **Drag a post** to another time to move it (in Month, drag it to another day). Posts already in Zernio ask you to type **move**; drafts move at once.
- **Click or drag on an empty time** to plan it: put your open draft or any draft there, start a new post for that time, or have PIX draft one from an idea.
- **Copy a post:** press **⧉** on it (or right-click → Copy, or Ctrl+C). Click a day → **Paste here** (or Ctrl+V). Pick the time and type go, or save it as a Zernio draft. Tick 🎁 to copy its gift too.
- **Right-click** a post for View, Copy, Move, Edit or Cancel; right-click a day or hour to Paste or plan it.
- Click a post for **Move…**, **Edit caption…** (type **edit**) and **Cancel…** (type **cancel**). Published posts can't be moved or edited.
- Click a day to see its posts or plan it. Double-click an empty future day to schedule the current post at that day's best hour.
- **When your audience engages:** darker cells had more engagement. 1-2-3 mark your best slots; click any cell to schedule there.
- **Peak times by day:** each weekday's best hours with lift, number of posts (n) and confidence.

### Posts: everything in Zernio

- Every post (scheduled, published, failed) plus local drafts. Filter at the top; switch Grid or List.
- Hover a video to see a muted preview. Click any post to see all of it: swipe every carousel slide (arrows, dots or ← →), play the full video with sound, or read the PDF; full screen too. Links, per-platform status and errors are there as well.
- **Networks:** each post shows its first network's icon and **+N**. Click it for every network's account, status and time.
- **⇆ Networks…** (in a post's window, or right-click it in Plan): switch any network on or off. Type edit to save; at least one stays on.
- **Copy** in a post's window: paste it on another day in Plan.
- Failed post? "Ask PIX to fix". A draft? "Continue this post".
- "Refresh from Zernio" reloads everything now (it also refreshes every 5 minutes).
- **Cancel** any post: open it and press Cancel post (or use the calendar, the Post tab, or Ctrl+K → Cancel a post), then type **cancel**. Scheduled posts never go out and the draft stays; Instagram posts that are already live are deleted in the Instagram app.

### Growth

- **🅰🅱 Test two hooks** (an Instagram Reel, Post tab → Preview → Test two hooks, or Ctrl+K): B gets a different first line (write it, or **✨ Ask PIX for hook B**) and optionally a different cover. Type **go**: both go out as Trial Reels at the same time, seen only by non-followers. After 48 hours, Growth → **Hook tests** → Check results compares views, reach, skip rate and watch time; a winner only with 100+ views each and a clear gap. Share the winner to your followers in the Instagram app (··· → Share to followers).
- **♻ Recycle best posts** (Top posts card, a ♻ on each row, or Ctrl+K): Zernio re-posts a published post every few weeks or months. Pick how often, how many times and the first date; add 2 or more new versions (or press **✨ Ask PIX for new hooks**) and each repost uses the next one. Type **go** to start; it's read back from Zernio with the next repost date. **Stop recycling** any time. Up to 10 at once; TikTok posts can't be recycled.
- Reach, views, engagement and new follows for 7 days, compared with the 7 days before.
- **Tabs = networks** (Instagram · 6). Click one with several accounts to pick **All accounts** or one account.
- **All accounts** adds them up and lists them side by side; click a column to sort. ☆ pins an account to the top.
- **+ Connect** adds a network or account through Zernio.
- Each network shows followers, its own goal, the last 30 days, best times, posting rhythm and top posts. **▶ View** plays a top post here.
- **updated …** next to followers: when Zernio last refreshed them (about once a day).
- **Goal:** progress from your Zernio follower count, with how many are left. "How this goal works" explains it; **Change goal** sets a new one in two clicks.
- Streak (last 14 days), top posts (ranked by follows, then saves + shares) and your audience.
- **🧪 Trial Reels for waiting Reels** (Posts → 🧪 Trial Reels, Ctrl+K, a post's window, or right-click it in Plan): every Instagram Reel that isn't live yet. See what your own results say (trial vs normal Reels, with how many and how sure) and what Instagram says. Tick **Trial Reel**, pick **Automatic** or **Manual** (★ = your default), type **edit** and **Apply**: only the Instagram part changes, and it's read back from Zernio. **✨ Ask PIX** gives advice per Reel in the chat. Trial Reels are easy to spot: 🧪 and a dashed outline in Plan, a lime 🧪 Trial chip in Posts.
- **What it is on each network**: one video can be a Reel on Instagram, a Video on LinkedIn, a Spotlight on Snapchat. Every post shows its format per network: ▶ Reel, ▷ Trial Reel, ▣ Carousel, ▢ Photo, ◔ Story, ◑ Saved story, ✦ Spotlight, ▤ Document, ¶ Text, ☰ Poll, ↻ Repost (point at the icon, or see the day card).
- **💬 Ask PIX about one post** (day cards, a post's window, right-click a post in Plan or Posts): a small chat opens right there. PIX knows which post you mean and answers in the same box. Public changes still need your yes.
- **Plan at a glance**: every post shows its type (▶ Reel, ▣ carousel, ▢ photo, ▤ PDF, ¶ text, ☰ poll), its time and one badge per network (IG·3 = 3 Instagram accounts; lime ✓ all live, outline waiting, red ! something failed; point at it for every account). **Show only** chips at the top: all, one network or one account. Day view shows full account names.
- **Click a day**: a card per post with its picture, type, time, status and networks, and every action: View, Networks…, **Reschedule…**, Edit caption…, Trial Reel…, Copy, Cancel. **Reschedule**: pick any day and minute or a quick pick (+1 day, +1 week, your best hours); From → To shows the full day name and date; type **move** for a post in Zernio.
- **Every network on each post** (Plan and Posts): each network is its own badge: lime with ✓ = live, outline = waiting, red ! = failed. Click the badges to see where it goes, open it on each network, change its networks or make it a Trial Reel.
- **Audience per account** (Growth → a network tab → one account → Audience): where that account's followers are. Instagram: countries, cities, ages, gender and their clocks. Facebook Pages: countries and cities. LinkedIn company pages: country, region, industry, job and seniority. **All accounts** adds them up. Personal LinkedIn profiles, TikTok and Snapchat don't share it. Refreshed every 6 hours.
- **The idea bank is on every Growth tab** (All networks and each network), at the bottom.
- **Idea bank:** ideas from your best posts. Click one for hook, outline, hashtags and best time; plan it on a day, or **✎ Edit** it.
- **Idea bank tools:** tick ideas (or Select all) to **Delete** them (Undo brings them back) or save them as a readable document (.md) or a backup (.json) wherever you choose. **Add an idea** writes your own; **Load ideas from a file** brings a backup back; **Clear all** empties the bank (with Undo).

### Inbox

- **Comments waiting:** each comment shows the post it's on (click to open it) and that post's gift. Filter Waiting · Handled · All, or by label.
- **Reply** answers publicly under the comment. **Send gift** sends the post's gift (or any message) privately: one per comment, within 7 days. The link goes in the text; a link button is optional, because Instagram may refuse buttons to non-followers and a refused try uses up the message.
- **Labels** (Question, Lead, Spam… or your own) stay on this computer. **Hide** keeps a comment from others; **Delete** removes it for good after you type **delete**. Handled comments move to Handled; "Back to waiting" undoes the mark.
- **🕒 Times in:** comment times on your clock, an audience country's, or any time zone.
- **Auto-handled:** comments your DM gift already answered move to Handled by themselves.
- **✨ Ask PIX to draft replies** → **Use it** → **Send reply**, or **Send all drafts** at once. Nothing sends without your click.
- **Gift funnel** (DM automations): commented → followed → got the gift → opened the link.
- Answered in the Instagram app (a reply, an @mention or a DM)? It moves to Handled too. **▶ View** opens the post a comment is on.
- Below: your keyword → DM automations and ice breakers.

### Working with PIX

- **Enter** sends your note; **Shift+Enter** or **Ctrl+Enter** adds a new line.
- The **PIX is listening** light: green means your clicks reach Claude Code right away.
- **Note to PIX**: tell PIX anything ("use frame 4", "shorter hook"). Each note shows where PIX is: waiting → PIX got it → working (with the current step) → **done** or **couldn't do it**. PIX's answer appears right under your note.
- When PIX finishes a note, a **notice** slides in with the result and the dashboard refreshes itself, so you see the change without reloading.
- The **Activity** bell (top bar) lists every note and request with its status and result; filter by In progress, Done or Couldn't. Its number counts new results.
- When PIX needs you, a pop-up asks. Answer there or in the chat; the first answer wins.
- **Ctrl+K** (⌘K): the command bar. Type cover, fix, time, batch, dark, guide…

### Look and settings

- **Version and build** (top bar, footer, Settings): "v1.18.0 · build YYYYMMDD.HHMM", updated by itself with every change. Tell PIX this number when reporting a problem.
- English and Arabic look and read the same; switch in Settings → Language.
- 12h/24h time, light/dark theme, and **Hover tips** (these explanations) on or off.
- **Color-blind mode** (Settings, or Ctrl+K → color): safer colors plus shapes, so no status relies on color alone. Badges get ✓ → ! ×, calendar dots become ■ ○ ✕ ▲, changes get ▲▼ arrows, and the heatmap turns blue-to-yellow.
- The quiet background of your mark and name follows the mouse with depth. It stops when your computer's "reduce motion" setting is on.
- API keys: Settings → Keys. Stored only in this folder's .env file and never shown in full.

### Safety

- Nothing is published, scheduled or automated until you type **go** (or say yes in the chat).
- One go covers one post, or exactly one batch list you reviewed.
- Every change to a draft is recorded: use ↺ on a step, or revert one change under Changes.
- This dashboard runs only on your computer (127.0.0.1) and never sees your social passwords.

### From the chat

- `/200bps-publish FOLDER`: check and publish one post. "open my dashboard", "report on my last post", "give me post ideas", "set my ice breakers".
- Batch from the chat: `bps.py batch scan`, `batch prepare FOLDERS`, `batch suggest --count N`, then `batch run --confirm` after your go.

## العربية

### البداية

- افتح Claude Code في مجلد البوستات واكتب `/200bps-publish set me up`. هاللوحة تنفتح بروحها.
- **أعلى اللوحة**: المنحنى هو نموك (الأخضر شغل ثابت، والنقطة الحمرا هي الاختراق). والشريط تحته يمشي بأرقامك الحقيقية من Zernio: المتابعين، الأيام المتواصلة، الوصول والتفاعل والمتابعين الجدد بآخر 7 أيام، تقييم البوست وأفضل وقت (وقّف عليه بالماوس عشان يوقف). وتقييم 100 ياخذ نقطة الاختراق الحمرا. حرّك الماوس عشان تنور الشبكة.
- **PIX، مساعدك**: PIX اللي بالزاوية تحت دايماً موجود. اضغط عليه أو اضغط **N** عشان تكتب لـPIX. **اسحب ملفات لأي مكان** بالصفحة (أو **📎 أرفق**، أو الصق) عشان ترسلها مع الرسالة. وPIX شكل ثلاثي الأبعاد حي: يلحق الماوس، يرمش، ينط لما تضغط عليه، ويوريك شنو يسوي PIX (يسمع، يكتب، يفكر، 👍، يهز كتوفه). ردوده تطلع جنبه؛ والأسئلة تفتح نافذة. وأي شي قاعد يشتغل تقدر توقفه: **■ وقّف** بقائمة الشغل أو تحت رسالتك. ولما تفتح اللوحة تطلع شاشة افتتاحية قصيرة؛ اضغط عليها عشان تتخطاها.
- **كلّم PIX كأنه إنسان**: اسأله عن أي شي هني («شلون أعيد نشر بوست؟»)، أو اطلب منه يسوي أشياء («فصّل الكابشن للينكدإن»، «سوّ غلاف للكاروسيل»، «انقل بوست الجمعة للساعة 7»). يسويها ويقولك النتيجة؛ وأي شي ينشر للناس يظل ينتظر موافقتك أو تكتب go. أشّر على PIX عشان يسوي حركة، أو حرّك الماوس فوقه، أو اضغطه.
- **انشر على** (تبويب البوست): اضغط على منصة عشان تشغّلها أو تطفيها لهالبوست. **المنشورات**: ▶ على الفيديو يشغّله بالصوت داخل اللوحة، مع نتايجه (الوصول، اللايكات، الحفظ…). **الرسائل**: **⊘ تجاهل** التعليق اللي ما يحتاج رد (أو **تجاهل الكل**)؛ والتراجع موجود.
- **حكم خريطة التفاعل**: أشّر على أي ساعة وتطلع بطاقة صغيرة: **وقت حلو / عادي / ضعيف** مقارنة بساعة عادية، وشلون سوّت الكاروسيل والفيديو والصور فيها، لكل منصة. من بوستاتك بس.
- **حركات سريعة**: اضغط **1-5** عشان تبدّل التبويبات (البوست، المنشورات، الخطة، النمو، الرسائل)؛ واضغط أي رقم بالشريط عشان تروح له. في **الفحوصات**، اللي نجحت تنطوي بسطر واحد عشان اللي يحتاجك يبين. وفي **خريطة التفاعل**، السطرين فوق يشرحون معناها؛ وأشّر على أي ساعة عشان تقرا أرقامها.
- الصق مفتاح Zernio في بطاقة **اربط Zernio** واضغط حفظ. ينختبر على طول ويظل في ملف ‎.env‎ بهالمجلد.
- جاوب أسئلة الإعداد مرة وحدة (الحسابات، الكلمات، الكلمات الممنوعة، الهدف…)، أو قول «defaults».
- اربط Instagram أو LinkedIn أو **Facebook** أو **TikTok** أو **Snapchat** من **المنشورات ← + اربط حساب**. توافق في موقع الشبكة نفسها.
- البوست يروح لكل منصة مربوطة تقدر تعرضه: TikTok ياخذ فيديو وبوستات صور (بدون PDF)؛ وSnapchat ياخذ صورة وحدة أو فيديو واحد. المنصات اللي انتجاهلت تطلع مع السبب.
- **TikTok** يحتاج منك شيئين قبل الجدولة: منو يشوفه، وموافقتك إنك شفت البوست وتبي تنشره (تنطلب مرة ثانية إذا تغيّر الكابشن أو الملفات). وتقدر بعد تحدد التعليقات والدويت والستيتش، علامة ترويج، علامة ذكاء اصطناعي، أو ترسله لصندوق TikTok كمسودة.
- **Facebook** (صفحة): بوست عادي (نص، صورة، لين 10 صور، أو فيديو؛ بدون خلط)، ريل (فيديو عمودي واحد، 3-90 ثانية، وعنوان اختياري) أو ستوري (عنصر واحد، 24 ساعة، بدون كابشن). أضف أول تعليق، احفظه كمسودة في أدوات النشر بفيسبوك، واختار الصفحة إذا عندك أكثر من وحدة.
- **Snapchat**: اختار ستوري (24 ساعة، بدون كابشن)، ستوري محفوظة (تظل في بروفايلك العام، العنوان لين 45 حرف) أو سبوتلايت (فيديو بس، الكابشن لين 160). Snapchat يحتاج بروفايل عام.

### انشر بوست واحد

- سوّ مجلد لكل بوست: `caption.txt` مع الصور، أو فيديو واحد (ريل)، أو PDF. اختياري: `caption.linkedin.txt` و`cover.jpg`.
- اكتب `/200bps-publish posts/my-post` في Claude Code، أو استخدم بطاقة **بوست جديد**: صور أو فيديو من جهازك، صورك، مجلد بوست، أو **سوّ صورة**.
- **ملف مضغوط (.zip, .7z, .rar…):** ضيفه مثل الصورة، أو اختار المجلد اللي فيه. ينفك وينفتح كبوست.
- **PDF وصور:** LinkedIn ياخذ الـPDF؛ والمنصات الثانية ياخذون الصور.
- **ريلز Instagram** تقدر توصل لين 15 دقيقة.
- **التصليح = نسخة لكل منصة**: بالبوست اللي ينزل على منصتين أو أكثر، **اطلب من PIX يصلحه** على أي فحص يكتب كابشن لكل منصة (طولها وهوكها وأسلوبها وهاشتاقاتها)، ونفس زر التصليح يفتحهم جنب بعض: استخدم الكل، بعضها، عدّل، أو لا شكراً.
- **الهدية بانستقرام بس**: الشخص يتابعك، يعلّق بالكلمة، ويوصله الرابط بالخاص (والمتابعة تنفحص داخل الخاص). كابشن انستقرام لازم يقول جذي (فحص ينبهك إذا لا)؛ والمنصات الثانية ما تطلب الكلمة، لأن ما ينرسل شي هناك: بلينكدإن وفيسبوك الرابط ينحط مباشرة بالكابشن مع سطر «تابعني» وسؤال؛ وتيك توك وسناب «الرابط بالبايو». الفحوصات تنبهك إذا الكابشن غلط.
- **✨ فصّله لكل منصة** (تبويب البوست تحت الكابشن، الخطوة 2 بالبوست الجديد، أو Ctrl+K؛ لبوست فيه منصتين أو أكثر): PIX يكتب نسخة لكل منصة (مكان الهوك، الأسلوب، حدود الطول والهاشتاقات)، نفس الرسالة وبأسلوبك. **راجعها** يعرض كل وحدة جنب الكابشن الحالي مع تغيّر السكور؛ عدّل، أو **استخدم هذي**، أو **استخدم الكل**، أو **لا شكراً**. وتتراجع من التغييرات.
- **🧪 Trial Reel** (ريل انستقرام: تبويب البوست ← إعدادات المنصات ← Instagram، أو بوست جديد خطوة 2): فعّل **Trial Reel** وانستقرام يعرضه لغير المتابعين أول. **بعد التجربة**: **تلقائي** ينشره لمتابعينك إذا أدّى زين؛ **يدوي** تنشره أنت من تطبيق انستقرام. ينختار بس وقت النشر: الريل المنشور ما يصير تجريبي. الافتراضي للريلز الجديدة في الإعدادات ← التفضيلات (مطفي إلا إذا غيّرته). المنشورات تحط عليه شارة **تجريبي**.
- **بوست نص، تصويت أو إعادة نشر في LinkedIn:** في **بوست جديد** لا تضيف صور، اكتب الكابشن بس. بالخطوة 2 (أو تبويب البوست ← إعدادات المنصات ← LinkedIn) اختار **تصويت** (سؤال، و2 إلى 4 خيارات كل واحد لين 30 حرف، مفتوح من يوم لين أسبوعين) أو **إعادة نشر** (الصق رابط بوست LinkedIn؛ الكابشن مالك يصير تعليقك). وFacebook إذا شغّال ياخذ الكابشن كبوست نص.
- **شوف تصويتك أي وقت:** قبل الجدولة في معاينة تبويب البوست؛ وبعد الجدولة أو النشر افتحه من المنشورات أو الخطة: كرت التصويت، وكم يظل مفتوح (والوقت الباقي لما ينتشر)، ومشاهدات وتفاعل وتعليقات LinkedIn، وزر **شوف التصويت في LinkedIn ↗** (LinkedIn ما يعطي الأصوات للتطبيقات).
- **عندك كذا حساب على نفس المنصة؟** علّمهم في **انشر على هالحسابات**. نفس الكابشن على كل واحد.
- **بوست جديد بـ4 خطوات:** اختار الملفات واكتب الكابشن (أو خله على PIX)، بعدين **افحص وحسّن** (عدّل الكابشن بنفسك أو اطلب من PIX يصلّح كل نقطة؛ قبل/بعد يطلع هني)، **الوقت** (أفضل أوقاتك، أي يوم ودقيقة، أو على طول) و**راجع وجدول** (أضف هدية، واكتب **go**).
- امشِ على المسار فوق تبويب البوست: **فحص ← غلاف ← وقت ← هدية ← نشر**. «التالي» دايماً يسوي الخطوة الجاية.
- **الفحص:** الأحمر يمنع النشر. اضغطه وPIX يوريك قبل/بعد؛ وافق، عدّل أو ارفض. النص الأصلي محفوظ.
- **التقييم (0-100):** قد إيش البوست جاهز، مع النصايح اللي ترفعه.
- **الغلاف** (للريلز): لقطة، صورتك، أو تصميم من PIX. «عرض الشبكة» يوريك القص بالبروفايل.
- **الوقت:** أفضل وقت من بياناتك، أو أي يوم/ساعة تضغطها.
- **الهدية** (اختياري): اللي يعلّق بكلمة على Instagram توصله رسالتك بالخاص (مع زر لرابطك إذا تبي)، وتقدر تشترط إنه يتابعك أول. نافذة الهدية تقولها بجملة وحدة وتوريك كل مشهد بيشوفونه الناس وأنت تكتب؛ وما تبدأ إلا لما البوست ينزل.
- **نشر:** اضغط انشر واكتب **go**. اللوحة ترفعه على Zernio وبعدها تقراه منه عشان تتأكد إنه موجود.

### سوّ وعدّل صور

- افتحها من **صورة** فوق، أو **+ سوّ صورة** في تبويب البوست، أو **بوست جديد ← سوّ صورة**، أو Ctrl+K.
- **طريقتين:** **صورة OpenAI** ترسم صور ورسومات (تحتاج مفتاح OpenAI وتستهلك رصيده). **PIX يصممها** تبني الصورة بالكود (كتابة، سلايدات كاروسيل، اقتباسات، رسوم بيانية) بنفس مقاس البوست (مربع، طولي 4:5، عرضي أو ستوري)، ببلاش. لازم Claude Code يكون مفتوح؛ والتصميم يطلع بالنافذة بروحه. **✦ خل PIX يعدّلها** يعدّل تصميم PIX.
- **موديلات جديدة:** قائمة موديلات OpenAI تتحدث بروحها مرة باليوم. أي موديل جديد يطلع له تنبيه: **جرّبه**، **خله الافتراضي** أو **تمام**. **↻ افحص الحين** (بالنافذة وبالإعدادات ← المفاتيح ← OpenAI) يسأل OpenAI على طول.
- **سوّ:** اوصف الصورة (أو اضغط «خل PIX يحسّنه»)، أضف صور مرشدة عشان تحافظ على أسلوب أو وجه أو منتج، واختار الشكل والجودة والعدد.
- **عدّل:** اضغط **✎ عدّل** على أي صورة، أو **عدّل صورة من جهازك**. علّم على الصورة بـ**دبوس / مربع** (ضغطة أو سحب)، **لوّن** (فرشاة S، M، L) أو **حوّط** (ارسم دايرة)، واكتب ملاحظة لكل علامة مرقّمة.
- **غيّر بس الأماكن المحددة** (شغّال من البداية): بس علاماتك تتغيّر، وكل شي ثاني يبقى نفس الأصلية بالضبط. والتعديل يحافظ على مقاس الأصلية.
- **ملء الشاشة** يكبّر الصورة وملاحظاتك جنبها. النسخة المعدّلة تطلع داخل المحرر نفسه؛ والأصلية ما تتغيّر أبداً.
- **احفظ بمجلد** و**احفظ باسم…** يفتحون مدير الملفات بجهازك، فتختار وين تروح. **أضفها للبوست** تحطها بالمسودة المفتوحة.
- في **بوست جديد ← سوّ صورة**، اضغط **أضفها للبوست الجديد** على النتيجة عشان تنحط بالبوست اللي تسويه.

### جدولة مجموعة (بوستات كثيرة مرة وحدة)

- افتحها من **البوست** أو **الخطة** أو **المنشورات** ← **جدولة مجموعة**، أو Ctrl+K.
- **1 اختار البوستات:** كل مجلد بوست هني يطلع كبطاقة. اضغط عشان تختار، أو «اختار كل الجديد».
- **تصفح…** يفتح نافذة المجلدات بجهازك، لمجلدات من أي مكان. **متصفح المجلدات** نفس الشي داخل اللوحة.
- **2 حدد الأوقات:** اختار يوم البداية، كم مرة (كل يوم، كل يومين، أو أيام تختارها) والوقت (أفضل أوقاتك أو وقت ثابت). الأيام اللي فيها بوست تنتجاهل.
- كل وقت يقول ليش انختار (مثلاً «أفضل وقت الأربعاء · +96% · n=5»). اسحب ⋮⋮ أو ↑↓ عشان ترتب؛ وعدّل أي وقت مباشرة.
- **3 نشر:** راجع القائمة واكتب **go** مرة وحدة. كل بوست ينسوى في Zernio كمجدول، مع علامة ✓ لكل واحد. ما ينزل شي الحين.
- البوستات اللي ما ينفع تنجدول تطلع لحالها، مع «اطلب من PIX يصلحه».

### الخطة: التقويم وأفضل الساعات

- التقويم يعرض نفس البوستات اللي في تبويب المنشورات. الألوان: **ليموني** منشور، **أزرق** مجدول، **أحمر** يحتاج انتباه، **إطار** ما انرفع.
- ‹ و› يغيرون الشهر (أو الأسبوع أو اليوم)؛ **اليوم** يرجعك. بدّل **شهر · أسبوع · يوم** من فوق.
- **الأسبوع واليوم** يعرضون الساعات، مع تظليل أفضل ساعاتك وخط أحمر للحين. **اسحب أي بوست** لوقت ثاني عشان تنقله (في الشهر اسحبه ليوم ثاني). بوستات Zernio تطلب تكتب **move**؛ والمسودات تنتقل على طول.
- **اضغط أو اسحب على وقت فاضي** عشان تخطط له: حط المسودة المفتوحة أو أي مسودة، أو ابدأ بوست جديد لهالوقت، أو خل PIX يكتب واحد من فكرة.
- **انسخ بوست:** اضغط **⧉** عليه (أو كلك يمين ← انسخ، أو Ctrl+C). اضغط يوم ← **الصق هني** (أو Ctrl+V). اختار الوقت واكتب go، أو احفظه مسودة في Zernio. علّم 🎁 عشان تنسخ الهدية بعد.
- **كلك يمين** على بوست: شوفه، انسخ، انقل، عدّل أو ألغِ؛ وعلى يوم أو ساعة: الصق أو خطّط له.
- اضغط أي بوست لـ**انقل…** و**عدّل الكابشن…** (اكتب **edit**) و**ألغِ…** (اكتب **cancel**). المنشور ما ينقل ولا يتعدّل.
- اضغط يوم عشان تشوف بوستاته أو تخطط له. اضغط مرتين على يوم فاضي جاي عشان تجدول البوست الحالي بأفضل ساعة.
- **متى يتفاعل جمهورك:** الأغمق تفاعله أكثر. 1-2-3 أفضل أوقاتك؛ اضغط أي خانة عشان تجدول فيها.
- **أفضل الأوقات لكل يوم:** أفضل ساعات كل يوم مع الزيادة وعدد البوستات (n) ودرجة الثقة.

### المنشورات: كل شي في Zernio

- كل البوستات (مجدولة، منشورة، فاشلة) والمسودات المحلية. فلتر من فوق؛ وبدّل بين شبكة وقائمة.
- حط الماوس على أي فيديو عشان تشوف معاينة بدون صوت. اضغط أي بوست عشان تشوفه كامل: قلّب كل شرائح الكاروسيل (الأسهم أو النقاط أو ← →)، شغّل الفيديو كامل بالصوت، أو اقرا الـPDF، وبملء الشاشة بعد. والروابط والحالة والأخطاء موجودة هناك.
- **المنصات:** كل بوست يبين أيقونة أول منصة و**+N**. اضغطها عشان تشوف حساب كل منصة وحالتها ووقتها.
- **⇆ المنصات…** (من نافذة البوست، أو كلك يمين في الخطة): شغّل أو طفّ أي منصة. اكتب edit عشان تحفظ؛ ومنصة وحدة لازم تظل.
- **انسخ** من نافذة البوست: والصقه على يوم ثاني في الخطة.
- بوست فشل؟ «اطلب من PIX يصلحه». مسودة؟ «كمّل هالبوست».
- «تحديث من Zernio» يجيب كل شي الحين (ويتحدث بروحه كل 5 دقايق).
- **ألغِ** أي بوست: افتحه واضغط «ألغِ البوست» (أو من التقويم، أو تبويب البوست، أو Ctrl+K ← ألغِ بوست)، واكتب **cancel**. المجدول ما ينزل والمسودة تظل؛ وبوستات Instagram المنشورة تنحذف من تطبيق Instagram.

### النمو

- **🅰🅱 جرّب هوكين** (ريل انستقرام، تبويب البوست ← المعاينة ← جرّب هوكين، أو Ctrl+K): B ياخذ أول سطر مختلف (اكتبه، أو **✨ اطلب من PIX هوك B**) وكفر مختلف إذا تبي. اكتب **go**: النسختين ينزلون كـ Trial Reels بنفس الوقت ويشوفهم بس اللي ما يتابعونك. بعد 48 ساعة، النمو ← **تجارب الهوك** ← شوف النتايج يقارن المشاهدات والوصول ونسبة التخطي ووقت المشاهدة؛ وما في فايز إلا مع 100 مشاهدة لكل وحدة وفرق واضح. شارك الفايز مع متابعينك من تطبيق انستقرام (··· ← Share to followers).
- **♻ أعد تدوير الأفضل** (كرت أفضل البوستات، أو ♻ جنب كل بوست، أو Ctrl+K): Zernio يعيد نشر البوست المنشور كل كم أسبوع أو شهر. اختار كل قد إيش، وكم مرة، وأول تاريخ؛ وأضف نسختين أو أكثر (أو اضغط **✨ اطلب من PIX هوكات جديدة**) وكل إعادة تاخذ النسخة اللي بعدها. اكتب **go** عشان يبدأ؛ ونقرا اللي انحفظ في Zernio مع تاريخ الإعادة الجاية. **وقّف إعادة التدوير** متى ما تبي. لين 10 بوستات مرة وحدة؛ بوستات TikTok ما تنعاد.
- الوصول والمشاهدات والتفاعل والمتابعين الجدد لآخر 7 أيام، مقارنة بالأسبوع اللي قبله.
- **التبويبات = المنصات** (Instagram · 6). اضغط منصة فيها كذا حساب واختار **كل الحسابات** أو حساب واحد.
- **كل الحسابات** يجمعهم ويعرضهم جنب بعض؛ اضغط عمود عشان ترتّب. ☆ تثبّت الحساب فوق.
- **+ اربط حساب** يضيف منصة أو حساب عن طريق Zernio.
- كل منصة تبين متابعينها وهدفها وآخر 30 يوم وأفضل أوقاتها وإيقاع نشرك وأفضل بوستاتها. **▶ شوفه** يشغّل البوست هني.
- **تحدّث …** جنب المتابعين: متى آخر مرة Zernio حدّثهم (تقريباً مرة باليوم).
- **الهدف:** تقدمك من عدد متابعينك في Zernio وكم باقي. «شلون يشتغل الهدف» يشرحه؛ و**غيّر الهدف** بضغطتين.
- الأيام المتواصلة (آخر 14 يوم)، أفضل البوستات (حسب المتابعين ثم الحفظ والمشاركة) وجمهورك.
- **🧪 Trial Reels للريلز اللي تنتظر** (المنشورات ← 🧪 Trial Reels، أو Ctrl+K، أو نافذة البوست، أو كليك يمين عليه بالخطة): كل ريل انستقرام لسا ما نزل. تشوف شنو تقول نتايجك (التجريبي ضد العادي، مع كم وحدة وشكثر متأكدين) وشنو يقول انستقرام. فعّل **Trial Reel**، اختار **تلقائي** أو **يدوي** (★ = الافتراضي مالك)، اكتب **edit** واضغط **طبّق**: بس جزء انستقرام يتغير، وينقرا من Zernio. **✨ اسأل PIX** يعطيك نصيحة لكل ريل بالشات. الـTrial Reels واضحة: 🧪 وإطار متقطع بالخطة، وشارة 🧪 تجريبي بالمنشورات.
- **شنو هو بكل منصة**: الفيديو الواحد ممكن يكون ريل بانستقرام، فيديو بلينكدإن، سبوتلايت بسناب. كل بوست يبين نوعه بكل منصة: ▶ ريل، ▷ Trial Reel، ▣ كاروسيل، ▢ صورة، ◔ ستوري، ◑ ستوري محفوظة، ✦ سبوتلايت، ▤ مستند، ¶ نص، ☰ تصويت، ↻ إعادة نشر (أشّر على الأيقونة، أو شوف كرت اليوم).
- **💬 اسأل PIX عن بوست** (كروت اليوم، نافذة البوست، كليك يمين على بوست بالخطة أو المنشورات): شات صغير يطلع بمكانه. PIX يعرف أي بوست تقصد ويرد بنفس المربع. أي تغيير عام يحتاج موافقتك.
- **الخطة بنظرة**: كل بوست يبين نوعه (▶ ريل، ▣ كاروسيل، ▢ صورة، ▤ PDF، ¶ نص، ☰ تصويت)، ووقته، وشارة لكل منصة (IG·3 = 3 حسابات انستقرام؛ ليموني ✓ كله منشور، إطار ينتظر، أحمر ! شي فشل؛ أشّر عليها تطلع كل الحسابات). أزرار **اعرض بس** فوق: الكل، منصة وحدة أو حساب واحد. عرض اليوم يبين أسماء الحسابات كاملة.
- **اضغط على يوم**: كرت لكل بوست بصورته ونوعه ووقته وحالته ومنصاته، وكل الأفعال: شوفه، المنصات…، **أعد الجدولة…**، عدّل الكابشن…، Trial Reel…، انسخ، ألغِ. **أعد الجدولة**: اختار أي يوم ودقيقة أو اختيار سريع (+يوم، +أسبوع، أفضل ساعاتك)؛ من ← إلى يبين اسم اليوم والتاريخ كامل؛ اكتب **move** لبوست بـZernio.
- **كل منصات البوست** (الخطة والمنشورات): كل منصة لها شارة: ليموني مع ✓ = منشور، إطار = ينتظر، أحمر ! = فشل. اضغط الشارات عشان تشوف وين ينزل، تفتحه بكل منصة، تغيّر منصاته أو تخليه Trial Reel.
- **الجمهور لكل حساب** (النمو ← تبويب منصة ← حساب ← الجمهور): وين متابعين هالحساب. انستقرام: الدول والمدن والأعمار والجنس وساعاتهم. صفحات فيسبوك: الدول والمدن. صفحات شركات لينكدإن: الدولة والمنطقة والمجال والوظيفة والمستوى. **كل الحسابات** يجمعهم. لينكدإن الشخصي وتيك توك وسناب ما يشاركونها. تتحدث كل 6 ساعات.
- **بنك الأفكار بكل تبويبات النمو** (كل المنصات وكل منصة)، تحت.
- **بنك الأفكار:** أفكار من أفضل بوستاتك. اضغط وحدة للافتتاحية والمخطط والهاشتاقات وأفضل وقت؛ خطط لها بيوم، أو **✎ عدّلها**.
- **أدوات بنك الأفكار:** علّم على الأفكار (أو اختار الكل) عشان **تحذفها** («تراجع» يرجعها) أو تحفظها كمستند مقروء (‎.md‎) أو نسخة احتياطية (‎.json‎) وين ما تبي. **أضف فكرة** تكتب فكرتك؛ **حمّل أفكار من ملف** يرجّع نسخة؛ **امسح الكل** يفضي البنك (مع تراجع).

### الرسائل

- **تعليقات تنتظر:** كل تعليق يوريك البوست اللي عليه (اضغط عشان تفتحه) وهدية البوست. فلتر تنتظر · انتهت · الكل، أو حسب التصنيف.
- **رد** يجاوب علناً تحت التعليق. **أرسل الهدية** يرسل هدية البوست (أو أي رسالة) بالخاص: وحدة لكل تعليق، خلال 7 أيام. الرابط ينحط في النص؛ والزر اختياري، لأن Instagram ممكن يرفض الأزرار للي ما يتابعونك والمحاولة المرفوضة تستهلك الرسالة.
- **التصنيفات** (سؤال، عميل، سبام… أو تصنيفك) تظل على هالجهاز. **اخفِ** يخفي التعليق عن الناس؛ **احذف** يشيله نهائياً بعد ما تكتب **delete**. اللي خلصت تروح لـ«انتهت»؛ و«رجّعه للانتظار» يلغي العلامة.
- **🕒 الوقت حسب:** وقت التعليقات على ساعتك، أو دولة من جمهورك، أو أي منطقة زمنية.
- **تلقائي:** التعليقات اللي ردّت عليها هدية الرسائل تنتقل لـ«انتهت» بروحها.
- **✨ خل PIX يكتب الردود** ← **استخدمها** ← **أرسل الرد**، أو **أرسل كل المسودات** مرة وحدة. ما ينرسل شي بدون ضغطتك.
- **مسار الهدية** (الرسائل التلقائية): علّق ← تابع ← وصلته الهدية ← فتح الرابط.
- رديت من تطبيق Instagram (رد، أو منشن، أو بالخاص)؟ ينتقل لـ«انتهت» بعد. **▶ شوفه** يفتح البوست اللي عليه التعليق.
- تحت: الرسائل التلقائية بالكلمات وأسئلة البداية.

### الشغل مع PIX

- **Enter** يرسل رسالتك؛ و**Shift+Enter** أو **Ctrl+Enter** لسطر جديد.
- ضوء **PIX يسمعك**: الأخضر يعني ضغطاتك توصل Claude Code فوراً.
- **رسالة لـPIX**: قول له أي شي («استخدم اللقطة 4»، «قصّر الافتتاحية»). كل ملاحظة توريك وين وصل PIX: ينتظر ← وصلت PIX ← قاعد يشتغل (مع الخطوة) ← **خلصت** أو **ما قدر**. وجواب PIX يطلع تحت ملاحظتك على طول.
- لما PIX يخلّص ملاحظة، يطلع **تنبيه** فيه النتيجة واللوحة تتحدث بروحها، فتشوف التغيير بدون ما تعيد التحميل.
- جرس **النشاط** (فوق) يعرض كل ملاحظة وطلب مع حالته ونتيجته؛ فلتر حسب قيد الشغل أو خلصت أو ما قدر. والرقم يعد النتايج الجديدة.
- لما PIX يحتاجك، تطلع نافذة تسألك. جاوب فيها أو بالمحادثة؛ أول جواب يعتمد.
- **Ctrl+K** (⌘K): شريط الأوامر. اكتب غلاف، تصحيح، وقت، جدولة، دليل…

### الشكل والإعدادات

- **الإصدار والبِلد** (الشريط العلوي، أسفل الصفحة، الإعدادات): "v1.18.0 · build YYYYMMDD.HHMM"، يتحدّث بروحه مع كل تعديل. عطه PIX إذا بلّغت عن مشكلة.
- العربي والإنجليزي نفس الشكل والمحتوى؛ بدّل من الإعدادات ← اللغة.
- 12/24 ساعة، فاتح/داكن، و**الشروحات** (هالتوضيحات) تشغيل أو إطفاء.
- **وضع عمى الألوان** (الإعدادات، أو Ctrl+K ← color): ألوان أوضح مع أشكال، عشان ما تعتمد أي حالة على اللون بس. الشارات تاخذ ✓ → ! ×، ونقاط التقويم تصير ■ ○ ✕ ▲، والتغييرات تاخذ أسهم ▲▼، والخريطة الحرارية تصير من أزرق لأصفر.
- الخلفية الهادية لشعارك واسمك تتبع الماوس بعمق. تتوقف إذا إعداد «تقليل الحركة» بجهازك شغّال.
- مفاتيح API: الإعدادات ← المفاتيح. محفوظة بس في ملف ‎.env‎ بهالمجلد وما تنعرض كاملة.

### الأمان

- ما ينزل أو ينجدول أو يشتغل أي شي إلا لما تكتب **go** (أو توافق بالمحادثة).
- كل go يغطي بوست واحد، أو قائمة مجموعة وحدة راجعتها بالضبط.
- كل تعديل على المسودة ينحفظ: استخدم ↺ على أي خطوة، أو رجّع تعديل واحد من التغييرات.
- هاللوحة تشتغل بس على جهازك (127.0.0.1) وما تشوف كلمات سر حساباتك.

### من المحادثة

- `/200bps-publish FOLDER`: فحص ونشر بوست واحد. «افتح اللوحة»، «تقرير آخر بوست»، «عطني أفكار»، «حط أسئلة البداية».
- جدولة مجموعة من المحادثة: `bps.py batch scan`، `batch prepare FOLDERS`، `batch suggest --count N`، وبعدها `batch run --confirm` بعد موافقتك.
