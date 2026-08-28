# CURRENT PROJECT STATE

Last updated: 2026-08-28 16:35 KST

## Current Phase

UX V2 IMPROVEMENT: COMPLETE, AWAITING DEPLOYMENT

V1 remains the stable checkpoint. The UX v2 follow-up replaces the horizontal rail with a physical 78-card spread, prevents identity leakage before a card is revealed, makes readings question-aware, and uses a configured real affiliate item. Threads/Growth Engine work is not in scope.

## Completed

- Reader entrance, optional question, deck preparation, unbiased 78-card shuffle and horizontal spread
- Three-card select/deselect/max-three confirmation, centered sequential reveal and reading pause
- 78 local Public Domain Rider-Waite-Smith WebP fronts with Commons provenance and checksums
- Existing original botanical/celestial card back and reader-table illustration reused
- Skippable Coupang interstitial with disclosure, server-only HTTPS host allowlist and missing-URL safety
- Connected Korean fallback reading plus four authored sample overrides through one canonical domain lookup
- One versioned share token, shared-result route and OG, Web Share API and copy-link fallback
- Immediate in-app restart without page reload
- Typed analytics events that never include the question
- 200-row batch generation, locks, temp validation, atomic finalize, range/resume/retry/status
- 100-row evaluation set; full authored corpus intentionally not generated
- Architecture review APPROVED
- Security review APPROVED
- Completion verifier found no functional/code blocker
- Three-row, 78-card physical spread with identical backs, direct selection, clear order markers and reduced-motion support
- Card faces are not mounted until their individual reveal step, preventing unrevealed card identity from appearing in the DOM or accessibility tree
- Question-aware, relationship-based interpretation v2 with 30 representative evaluation fixtures; no bulk corpus generation started
- Curated local affiliate product asset, context copy, disclosure, working configured CTA and an always-available skip path
- Dense, mobile-first result layout and responsive browser checks at 375, 390, 430, 768 and 1440px with no horizontal overflow

## In Progress

- Commit the UX v2 checkpoint and deploy it after setting the production environment variables

## Remaining

- Set `NEXT_PUBLIC_SITE_URL=https://mr-tarot.netlify.app`, `AFFILIATE_ENABLED=true`, and the server-only `COUPANG_PARTNERS_URL` in production
- Confirm the final Coupang partner destination and policy wording with the operating account
- Run a final physical iPhone Safari/native share smoke test after deployment
- Generate the 76,076 authored corpus only in a separate reviewed data-production phase

## Known Issues

- Authored interpretation coverage is 4/76,076; deterministic connected fallback covers every valid triple
- CSP permits `unsafe-inline` scripts for current Next.js compatibility; nonce/hash tightening is later hardening
- Native share depends on browser/device support; copy-link fallback is implemented and tested
- Home OG uses a symbolic three-card brand composition; shared-result OG uses actual selected RWS fronts

## Current Tarot Asset Status

- Reader: `public/images/tarot-reader-table.png`, approved and reused
- Back: `public/images/tarot-card-back.png`, approved and reused
- Fronts: 78/78 local WebP under `public/tarot/cards/`, 600px wide, about 12MB total
- Manifest: `data/tarot/rws-assets.json`, 78 Public Domain records with source URLs and checksums
- Asset docs: `docs/TAROT_ASSETS.md`, `docs/FONT_ASSETS.md`

## Current UX Status

- Physical spread visual verdict: pass, 94/100. It fills the mobile viewport with three dense rows, only exposes card backs, and gives selected cards a clear lift and order marker.
- Browser flow verified from question through selection, sequential reveal, affiliate skip and result at 390px.
- The first revealed card alone is exposed while later cards remain unmounted; no pre-reveal identity leak remains.
- Affiliate enabled with configured local production-style values: product image, CTA and skip path verified.
- 375, 390, 430, 768 and 1440 widths: no horizontal overflow; share and restart controls remain available.
- Browser console errors/warnings: 0 on result verification.

## Interpretation Generation Status

generated: 0

validated generated rows: 0

sample authored overrides: 4

evaluation rows: 130 (existing 100 + UX v2 representative 30)

remaining: 76,076

Pipeline is ready. Do not run full generation as part of ordinary product or deployment work.

## Last Successful Test

UX v2 verification on 2026-08-28:

- typecheck: pass
- lint: pass
- tests: 19 files, 48 tests pass
- Next.js webpack production build: compiled, type-checked, generated all 5 static pages and finalized output successfully
- tarot validate: 78 cards, 76,076 combinations, 381 batches, 4 samples, 100 baseline eval rows; UX v2 uses a separate 30-row representative fixture
- tarot status: generated 0, remaining 76,076, failed 0
- diff-check: pass

The status command is read-only and leaves the worktree unchanged.

## Exact Recommended Next Task

Commit and push the UX v2 checkpoint, then redeploy Netlify with the three production environment variables. After deployment, smoke-test the complete ritual and native share on an iPhone. Do not begin Threads/Growth Engine work in this task.

## Last Commit

Checkpoint before UX v2: `44e3a28 Close V1 with reproducible verification and handoff`.

UX v2 commit: pending this checkpoint.
