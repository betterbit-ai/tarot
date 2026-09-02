import { CURATED_AFFILIATE_PRODUCTS, type AffiliateProduct } from "@/lib/affiliate/products";
import { AFFILIATE_POOL_KEY, createUpstashJsonStore } from "@/lib/content/upstash-store";

export const runtime = "nodejs";

function isUsableProduct(value: unknown): value is AffiliateProduct {
  if (!value || typeof value !== "object") return false;
  const product = value as Partial<AffiliateProduct>;
  if (!product.id || !product.title || !product.imageSrc || !product.imageAlt || !product.ctaLabel || !product.disclosure || !product.active || !Array.isArray(product.categories)) return false;
  try {
    const image = new URL(product.imageSrc);
    const imageAllowed = image.protocol === "https:" && (image.hostname.endsWith(".coupangcdn.com") || image.hostname === "ads-partners.coupang.com");
    if (!imageAllowed) return false;
    if (product.partnerUrl) {
      const partner = new URL(product.partnerUrl);
      if (partner.protocol !== "https:" || (!partner.hostname.endsWith(".coupang.com") && partner.hostname !== "coupang.com")) return false;
    }
  } catch {
    return false;
  }
  return true;
}

export async function GET() {
  const store = createUpstashJsonStore();
  const stored = store ? await store.get<unknown>(AFFILIATE_POOL_KEY).catch(() => null) : null;
  const products = Array.isArray(stored) ? stored.filter(isUsableProduct) : [];
  return Response.json({ products: products.length ? products : CURATED_AFFILIATE_PRODUCTS });
}
