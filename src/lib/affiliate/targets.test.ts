import { describe, expect, it, vi } from "vitest";
import type { AffiliateProduct } from "./products";
import { affiliateTargetKey, coupangProductPageUrl, persistAffiliateTargets, resolveAffiliateDestination, type AffiliateTargetStore } from "./targets";

function memoryTargetStore(): AffiliateTargetStore & { values: Map<string, unknown> } {
  const values = new Map<string, unknown>();
  return {
    values,
    get: async <Value>(key: string) => values.get(key) as Value | null ?? null,
    set: async (key: string, value: unknown) => { values.set(key, value); },
  };
}

const product: AffiliateProduct = {
  id: "coupang-current",
  categories: ["organization"],
  title: "정리함",
  imageSrc: "https://image1.coupangcdn.com/image/example.jpg",
  imageAlt: "정리함",
  disclosure: "파트너스 고지",
  ctaLabel: "쿠팡에서 보기",
  weight: 1,
  active: true,
  partnerUrl: "https://link.coupang.com/a/current",
};

describe("durable affiliate targets", () => {
  it("resolves a saved target after the rotating product pool changes", async () => {
    const store = memoryTargetStore();
    await persistAffiliateTargets(store, [{ contentId: "mr-tarot-0048", choice: "A", productId: product.id, title: product.title, partnerUrl: product.partnerUrl! }], "2026-10-15T00:00:00.000Z");

    await expect(resolveAffiliateDestination({ store, products: [], contentId: "mr-tarot-0048", choice: "A", productId: product.id })).resolves.toBe(product.partnerUrl);
  });

  it("snapshots a verified product from the current pool", async () => {
    const store = memoryTargetStore();

    await expect(resolveAffiliateDestination({ store, products: [product], contentId: "mr-tarot-0048", choice: "B", productId: product.id })).resolves.toBe(product.partnerUrl);
    expect(store.values.has(affiliateTargetKey("mr-tarot-0048", "B"))).toBe(true);
  });

  it("does not trust a snapshot stored under the wrong content binding", async () => {
    const store = memoryTargetStore();
    await persistAffiliateTargets(store, [{ contentId: "mr-tarot-0049", choice: "A", productId: product.id, title: product.title, partnerUrl: product.partnerUrl! }]);
    store.values.set(affiliateTargetKey("mr-tarot-0048", "A"), store.values.get(affiliateTargetKey("mr-tarot-0049", "A")));

    await expect(resolveAffiliateDestination({ store, products: [], contentId: "mr-tarot-0048", choice: "A", productId: product.id })).resolves.toBeNull();
  });

  it("recovers only the known legacy published target and saves it", async () => {
    const store = memoryTargetStore();
    const recoverLegacy = vi.fn(async () => "https://link.coupang.com/a/recovered");

    await expect(resolveAffiliateDestination({ store, products: [], contentId: "mr-tarot-0047", choice: "A", productId: "coupang-9487213892", recoverLegacy })).resolves.toBe("https://link.coupang.com/a/recovered");
    expect(recoverLegacy).toHaveBeenCalledOnce();
    expect(store.values.has(affiliateTargetKey("mr-tarot-0047", "A"))).toBe(true);
  });

  it("does not turn an arbitrary product id into a partner-link proxy", async () => {
    const store = memoryTargetStore();
    const recoverLegacy = vi.fn(async () => "https://link.coupang.com/a/unsafe");

    await expect(resolveAffiliateDestination({ store, products: [], contentId: "mr-tarot-0048", choice: "A", productId: "coupang-123", recoverLegacy })).resolves.toBeNull();
    expect(recoverLegacy).not.toHaveBeenCalled();
  });

  it("constructs only numeric Coupang product pages", () => {
    expect(coupangProductPageUrl("9487213892")).toBe("https://www.coupang.com/vp/products/9487213892");
    expect(coupangProductPageUrl("9487/path")).toBeNull();
  });
});
