---
date: 2026-09-02
scope: feature
status: active
source: official-coupang-partners-api
---

# Run Coupang recommendation refresh outside the tarot ritual

## Decision

Use the Coupang Partners affiliate Open API only from a protected, scheduled Vercel route. The route searches six operator-owned theme keywords, validates the returned product image and Coupang URL, converts the URL through `/deeplink`, and stores a small sanitized pool in Upstash. The browser reads that pool without sending the visitor's question.

## Constraints

- AccessKey and SecretKey remain Vercel-only secrets.
- The raw tarot question and ADID never leave the browser.
- The existing verified local product remains the fallback when refresh is disabled or unavailable.
- Product prices are omitted until a trusted current-price policy exists.
- Only HTTPS Coupang product links and Coupang CDN images are accepted.

## Rejected

- Live product search during a visitor request: leaks transient question context and adds latency.
- `/products/reco` with ADID: introduces identifier-based personalization without a new privacy decision.
- Committing refreshed API results to Git: exposes stale product data and couples external state to deploys.
