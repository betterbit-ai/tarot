import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { generateContentQueue, validateContentQueue } from "../../src/domain/content";
import type { ContentQueue } from "../../src/domain/content";

const output = resolve(process.cwd(), "data/content/threads-queue.json");
const existing = JSON.parse(await readFile(output, "utf8")) as ContentQueue;
const regenerated = generateContentQueue(existing.items.length);

// These two items have already been published externally. Keep their exact copy
// while upgrading every still-queued item to the current hook library.
const publishedIds = new Set(["mr-tarot-0001", "mr-tarot-0002"]);
const queue: ContentQueue = {
  ...regenerated,
  items: regenerated.items.map((item) => publishedIds.has(item.id) ? existing.items.find((saved) => saved.id === item.id) ?? item : item),
};
const errors = validateContentQueue(queue);
if (errors.length) throw new Error(errors.join("\n"));
await writeFile(output, `${JSON.stringify(queue, null, 2)}\n`, "utf8");
process.stdout.write(`refreshed=${queue.items.length} preserved=${publishedIds.size} output=${output}\n`);
