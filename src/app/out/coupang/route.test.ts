import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { affiliateTargetKey } from "@/lib/affiliate/targets";

const { recordFunnelEvent, createCoupangDeepLink, values, store } = vi.hoisted(() => {
  const hoistedValues = new Map<string, unknown>();
  return {
    recordFunnelEvent: vi.fn(async () => undefined),
    createCoupangDeepLink: vi.fn(async () => "https://link.coupang.com/a/recovered"),
    values: hoistedValues,
    store: {
      get: vi.fn(async <Value>(key: string) => hoistedValues.get(key) as Value | null ?? null),
      set: vi.fn(async (key: string, value: unknown) => { hoistedValues.set(key, value); }),
    },
  };
});

vi.mock("@/lib/affiliate/config", () => ({ resolveAffiliateTarget: vi.fn(() => null) }));
vi.mock("@/lib/affiliate/coupang-api", () => ({ createCoupangDeepLink }));
vi.mock("@/lib/analytics/funnel", () => ({
  isThreadsAttributionId: (value: string) => /^mr-tarot-\d{4}$/.test(value),
  recordFunnelEvent,
}));
vi.mock("@/lib/content/upstash-store", () => ({
  AFFILIATE_POOL_KEY: "affiliate-pool",
  createUpstashJsonStore: vi.fn(() => store),
}));

import { GET, HEAD } from "./route";

function request(method: "GET" | "HEAD", product = "coupang-9487213892") {
  return new NextRequest(`https://mr-tarot.vercel.app/out/coupang?product=${product}&content=mr-tarot-0047&choice=A`, { method });
}

describe("Coupang outbound redirect", () => {
  beforeEach(() => {
    values.clear();
    vi.clearAllMocks();
    process.env.COUPANG_PARTNERS_ACCESS_KEY = "access";
    process.env.COUPANG_PARTNERS_SECRET_KEY = "secret";
  });

  it("recovers a known legacy target on HEAD without counting a click", async () => {
    const response = await HEAD(request("HEAD"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://link.coupang.com/a/recovered");
    expect(response.headers.get("cache-control")).toBe("private, no-store, max-age=0");
    expect(createCoupangDeepLink).toHaveBeenCalledOnce();
    expect(recordFunnelEvent).not.toHaveBeenCalled();
    expect(values.has(affiliateTargetKey("mr-tarot-0047", "A"))).toBe(true);
  });

  it("counts a successful GET after reusing the saved target", async () => {
    await HEAD(request("HEAD"));
    createCoupangDeepLink.mockClear();

    const response = await GET(request("GET"));

    expect(response.headers.get("location")).toBe("https://link.coupang.com/a/recovered");
    expect(createCoupangDeepLink).not.toHaveBeenCalled();
    expect(recordFunnelEvent).toHaveBeenCalledWith(store, "threads_affiliate_clicked", "mr-tarot-0047");
  });

  it("fails closed without counting or overwriting a tampered binding", async () => {
    await HEAD(request("HEAD"));
    const saved = values.get(affiliateTargetKey("mr-tarot-0047", "A"));
    recordFunnelEvent.mockClear();

    const response = await GET(request("GET", "coupang-6661849504"));

    expect(response.headers.get("location")).toBe("https://mr-tarot.vercel.app/");
    expect(values.get(affiliateTargetKey("mr-tarot-0047", "A"))).toEqual(saved);
    expect(recordFunnelEvent).not.toHaveBeenCalled();
  });
});
