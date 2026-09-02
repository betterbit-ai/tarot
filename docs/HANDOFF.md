# CURRENT PROJECT STATE

Last updated: 2026-09-02 02:00 KST

## Current Phase

VERCEL FREE MIGRATION: MR-TAROT DOMAIN LIVE + AUTO CONFIGURED, FIRST LIVE THREADS CONTENT PUBLISHED

V1 remains the stable checkpoint. Growth Engine is now an approved Phase 2 operational extension; it must preserve V1 tarot UX, use no runtime LLM, default to review/dry-run, and never publish externally during automated tests.

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
- Runtime interpretation now separates question profile, ordered card skeleton, stance and renderer without an external LLM call
- Hybrid skeleton corpus generated and validated: 381 batches, 76,076 rows under `data/readings/skeletons/`
- Regression gate expanded to 51 varied question/card cases; structured evaluator reports 4.90/5 with no flagged failures
- Runtime calls `/api/tarot-skeleton` with selected card ids only, fetches one canonical skeleton batch row, and binds it to ordered positions locally; question text is not sent or persisted
- Korean naturalness pass applied to the renderer and all 76,076 prose batch rows using the supplied `im-not-ai` taxonomy and rewriting playbook principles
- Full deterministic audit command `pnpm tarot:audit` checks all 76,076 runtime readings for no-question decision leakage, banned AI-tell phrases, malformed card-name particles, and length bounds; current result is zero failures
- Result page now separates card list and Major Arcana status, per-card keywords, visual evidence, combined flow, question application, and reader mindset into short readable sections
- Selection guidance is a single non-wrapping line on mobile and scales down before the desktop breakpoint
- Removed the repeated minor-card sentence about card numbers and placement; each minor card now gets a suit cue plus a rank-specific visual cue
- Simplified the three-card flow into three short sentences using `처음에는`, `가운데`, and `마지막` without abstract “시선 이동” phrasing
- Reduced the reveal pause headline to a smaller mobile type scale for the 390px viewport
- Replaced generic minor-card meanings with 56 suit-specific light/shadow keyword pairs; Cup 5, Sword Queen, and Cup King now read with their own tarot meanings
- Added `return` question context for comeback, return, and reunion wording so application and mindset copy use a concrete recovery/team-direction frame
- Share remains the filled primary action while restart is an outlined secondary action on dark and light result surfaces
- Growth Engine research completed for Meta Threads API, Netlify Scheduled Functions/Blobs, GitHub Actions limitations, and Coupang official surfaces
- Active Growth Engine spec and runtime decisions recorded in `spec/spec.md`, `docs/GROWTH_ENGINE_RESEARCH.md`, `decisions/2026-08-30-growth-engine-runtime.md`, and `decisions/2026-08-31-github-actions-publish-trigger.md`
- Affiliate selector now combines question intent and card signals, selects only verified pool items, and skips the interstitial when no relevant verified product exists
- Generated a 105-item READY content queue across 8 formats and 6 planned topics under `data/content/threads-queue.json`
- Generated 105 programmatic 1080x1350 Threads PNG images and SVG source assets under `public/threads/generated/`
- Threads publisher creates/persists containers before publish, appends per-content UTM CTA links, publishes result replies sequentially, and marks unknown external outcomes for manual reconciliation rather than retrying
- `netlify/functions/publish-next.mts` schedules daily at 20:30 KST (`30 11 * * *` UTC) and stores runtime state in a strong-consistency Netlify Blob store
- `PUBLISH_MODE=review` and `DRY_RUN=true` are defaults. `pnpm content:publish-next` prints the planned main post, image URL, replies, and CTA without calling Threads
- Metrics sync stores only API-returned views/likes/replies/reposts/quotes and defaults to dry run; browser queue dashboard reads the 105-item source queue and supports copy/preview interaction
- A daily token-refresh function saves only a successful long-lived Threads token replacement to Blob storage; publisher prefers it over the original environment token
- GitHub Actions now triggers the protected Netlify publisher at 20:30 KST; Threads credentials remain only in Netlify and Blob queue state prevents replay from ephemeral runners
- Coupang Partners API discovery corrected: product search, deep link conversion, and daily aggregate reports are available to the operating account; future integration must refresh a privileged theme-based pool without transmitting raw questions or using ADID reco
- Threads Week 01 calendar contains seven copy-paste-ready posts with varied formats, comments, CTAs, topics, hypotheses and metrics placeholders
- Seven 1080x1350 SVG choice-card assets generated under `public/threads/week-01/`; Day 01 and Day 04 visual previews checked
- All 23 referenced card IDs resolve against the real 78-card RWS catalog; no card fronts or affiliate assets were regenerated
- `pnpm threads:copy -- day-01 main|comment-1|comments|cta` helper copies the main post, an individual result comment, all comments, or CTA to the macOS clipboard; `docs/content/THREADS_QUICKSTART.md` documents the exact posting sequence
- `/threads` browser dashboard now lets the user switch days, preview the PNG, and copy main/comments/CTA without keeping a terminal open
- Structured reading checkpoint: `b09d60d Bind ritual readings to precomputed skeletons at runtime`
- Seven PNG exports are available alongside the SVG source assets for direct Threads upload
- Public Meta compliance pages now exist at `/privacy`, `/terms`, and `/data-deletion`; they accurately state that the service has no user accounts, does not persist tarot questions, and always leaves the affiliate route optional
- Vercel project import from `betterbit-ai/tarot` is connected on the Hobby team. Its first deployment reached Next.js static-page collection but failed because an imported blank `NEXT_PUBLIC_SITE_URL` made `new URL("")` throw.
- Vercel portability slice adds protected Next route handlers for publish, token refresh, and metrics sync. The new Upstash REST adapter keeps queue and refreshed-token state server-side with no added package; GitHub Actions triggers those routes instead of a Netlify URL.
- Vercel Hobby project `tarot` is live at `https://tarot-ten-gamma.vercel.app`; `/privacy`, `/terms`, and `/data-deletion` have been checked on the public deployment.
- Vercel has `NEXT_PUBLIC_SITE_URL` as a public Config value, affiliate enabled with the verified partner URL, and `PUBLISH_MODE=review` plus `DRY_RUN=true`. Coupang Access/Secret Keys were copied directly from the Partners UI into Vercel server-only Secrets and never committed or recorded in docs.
- The Threads profile link now points to `https://tarot-ten-gamma.vercel.app/?utm_source=threads&utm_medium=social&utm_content=link_in_bio` and publicly displays the new Vercel host.
- Threads OAuth start/callback routes now bind a signed, expiring state to an HttpOnly browser cookie, verify the authorized `@mr._.tarot` username through the Threads API, exchange a code in a POST body, and store only the long-lived token in Upstash. Publisher uses the stored OAuth user id when present.
- Upstash account is connected under `joelonsw`; free Redis database `mr-tarot-growth` was created in `us-east-1` with REST API and TLS enabled. Its REST URL is stored in Vercel; the standard REST token is intentionally not read or recorded and still needs direct operator paste into Vercel.
- Coupang Partners Access Key and Secret Key were transferred directly from the authenticated Partners UI into Vercel server-only Secrets. Values are not present in Git, docs or chat.
- Threads public profile link was saved as `tarot-ten-gamma.vercel.app` with UTM parameters. Meta Basic Settings could not be re-verified because the session redirected to Facebook login.
- Vercel project was renamed to `mr-tarot` and `https://mr-tarot.vercel.app` was connected to Production. `NEXT_PUBLIC_SITE_URL` now uses that alias and a redeploy was requested.
- Threads profile link was corrected to `https://mr-tarot.vercel.app/?utm_source=threads&utm_medium=social&utm_content=link_in_bio`; the public profile now displays `mr-tarot.vercel.app`.
- Vercel and GitHub scheduler secrets were rotated together, but the first post-redeploy dry-runs still receive `401 Unauthorized`; the workflow now prints only status and redacted response text for diagnosis.
- Canonical `CONTENT_SCHEDULER_SECRET` was added to GitHub Actions and Vercel; after a fresh Production redeploy, publish workflow run #9 succeeded in dry-run mode and run #11 succeeded with `PUBLISH_MODE=auto` and `DRY_RUN=false`.
- Threads token-refresh workflow run #2 succeeded, confirming the stored token can refresh through Vercel/Upstash without exposing the token.
- Publish workflow run #11 reached Vercel with HTTP 200 but returned `mode: failed` because the runtime lacked Threads credentials or site URL; its response was inspected without exposing tokens. Token refresh now also resolves and persists the verified `@mr._.tarot` user id from `/me`.
- Publish workflow run #12 reached Vercel with HTTP 200 after the latest Production redeploy but still returned `mode: failed` with `Missing Threads credentials or site URL`. Upstash runtime state remains `mr-tarot-0001: READY` and no `mr-tarot:threads-token:v1` key exists.
- `PUBLISH_MODE=auto` and `DRY_RUN=false` were deleted/recreated as readable Config variables and verified through the Vercel dashboard. The remaining failure is a missing or invalid `THREADS_ACCESS_TOKEN` or `THREADS_USER_ID` in the deployed runtime, not a dry-run flag.
- Latest token-refresh workflow #6 returned HTTP 200 but did not create `mr-tarot:threads-token:v1`; the publisher therefore remains fail-closed and has not created a confirmed live post.
- After the operator supplied `THREADS_ACCESS_TOKEN` and numeric `THREADS_USER_ID`, token-refresh workflow #7 returned HTTP 200 with `{"mode":"refreshed"}`.
- Publish workflow #13 reached Vercel with HTTP 200 and valid content, but Threads returned `400` while publishing a reply container. Publish workflow #15 then confirmed the provider response `media container is still processing`; text replies now use the official `auto_publish_text=true` path, while only an unpublished image container is readiness-polled and provider error details are preserved.
- Publish workflow #19 created the first live Threads post and six replies for `mr-tarot-0001`; the public `@mr._.tarot` profile shows the post and `답글 6`. Upstash runtime state is `PUBLISHED` with the main post id and all six reply ids.
- GitHub's previous 25-second curl limit caused a false timeout after the serverless publisher completed; the workflow limit is now 55 seconds.
- The missing `3번` reply on `mr-tarot-0002` was manually posted under the user's `wanderer_0528` comment. Threads shows the parent reply count increased from 3 to 4 and the new author reply is visible.
- Coupang Partners refresh integration is implemented: HMAC-SHA256 signing, theme-keyword product search, CDN/product URL validation, `/deeplink` conversion, Upstash pool storage, public sanitized pool fallback, and a protected GitHub schedule.
- Manual `Refresh Coupang affiliate pool` run reached the deployed route but Coupang returned HTTP `401`. The feature flag is enabled; the current blocker is the Partners API key pair or its account authorization, not the scheduler route.
- Threads hook research added at `docs/content/THREADS_HOOK_RESEARCH.md`: 30 original Korean hook candidates based on public archetype research, with a note that no official cross-account top-30 ranking exists.
- The content generator now rotates 30 curiosity, tension, direct-question, warning, reversal and participation hooks. `pnpm content:refresh-hooks` upgraded 103 queued items while preserving the two already-published items, and `pnpm content:images` regenerated matching PNG/SVG assets.

## In Progress

- Verify the next queued item through the same workflow and record hook impressions, replies and profile visits before choosing a winning hook pattern.
- Set `COUPANG_PARTNERS_API_ENABLED=true` in Vercel Production, redeploy, run `Refresh Coupang affiliate pool` once, and confirm `/api/affiliate/pool` returns at least one refreshed product before relying on live recommendations.
- After issuing or correcting a valid Coupang Partners AccessKey/SecretKey, rerun the refresh workflow and confirm `mode: refreshed`; until then the ritual safely uses the local fallback product.
- Paste the Upstash REST token into Vercel `UPSTASH_REDIS_REST_TOKEN`; do not put it in Git or chat.
- Meta settings save redirected to a Facebook login prompt before reflection could be verified. Facebook login is needed to validate the Vercel policy URLs, category and OAuth redirect setup.
- Upstash REST token still needs direct paste in Vercel. The browser automation surface does not expose the masked token to another form, by design.
- GitHub repository Actions settings returned 404 for the current GitHub session; `GROWTH_SCHEDULER_SECRET` must be added by an account with repository Actions-secret access.
- GitHub Actions variable and repository secret are now visible and present. The latest protected publish workflow succeeded after the canonical secret migration.

## Remaining

- Auto mode is enabled in the current Vercel Production deployment. Leave the daily GitHub schedule enabled and do not manually rerun it unless reconciling the queue.
- Confirm the final Coupang partner destination and policy wording with the operating account
- Run a final physical iPhone Safari/native share smoke test after deployment
- Threads auto publishing is configured and the first item is confirmed published; continue checking each next item for `mode: published` because provider processing can be delayed.
- Vercel `THREADS_ACCESS_TOKEN` must be a valid long-lived Threads user token and `THREADS_USER_ID` must be the numeric id for `@mr._.tarot`, not the Threads App ID. Both must be set for the Production environment and followed by a redeploy.
- Legacy prose batches are retained for rollback/audit but are not used by the normal ritual runtime
- The legacy prose batches were regenerated from the current renderer after the naturalness pass; the runtime still uses the smaller hybrid skeleton route

## Known Issues

- `/threads` queue dashboard browser smoke test is pending because this session hit the Codex browser usage limit; component interaction test and production build pass
- Authored interpretation coverage is 76,076/76,076; deterministic connected renderer and generated batch records cover every valid triple
- Quality evaluator is intentionally heuristic and should be supplemented by human review for future corpus revisions
- CSP permits `unsafe-inline` scripts for current Next.js compatibility; nonce/hash tightening is later hardening
- Native share depends on browser/device support; copy-link fallback is implemented and tested
- Home OG uses a symbolic three-card brand composition; shared-result OG uses actual selected RWS fronts
- Threads assets are SVG source artwork for direct social export; export at 1080x1350 PNG only if the account requires raster uploads
- Netlify reports that the `betterbit-ai` team has operational credits only and that production deploys are paused. The current `mr-tarot.netlify.app/privacy` response is therefore 404 even though `main` contains the route. Do not save the Meta policy URLs until the deploy succeeds.
- The Vercel Hobby import currently has 20 detected variable names. Public site/affiliate defaults and the Coupang Secrets are present; Upstash REST token, Threads App Secret and user token remain unset.
- Vercel/Upstash port exists in source but is intentionally inactive without `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and `CONTENT_SCHEDULER_SECRET`.
- Vercel/Upstash port is configured, but the protected publisher currently fails closed with `401` until the deployed scheduler secret matches GitHub's repository secret.
- `COUPANG_PARTNERS_API_ENABLED` remains unset because live product-pool refresh is not yet implemented; do not claim that the stored keys have started live discovery.
- Threads profile link edit is not persistent: the UI optimistically displays `mr-tarot.vercel.app`, but a reload restores `mr-tarot.netlify.app`. Fix or manually retry before claiming the profile migration complete.

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

Structured skeleton corpus: 381 batches / 76,076 rows / validated.

## Threads Content Status

- Calendar: `docs/content/threads-week-01.md`
- Assets: `public/threads/week-01/day-01.svg` through `day-07.svg`
- Format mix: 4 selection posts, 1 relationship post, 1 work/money post, 1 conversation post
- Card references: 23 (22 unique), all valid against the RWS catalog
- Posting status: not posted; metrics placeholders are ready
- Copy helper smoke test: day-01 main/comments/cta copied successfully; no external account action performed
- Browser dashboard smoke test at 390px: DAY 02 switch, image href, copy toast and no overflow all passed; browser console errors: 0

## Last Successful Test

UX v2 verification on 2026-08-28:

- typecheck: pass
- lint: pass
- tests: 19 files, 49 tests pass
- latest typecheck and lint: pass after narrative-pattern changes
- `pnpm tarot:evaluate`: 51 cases, average 4.90/5, failure distribution empty
- `pnpm tarot:audit`: 76,076 readings checked, zero no-question decision headlines, zero banned patterns, zero malformed particles, zero length failures
- `pnpm typecheck`, `pnpm lint`, `pnpm test`: 20 files, 52 tests pass after result-page restructure
- `pnpm content:refresh-hooks`, `pnpm content:images`, `pnpm content:validate`: 105 queued items, 105 READY, validation pass
- `pnpm test`: 30 files, 79 tests pass after hook rotation changes
- `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm content:validate`, `git diff --check`: pass after Threads hook refresh
- Coupang adapter tests cover HMAC signing, six-theme refresh mapping, and refreshed-pool selection.
- `pnpm tarot:audit`: added editorial-layer, redundant-visual, and awkward-flow checks; all 76,076 rows still pass with zero failures
- `pnpm tarot:generate --from 1 --to 381`: regenerated all 76,076 prose rows with suit-specific minor meanings
- Growth Engine checks: `pnpm content:generate --count 105`, `pnpm content:images`, `pnpm content:validate`, `pnpm content:status`, `pnpm content:publish-next`, `pnpm content:sync-metrics`, `pnpm content:refresh-token`, 25 test files / 62 tests, typecheck, lint, and build all pass
- `pnpm tarot:skeletons:validate`: 381 batches, 76,076 skeleton rows
- Next.js webpack production build: compiled, type-checked, generated all 5 static pages and finalized output successfully
- tarot validate: 78 cards, 76,076 combinations, 381 batches, 4 samples, 100 baseline eval rows; UX v2 uses a separate 30-row representative fixture
- tarot status: generated 76,076, remaining 0, failed 0
- `pnpm threads:assets`: generated 7 SVG social assets
- Threads card-reference check: 23 valid references, 0 invalid
- diff-check: pass
- Meta compliance-page checkpoint: `pnpm typecheck`, `pnpm lint`, `pnpm test` (25 files, 62 tests), `pnpm build`, and `git diff --check`: pass. Build includes static `/privacy`, `/terms`, and `/data-deletion` routes.
- Vercel portability checkpoint: `pnpm test` (29 files, 73 tests), `pnpm typecheck`, `pnpm lint`, `pnpm build`, and `git diff --check`: pass. Build includes protected `/api/content/publish-next`, `/api/content/refresh-token`, and `/api/content/sync-metrics` routes. Independent architecture review approved after token-refresh metrics regression repair.
- Threads OAuth security checkpoint: `pnpm test` (30 files, 77 tests), typecheck, lint, build and diff check pass. OAuth security review found and then verified fixes for CSRF, account binding and token transport.

The status command is read-only and leaves the worktree unchanged.

## Exact Recommended Next Task

Resolve the Coupang Partners API `401` by issuing a valid partner key pair or enabling the Partners API for the operating account, rerun `Refresh Coupang affiliate pool`, and verify a live ritual shows a refreshed product while keeping the skip path. After that, run `Publish prepared Threads content` for `mr-tarot-0003` and compare hook performance against the two published baselines. Do not regenerate the two preserved published items.

## Last Commit

Checkpoint before UX v2: `44e3a28 Close V1 with reproducible verification and handoff`.

UX v2 commit: `96e5dad Make the tarot ritual feel physically chosen and personally read`.

Mr. Tarot polish commit: `f221c2c Give Mr. Tarot a quieter and more varied voice`.

Interpretation quality checkpoint: `d1a0a5e Make interpretation answers direct and measurable`.

Full corpus generation checkpoint: `c5b978d Finalize the full relationship-aware interpretation corpus`.

Threads content checkpoint: `fc828e0 Add a browser dashboard for Threads posting`.

Naturalness audit checkpoint: `a7c9ba5 Make every tarot reading sound like natural Korean`.

Editorial result checkpoint: `ccd22bd Ground tarot readings in card-specific meaning and context`.

Growth Engine checkpoints: `7f44e7c`, `d6ce766`, `7f8f367`, `66625be`, `38c608a`, `5873a10`, `94b0bfb`.

Meta compliance-page checkpoint: `9ef6a68 Make Meta compliance URLs truthful and deployable`.

Netlify deployment-blocker record: current `HEAD`.

Vercel migration record: current `HEAD` — empty production URL no longer blocks a first deploy.

Vercel/Upstash runtime portability record: current `HEAD`.

Vercel live + Threads link + OAuth callback record: `f951faf` followed by current provider setup.

Vercel project rename/domain record: current `HEAD` — `mr-tarot` / `mr-tarot.vercel.app`.

Scheduler diagnostic checkpoint: current `HEAD` — GitHub reaches Vercel; first automated content is published, and the missing `3번` reply was manually completed.
