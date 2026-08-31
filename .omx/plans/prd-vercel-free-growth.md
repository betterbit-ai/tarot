# PRD: Vercel free deployment and portable Growth Engine

## Outcome

The deployed Mr. Tarot site runs from Vercel without requiring a paid-plan subscription. The existing ritual and legal pages must be reachable at the assigned Vercel origin. The review-first Threads pipeline must remain safe while durable publisher state is moved away from Netlify-specific storage.

## User stories

1. As a visitor, I can use the full tarot flow and open legal pages at the Vercel deployment URL.
2. As an operator, I can configure all secrets in provider dashboards without placing credentials in Git.
3. As an operator, I can keep content publishing in review/dry-run until a one-time external activation is explicitly confirmed.
4. As an operator, I can inspect external account configuration and receive an exact next action whenever a credential or paid service is required.

## Scope

- Vercel import/configuration and production URL verification.
- Correct metadata, policy URLs, redirects, and environment-variable inventory for the new origin.
- A Vercel-compatible publisher transport and a free-tier-compatible durable-state design.
- Meta basic/app configuration discovery; Coupang and Threads setup discovery.

## Non-goals

- Signing up for paid products, accepting trials, or purchasing usage.
- Revealing, copying into chat, or committing any credential.
- Blindly submitting Meta/Threads/Coupang forms or publishing a post.
- Changing the existing tarot flow or generating new card art.

## Acceptance criteria

- The Vercel deployment exposes `/`, `/privacy`, `/terms`, and `/data-deletion` without 404.
- Vercel build, lint, types and test suite remain green.
- No Netlify URL remains in an active production path after migration, other than documented historical rollback context.
- The publisher state store is independent of Netlify and preserves the current interface, persisted container IDs, and fail-closed ambiguous result behavior.
- Scheduled calls remain at most daily per endpoint and do not need Vercel paid scheduling precision.
- Meta/Threads/Coupang external configuration is either verified as saved or stopped at a documented, user-confirmed action boundary.

## Rollback

Keep the Netlify adapters until a Vercel route and durable-state implementation pass dry-run tests. Repoint public metadata and Meta URLs only after the Vercel public origin serves all legal pages.
