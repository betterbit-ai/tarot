import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";
import sourceQueue from "../../data/content/threads-queue.json";
import type { ContentQueue } from "../../src/domain/content";
import { getThreadsPublisherConfig } from "../../src/lib/content/config";
import { EMPTY_RUNTIME_QUEUE, publishNextContent, type ContentRuntimeQueue } from "../../src/lib/content/publisher";

const STATE_KEY = "threads-runtime-state.json";

export default async () => {
  const blob = getStore("mr-tarot-growth", { consistency: "strong" });
  const store = {
    async read(): Promise<ContentRuntimeQueue> {
      return await blob.get(STATE_KEY, { type: "json", consistency: "strong" }) as ContentRuntimeQueue ?? EMPTY_RUNTIME_QUEUE;
    },
    async write(state: ContentRuntimeQueue): Promise<void> {
      await blob.set(STATE_KEY, JSON.stringify(state));
    },
  };
  const result = await publishNextContent((sourceQueue as ContentQueue).items, store, getThreadsPublisherConfig());
  console.log(JSON.stringify(result));
  return new Response(JSON.stringify(result), { headers: { "content-type": "application/json" } });
};

export const config: Config = { schedule: "30 11 * * *" };
