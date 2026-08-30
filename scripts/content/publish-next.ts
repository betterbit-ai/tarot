import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { ContentQueue } from "../../src/domain/content";
import { getThreadsPublisherConfig } from "../../src/lib/content/config";
import { EMPTY_RUNTIME_QUEUE, publishNextContent, type ContentRuntimeQueue } from "../../src/lib/content/publisher";

const root = resolve(process.cwd());
const source = JSON.parse(await readFile(resolve(root, "data/content/threads-queue.json"), "utf8")) as ContentQueue;
const stateFile = resolve(root, "generation/content-runtime.json");
const store = {
  async read(): Promise<ContentRuntimeQueue> {
    try { return JSON.parse(await readFile(stateFile, "utf8")) as ContentRuntimeQueue; } catch { return EMPTY_RUNTIME_QUEUE; }
  },
  async write(state: ContentRuntimeQueue): Promise<void> {
    await mkdir(dirname(stateFile), { recursive: true });
    await writeFile(stateFile, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  },
};

const result = await publishNextContent(source.items, store, getThreadsPublisherConfig());
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (result.mode === "failed") process.exitCode = 1;
