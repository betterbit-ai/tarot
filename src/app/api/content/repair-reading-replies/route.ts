import sourceQueue from "../../../../../data/content/threads-queue.json";
import type { ContentQueue } from "@/domain/content";
import { getThreadsPublisherConfig, withStoredThreadsToken } from "@/lib/content/config";
import { repairMissingReadingReplies } from "@/lib/content/publisher";
import { schedulerRequestIsAuthorized } from "@/lib/content/scheduler-auth";
import { createUpstashContentStateStore, createUpstashJsonStore, UPSTASH_TOKEN_STATE_KEY } from "@/lib/content/upstash-store";
import type { ThreadsTokenState } from "@/lib/content/token";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!schedulerRequestIsAuthorized(request)) return new Response("Unauthorized", { status: 401 });
  const payload = await request.json().catch(() => null) as { contentId?: unknown } | null;
  const contentId = typeof payload?.contentId === "string" ? payload.contentId.trim() : "";
  if (!/^mr-tarot-\d{4}$/.test(contentId)) return new Response("A valid contentId is required", { status: 400 });

  const store = createUpstashContentStateStore();
  const tokenStore = createUpstashJsonStore();
  if (!store || !tokenStore) return new Response("Upstash runtime state is not configured", { status: 503 });

  const refreshed = await tokenStore.get<ThreadsTokenState>(UPSTASH_TOKEN_STATE_KEY);
  const config = getThreadsPublisherConfig();
  const result = await repairMissingReadingReplies((sourceQueue as ContentQueue).items, contentId, store, {
    ...withStoredThreadsToken(config, refreshed),
    userId: refreshed?.userId ?? config.userId,
  });
  return Response.json(result, { status: result.mode === "failed" ? 502 : 200 });
}
