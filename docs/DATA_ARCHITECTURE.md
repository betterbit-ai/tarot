# Reading Data Architecture

## Legacy prose corpus

78C3 = 76,076 canonical combinations, 200 rows per batch, 381 batches. Legacy prose batches are preserved for audit and rollback, but normal runtime does not select a complete prose paragraph from them because user questions require personalization.

## Hybrid skeleton corpus

`data/readings/skeletons/` contains 381 batches of canonical relationship skeletons. Each row records canonical key, canonical card order, dominant-card candidate, central tension, direction, relationship signals and raw signal counts. Runtime re-binds the pure skeleton contract to the user's chosen order, then combines it with a transient question profile and renders Korean prose.

Commands:

- `pnpm tarot:skeletons -- --resume`
- `pnpm tarot:skeletons:validate`

## Atomic lifecycle

Acquire `generation/locks/batch-NNNN.lock` with exclusive creation -> write worker-specific `.tmp` -> validate -> atomic rename to `data/readings/batches/batch-NNNN.jsonl` -> release lock.

Only final valid JSONL files count as complete. Status is derived from repository files, never session memory.

## Commands

- `pnpm tarot:generate [--resume] [--from N --to N] [--dry-run]`
- `pnpm tarot:validate`
- `pnpm tarot:retry-failed`
- `pnpm tarot:status [--json]`

## Delivery order

The app ships with curated sample overrides and deterministic fallback. Bulk model generation begins only after a frozen 100-combination evaluation set and editorial comparison.

## Runtime

The normal browser flow does not call an external model. It creates `QuestionProfile -> ReadingSkeleton -> Judgment/Stance -> Renderer` locally after fetching only the selected canonical skeleton from the Node route `/api/tarot-skeleton`. That endpoint accepts card ids only, returns one skeleton, and never receives the question. The skeleton corpus is not sent wholesale to the browser.
