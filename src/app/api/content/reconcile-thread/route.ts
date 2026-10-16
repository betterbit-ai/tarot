import sourceQueue from "../../../../../data/content/threads-queue.json";
import type { ContentQueue } from "@/domain/content";
import { isStoredAffiliateProduct } from "@/lib/affiliate/products";
import { getThreadsPublisherConfig, withStoredThreadsToken } from "@/lib/content/config";
import { repairIncompletePublishedThread } from "@/lib/content/publisher";
import { schedulerRequestIsAuthorized } from "@/lib/content/scheduler-auth";
import { AFFILIATE_POOL_KEY, createUpstashContentStateStore, createUpstashJsonStore, UPSTASH_TOKEN_STATE_KEY } from "@/lib/content/upstash-store";
import type { ThreadsTokenState } from "@/lib/content/token";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!schedulerRequestIsAuthorized(request)) return new Response("Unauthorized", { status: 401 });
  const payload = await request.json().catch(() => null) as { contentId?: unknown } | null;
  const contentId = typeof payload?.contentId === "string" ? payload.contentId.trim() : "";
  if (!/^mr-tarot-\d{4}$/.test(contentId)) return new Response("A valid contentId is required", { status: 400 });

  const contentStore = createUpstashContentStateStore();
  const jsonStore = createUpstashJsonStore();
  if (!contentStore || !jsonStore) return new Response("Upstash runtime state is not configured", { status: 503 });

  const [refreshed, storedProducts] = await Promise.all([
    jsonStore.get<ThreadsTokenState>(UPSTASH_TOKEN_STATE_KEY),
    jsonStore.get<unknown>(AFFILIATE_POOL_KEY),
  ]);
  const config = getThreadsPublisherConfig();
  const result = await repairIncompletePublishedThread((sourceQueue as ContentQueue).items, contentId, contentStore, {
    ...withStoredThreadsToken(config, refreshed),
    userId: refreshed?.userId ?? config.userId,
    affiliateProducts: Array.isArray(storedProducts) ? storedProducts.filter(isStoredAffiliateProduct) : [],
    affiliateTargetStore: jsonStore,
  });
  return Response.json(result, { status: result.mode === "failed" ? 502 : 200 });
}
