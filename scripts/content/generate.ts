import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { generateContentQueue, validateContentQueue } from "../../src/domain/content";

const args = process.argv.slice(2);
const countIndex = args.indexOf("--count");
const count = countIndex === -1 ? 105 : Number(args[countIndex + 1]);
if (!Number.isInteger(count) || count < 100) throw new Error("Use --count with an integer of at least 100");

const output = resolve(process.cwd(), "data/content/threads-queue.json");
const queue = generateContentQueue(count);
const errors = validateContentQueue(queue);
if (errors.length) throw new Error(errors.join("\n"));
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(queue, null, 2)}\n`, "utf8");
process.stdout.write(`generated=${queue.items.length} ready=${queue.items.filter((item) => item.status === "READY").length} output=${output}\n`);
