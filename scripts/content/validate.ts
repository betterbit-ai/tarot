import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validateContentQueue, type ContentQueue } from "../../src/domain/content";

const path = resolve(process.cwd(), "data/content/threads-queue.json");
const queue = JSON.parse(await readFile(path, "utf8")) as ContentQueue;
const errors = validateContentQueue(queue);
if (errors.length) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`items=${queue.items.length} ready=${queue.items.filter((item) => item.status === "READY").length} validation=pass\n`);
}
