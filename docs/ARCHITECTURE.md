# Architecture

## Selected stack

- Next.js App Router, React, TypeScript
- Tailwind CSS v4 for layout and tokens
- Motion for staged UI choreography
- Vitest and Testing Library
- pnpm, Vercel-compatible Node deployment

## Boundaries

```text
src/app            routing, metadata, server edges
src/features       ritual UI and state choreography
src/domain         pure deck, selection, combination, reading rules
src/lib            analytics, environment, share and affiliate edges
data               card catalog and generated reading artifacts
scripts/tarot      offline generation and validation
```

The interactive ritual is a client island. Share and OG rendering are server routes. Question text remains client-local. The runtime reading adapter derives a structured question profile, an order-aware three-card skeleton, a stance, and a Korean reading through one deterministic renderer. The legacy `lookupReading()` seam remains available for offline/data compatibility but is not the normal ritual path.

## Runtime data

User order stays intact for display and three positions. Canonical keys identify a three-card set, while ordered binding determines background, tension and direction at runtime. Offline skeleton data is sharded by canonical key; the client derives the same pure skeleton contract locally and never downloads the full corpus.

## Deployment

The main shell can be prerendered. `/share/[token]`, OG rendering, optional analytics, and affiliate redirect are thin server edges. No database is required for V1.

## Security and privacy

- Validate token version and three unique card ids.
- Never include the question in URL, token, metadata, or analytics.
- Redirect only to the configured affiliate URL.
- Keep provider keys and generation outside the user request path.

See `decisions/` for trade-offs and revisit triggers.
