import { getThreadsTokenConfig } from "@/lib/content/config";
import { schedulerRequestIsAuthorized } from "@/lib/content/scheduler-auth";
import { refreshThreadsToken } from "@/lib/content/token";
import { createUpstashJsonStore, UPSTASH_TOKEN_STATE_KEY } from "@/lib/content/upstash-store";
import type { ThreadsTokenState } from "@/lib/content/token";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!schedulerRequestIsAuthorized(request)) return new Response("Unauthorized", { status: 401 });
  const tokenStore = createUpstashJsonStore();
  if (!tokenStore) return new Response("Upstash runtime state is not configured", { status: 503 });

  const stored = await tokenStore.get<ThreadsTokenState>(UPSTASH_TOKEN_STATE_KEY);
  const config = getThreadsTokenConfig();
  const result = await refreshThreadsToken({ ...config, accessToken: stored?.accessToken ?? config.accessToken });
  if (result.token) await tokenStore.set(UPSTASH_TOKEN_STATE_KEY, { ...result.token, userId: stored?.userId });
  return Response.json({ mode: result.mode, reason: result.reason });
}
