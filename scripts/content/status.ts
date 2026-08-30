import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ContentQueue, ContentStatus } from "../../src/domain/content";

const path = resolve(process.cwd(), "data/content/threads-queue.json");
const queue = JSON.parse(await readFile(path, "utf8")) as ContentQueue;
const counts = queue.items.reduce<Partial<Record<ContentStatus, number>>>((all, item) => ({ ...all, [item.status]: (all[item.status] ?? 0) + 1 }), {});
const next = queue.items.find((item) => item.status === "READY");
process.stdout.write(`${JSON.stringify({ counts, next: next ? { id: next.id, topic: next.topic, format: next.format } : null }, null, 2)}\n`);
