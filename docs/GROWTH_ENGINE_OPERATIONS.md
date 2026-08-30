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
```

`content:publish-next` writes local dry-run state to an ignored file. On Netlify, the scheduled function instead keeps runtime state in the `mr-tarot-growth` Blob store.

## Production schedule

`netlify/functions/refresh-threads-token.mts` runs at 09:05 Asia/Seoul. `netlify/functions/publish-next.mts` runs at `30 11 * * *`, which is 20:30 Asia/Seoul. Korea has no daylight saving time. The metrics sync runs at `10 12 * * *`, one hour and forty minutes later.

Scheduled functions run in UTC, only after a published deploy, and have a 30-second limit. The publisher is intentionally sequential: main post, result replies, then CTA reply.

## Secrets needed to turn on real posting

Set these in Netlify environment variables, never in Git:

- `THREADS_ACCESS_TOKEN`: long-lived Threads user access token
- `THREADS_USER_ID`: Threads user id from Meta OAuth
- `NEXT_PUBLIC_SITE_URL`: production site, currently `https://mr-tarot.netlify.app`
- `PUBLISH_MODE=auto`
- `DRY_RUN=false`

Before switching those two final values, confirm the Meta token has `threads_basic`, `threads_content_publish`, `threads_read_replies`, `threads_manage_replies`, and `threads_manage_insights` as applicable to the chosen features. Run one manual scheduled function invocation in Netlify while watching its logs.

When live mode is enabled, the daily refresh function calls Meta's documented long-lived-token refresh endpoint and saves a successful replacement token plus its expiry to the Blob store. The publisher reads that stored token first. A refresh response without a replacement token fails closed and leaves the prior stored token untouched.

## Failure behavior

- Main/reply container IDs are persisted before their publish request.
- An API timeout or non-2xx response marks the item `FAILED` with `requiresReconciliation=true`.
- It is not automatically retried after an ambiguous result because an automatic retry could duplicate a Threads post.
- Inspect the Threads account and the `mr-tarot-growth` Blob state before manually resolving the item.

## Queue and assets

The repository starts with 105 `READY` items: 37 relationship, 26 general, 16 career, 11 money, 10 decision, and 5 experimental items. It uses all eight supported formats. Every item has a generated 1080×1350 PNG plus an SVG source; conversation posts use the same quiet card-back composition with an invitation to comment.

Each outbound CTA gets `utm_source=threads`, `utm_medium=social`, `utm_campaign=growth-engine`, and the content id as `utm_content`.

## Affiliate pool

The web selector joins question intent and card signals to a theme before choosing a verified product. Current pool coverage is relationship, self-care, rest, and new-start. Work, money, and organization categories skip the interstitial until a matching product URL and licensed image are verified. Results always remain available without clicking.
