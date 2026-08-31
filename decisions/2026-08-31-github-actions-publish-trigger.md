---
date: 2026-08-31
scope: project
status: active
source: operator-request
supersedes: 2026-08-30-growth-engine-runtime.md
---

# Use GitHub Actions to trigger the protected publisher

## Decision

GitHub Actions is the daily 20:30 Asia/Seoul trigger. A protected Netlify Function remains the only component that reads Threads credentials and mutates the Blob-backed queue.

## Context and constraints

The operator explicitly wants GitHub Actions to automate posting prepared images, questions, and result replies. An Actions runner is ephemeral, so it cannot own durable content status. Netlify Blobs already holds publisher state, token rotation, and reconciliation metadata. The Action therefore sends one authenticated POST request to the protected Netlify publisher; it never receives the Threads access token.

GitHub schedule runs in UTC and can be delayed or occasionally dropped under high load. The workflow uses a 11:30 UTC cron, away from the top of the hour, and supports `workflow_dispatch` for operator recovery. The publisher's state machine prevents repeated ready content from being posted on a later retry.

## Alternatives considered

- Keep Netlify Scheduled Function as the publish trigger: rejected because the operator requested GitHub Actions as the visible scheduler.
- Give Threads credentials directly to GitHub Actions: rejected because it duplicates a high-value secret and bypasses Blob-backed idempotency state.
- Persist queue state in repository commits: rejected because scheduled mutations would create noisy commits and race with normal development.

## Revisit when

Revisit if GitHub schedule reliability becomes unacceptable, if the repository is inactive enough for schedules to be disabled, or if multiple daily posts require a more capable job orchestrator.
