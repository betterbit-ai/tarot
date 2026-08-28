# CURRENT PROJECT STATE

Last updated: 2026-08-28 20:45 KST

## Current Phase

PHASE 2 THREADS CONTENT: COMPLETE, AWAITING MANUAL POSTING

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
- User-facing brand unified as “미스터 타로” with Mr. Tarot metadata, share text, shared-page copy and OG artwork
- Opening, selection, reveal and affiliate copy audited for a quiet, observant reader voice
- Reveal copy now varies only for detected card relationships: conflict, repeated suit, major-heavy, or a strong middle pause
- Result narrative now selects one of five relationship-based label patterns instead of repeating three fixed report headings
- Result prose is shorter, concrete and question-aware; all 30 representative readings now measure 362–431 characters and representative 3-cycle browser QA completed at 375, 390 and 430px
- Interpretation quality autopilot now classifies decision, other-person, future and open questions, gives decision questions a clear non-prophetic position first, and protects the marriage regression case (컵 6 / 완드 킹 / 죽음)
- Deterministic evaluator covers 31 fixtures, records dimension scores and failure categories, and reports 4.82/5 average with no flagged failures; 10-result manual spot-check completed
- All 76,076 interpretation rows regenerated through the current relationship-aware renderer; no grammar regression markers remain in the batch files
- Threads Week 01 calendar contains seven copy-paste-ready posts with varied formats, comments, CTAs, topics, hypotheses and metrics placeholders
- Seven 1080x1350 SVG choice-card assets generated under `public/threads/week-01/`; Day 01 and Day 04 visual previews checked
- All 23 referenced card IDs resolve against the real 78-card RWS catalog; no card fronts or affiliate assets were regenerated
- `pnpm threads:copy -- day-01 main|comments|cta` helper copies each post section to the macOS clipboard; `docs/content/THREADS_QUICKSTART.md` documents the exact posting sequence
- Seven PNG exports are available alongside the SVG source assets for direct Threads upload

## In Progress

- Post the Week 01 Threads calendar manually, then record metrics in the calendar placeholders

## Remaining

- Set `NEXT_PUBLIC_SITE_URL=https://mr-tarot.netlify.app`, `AFFILIATE_ENABLED=true`, and the server-only `COUPANG_PARTNERS_URL` in production
- Confirm the final Coupang partner destination and policy wording with the operating account
- Run a final physical iPhone Safari/native share smoke test after deployment
- Threads posting and metrics collection remain manual; no Meta API or auto-publishing was added

## Known Issues

- Authored interpretation coverage is 76,076/76,076; deterministic connected renderer and generated batch records cover every valid triple
- Quality evaluator is intentionally heuristic and should be supplemented by human review for future corpus revisions
- CSP permits `unsafe-inline` scripts for current Next.js compatibility; nonce/hash tightening is later hardening
- Native share depends on browser/device support; copy-link fallback is implemented and tested
- Home OG uses a symbolic three-card brand composition; shared-result OG uses actual selected RWS fronts
- Threads assets are SVG source artwork for direct social export; export at 1080x1350 PNG only if the account requires raster uploads

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
- Three full local cycles passed at 375/390/430px using career, love and continuing-work questions; all reached result, retained the question context and had no horizontal overflow.
- Copy visual verdict: pass, 93/100. Brand, reader voice and relationship-specific narrative labels read as one restrained character without changing the established visual system.

## Interpretation Generation Status

generated: 76,076

validated generated rows: 76,076

sample authored overrides: 4

evaluation rows: 131 (existing 100 + UX v2 representative 31)

remaining: 0

Pipeline completed. Do not regenerate the corpus unless the provider or interpretation rules change and a new quality gate passes.

## Threads Content Status

- Calendar: `docs/content/threads-week-01.md`
- Assets: `public/threads/week-01/day-01.svg` through `day-07.svg`
- Format mix: 4 selection posts, 1 relationship post, 1 work/money post, 1 conversation post
- Card references: 23 (22 unique), all valid against the RWS catalog
- Posting status: not posted; metrics placeholders are ready
- Copy helper smoke test: day-01 main/comments/cta copied successfully; no external account action performed

## Last Successful Test

UX v2 verification on 2026-08-28:

- typecheck: pass
- lint: pass
- tests: 19 files, 49 tests pass
- latest typecheck and lint: pass after narrative-pattern changes
- `pnpm tarot:evaluate`: 31 cases, average 4.82/5, failure distribution empty
- Next.js webpack production build: compiled, type-checked, generated all 5 static pages and finalized output successfully
- tarot validate: 78 cards, 76,076 combinations, 381 batches, 4 samples, 100 baseline eval rows; UX v2 uses a separate 30-row representative fixture
- tarot status: generated 76,076, remaining 0, failed 0
- `pnpm threads:assets`: generated 7 SVG social assets
- Threads card-reference check: 23 valid references, 0 invalid
- diff-check: pass

The status command is read-only and leaves the worktree unchanged.

## Exact Recommended Next Task

Post the Week 01 Threads calendar manually and record metrics, then deploy the completed `main` HEAD to Netlify with the three production environment variables. Do not add auto-publishing or Meta API integration in this phase.

## Last Commit

Checkpoint before UX v2: `44e3a28 Close V1 with reproducible verification and handoff`.

UX v2 commit: `96e5dad Make the tarot ritual feel physically chosen and personally read`.

Mr. Tarot polish commit: `f221c2c Give Mr. Tarot a quieter and more varied voice`.

Interpretation quality checkpoint: `d1a0a5e Make interpretation answers direct and measurable`.

Full corpus generation checkpoint: `c5b978d Finalize the full relationship-aware interpretation corpus`.

Threads content checkpoint: `6ed18b4 Make the Threads week one pack one-command copyable`.
