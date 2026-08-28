import { mkdir, open, rename, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createReadingSkeleton } from "../../src/domain/tarot/interpretation-v2";
import { batchFileName, getCombinationRowsForBatch, TAROT_TOTAL_BATCHES } from "./shared";

const root = resolve(process.cwd());
const outputDir = join(root, "data/readings/skeletons");
const lockDir = join(root, "generation/skeleton-locks");
const tempDir = join(root, "generation/skeleton-temp");
const args = process.argv.slice(2);
const resume = args.includes("--resume");
const valueFor = (flag: string, fallback: number) => {
  const index = args.indexOf(flag);
  return index === -1 ? fallback : Number(args[index + 1]);
};
const from = valueFor("--from", 1);
const to = valueFor("--to", TAROT_TOTAL_BATCHES);

if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to > TAROT_TOTAL_BATCHES || from > to) {
  throw new Error(`Use --from 1..${TAROT_TOTAL_BATCHES} and --to 1..${TAROT_TOTAL_BATCHES}`);
}

await Promise.all([mkdir(outputDir, { recursive: true }), mkdir(lockDir, { recursive: true }), mkdir(tempDir, { recursive: true })]);
let generated = 0;
let skipped = 0;

for (let batch = from; batch <= to; batch += 1) {
  const filename = batchFileName(batch);
  const finalFile = join(outputDir, filename);
  if (resume) {
    try {
      await open(finalFile, "r").then((handle) => handle.close());
      skipped += 1;
      continue;
    } catch {
      // Generate a missing batch.
    }
  }

  const lockFile = join(lockDir, filename.replace(".jsonl", ".lock"));
  const tempFile = join(tempDir, filename.replace(".jsonl", ".tmp"));
  const handle = await open(lockFile, "wx");
  try {
    const rows = getCombinationRowsForBatch(batch).map((row) => {
      const ids = row.cards.map((card) => card.id);
      return { version: 1, combination: row.combination, skeleton: createReadingSkeleton(ids) };
    });
    await writeFile(tempFile, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");
    await rename(tempFile, finalFile);
    generated += 1;
  } finally {
    await handle.close();
    await rm(lockFile, { force: true });
    await rm(tempFile, { force: true });
  }
}

process.stdout.write(`skeletons targeted=${to - from + 1} generated=${generated} skipped=${skipped}\n`);
