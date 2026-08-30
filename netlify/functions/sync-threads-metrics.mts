import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";
import { getThreadsMetricsConfig } from "../../src/lib/content/config";
import { syncThreadsMetrics } from "../../src/lib/content/metrics";
import { EMPTY_RUNTIME_QUEUE, type ContentRuntimeQueue } from "../../src/lib/content/publisher";

const STATE_KEY = "threads-runtime-state.json";

const handler = async () => {
  const blob = getStore("mr-tarot-growth", { consistency: "strong" });
  const store = {
    async read(): Promise<ContentRuntimeQueue> {
      return await blob.get(STATE_KEY, { type: "json", consistency: "strong" }) as ContentRuntimeQueue ?? EMPTY_RUNTIME_QUEUE;
    },
    async write(state: ContentRuntimeQueue): Promise<void> {
      await blob.set(STATE_KEY, JSON.stringify(state));
    },
  };
  const result = await syncThreadsMetrics(store, getThreadsMetricsConfig());
  console.log(JSON.stringify(result));
  return new Response(JSON.stringify(result), { headers: { "content-type": "application/json" } });
};

export default handler;

export const config: Config = { schedule: "10 12 * * *" };
