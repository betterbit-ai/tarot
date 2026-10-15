import { type NextRequest, NextResponse } from "next/server";
import { resolveAffiliateTarget } from "@/lib/affiliate/config";
import { createCoupangDeepLink } from "@/lib/affiliate/coupang-api";
import { findStoredAffiliateProduct } from "@/lib/affiliate/products";
import { coupangProductPageUrl, resolveAffiliateDestination, type AffiliateChoice } from "@/lib/affiliate/targets";
import { isThreadsAttributionId, recordFunnelEvent } from "@/lib/analytics/funnel";
import { AFFILIATE_POOL_KEY, createUpstashJsonStore } from "@/lib/content/upstash-store";

export const runtime = "nodejs";

function redirect(destination: string | URL): NextResponse {
  const response = NextResponse.redirect(destination instanceof URL ? destination : new URL(destination));
  response.headers.set("cache-control", "private, no-store, max-age=0");
  return response;
}

async function handle(request: NextRequest, recordClick: boolean): Promise<NextResponse> {
  const productId = request.nextUrl.searchParams.get("product")?.trim();
  if (productId) {
    const contentId = request.nextUrl.searchParams.get("content")?.trim();
    const choice = request.nextUrl.searchParams.get("choice")?.trim();
    const fallback = new URL("/", request.url);
    if (!contentId || !isThreadsAttributionId(contentId) || !choice || !/^[ABC]$/.test(choice)) return redirect(fallback);

    const store = createUpstashJsonStore();
    if (!store) return redirect(fallback);
    const stored = await store.get<unknown>(AFFILIATE_POOL_KEY).catch(() => null);
    const target = await resolveAffiliateDestination({
      store,
      contentId,
      choice: choice as AffiliateChoice,
      productId,
      recoverLegacy: async (legacy) => {
        const current = Array.isArray(stored) ? findStoredAffiliateProduct(stored, legacy.productId) : null;
        if (current?.partnerUrl) return current.partnerUrl;
        const accessKey = process.env.COUPANG_PARTNERS_ACCESS_KEY?.trim();
        const secretKey = process.env.COUPANG_PARTNERS_SECRET_KEY?.trim();
        const sourceUrl = coupangProductPageUrl(legacy.sourceProductId);
        if (!accessKey || !secretKey || !sourceUrl) throw new Error("Coupang legacy recovery is not configured");
        return createCoupangDeepLink({ accessKey, secretKey }, sourceUrl, `mr-tarot-${contentId}-${choice}`);
      },
    }).catch((error) => {
      console.error("Unable to resolve direct Threads affiliate target", error);
      return null;
    });
    if (!target) return redirect(fallback);

    if (recordClick) {
      await recordFunnelEvent(store, "threads_affiliate_clicked", contentId).catch((error) => {
        console.error("Unable to record direct Threads affiliate click", error);
      });
    }
    return redirect(target);
  }

  const target = resolveAffiliateTarget();
  const fallback = new URL("/", request.url);

  if (!target) {
    return redirect(fallback);
  }

  return redirect(target);
}

export async function GET(request: NextRequest) {
  return handle(request, true);
}

// HEAD supports deployment and durability checks without recording a visitor click.
export async function HEAD(request: NextRequest) {
  return handle(request, false);
}
