import { createHmac } from "node:crypto";
import type { AffiliateProduct, AffiliateTheme } from "./products";

export const COUPANG_AFFILIATE_BASE_URL = "https://api-gateway.coupang.com/v2/providers/affiliate_open_api/apis/openapi/v1";

export type CoupangApiConfig = {
  accessKey: string;
  secretKey: string;
  baseUrl?: string;
  fetcher?: typeof fetch;
  now?: Date;
};

export type CoupangRefreshStats = {
  themes: number;
  searched: number;
  arrayResponses: number;
  objectResponses: number;
  verified: number;
  missingNames: number;
  missingIds: number;
  invalidImages: number;
  invalidUrls: number;
  imageHosts: string[];
  productHosts: string[];
};

type CoupangProduct = {
  productId?: number | string;
  productName?: string;
  productImage?: string;
  productUrl?: string;
};

type CoupangSearchResponse = {
  rCode?: string | number;
  rMessage?: string;
  data?: CoupangProduct[] | { productData?: CoupangProduct[] };
};

type CoupangDeepLinkResponse = {
  rCode?: string | number;
  rMessage?: string;
  data?: Array<{ originalUrl?: string; shortenUrl?: string; landingUrl?: string }>;
};

export const COUPANG_THEME_KEYWORDS: Readonly<Record<AffiliateTheme, string>> = {
  relationship: "커플 선물",
  "self-care": "셀프케어",
  rest: "수면 안대",
  focus: "책상 정리",
  "new-start": "다이어리",
  organization: "수납 정리",
};

function signedDate(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now).reduce<Record<string, string>>((result, part) => {
    result[part.type] = part.value;
    return result;
  }, {});
  return `${parts.year}${parts.month}${parts.day}T${parts.hour}${parts.minute}${parts.second}Z`;
}

export function createCoupangAuthorization(
  method: string,
  path: string,
  query: string,
  accessKey: string,
  secretKey: string,
  now = new Date(),
): string {
  const datetime = signedDate(now);
  const message = `${datetime}${method.toUpperCase()}${path}${query}`;
  const signature = createHmac("sha256", secretKey).update(message).digest("hex");
  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}`;
}

function isSuccess(code: string | number | undefined): boolean {
  return code === undefined || code === "0" || code === 0 || code === "SUCCESS";
}

function validHttpsUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
}

function validProductImage(value: string | undefined): string | undefined {
  const url = validHttpsUrl(value);
  if (!url) return undefined;
  const hostname = new URL(url).hostname.toLowerCase();
  return hostname.endsWith(".coupangcdn.com") ? url : undefined;
}

function validProductUrl(value: string | undefined): string | undefined {
  const url = validHttpsUrl(value);
  if (!url) return undefined;
  const hostname = new URL(url).hostname.toLowerCase();
  return hostname === "coupang.com" || hostname.endsWith(".coupang.com") ? url : undefined;
}

async function requestJson<T>(config: CoupangApiConfig, method: "GET" | "POST", path: string, query: string, body?: unknown): Promise<T> {
  const fetcher = config.fetcher ?? fetch;
  const baseUrl = config.baseUrl ?? COUPANG_AFFILIATE_BASE_URL;
  const requestPath = new URL(`${baseUrl}${path}`).pathname;
  const response = await fetcher(`${baseUrl}${path}${query ? `?${query}` : ""}`, {
    method,
    headers: {
      authorization: createCoupangAuthorization(method, requestPath, query, config.accessKey, config.secretKey, config.now),
      "content-type": "application/json;charset=UTF-8",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const payload = await response.json() as T & { rMessage?: string };
  if (!response.ok) throw new Error(`Coupang API request failed: ${response.status}`);
  if (!isSuccess((payload as { rCode?: string | number }).rCode)) throw new Error(`Coupang API request failed: ${payload.rMessage ?? "provider error"}`);
  return payload;
}

export async function searchCoupangProducts(config: CoupangApiConfig, keyword: string, limit = 5): Promise<CoupangProduct[]> {
  const query = new URLSearchParams({ keyword, limit: String(Math.min(10, Math.max(1, limit))) }).toString();
  const payload = await requestJson<CoupangSearchResponse>(config, "GET", "/products/search", query);
  return Array.isArray(payload.data) ? payload.data : payload.data?.productData ?? [];
}

export async function createCoupangDeepLink(config: CoupangApiConfig, originalUrl: string, subId: string): Promise<string> {
  const payload = await requestJson<CoupangDeepLinkResponse>(config, "POST", "/deeplink", "", { coupangUrls: [originalUrl], subId });
  const link = payload.data?.[0]?.shortenUrl ?? payload.data?.[0]?.landingUrl;
  const valid = validHttpsUrl(link);
  if (!valid) throw new Error("Coupang API returned an invalid partner link");
  const hostname = new URL(valid).hostname.toLowerCase();
  if (!hostname.endsWith(".coupang.com") && hostname !== "coupang.com") throw new Error("Coupang API returned an invalid partner link");
  return valid;
}

export async function refreshCoupangPool(config: CoupangApiConfig, refreshedAt = new Date().toISOString()): Promise<AffiliateProduct[]> {
  return (await refreshCoupangPoolWithStats(config, refreshedAt)).products;
}

export async function refreshCoupangPoolWithStats(config: CoupangApiConfig, refreshedAt = new Date().toISOString()): Promise<{ products: AffiliateProduct[]; stats: CoupangRefreshStats }> {
  const themes = Object.entries(COUPANG_THEME_KEYWORDS) as Array<[AffiliateTheme, string]>;
  const stats: CoupangRefreshStats = { themes: themes.length, searched: 0, arrayResponses: 0, objectResponses: 0, verified: 0, missingNames: 0, missingIds: 0, invalidImages: 0, invalidUrls: 0, imageHosts: [], productHosts: [] };
  const products: Array<AffiliateProduct | null> = await Promise.all(themes.map(async ([theme, keyword]): Promise<AffiliateProduct | null> => {
    const candidates = await searchCoupangProducts(config, keyword, 5);
    stats.searched += candidates.length;
    if (candidates.length) stats.arrayResponses += 1;
    else stats.objectResponses += 1;
    for (const item of candidates) {
      if (!item.productName) stats.missingNames += 1;
      if (!item.productId) stats.missingIds += 1;
      try { if (item.productImage) stats.imageHosts.push(new URL(item.productImage).hostname); else stats.invalidImages += 1; } catch { stats.invalidImages += 1; }
      try { if (item.productUrl) stats.productHosts.push(new URL(item.productUrl).hostname); else stats.invalidUrls += 1; } catch { stats.invalidUrls += 1; }
    }
    stats.imageHosts = [...new Set(stats.imageHosts)].slice(0, 10);
    stats.productHosts = [...new Set(stats.productHosts)].slice(0, 10);
    const candidate = candidates.find((item) => item.productName && validProductImage(item.productImage) && validProductUrl(item.productUrl));
    if (!candidate || !candidate.productName || !candidate.productId) return null;
    const partnerUrl = await createCoupangDeepLink(config, candidate.productUrl as string, `mr-tarot-${theme}`);
    const imageSrc = validProductImage(candidate.productImage);
    if (!imageSrc) return null;
    stats.verified += 1;
    return {
      id: `coupang-${String(candidate.productId)}`,
      categories: [theme],
      title: candidate.productName,
      imageSrc,
      imageAlt: `${candidate.productName} 상품 이미지`,
      disclosure: "이 추천은 쿠팡 파트너스 활동의 일환으로, 구매 시 일정액의 수수료를 제공받습니다.",
      ctaLabel: "쿠팡에서 보기",
      weight: 1,
      active: true,
      partnerUrl,
      sourceProductId: String(candidate.productId),
      refreshedAt,
    } satisfies AffiliateProduct;
  }));
  return { products: products.filter((product): product is AffiliateProduct => Boolean(product)), stats };
}
