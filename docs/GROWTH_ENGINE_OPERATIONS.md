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

GitHub Actions triggers protected Vercel routes. `refresh-threads-token.yml` runs at 09:05 Asia/Seoul, `publish-threads.yml` at 20:30, `sync-threads-metrics.yml` at 21:10, and `refresh-coupang-pool.yml` at 04:30. Korea has no daylight saving time.

GitHub schedules run in UTC and can be delayed. The publisher is intentionally sequential: main post, result replies, then CTA reply.

## Secrets needed to turn on real posting

Set these in Vercel project environment variables, never in Git:

- `THREADS_ACCESS_TOKEN`: long-lived Threads user access token
- `THREADS_USER_ID`: Threads user id from Meta OAuth
- `CONTENT_SCHEDULER_SECRET`: random secret accepted only by the Vercel publisher routes
- `NEXT_PUBLIC_SITE_URL`: verified Vercel production origin
- `UPSTASH_REDIS_REST_URL`: Upstash database REST endpoint
- `UPSTASH_REDIS_REST_TOKEN`: Upstash standard REST token
- `PUBLISH_MODE=auto`
- `DRY_RUN=false`
- `COUPANG_PARTNERS_API_ENABLED=true`
- `COUPANG_PARTNERS_ACCESS_KEY`: Coupang Partners AccessKey
- `COUPANG_PARTNERS_SECRET_KEY`: Coupang Partners SecretKey

Set the exact same random value as `GROWTH_SCHEDULER_SECRET` in GitHub Actions secrets. Set `VERCEL_GROWTH_BASE_URL` as a GitHub Actions variable to the Vercel production origin without a trailing slash. GitHub only uses the secret to trigger Vercel; it never receives a Threads or Upstash token.

Before switching those two final values, confirm the Meta token has `threads_basic`, `threads_content_publish`, `threads_read_replies`, `threads_manage_replies`, and `threads_manage_insights` as applicable to the chosen features. Run one manual GitHub Actions invocation while watching Vercel function logs.

When live mode is enabled, the daily refresh route calls Meta's documented long-lived-token refresh endpoint and saves a successful replacement token plus its expiry to Upstash. The publisher reads that stored token first. A refresh response without a replacement token fails closed and leaves the prior stored token untouched.

The Coupang refresh route is separate from the visitor request. It maps each internal affiliate theme to a neutral keyword, calls `/products/search`, validates the Coupang CDN image and product URL, converts the URL through `/links/deeplink`, and stores the bounded pool at `mr-tarot:affiliate-pool:v1`. It never sends the user's raw question or an ADID.

## Failure behavior

- Main/reply container IDs are persisted before their publish request.
- An API timeout or non-2xx response marks the item `FAILED` with `requiresReconciliation=true`.
- It is not automatically retried after an ambiguous result because an automatic retry could duplicate a Threads post.
- Inspect the Threads account and the Upstash runtime state before manually resolving the item.

## Queue and assets

The repository starts with 105 `READY` items: 37 relationship, 26 general, 16 career, 11 money, 10 decision, and 5 experimental items. It uses all eight supported formats. Every item has a generated 1080×1350 PNG plus an SVG source; conversation posts use the same quiet card-back composition with an invitation to comment.

Each outbound CTA gets `utm_source=threads`, `utm_medium=social`, `utm_campaign=growth-engine`, and the content id as `utm_content`.

## Affiliate pool

The web selector joins question intent and card signals to a theme before choosing a verified product. Current pool coverage is relationship, self-care, rest, and new-start. Work, money, and organization categories skip the interstitial until a matching product URL and licensed image are verified. Results always remain available without clicking.

Set `COUPANG_PARTNERS_API_ENABLED=true`, `COUPANG_PARTNERS_ACCESS_KEY`, and `COUPANG_PARTNERS_SECRET_KEY` only in Vercel. Then run `Refresh Coupang affiliate pool` manually once from GitHub Actions and confirm the response reports `mode: refreshed`. The web ritual reads the sanitized pool from `/api/affiliate/pool`, with the existing local product as a fallback. Do not send raw tarot questions and do not enable ADID-based `/products/reco` without a new privacy decision.
