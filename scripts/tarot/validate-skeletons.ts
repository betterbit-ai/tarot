import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createCanonicalCombinationKey } from "../../src/domain/tarot/combination";
import { TAROT_TOTAL_BATCHES, TAROT_TOTAL_COMBINATIONS } from "./shared";

const directory = join(resolve(process.cwd()), "data/readings/skeletons");
const files = (await readdir(directory)).filter((file) => /^batch-\d{4}\.jsonl$/.test(file)).sort();
if (files.length !== TAROT_TOTAL_BATCHES) throw new Error(`Expected ${TAROT_TOTAL_BATCHES} skeleton batches, received ${files.length}`);

let rows = 0;
for (const file of files) {
  const lines = (await readFile(join(directory, file), "utf8")).trim().split("\n");
  for (const line of lines) {
    const row = JSON.parse(line) as { combination: string; skeleton: { orderedCardIds: [number, number, number]; canonicalKey: string; dominantCardId: number; relationships: string[] } };
    const expected = createCanonicalCombinationKey(row.skeleton.orderedCardIds);
    if (row.combination !== expected || row.skeleton.canonicalKey !== expected || !row.skeleton.relationships.length || !Number.isInteger(row.skeleton.dominantCardId)) {
      throw new Error(`Invalid skeleton row in ${file}`);
    }
    rows += 1;
  }
}
if (rows !== TAROT_TOTAL_COMBINATIONS) throw new Error(`Expected ${TAROT_TOTAL_COMBINATIONS} skeleton rows, received ${rows}`);
process.stdout.write(`skeletonBatches=${files.length} skeletonRows=${rows}\n`);
