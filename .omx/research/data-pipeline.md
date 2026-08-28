# Data Pipeline Research

Enumerate 78C3 lexicographically into 381 deterministic batches of at most 200 rows. Cooperative file locks prevent overlapping workers. Every batch writes to a worker-specific temp file, validates, then renames atomically. Resume and status derive only from finalized repository files.

Provider/model adapters remain outside orchestration. A frozen 100-combination evaluation set precedes bulk generation. Full contracts are in `docs/DATA_ARCHITECTURE.md` and `spec/spec.md`.
