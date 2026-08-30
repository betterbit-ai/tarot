import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ContentQueue } from "../../src/domain/content";

const idIndex = process.argv.indexOf("--id");
const id = idIndex === -1 ? undefined : process.argv[idIndex + 1];
if (!id) throw new Error("Use --id mr-tarot-0001");
const queue = JSON.parse(await readFile(resolve(process.cwd(), "data/content/threads-queue.json"), "utf8")) as ContentQueue;
const item = queue.items.find((candidate) => candidate.id === id);
if (!item) throw new Error(`Unknown content id: ${id}`);
process.stdout.write(`${JSON.stringify(item, null, 2)}\n`);
