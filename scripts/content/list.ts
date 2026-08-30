import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ContentQueue } from "../../src/domain/content";

const queue = JSON.parse(await readFile(resolve(process.cwd(), "data/content/threads-queue.json"), "utf8")) as ContentQueue;
process.stdout.write(queue.items.map((item) => `${item.id}\t${item.status}\t${item.topic}\t${item.format}\t${item.hook}`).join("\n").concat("\n"));
