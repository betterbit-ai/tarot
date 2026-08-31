---
date: 2026-08-31
scope: feature
status: active
source: operator-provided-official-api
---

# Refresh the affiliate pool with Partners API, not user-time search

## Decision

When the operator supplies a Coupang Partners AccessKey and SecretKey, use the Partners API to refresh a bounded, verified affiliate product pool through theme-to-keyword searches and `/links/deeplink` conversion. Do not search with user question text during the tarot ritual.

## Context and constraints

The official Partners API page available to the operating account lists product search, deep link creation, and daily performance reports. It also lists `/products/reco`, but that method uses ADID and is not appropriate for the current no-account, no-tracking product contract.

The ritual keeps the question transient and client-local. A privileged scheduled refresh protects API credentials, avoids a visible request delay, keeps product selection auditable, and provides time for product image and policy verification before activation.

## Alternatives considered

- Search the raw question on every visitor request: rejected because it leaks a sensitive transient question to an affiliate API, adds latency, and can produce irrelevant results.
- Use `products/reco` with ADID: rejected because it introduces identifier-based personalization without a consent and privacy decision.
- Keep the pool forever manual: rejected because the verified Partners API can reduce operator work after an explicit integration review.

## Revisit when

Revisit after the operator provides the exact V2 signing guide and a sandbox/dry-run credential, or if product image, price, or disclosure policy requires a different refresh approval workflow.
