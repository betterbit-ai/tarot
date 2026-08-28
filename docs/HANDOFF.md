# CURRENT PROJECT STATE

Last updated: 2026-08-28 11:03 KST

## Current Phase

PHASE 1 PRODUCT: COMPLETE

The production-ready V1 implementation and repository verification are complete. Threads publishing, analytics automation, and Growth Engine work were not started.

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

## In Progress

None for V1.

## Remaining

- Set `NEXT_PUBLIC_SITE_URL`, `AFFILIATE_ENABLED`, and the server-only `COUPANG_PARTNERS_URL` in production
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

- Intro, selection, reveal and result visual-verdict scores: 92, 91, 90, 92
- Browser flow verified through result, shared re-entry, invalid-token recovery and immediate restart
- Affiliate enabled with missing URL verified as disclosure plus skip-only path
- 375, 390, 430, 768 and 1440 widths: no horizontal overflow; intro CTA stays in the viewport
- Browser console errors: 0

## Interpretation Generation Status

generated: 0

validated generated rows: 0

sample authored overrides: 4

evaluation rows: 100

remaining: 76,076

Pipeline is ready. Do not run full generation as part of ordinary product or deployment work.

## Last Successful Test

`node .codex-harness/scripts/verify-project.mjs` passed on 2026-08-28:

- typecheck: pass
- lint: pass
- tests: 14 files, 38 tests pass
- Next.js webpack production build: pass
- tarot validate: 78 cards, 76,076 combinations, 381 batches, 4 samples, 100 eval rows
- tarot status: generated 0, remaining 76,076, failed 0
- diff-check: pass

The status command is read-only and leaves the worktree unchanged.

## Exact Recommended Next Task

Create the production hosting project, configure the three environment variables, deploy the current `main` HEAD, then smoke-test the complete flow and native share on an iPhone. Do not begin Threads/Growth Engine work in this task.

## Last Commit

Checkpoint: `2f57998 Make the complete tarot ritual durable across sessions`.

The immediately following HEAD commit closes Phase 1 documentation and the read-only status fix; use `git log -1` for its immutable hash.
