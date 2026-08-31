import { getStore } from "@netlify/blobs";
import sourceQueue from "../../data/content/threads-queue.json";
import type { ContentQueue } from "../../src/domain/content";
import { getThreadsPublisherConfig } from "../../src/lib/content/config";
import { EMPTY_RUNTIME_QUEUE, publishNextContent, type ContentRuntimeQueue } from "../../src/lib/content/publisher";
import type { ThreadsTokenState } from "../../src/lib/content/token";

const STATE_KEY = "threads-runtime-state.json";
const TOKEN_KEY = "threads-token.json";

const handler = async (request: Request) => {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const schedulerSecret = process.env.CONTENT_SCHEDULER_SECRET;
  if (!schedulerSecret) return new Response("Scheduler secret is not configured", { status: 503 });
  if (request.headers.get("x-mr-tarot-scheduler") !== schedulerSecret) return new Response("Unauthorized", { status: 401 });
  const blob = getStore("mr-tarot-growth", { consistency: "strong" });
  const store = {
    async read(): Promise<ContentRuntimeQueue> {
      return await blob.get(STATE_KEY, { type: "json", consistency: "strong" }) as ContentRuntimeQueue ?? EMPTY_RUNTIME_QUEUE;
    },
    async write(state: ContentRuntimeQueue): Promise<void> {
      await blob.set(STATE_KEY, JSON.stringify(state));
    },
  };
  const refreshed = await blob.get(TOKEN_KEY, { type: "json", consistency: "strong" }) as ThreadsTokenState | null;
  const config = getThreadsPublisherConfig();
  const result = await publishNextContent((sourceQueue as ContentQueue).items, store, { ...config, accessToken: refreshed?.accessToken ?? config.accessToken });
  console.log(JSON.stringify(result));
  return new Response(JSON.stringify(result), { headers: { "content-type": "application/json" } });
};

export default handler;
