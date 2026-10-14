import { CURATED_AFFILIATE_PRODUCTS, isStoredAffiliateProduct } from "@/lib/affiliate/products";
import { AFFILIATE_POOL_KEY, createUpstashJsonStore } from "@/lib/content/upstash-store";

export const runtime = "nodejs";

export async function GET() {
  const store = createUpstashJsonStore();
  const stored = store ? await store.get<unknown>(AFFILIATE_POOL_KEY).catch(() => null) : null;
  const products = Array.isArray(stored) ? stored.filter(isStoredAffiliateProduct) : [];
  return Response.json({ products: products.length ? products : CURATED_AFFILIATE_PRODUCTS });
}
