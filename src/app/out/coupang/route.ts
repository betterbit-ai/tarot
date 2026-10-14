import { type NextRequest, NextResponse } from "next/server";
import { resolveAffiliateTarget } from "@/lib/affiliate/config";
import { resolveStoredAffiliateTarget } from "@/lib/affiliate/products";
import { isThreadsAttributionId, recordFunnelEvent } from "@/lib/analytics/funnel";
import { AFFILIATE_POOL_KEY, createUpstashJsonStore } from "@/lib/content/upstash-store";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("product")?.trim();
  if (productId) {
    const contentId = request.nextUrl.searchParams.get("content")?.trim();
    const choice = request.nextUrl.searchParams.get("choice")?.trim();
    const fallback = new URL("/", request.url);
    if (!contentId || !isThreadsAttributionId(contentId) || !choice || !/^[ABC]$/.test(choice)) return NextResponse.redirect(fallback);

    const store = createUpstashJsonStore();
    if (!store) return NextResponse.redirect(fallback);
    const stored = await store.get<unknown>(AFFILIATE_POOL_KEY).catch(() => null);
    const target = Array.isArray(stored) ? resolveStoredAffiliateTarget(stored, productId) : null;
    if (!target) return NextResponse.redirect(fallback);

    await recordFunnelEvent(store, "threads_affiliate_clicked", contentId).catch((error) => {
      console.error("Unable to record direct Threads affiliate click", error);
    });
    return NextResponse.redirect(target);
  }

  const target = resolveAffiliateTarget();
  const fallback = new URL("/", request.url);

  if (!target) {
    return NextResponse.redirect(fallback);
  }

  return NextResponse.redirect(target);
}
