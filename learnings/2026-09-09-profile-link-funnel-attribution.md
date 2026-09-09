---
date: 2026-09-09
category: pattern
source: manual
---

# Threads profile links are attribution sources, not fallback traffic

## Situation

The automated post CTA uses `utm_content=mr-tarot-####`, but the public Threads profile link uses `utm_content=link_in_bio`. The first funnel implementation accepted only post ids, so profile-originated tarot visits would have been omitted from the aggregate page-click total.

## What we learned

Link-in-bio traffic is a distinct Threads acquisition surface. It must be counted separately from individual post CTAs, while still using the same anonymous session-level event contract and never becoming a user identifier.

## Next time

When adding or changing acquisition links, enumerate every stable `utm_content` value in the server validator and dashboard labels before claiming funnel coverage.
