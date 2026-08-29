import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createCanonicalCombinationKey, type ReadingSkeleton } from "@/domain/tarot";

const BATCH_SIZE = 200;
const TOTAL_CARDS = 78;
const batchCache = new Map<number, Map<string, ReadingSkeleton>>();

function canonicalCombinationIndex(cardIds: readonly number[]): number {
  const [first, second, third] = [...cardIds].sort((left, right) => left - right);
  let index = 0;
  for (let candidate = 0; candidate < first; candidate += 1) index += ((TOTAL_CARDS - candidate - 1) * (TOTAL_CARDS - candidate - 2)) / 2;
  for (let candidate = first + 1; candidate < second; candidate += 1) index += TOTAL_CARDS - candidate - 1;
  return index + third - second - 1;
}

async function loadBatch(batch: number): Promise<Map<string, ReadingSkeleton>> {
  const cached = batchCache.get(batch);
  if (cached) return cached;
  const file = join(process.cwd(), "data/readings/skeletons", `batch-${String(batch).padStart(4, "0")}.jsonl`);
  const rows = (await readFile(file, "utf8")).trim().split("\n").map((line) => JSON.parse(line) as { combination: string; skeleton: ReadingSkeleton });
  const index = new Map(rows.map((row) => [row.combination, row.skeleton]));
  batchCache.set(batch, index);
  return index;
}

export async function loadReadingSkeleton(cardIds: readonly number[]): Promise<ReadingSkeleton> {
  const key = createCanonicalCombinationKey(cardIds);
  const batch = Math.floor(canonicalCombinationIndex(cardIds) / BATCH_SIZE) + 1;
  const skeleton = (await loadBatch(batch)).get(key);
  if (!skeleton) throw new Error(`Missing reading skeleton for ${key}`);
  return skeleton;
}
