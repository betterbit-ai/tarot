---
date: 2026-09-09
scope: feature
status: active
source: operator-request
---

# Send one aggregate Coupang report to Slack each day

## Decision

Use the existing server-side Coupang HMAC client to request only `/reports/commission` for the previous KST day. Format its aggregate values in a protected Vercel route, send through a Vercel-only Slack incoming-webhook secret, and use the existing Upstash REST adapter for a daily idempotency marker and short lease.

## Context and constraints

The official Partners API documentation supplied by the operator states that reports update at 15:00 KST and that `/reports/commission` returns click, order, cancel, GMV and commission in daily rows. This endpoint supplies every value needed for an operator summary without fetching individual order/product records.

The scheduler cannot own secrets or durable send state. GitHub Actions therefore triggers Vercel with the existing scheduler secret, while Vercel reads Slack/Coupang secrets and Upstash records whether the report was sent.

## Alternatives considered

- Call clicks, orders, cancels and commission separately: rejected because commission already returns the aggregate values and separate order records create unnecessary data exposure.
- Send from GitHub Actions directly: rejected because it duplicates the Slack webhook and Coupang credentials outside Vercel.
- Store raw report rows in Upstash: rejected because the daily aggregate is sufficient and raw order data is not needed for the operating report.

## Revisit when

Revisit if Slack reports need multiple channels, the account needs product-level revenue analysis, or the Partners report API introduces a supported aggregate endpoint with a different contract.
