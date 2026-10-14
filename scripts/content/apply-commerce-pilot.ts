import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { generateCommercePilot, validateContentQueue, type ContentQueue, type ThreadsContent } from "../../src/domain/content";

const output = resolve(process.cwd(), "data/content/threads-queue.json");
const existing = JSON.parse(await readFile(output, "utf8")) as ContentQueue;
const pilot = generateCommercePilot(new Date().toISOString());
const pilotById = new Map(pilot.map((item) => [item.id, item]));

function numericId(item: ThreadsContent): number {
  return Number(item.id.match(/\d+$/)?.[0] ?? Number.NaN);
}

const items = existing.items.map((item): ThreadsContent => {
  const replacement = pilotById.get(item.id);
  if (replacement) return replacement;
  const number = numericId(item);
  if (number <= 46 || number >= 59) return { ...item, status: "SKIPPED" };
  return item;
});

for (const item of pilot) {
  if (!items.some((candidate) => candidate.id === item.id)) items.push(item);
}
items.sort((left, right) => numericId(left) - numericId(right));

const queue: ContentQueue = { version: 1, generatedAt: new Date().toISOString(), items };
const errors = validateContentQueue(queue);
if (errors.length) throw new Error(errors.join("\n"));
await writeFile(output, `${JSON.stringify(queue, null, 2)}\n`, "utf8");
process.stdout.write(`pilot=${pilot.length} next=${pilot[0]?.id ?? "none"} skipped=${items.filter((item) => item.status === "SKIPPED").length} output=${output}\n`);
