import sourceQueue from "../../../../../data/content/threads-queue.json";
import type { ContentQueue } from "@/domain/content";
import { getThreadsPublisherConfig, withStoredThreadsToken } from "@/lib/content/config";
import { publishNextContent } from "@/lib/content/publisher";
import { schedulerRequestIsAuthorized } from "@/lib/content/scheduler-auth";
import { AFFILIATE_POOL_KEY, createUpstashContentStateStore, createUpstashJsonStore, UPSTASH_TOKEN_STATE_KEY } from "@/lib/content/upstash-store";
import type { ThreadsTokenState } from "@/lib/content/token";
import { isStoredAffiliateProduct } from "@/lib/affiliate/products";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!schedulerRequestIsAuthorized(request)) return new Response("Unauthorized", { status: 401 });
  const store = createUpstashContentStateStore();
  const tokenStore = createUpstashJsonStore();
  if (!store || !tokenStore) return new Response("Upstash runtime state is not configured", { status: 503 });

  const [refreshed, storedProducts] = await Promise.all([
    tokenStore.get<ThreadsTokenState>(UPSTASH_TOKEN_STATE_KEY),
    tokenStore.get<unknown>(AFFILIATE_POOL_KEY),
  ]);
  const config = getThreadsPublisherConfig();
  const result = await publishNextContent((sourceQueue as ContentQueue).items, store, {
    ...withStoredThreadsToken(config, refreshed),
    userId: refreshed?.userId ?? config.userId,
    affiliateProducts: Array.isArray(storedProducts) ? storedProducts.filter(isStoredAffiliateProduct) : [],
    affiliateTargetStore: tokenStore,
  });
  return Response.json(result);
}
