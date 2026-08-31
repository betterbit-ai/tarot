# Test specification: Vercel free migration

## Repository checks

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `git diff --check`

## Deployment checks

- Vercel deployment URL returns the ritual page and the three policy pages.
- `/privacy`, `/terms`, `/data-deletion` have the correct title/content and are no longer Netlify 404s.
- `NEXT_PUBLIC_SITE_URL` matches the Vercel production origin.

## Publisher regression checks

- Review mode and missing credentials make no outbound Threads call.
- Dry run previews exactly one READY item and leaves it READY.
- State persistence retains container identifiers and uses fail-closed handling for uncertain publish results.
- Scheduler request rejects a missing or mismatched secret.

## External-account checks

- Verify fields and configuration without revealing credentials.
- Before any form save, token/key creation, OAuth authorization, profile save, or post publish, present exact destination/action and get action-time confirmation.
