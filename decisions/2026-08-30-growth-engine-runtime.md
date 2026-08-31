---
date: 2026-08-30
scope: project
status: superseded
source: research
---

# Netlify schedule, Blob queue, and review-first publishing

## Decision

Superseded by `2026-08-31-github-actions-publish-trigger.md`. Content definitions and generated image assets remain versioned in the repository. Publishing defaults to review-first dry run and only enables external HTTP calls after all explicit production variables are configured.

## Context and constraints

The deployed product already runs on Netlify and needs a scheduler that does not depend on a local Codex process. Netlify Scheduled Functions run in UTC, only on published deploys, and have a 30 second execution limit. Netlify Blobs is suitable for a small key-value queue but does not provide concurrent write transactions, so the publisher must use one scheduled writer, strong reads, leases, and conservative reconciliation on unknown API outcomes.

Threads publishing uses Meta's documented two-step media container and publish contract. Persisting the container id before publishing gives retries a safe resume point. A timeout after the publish call is treated as unknown and is not retried automatically.

Coupang's published Open API documentation is seller-oriented and does not establish a general Partners product discovery API for this project. A curated verified pool avoids price staleness, image rights uncertainty, and irrelevant products.

## Alternatives considered

- GitHub Actions cron + committed queue state: rejected because scheduled jobs can be delayed or dropped under load, public repositories can be disabled after inactivity, and mutable publish state would require commits or a separate store.
- Netlify Database: rejected for now because one daily queue writer and simple status lookups do not justify a relational database or its operating cost.
- Local CLI scheduler: rejected because it depends on the operator's machine and violates the no-Codex-process production requirement.
- Live Coupang-wide product lookup: rejected because available official docs are seller APIs and live price/image/product quality cannot be safely guaranteed.

## Revisit when

Revisit if more than one concurrent publisher/admin writer is needed, content exceeds Blob-friendly size, scheduled runs exceed 30 seconds, or a verified Coupang Partners discovery API is made available to the operating account.
