# Threads revenue tests use complete three-card sets

## Status

Accepted on 2026-10-15.

## Context

The first 46 scheduled Threads posts proved that publishing, replies, metrics, Coupang product discovery and official reporting can operate, but they did not produce site landings or Coupang clicks. The content unit was the wrong shape: a reader selected one card, received a generic one-card sentence, and only later saw a separate site CTA. `YES / NO / NOT YET` also repeated language that does not match ordinary Korean tarot reading behavior.

Reference readings supplied by the operator consistently use a complete combination for each choice. They assign positions to cards, connect the cards causally, describe a recognizable real-world event, and offer advice only after the reading has earned trust.

## Decision

Starting with `mr-tarot-0047`, a Threads choice represents a complete three-card set rather than one card. A post contains three choices, so one post contains nine hidden tarot cards and three pre-authored readings.

Each choice owns:

- an A/B/C key and a visible symbol;
- exactly three valid RWS card ids;
- a connected reading, a recognizable signal and a concrete action;
- one affiliate theme and an authored sentence explaining why that product category follows from the action.

The publisher resolves the product at publish time from the server-side verified Coupang pool. A direct product recommendation is appended to each reading. If any choice cannot resolve a verified Coupang partner URL, the whole post fails closed before an external Threads call. The final reply remains a separate UTM site CTA for readers who want to draw their own cards.

The first release is a 12-post pilot. Previously published items remain unchanged, and untested legacy drafts after the pilot are skipped until revenue evidence justifies a next batch.

## Consequences

- Threads can test a direct content-to-Coupang path without forcing a visit through the tarot ritual.
- Three product links per post increase policy and quality risk, so every link must carry the disclosure and pass the Coupang host allowlist.
- Source content becomes richer than the legacy `cardIds + replies` shape. Optional structured choice data preserves historical queue compatibility while new posts use the stronger contract.
- The queue cannot publish when the live affiliate pool is missing. This is intentional because publishing a revenue experiment without the promised product context would invalidate the test.

## Rejected alternatives

- Keep one-card results and improve wording: the selection still lacks enough evidence and narrative to earn trust.
- Route every reader through the website before showing a product: the observed funnel has no site landings and adds unnecessary steps before the first revenue proof.
- Commit fixed Coupang URLs into the queue: products and deeplinks can change, and the existing server-side verified pool is the safer source of truth.
- Generate another 100 posts immediately: there is no conversion evidence yet, so a 12-post bounded pilot is more reversible.
