# Zernio endpoints used

Base URL: `https://zernio.com/api/v1`. Auth header: `Authorization: Bearer sk_…`. Spec: https://zernio.com/openapi.yaml

| Purpose | Method + path |
|---|---|
| Accounts | `GET /accounts`, `GET /accounts/{id}/linkedin-organizations` |
| Upload | `POST /media/presign` → `PUT uploadUrl` → use `publicUrl` |
| Validate (dry run) | `POST /tools/validate/post` |
| Create / schedule | `POST /posts`, sent with an `Idempotency-Key` header |
| Posts | `GET /posts?status=scheduled|published`, `GET /posts/{id}` |
| Best time | `GET /analytics/best-time?platform&accountId` → `slots[{day_of_week 0=Mon, hour UTC, avg_engagement, post_count}]` |
| Post analytics | `GET /analytics?postId|fromDate|toDate|limit` |
| IG insights | `GET /analytics/instagram/account-insights`, `/follower-history`, `/demographics` |
| Follower stats | `GET /accounts/follower-stats?accountIds=` |
| Comments | `GET /inbox/comments?since=&limit=`, `GET /inbox/comments/{postId}?accountId=&limit=&cursor=` (see Inbox comments below) |
| DM threads | `GET /inbox/conversations?accountId=` (newest first), `GET /inbox/conversations/{id}/messages?accountId=&limit=&sortOrder=desc` → `messages[]`; the default order is oldest first, so without `sortOrder=desc` a long thread returns its oldest messages (verified 2026-11-18). `participantUsername` is often missing: the username is then in `participantName`, or the thread is "Instagram User". A comment's `from.id` equals the thread's `participantId` (verified 2026-11-15 on 128 comments) |
| Follow status | `GET /accounts/{id}/follow-status/{userId}` → `isFollower` true / false, or null with `unavailableReason: consent_required` (Instagram answers only for people who have messaged the account; verified 2026-11-15) |
| DM automations | `GET/POST /comment-automations`, `PATCH/DELETE /comment-automations/{id}` |
| Ice breakers | `GET/PUT /accounts/{id}/instagram-ice-breakers` |

## Inbox comments (verified 2026-11-18 on a post with 917 comments and replies)
- **List** `GET /inbox/comments`: `data[{id (post id), accountId, platform, commentCount, createdTime, content, permalink, picture}]`. `since` is the **post's publish date** ("posts created after this date"), not the date of its comments: the Inbox asks 30 days back, so a post people still comment on doesn't leave when it turns a week old. Instagram's `commentCount` includes replies.
- **One post** `GET /inbox/comments/{postId}`: `{comments[], pagination{hasMore, cursor}, post, meta{lastUpdated}}`, newest first. `limit` is 100 at most (a larger number is cut to 100) and counts comments and replies together: about 55 rows a page. `cursor` comes only while `hasMore` is true. Read every page (the plugin stops at 2000 rows and marks the post `more`).
- **Replies** sit inside their comment's `replies[]`, each with `parentId` (the top comment); threads are one level deep. Rows have no `parentId`.
- **A reply can come twice:** as a row of its own (full `from`) and inside the thread, where that copy is a stub: `from` is just `{"isOwner": false}`, even on the account's own reply. Match by `id` and believe the row. Which replies come twice changes with the page size. Other replies come only inside the thread, with their `from.username`.
- **One comment** `GET /inbox/comments/{postId}?accountId=&commentId=` → `{comment{… full from …}, comments[its replies]}`, about 0.7 s (verified 2026-11-19). The copy of a reply inside a thread can lack its author on any read, not only when the reply is also a row: 60 to 93 of about 450 replies on one post, more with each repeated read, the account's own replies included (`from` is `{"isOwner": false}`). This call names it; the Inbox asks once per reply and remembers it.
- **Caching:** Zernio keeps each page up to 10 minutes; a reply, hide or delete made through the API refreshes it at once. A page costs about 0.7 s from that cache and about 3 s fresh from Instagram (10 pages: 7 s or about 33 s).
- `view=summary` cuts each thread to 3 replies: don't use it for the Inbox.

## Required plan and add-ons
- **Analytics add-on:** best time, insights, demographics and post analytics.
- **Inbox add-on:** comments and DM automations.

## Rate limits
- 60 requests per minute with 0–2 accounts; 600 per minute with 3 or more.
- Posting is capped at 25 posts per hour per account, and 100 per day on Instagram.
- The client honours `Retry-After` when it gets a 429.

## `platformSpecificData` used (on each `platforms[]` entry)
- **Instagram:** `trialParams{graduationStrategy}`, `instagramThumbnail`, `locationId`, `firstComment`, `collaborators`, `isAiGenerated`
- **Facebook:** `contentType:"reel"`, `firstComment`
- **Threads:** `topic_tag`
- **LinkedIn:** `firstComment`, `documentTitle`, `organizationUrn`, `poll` {question ≤140, options 2-4 ×≤30, duration ONE_DAY|THREE_DAYS|SEVEN_DAYS|FOURTEEN_DAYS}, `reshareUrl` (post link or urn:li:share/ugcPost/groupPost). poll and reshareUrl exclude mediaItems and each other. No long-form articles in the API.

## Trial Reels on waiting posts (v1.20)
- `PUT /posts/{id}` with the full `platforms` list (each entry keeps customContent/customMedia/platformSpecificData) and the Instagram entry's `platformSpecificData.trialParams` added or removed. Works on draft/scheduled/failed/partial/cancelled; tested 2026-11-07 on a draft: on, MANUAL, off all read back, firstComment and LinkedIn kept.

## Audience per account (v1.20)
- `GET /analytics/instagram/demographics?accountId=` age, gender, city, country (100+ followers). `GET /analytics/facebook/demographics?accountId=&breakdown=country,city` (ISO country codes; Meta removed Page age/gender on 2025-11-15). `GET /analytics/linkedin/demographics?accountId=&breakdown=country,region,industry,function,seniority`: organization pages only; personal profiles answer 400 `personal_account_not_supported`. TikTok/Snapchat: none. Verified 2026-11-07.

## Hook tests (v1.19)
- Instagram `platformSpecificData.trialParams` {graduationStrategy: MANUAL | SS_PERFORMANCE}: Trial Reels shown to non-followers only; graduation (share to followers) happens in the Instagram app. Reels only, set at creation only (no API to graduate later; verified 2026-11-05 on docs.zernio.com/platforms/instagram/fields). Read back as `isTrialReel` + `trialGraduationStrategy` on the platform entry.
- `GET /analytics?postId=<Zernio id>`: one post's analytics incl. `reelsSkipRate` (0-1), `igReelsAvgWatchTime` (ms), views, reach. 202 = sync pending.

## Recycling (v1.18)
- `PUT /posts/{id}` with `recycling` {enabled, gap ≥1, gapFreq week|month, startDate, expireCount|null, expireDate|null, contentVariations [] or 2-20}. Published posts accept only this change.
- Read back: `GET /posts/{id}` → `recycling` {enabled, recycleCount, nextRecycleAt, lastRecycledAt, contentVariationIndex}.
- Max 10 active per account; TikTok and YouTube excluded. Analytics rows link to the Zernio post via `latePostId`.

