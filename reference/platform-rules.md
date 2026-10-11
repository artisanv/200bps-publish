# Platform rules used by the checks

Last verified: 2026-09-27. This release publishes to **Instagram and LinkedIn**; the Facebook and Threads columns are kept for when they are switched back on. The numbers the code uses live in `lib/checks.py → RULES`, so update them there.

## Limits

| | Instagram | Facebook | Threads | LinkedIn |
|---|---|---|---|---|
| Caption max | 2,200 | 63,206 | 500 | 3,000 |
| Shown before "more" | ~125 | ~480 | full | ~210 |
| Hashtags (hard check) | **5** | 5 (house rule) | 1 topic tag | 5 (house rule) |
| Carousel items (via API) | 10 | 10 | 10 | 20 images or 1 PDF |
| Image aspect | 9:16 to 1.91:1 (4:5 recommended) | – | – | – |
| Reel | 9:16, 3–90 s, 300 MB | 9:16, 3–60 s | 5 min, 1 GB | 3 s–10 min (personal) |
| Links clickable in caption | no | yes | yes | yes |

## Other rules
- Instagram needs a Business or Creator account and at least one image or video.
- LinkedIn cannot mix media types in one post, and rejects duplicate content (422).
- Every post also passes Zernio's `POST /v1/tools/validate/post` before publishing. That is the double check against each platform's current rules.

## Sources
- Zernio platform docs: https://docs.zernio.com/platforms/instagram, `/facebook`, `/threads`, `/linkedin`
- Zernio OpenAPI spec: https://zernio.com/openapi.yaml
- Instagram's 5-hashtag cap: Instagram's announcement of December 2025. The Zernio docs do not state a number, so the validator is the backstop.
