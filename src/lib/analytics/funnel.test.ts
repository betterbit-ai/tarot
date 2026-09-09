import { describe, expect, it } from "vitest";
import { combineDailyGrowthReports, isFunnelEvent, isSameOriginAnalyticsRequest, isThreadsAttributionId, readRecentFunnelReports, recordFunnelEvent } from "./funnel";

function memoryStore() {
  const hashes = new Map<string, Record<string, number>>();
  return {
    incrementHash: async (key: string, field: string, amount: number) => {
      const hash = hashes.get(key) ?? {};
      hash[field] = (hash[field] ?? 0) + amount;
      hashes.set(key, hash);
      return hash[field];
    },
    readHash: async (key: string) => hashes.get(key) ?? {},
    hashes,
  };
}

describe("anonymous funnel counters", () => {
  it("accepts only known events and prepared content ids", () => {
    expect(isFunnelEvent("result_viewed")).toBe(true);
    expect(isFunnelEvent("question_text")).toBe(false);
    expect(isThreadsAttributionId("mr-tarot-0009")).toBe(true);
    expect(isThreadsAttributionId("link_in_bio")).toBe(true);
    expect(isThreadsAttributionId("../../token")).toBe(false);
  });

  it("accepts only same-origin browser requests", () => {
    const request = (origin: string | null) => ({
      url: "https://mr-tarot.vercel.app/api/analytics/event",
      headers: { get: (name: string) => name === "origin" ? origin : null },
    }) as unknown as Request;
    expect(isSameOriginAnalyticsRequest(request("https://mr-tarot.vercel.app"))).toBe(true);
    expect(isSameOriginAnalyticsRequest(request("https://example.com"))).toBe(false);
    expect(isSameOriginAnalyticsRequest(request(null))).toBe(false);
  });

  it("records only daily aggregate and content counters", async () => {
    const store = memoryStore();
    await recordFunnelEvent(store, "landing_view", "mr-tarot-0009", new Date("2026-09-08T15:30:00.000Z"));

    expect(store.hashes.get("mr-tarot:funnel:v1:day:2026-09-09")).toEqual({ landing_view: 1 });
    expect(store.hashes.get("mr-tarot:funnel:v1:content:2026-09-09:mr-tarot-0009")).toEqual({ landing_view: 1 });
  });

  it("returns seven KST days with zero-filled stages", async () => {
    const store = memoryStore();
    await recordFunnelEvent(store, "result_viewed", "mr-tarot-0009", new Date("2026-09-08T15:30:00.000Z"));
    const reports = await readRecentFunnelReports(store, 2, new Date("2026-09-09T03:00:00.000Z"));

    expect(reports.map((report) => report.date)).toEqual(["2026-09-09", "2026-09-08"]);
    expect(reports[0]?.counts).toMatchObject({ landing_view: 0, result_viewed: 1, affiliate_clicked: 0 });
  });

  it("joins each KST day with provider-returned post metrics", () => {
    const reports = [{ date: "2026-09-09", counts: { landing_view: 1, ritual_started: 0, cards_confirmed: 0, result_viewed: 0, affiliate_viewed: 0, affiliate_skipped: 0, affiliate_clicked: 0, result_shared: 0 } }];
    const runtime = { version: 1 as const, items: {
      "mr-tarot-0009": { status: "PUBLISHED" as const, updatedAt: "2026-09-08T15:30:00.000Z", publishedAt: "2026-09-08T15:30:00.000Z", attemptCount: 1, metrics: { views: 12, likes: 2 } },
    } };

    expect(combineDailyGrowthReports(reports, runtime)[0]).toMatchObject({ contentIds: ["mr-tarot-0009"], threads: { views: 12, likes: 2 } });
  });
});
