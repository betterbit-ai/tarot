import { afterEach, describe, expect, it } from "vitest";
import { getAffiliateConfig, resolveAffiliateTarget } from "@/lib/affiliate/config";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("affiliate config", () => {
  it("stays disabled when the flag is off even with a URL", () => {
    process.env.AFFILIATE_ENABLED = "false";
    process.env.COUPANG_PARTNERS_URL = "https://link.coupang.com/example";

    expect(getAffiliateConfig()).toEqual({ enabled: false, outHref: null });
    expect(resolveAffiliateTarget()).toBeNull();
  });

  it("shows a skippable sheet without exposing a broken target when URL is missing", () => {
    process.env.AFFILIATE_ENABLED = "true";
    delete process.env.COUPANG_PARTNERS_URL;

    expect(getAffiliateConfig()).toEqual({ enabled: true, outHref: null });
    expect(resolveAffiliateTarget()).toBeNull();
  });

  it("uses the internal redirect and validates the configured destination", () => {
    process.env.AFFILIATE_ENABLED = "true";
    process.env.COUPANG_PARTNERS_URL = "https://link.coupang.com/example";

    expect(getAffiliateConfig()).toEqual({ enabled: true, outHref: "/out/coupang" });
    expect(resolveAffiliateTarget()).toBe("https://link.coupang.com/example");
  });

  it("rejects non-HTTPS and non-Coupang redirect targets", () => {
    process.env.AFFILIATE_ENABLED = "true";
    process.env.COUPANG_PARTNERS_URL = "https://example.com/phishing";
    expect(resolveAffiliateTarget()).toBeNull();

    process.env.COUPANG_PARTNERS_URL = "http://link.coupang.com/insecure";
    expect(resolveAffiliateTarget()).toBeNull();
  });
});
