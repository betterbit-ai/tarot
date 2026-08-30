import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ContentQueue, ContentStatus } from "../../src/domain/content";
import { applyRuntimeState, EMPTY_RUNTIME_QUEUE, type ContentRuntimeQueue } from "../../src/lib/content/publisher";

const path = resolve(process.cwd(), "data/content/threads-queue.json");
const queue = JSON.parse(await readFile(path, "utf8")) as ContentQueue;
const runtimePath = resolve(process.cwd(), "generation/content-runtime.json");
let runtime: ContentRuntimeQueue = EMPTY_RUNTIME_QUEUE;
try { runtime = JSON.parse(await readFile(runtimePath, "utf8")) as ContentRuntimeQueue; } catch { /* Local dry-run has no durable queue state. */ }
const items = applyRuntimeState(queue.items, runtime);
const counts = items.reduce<Partial<Record<ContentStatus, number>>>((all, item) => ({ ...all, [item.status]: (all[item.status] ?? 0) + 1 }), {});
const next = items.find((item) => item.status === "READY");
process.stdout.write(`${JSON.stringify({ counts, next: next ? { id: next.id, topic: next.topic, format: next.format } : null }, null, 2)}\n`);
