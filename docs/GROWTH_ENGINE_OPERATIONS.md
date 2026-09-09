# Growth Engine Operations

## Defaults

```dotenv
PUBLISH_MODE=review
DRY_RUN=true
THREADS_API_BASE_URL=https://graph.threads.net/v1.0
THREADS_MAX_ATTEMPTS=2
THREADS_INSIGHT_METRICS=views,likes,replies,reposts,quotes
```

The default setup does not call Threads. It prints the next main post, public image URL, replies, and UTM CTA instead.

## Commands

```bash
pnpm content:generate --count 105
pnpm content:images
pnpm content:validate
pnpm content:status
pnpm content:list
pnpm content:preview --id mr-tarot-0001
pnpm content:publish-next
pnpm content:sync-metrics
pnpm content:refresh-token
pnpm content:refresh-hooks
```

`content:publish-next` writes local dry-run state to an ignored file. On Vercel, protected API routes keep runtime state and the refreshed token in Upstash Redis through server-only REST credentials.

## Production schedule

GitHub Actions triggers protected Vercel routes. `refresh-threads-token.yml` runs at 09:05 Asia/Seoul, `publish-threads.yml` sends recovery attempts only from 22:05 through 22:55, `sync-threads-metrics.yml` at 23:30 after publishing, and `refresh-coupang-pool.yml` at 04:30. Vercel Cron is the independent once-daily publisher inside the 22:00-22:59 window. Korea has no daylight saving time.

The daily publisher is idempotent by KST calendar day. Once it records a successful post in Upstash, every later GitHub or Vercel Cron attempt that day returns `already-published` instead of publishing another item. Failed image processing remains retryable in the recovery window.

GitHub schedules run in UTC and can be delayed. The publisher is intentionally sequential: main post, result replies, then CTA reply.

## Secrets needed to turn on real posting

Set these in Vercel project environment variables, never in Git:

- `THREADS_ACCESS_TOKEN`: long-lived Threads user access token
- `THREADS_USER_ID`: Threads user id from Meta OAuth
- `CONTENT_SCHEDULER_SECRET`: random secret accepted only by the Vercel publisher routes
- `CRON_SECRET`: a separate random secret for the Vercel daily cron fallback
- `NEXT_PUBLIC_SITE_URL`: verified Vercel production origin
- `UPSTASH_REDIS_REST_URL`: Upstash database REST endpoint
- `UPSTASH_REDIS_REST_TOKEN`: Upstash standard REST token
- `PUBLISH_MODE=auto`
- `DRY_RUN=false`
- `COUPANG_PARTNERS_API_ENABLED=true`
- `COUPANG_PARTNERS_ACCESS_KEY`: Coupang Partners AccessKey
- `COUPANG_PARTNERS_SECRET_KEY`: Coupang Partners SecretKey

Set the exact same random value as `GROWTH_SCHEDULER_SECRET` in GitHub Actions secrets. Set `VERCEL_GROWTH_BASE_URL` as a GitHub Actions variable to the Vercel production origin without a trailing slash. GitHub only uses the secret to trigger Vercel; it never receives a Threads or Upstash token.

Set `CRON_SECRET` only in Vercel Production and Preview. `vercel.json` invokes `/api/content/publish-daily` once a day in the 22:00-22:59 KST production window; Vercel authenticates the request with a Bearer token. On Vercel Hobby, cron execution may occur at any point during the scheduled hour and is limited to one job per day. GitHub Actions therefore provides same-window recovery attempts. The KST guard and Upstash lease prevent either provider from posting twice.

Before switching those two final values, confirm the Meta token has `threads_basic`, `threads_content_publish`, `threads_read_replies`, `threads_manage_replies`, and `threads_manage_insights` as applicable to the chosen features. Run one manual GitHub Actions invocation while watching Vercel function logs.

When live mode is enabled, the daily refresh route calls Meta's documented long-lived-token refresh endpoint and saves a successful replacement token plus its expiry to Upstash. The publisher reads that stored token first. A refresh response without a replacement token fails closed and leaves the prior stored token untouched.

The Coupang refresh route is separate from the visitor request. It maps each internal affiliate theme to a neutral keyword, calls `/products/search`, validates the Coupang CDN image and product URL, converts the URL through `/deeplink`, and stores the bounded pool at `mr-tarot:affiliate-pool:v1`. It never sends the user's raw question or an ADID.

## Failure behavior

- Main/reply container IDs are persisted before their publish request.
- An API timeout or non-2xx response marks the item `FAILED` with `requiresReconciliation=true`.
- It is not automatically retried after an ambiguous result because an automatic retry could duplicate a Threads post.
- Inspect the Threads account and the Upstash runtime state before manually resolving the item.
- If a historical post is confirmed published but its three numbered readings are missing, run the protected `Repair missing Threads reading replies` GitHub workflow with its exact `mr-tarot-####` id. It appends only the three prepared readings to that existing post, records each reply id, and fails closed on an uncertain outcome. Do not use it for normal scheduled publishing.

## Queue and assets

The repository starts with 105 `READY` items: 37 relationship, 26 general, 16 career, 11 money, 10 decision, and 5 experimental items. It uses five active formats. Every item has exactly three cards, three numbered reading replies, and one CTA reply. One-card, five-card, and comment-only conversation formats have been removed from the active queue. The publisher repeats the same completeness check immediately before the Threads API call and refuses malformed source data. Every item has a generated 1080×1350 PNG plus an SVG source.

Each outbound CTA gets `utm_source=threads`, `utm_medium=social`, `utm_campaign=growth-engine`, and the content id as `utm_content`.

The client retains only a validated post id or the distinct `link_in_bio` profile-link id for the browser session. `/api/analytics/event` stores no raw question, cards, IP, user agent, cookie id, or persistent visitor id; it atomically increments KST-day aggregate counters for landing, ritual start, card confirmation, result, affiliate view/skip/click, and share. `/threads` reads the last seven days and labels Threads provider metrics separately from first-party funnel counts. A `partial` or `skipped` Threads metrics sync now fails the protected route so the GitHub workflow does not silently report a healthy daily report. A provider `400` on one historical post is recorded as that post's unavailable-insight status and quarantined so it cannot block metrics for newer valid posts.

## Affiliate pool

The web selector joins question intent and card signals to a theme before choosing a verified product. Current pool coverage is relationship, self-care, rest, and new-start. Work, money, and organization categories skip the interstitial until a matching product URL and licensed image are verified. Results always remain available without clicking.

Set `COUPANG_PARTNERS_API_ENABLED=true`, `COUPANG_PARTNERS_ACCESS_KEY`, and `COUPANG_PARTNERS_SECRET_KEY` only in Vercel. Then run `Refresh Coupang affiliate pool` manually once from GitHub Actions and confirm the response reports `mode: refreshed`. A `401` response means the key pair is not authorized for the Partners API or the signing timestamp is rejected; issue a new Partners API key pair in Coupang before retrying. The web ritual reads the sanitized pool from `/api/affiliate/pool`, with the existing local product as a fallback. Do not send raw tarot questions and do not enable ADID-based `/products/reco` without a new privacy decision.
