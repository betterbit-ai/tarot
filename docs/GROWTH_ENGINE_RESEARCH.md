# Growth Engine Research

Checked: 2026-08-30 KST

## Threads / Meta

The official Meta Threads API collection documents a Threads-use-case Meta app, OAuth authorization, and the required scopes for this project: `threads_basic`, `threads_content_publish`, `threads_read_replies`, `threads_manage_replies`, and `threads_manage_insights`.

- Text and image publishing use a media-container request followed by publish. The documented text endpoint is `POST /{threads-user-id}/threads`; its response container id is published with `POST /{threads-user-id}/threads_publish`.
- A reply is another post with `reply_to_id`; the collection documents this parameter as required for a reply.
- Image posts require a public `image_url` that Meta can fetch. Local-only files cannot be sent to Threads.
- The collection documents short-lived token exchange to a long-lived token, 60-day `expires_in` example (`5,184,000` seconds), and refresh before expiry.
- API scopes must be confirmed with Meta's access token debugger. Rates and policy limits remain external configuration because Meta can change them; the publisher will use one daily post and conservative sequential replies.

Sources:

- https://www.postman.com/meta/threads/documentation/dht3nzz/threads-api
- https://developers.facebook.com/docs/threads/
- https://developers.facebook.com/docs/threads/changelog

## Scheduler and queue storage

Netlify Scheduled Functions run only on published deploys, use UTC cron expressions, and have a 30 second execution limit. A daily 20:30 Asia/Seoul run is `30 11 * * *` UTC because Korea has no daylight saving time.

Netlify Blobs is a site-wide key-value store that persists across deploys. It supports strong reads, but concurrent writes are last-write-wins and have no transaction primitive. The queue therefore has a single scheduled writer, an expiring lease, persisted per-item container IDs, and a manual reconciliation state for unknown publish outcomes.

Sources:

- https://docs.netlify.com/build/functions/scheduled-functions/
- https://docs.netlify.com/build/data-and-storage/netlify-blobs/

## GitHub Actions alternative

GitHub Actions schedules run from the default branch and can be delayed or dropped under high load. Public repositories can have scheduled workflows automatically disabled after 60 days of inactivity. It is retained only as an optional CI/manual dry-run path, not as the production scheduler.

Source:

- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows

## Coupang Partners

The Coupang Open API developer portal exposes seller/product management APIs. It does not establish a general Partners catalog search contract appropriate for finding arbitrary affiliate products at runtime. The Growth Engine therefore uses an operator-verified curated product pool. It stores no prices, does not scrape product data, and keeps the existing clear commission disclosure and result skip path.

The official Coupang Partners guide also warns against using Coupang intellectual property outside provided assets or presenting activity as official Coupang activity. The project must not recreate or modify Coupang logos, use unverified product images, or present a recommendation as official Coupang endorsement.

Sources:

- https://developers.coupang.com/en/api
- https://developers.coupang.com/en/getting-started/coupang-open-api
- https://partners.coupangcdn.com/partners-guide/partners-guide-20251028182159.pdf

## Delivery rules

- `PUBLISH_MODE=review` and `DRY_RUN=true` are defaults.
- No real post is created by tests, CLI, scheduler, or this implementation unless the operator later configures credentials and explicitly enables live publishing.
- Unknown HTTP outcomes after a Threads publish attempt stop the item for reconciliation instead of retrying and risking a duplicate post.
