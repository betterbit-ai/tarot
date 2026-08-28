# Autopilot Implementation Plan

## Slice 1: Reproducible scaffold

Create and pin through `pnpm-lock.yaml`:

- Next.js 16.3.3, React/React DOM 19.2.8
- TypeScript 6.0.3, Tailwind/@tailwindcss-postcss 4.3.3
- Motion 13.1.1
- Vitest 4.1.11, Testing Library React 16.3.2, user-event 14.6.6, happy-dom 20.11.10
- ESLint 9.39.5 and eslint-config-next 16.3.3 (plugin peer-compatible)
- tsx 4.23.12 for data CLIs

Artifacts: `package.json`, `pnpm-lock.yaml`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `vitest.config.ts`, `src/app/{layout,page,globals.css}`, `.codex-harness/config.json`.

Required scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:watch`, `tarot:generate`, `tarot:validate`, `tarot:retry-failed`, `tarot:status`.

Exit: blank route renders, lint/typecheck/test/build all exit 0, harness command represents each check.

## Slice 2: Framework-light tarot domain

Own files: `src/domain/tarot/{types,cards,deck,combination,selection,positions,reading,share-token}.ts`, fixtures in `src/domain/tarot/__tests__/`.

Implement stable ids 0-77, 78-card validation, cryptographic Fisher-Yates where available with injectable RNG for tests, canonical two-digit keys, 76,076 enumerator, three-selection reducer, ordered position mapping, authored override lookup, connected deterministic fallback, and versioned share token that contains only ordered ids.

Exit: tests prove 78 unique cards, 76,076 unique combinations, no repeated card in a combination, deterministic key across permutations, full-deck shuffle permutation, select/deselect/max three, connected reading shape for any valid triple, and share roundtrip/privacy.

## Slice 3: Complete ritual and routes

Own files: `src/features/ritual/**`, `src/components/**`, `src/lib/{analytics,affiliate,sharing}/**`, `src/app/page.tsx`, `src/app/share/[token]/**`, `src/app/out/coupang/route.ts`, `src/app/opengraph-image.tsx`.

Stages: intro, optional question, prepare, shuffle, spread/select, confirm, sequential reveal, reading pause, optional affiliate sheet, result, share, restart. Use a reducer with explicit stage transitions. Render all 78 card backs from one optimized asset and only three symbolic code-native fronts.

Visual asset decision: no additional generated raster assets. Keep `public/images/tarot-reader-table.png` and `public/images/tarot-card-back.png`. Card fronts use locally downloaded and optimized Public Domain Rider-Waite-Smith originals with a documented source manifest. Do not hotlink or use modern unverified recolors.

Exit: component tests cover empty question, stage transitions, three-card gating/deselect, affiliate disabled/missing URL/skip/click, reveal completion, native-share fallback, and in-app restart. Shared route reproduces ordered cards without a question.

## Slice 4: Resumable reading data tooling

Artifacts:

- `data/readings/eval/eval-set-v1.jsonl`: 100 rows of `{ combination, cards }`
- `data/readings/samples/sample-readings.jsonl`: authored `ReadingRecord` overrides
- `data/readings/batches/batch-NNNN.jsonl`: up to 200 full `ReadingRecord` rows
- `data/readings/failed/failed-batches.jsonl`: append-only attempts
- `data/readings/manifest.json`: derived status
- `generation/locks/*.lock`, `generation/temp/*.tmp`
- `scripts/tarot/{shared,provider,generate,validate,retry-failed,status}.ts`

ReadingRecord schema: `{ combination, cards, reading: { headline, story, advice, closing }, version, generation: { provider, model, promptVersion, batch, generatedAt } }`.

The built-in default provider is deterministic local fallback so commands work with no key. A future external provider implements the same interface. `--resume`, `--from`, `--to`, `--batch`, `--dry-run`, exclusive locks, temp validation, atomic rename, derived status, and unresolved retry are required.

Evaluation set pass criteria before external bulk generation: schema valid, all combinations unique/canonical, representative Major/Minor and suit distribution, then human editorial scoring for natural Korean, coherence, interaction, repetition, specificity, non-AI tone, usefulness. Bulk model selection is an operational decision recorded later; the repository does not pretend an evaluation was performed.

Exit: CLI integration tests cover interrupted temp ignored, valid batch skipped on resume, range selection, atomic finalization, overlapping lock rejection, stale lock recovery, invalid JSON/key/row count rejection, status counts, and retry selection. `tarot:validate` asserts the full 76,076 combination universe independently of generated coverage.

## Slice 5: Verification and browser matrix

Automated: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm tarot:validate`, `pnpm tarot:status`, full harness command.

Manual browser route/state matrix:

| Route/state | Widths | Conditions |
| --- | --- | --- |
| `/` intro/question | 375, 390, 430, 768, 1440 | keyboard, empty and filled question |
| `/` spread/select | 375, 390, 430, 768, 1440 | 78 backs, deselect, max three, horizontal touch/scroll |
| `/` reveal/pause | 375, 430, 1440 | normal and reduced motion |
| `/` affiliate/result | 375, 430, 768 | enabled with URL, disabled, URL missing, skip |
| `/` share/restart | 375, 430, 1440 | Web Share mocked unavailable, copy fallback, no hard reload |
| `/share/[valid]` | 375, 768, 1440 | same ordered cards, no question, start-own CTA |
| `/share/[invalid]` | 375, 1440 | safe recovery to ritual |

Each run checks focus order, focus visibility, 44px targets, contrast, no clipped CTAs, no console/terminal errors, and no visible AI wording or em/en dash.

## Slice 6: Independent validation

Run parallel architecture, security, and code-quality reviews on the final diff. Every blocking finding gets a targeted fix and the full verification sequence reruns. Record reusable non-obvious findings under `learnings/`.

## Slice 7: Handoff and checkpoint

Move `docs/tasks/active/001-production-tarot-service.md` to completed, update `docs/HANDOFF.md` with actual commands and Git hash, mark autopilot complete, and commit with Lore trailers. The external 76,076-model corpus, final Coupang URL/compliance sign-off, and production Vercel project remain explicit operational follow-ups.
