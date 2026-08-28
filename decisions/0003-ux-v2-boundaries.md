# 0003: Physical spread and question-aware curated runtime

## Decision

78 card backs are rendered as one bounded two-row physical spread using one cached background asset and CSS transforms. Interpretation v2 remains deterministic and question-aware at runtime, with representative fixtures before any corpus generation. Affiliate recommendations use a small curated category config and the existing safe redirect route.

## Context and constraints

The current horizontal rail, keyword-composed fallback and generic affiliate sheet break the ritual even though the functional flow works. Full LLM generation and a Coupang Product API are outside this iteration.

## Rejected

- Canvas/WebGL spread: unnecessary complexity and weaker native button accessibility.
- 78 independent Motion components: more JS and animation overhead than the interaction needs.
- Runtime LLM reading: privacy, latency, cost and determinism conflict.
- Fake product price: no trustworthy live source.

## Reversibility

The spread, interpretation analyzer and curated product selector are independent modules behind existing state/share/redirect contracts.

## Revisit trigger

Revisit only if measured mobile interaction exceeds performance targets or a verified Coupang API becomes available.
