---
date: 2026-09-09
scope: feature
status: active
source: operator-request
---

# Store anonymous daily funnel counters in Upstash

## Decision

Use the existing Upstash REST boundary for atomic KST-day aggregate counters. Preserve only a validated Threads content id in session storage, and send event type plus content id to the server. Show recent aggregate funnel counts next to provider-returned Threads metrics on the existing `/threads` operations page.

## Context and constraints

The current client emits `dataLayer` events but no analytics consumer stores them, so website arrivals and Coupang clicks cannot be measured. The published CTA already carries `utm_content`, which is sufficient to attribute the anonymous session to one prepared Threads item without retaining the user's tarot question, cards, IP, user agent, or a persistent identifier.

Threads insights are cumulative provider metrics. Website funnel counters are KST-day event counts deduplicated once per stage in the browser session. They must be labeled separately and never combined as if they shared one identity model.

## Rejected

- Add Google Analytics or another analytics SDK: unnecessary dependency and new privacy surface for the first operating scale.
- Store raw events or session identifiers: not required for the requested aggregate funnel and creates avoidable personal-data risk.
- Infer Coupang orders from outbound clicks: a click is not a purchase and must remain separately labeled.

## Revisit when

Revisit if traffic makes public counters vulnerable to material abuse, Upstash usage approaches the plan limit, or the operating Coupang account confirms report API response shapes for orders and commission.
