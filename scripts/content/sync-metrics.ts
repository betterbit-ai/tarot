import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { getThreadsMetricsConfig } from "../../src/lib/content/config";
import { syncThreadsMetrics } from "../../src/lib/content/metrics";
import { EMPTY_RUNTIME_QUEUE, type ContentRuntimeQueue } from "../../src/lib/content/publisher";

const stateFile = resolve(process.cwd(), "generation/content-runtime.json");
const store = {
  async read(): Promise<ContentRuntimeQueue> { try { return JSON.parse(await readFile(stateFile, "utf8")) as ContentRuntimeQueue; } catch { return EMPTY_RUNTIME_QUEUE; } },
  async write(state: ContentRuntimeQueue): Promise<void> { await mkdir(dirname(stateFile), { recursive: true }); await writeFile(stateFile, `${JSON.stringify(state, null, 2)}\n`, "utf8"); },
};
process.stdout.write(`${JSON.stringify(await syncThreadsMetrics(store, getThreadsMetricsConfig()), null, 2)}\n`);
