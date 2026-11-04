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
| Comments | `GET /inbox/comments`, `GET /inbox/comments/{postId}?accountId=` |
| DM automations | `GET/POST /comment-automations`, `PATCH/DELETE /comment-automations/{id}` |
| Ice breakers | `GET/PUT /accounts/{id}/instagram-ice-breakers` |

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

## Hook tests (v1.19)
- Instagram `platformSpecificData.trialParams` {graduationStrategy: MANUAL | SS_PERFORMANCE}: Trial Reels shown to non-followers only; graduation (share to followers) happens in the Instagram app.
- `GET /analytics?postId=<Zernio id>`: one post's analytics incl. `reelsSkipRate` (0-1), `igReelsAvgWatchTime` (ms), views, reach. 202 = sync pending.

## Recycling (v1.18)
- `PUT /posts/{id}` with `recycling` {enabled, gap ≥1, gapFreq week|month, startDate, expireCount|null, expireDate|null, contentVariations [] or 2-20}. Published posts accept only this change.
- Read back: `GET /posts/{id}` → `recycling` {enabled, recycleCount, nextRecycleAt, lastRecycledAt, contentVariationIndex}.
- Max 10 active per account; TikTok and YouTube excluded. Analytics rows link to the Zernio post via `latePostId`.

