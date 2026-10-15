import { findStoredAffiliateProduct, isCoupangPartnerUrl } from "./products";

export type AffiliateChoice = "A" | "B" | "C";

export type PreparedAffiliateTarget = {
  contentId: string;
  choice: AffiliateChoice;
  productId: string;
  title: string;
  partnerUrl: string;
};

export type AffiliateTargetSnapshot = PreparedAffiliateTarget & {
  version: 1;
  savedAt: string;
};

export type AffiliateTargetStore = {
  get: <Value>(key: string) => Promise<Value | null>;
  set: (key: string, value: unknown) => Promise<void>;
};

export type LegacyAffiliateTarget = { productId: string; sourceProductId: string; title: string };

// These two links were published before durable target snapshots existed.
// Keep this recovery map narrow so /out/coupang cannot become an arbitrary
// product-id-to-affiliate-link proxy.
const LEGACY_AFFILIATE_TARGETS: Readonly<Record<string, LegacyAffiliateTarget>> = {
  "mr-tarot-0047:A": { productId: "coupang-9487213892", sourceProductId: "9487213892", title: "틸하우스 틈새 다용도 정리함" },
  "mr-tarot-0047:B": { productId: "coupang-9487213892", sourceProductId: "9487213892", title: "틸하우스 틈새 다용도 정리함" },
};

export function affiliateTargetKey(contentId: string, choice: AffiliateChoice): string {
  return `mr-tarot:affiliate-target:v1:${contentId}:${choice}`;
}

export function isAffiliateTargetSnapshot(value: unknown): value is AffiliateTargetSnapshot {
  if (!value || typeof value !== "object") return false;
  const target = value as Partial<AffiliateTargetSnapshot>;
  return target.version === 1
    && typeof target.contentId === "string"
    && /^[A-C]$/.test(target.choice ?? "")
    && typeof target.productId === "string"
    && typeof target.title === "string"
    && typeof target.savedAt === "string"
    && isCoupangPartnerUrl(target.partnerUrl);
}

export async function persistAffiliateTargets(store: Pick<AffiliateTargetStore, "set">, targets: readonly PreparedAffiliateTarget[], savedAt = new Date().toISOString()): Promise<void> {
  await Promise.all(targets.map(async (target) => {
    if (!isCoupangPartnerUrl(target.partnerUrl)) throw new Error(`Invalid partner URL for ${target.contentId}:${target.choice}`);
    await store.set(affiliateTargetKey(target.contentId, target.choice), { version: 1, ...target, savedAt } satisfies AffiliateTargetSnapshot);
  }));
}

export function legacyAffiliateTarget(contentId: string, choice: AffiliateChoice, productId: string): LegacyAffiliateTarget | null {
  const target = LEGACY_AFFILIATE_TARGETS[`${contentId}:${choice}`];
  return target?.productId === productId ? target : null;
}

export function coupangProductPageUrl(sourceProductId: string): string | null {
  return /^\d+$/.test(sourceProductId) ? `https://www.coupang.com/vp/products/${sourceProductId}` : null;
}

export async function resolveAffiliateDestination(options: {
  store: AffiliateTargetStore;
  products: readonly unknown[];
  contentId: string;
  choice: AffiliateChoice;
  productId: string;
  recoverLegacy?: (target: LegacyAffiliateTarget) => Promise<string>;
}): Promise<string | null> {
  const { store, products, contentId, choice, productId, recoverLegacy } = options;
  const stored = await store.get<unknown>(affiliateTargetKey(contentId, choice)).catch(() => null);
  if (isAffiliateTargetSnapshot(stored)
    && stored.contentId === contentId
    && stored.choice === choice
    && stored.productId === productId) return stored.partnerUrl;

  const current = findStoredAffiliateProduct(products, productId);
  if (current?.partnerUrl && isCoupangPartnerUrl(current.partnerUrl)) {
    await persistAffiliateTargets(store, [{ contentId, choice, productId, title: current.title, partnerUrl: current.partnerUrl }]);
    return current.partnerUrl;
  }

  const legacy = legacyAffiliateTarget(contentId, choice, productId);
  if (!legacy || !recoverLegacy) return null;
  const partnerUrl = await recoverLegacy(legacy);
  if (!isCoupangPartnerUrl(partnerUrl)) return null;
  await persistAffiliateTargets(store, [{ contentId, choice, productId, title: legacy.title, partnerUrl }]);
  return partnerUrl;
}
