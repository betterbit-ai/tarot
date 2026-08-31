import { describe, expect, it } from "vitest";
import { getThreadsPublisherConfig, withStoredThreadsToken } from "./config";

describe("getThreadsPublisherConfig", () => {
  it("does not retain the historical Netlify origin when no public origin is configured", () => {
    expect(getThreadsPublisherConfig({}).siteUrl).toBeUndefined();
  });

  it("uses only a valid HTTPS public origin for Threads image and CTA URLs", () => {
    expect(getThreadsPublisherConfig({ NEXT_PUBLIC_SITE_URL: "https://tarot.example.com/path" }).siteUrl).toBe("https://tarot.example.com");
    expect(getThreadsPublisherConfig({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000" }).siteUrl).toBeUndefined();
  });
});

describe("withStoredThreadsToken", () => {
  it("uses a successfully refreshed token for every Threads operation", () => {
    expect(withStoredThreadsToken({ accessToken: "environment-token", dryRun: false }, {
      accessToken: "refreshed-token",
      refreshedAt: "2026-09-01T00:00:00.000Z",
      expiresAt: null,
    }).accessToken).toBe("refreshed-token");
  });
});
