import sourceQueue from "../../../../../data/content/threads-queue.json";
import type { ContentQueue } from "@/domain/content";
import { isFunnelEvent, isSameOriginAnalyticsRequest, isThreadsAttributionId, recordFunnelEvent } from "@/lib/analytics/funnel";
import { createUpstashJsonStore } from "@/lib/content/upstash-store";

export const runtime = "nodejs";

const CONTENT_IDS = new Set((sourceQueue as ContentQueue).items.map((item) => item.id));

export async function POST(request: Request) {
  if (!isSameOriginAnalyticsRequest(request)) return new Response("Forbidden", { status: 403 });

  const payload = await request.json().catch(() => null) as { event?: unknown; contentId?: unknown } | null;
  if (!isFunnelEvent(payload?.event) || !isThreadsAttributionId(payload?.contentId) || (payload.contentId !== "link_in_bio" && !CONTENT_IDS.has(payload.contentId))) {
    return new Response("Invalid analytics event", { status: 400 });
  }

  const store = createUpstashJsonStore();
  if (!store) return new Response(null, { status: 204 });
  await recordFunnelEvent(store, payload.event, payload.contentId);
  return Response.json({ accepted: true }, { status: 202 });
}
