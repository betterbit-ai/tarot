# Partial Threads posts block the queue until reconciled

## Status

Accepted on 2026-10-17.

## Context

`mr-tarot-0049` published its main post and three A/B/C reading replies, then Meta returned an explicit HTTP 400 while creating the final site CTA. Runtime state correctly retained the main and reply ids, but the next scheduler attempt selected the next READY item. This produced an incomplete `0049` thread and a second main post (`0050`) on the same KST day.

## Decision

A runtime item with a confirmed `mainPostId` and a status other than `PUBLISHED` takes precedence over every later READY item.

- If all expected reply ids are already persisted, the publisher finalizes the item without another provider call.
- If replies are missing and Meta returned an explicit 4xx container rejection, the publisher resumes at the first missing reply. A 4xx response has no successful container id and is therefore safe to retry within the configured attempt limit.
- If the previous outcome is ambiguous, including a network failure, the publisher makes no external call and does not advance the queue. Manual reconciliation is required because blindly retrying could duplicate a reply.
- A protected, content-id-scoped reconciliation route uses the same resume contract for operational repair. It can never create another main post.

## Consequences

- One incomplete reply chain can temporarily stop daily publishing. This is preferred to publishing a second main post while the first is visibly incomplete.
- Persisted main and reply ids remain the source of truth for safe continuation.
- Operators can repair a deterministic partial post without handling Threads credentials locally or exposing them to GitHub Actions.

## Rejected alternatives

- Skip FAILED items and continue with the next READY item: this caused the duplicate daily main post and left the earlier reader journey incomplete.
- Retry every missing reply automatically: a timeout or dropped response can mean Meta accepted the reply even though the client did not receive its id, creating a duplicate.
- Repost the entire thread: this discards the valid existing main and A/B/C replies and multiplies public duplicates.
