# Reading Data Architecture

## Corpus

78C3 = 76,076 canonical combinations, 200 rows per batch, 381 batches. Generation enumeration is lexicographic and deterministic.

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

The normal browser flow does not call a model. Full generated shards are a later override behind the same lookup API.
