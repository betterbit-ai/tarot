import { refreshCoupangPoolWithStats } from "@/lib/affiliate/coupang-api";
import { schedulerRequestIsAuthorized } from "@/lib/content/scheduler-auth";
import { AFFILIATE_POOL_KEY, createUpstashJsonStore } from "@/lib/content/upstash-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!schedulerRequestIsAuthorized(request)) return new Response("Unauthorized", { status: 401 });
  if (process.env.COUPANG_PARTNERS_API_ENABLED?.trim().toLowerCase() !== "true") {
    return Response.json({ mode: "disabled", reason: "COUPANG_PARTNERS_API_ENABLED is not true" });
  }

  const accessKey = process.env.COUPANG_PARTNERS_ACCESS_KEY?.trim();
  const secretKey = process.env.COUPANG_PARTNERS_SECRET_KEY?.trim();
  const store = createUpstashJsonStore();
  if (!accessKey || !secretKey || !store) return new Response("Coupang refresh is not configured", { status: 503 });

  try {
    const result = await refreshCoupangPoolWithStats({ accessKey, secretKey });
    if (!result.products.length) return Response.json({ mode: "failed", error: "Coupang returned no verified products", stats: result.stats }, { status: 502 });
    await store.set(AFFILIATE_POOL_KEY, result.products);
    return Response.json({ mode: "refreshed", count: result.products.length, stats: result.stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Coupang refresh failed";
    return Response.json({ mode: "failed", error: message }, { status: 502 });
  }
}
