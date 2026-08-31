# Vercel free migration and operating-account setup

## Task statement

Move the existing Mr. Tarot service away from a Netlify team whose production deploys are paused. Keep the Vercel deployment on the free plan. Verify and configure the Vercel import, Meta app, Coupang Partners API, and Threads account as far as real account state and safe external-change boundaries permit.

## Desired outcome

- A public Vercel deployment serves the existing tarot ritual and policy pages.
- Required environment-variable names and non-secret configuration are documented and set only through providers' secret stores.
- The Growth Engine is portable from Netlify Functions/Blobs without moving Threads or Coupang credentials into Git.
- Meta/Threads OAuth and Coupang API setup have a verified, concrete next action.
- Existing 105-item queue stays review-first and does not create a live Threads post until explicitly enabled and confirmed.

## Known facts and evidence

- `main` is clean at `9919e23` and contains `/privacy`, `/terms`, `/data-deletion`.
- `mr-tarot.netlify.app/privacy` returns 404 because Netlify reports production deploys paused for the `betterbit-ai` team.
- Project is Next.js 16 and static pages already build successfully.
- Runtime publishing is currently coupled to `netlify/functions/*.mts`, `@netlify/blobs`, and GitHub Actions calling Netlify.
- Repository already has content publisher interfaces (`ContentStateStore`), idempotency/container state and dry-run/review mode.
- User has signed in to Vercel and supplied an import URL for the existing GitHub repository.
- User says Meta app URLs were entered, supplied Coupang Partners Open API location, and supplied the Threads profile URL.

## Constraints

- User explicitly prefers Vercel free plan; do not subscribe, upgrade, or create a billable service.
- Do not put API keys, client secrets, OAuth tokens, or affiliate secrets into the repository or chat.
- No live Threads post, profile save, OAuth approval, key creation, or external setting save without immediate action-time confirmation.
- Keep the tarot public UX, question privacy, affiliate skip path, and 105-item queue intact.
- Vercel Hobby has schedule precision/usage restrictions and is documented as personal/non-commercial; this must be surfaced but not silently bypassed.

## Unknowns/open questions

- Whether the Vercel import has already produced a deployment and its assigned public URL.
- Whether Vercel has all necessary production environment values.
- Whether the Meta app contains a Threads use case and its OAuth redirect URL.
- Whether the user has already issued or merely viewed Coupang/Threads credentials.
- Whether a free external durable store is acceptable for live publishing state once the engine leaves Netlify Blobs.

## Likely touchpoints

- `src/app/**`, `src/app/layout.tsx`, `.github/workflows/publish-threads.yml`
- `netlify/functions/**`, `src/lib/content/**`, `docs/GROWTH_ENGINE_OPERATIONS.md`
- `docs/HANDOFF.md`, `spec/spec.md`, `decisions/**`
- Provider dashboards in the connected Chrome browser.
