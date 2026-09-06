import { describe, expect, it } from "vitest";
import { kstCalendarDate, publishedContentForKstDate } from "./daily-publish";

describe("daily Threads publish guard", () => {
  it("uses the Seoul calendar day instead of UTC", () => {
    expect(kstCalendarDate(new Date("2026-09-05T15:30:00.000Z"))).toBe("2026-09-06");
  });

  it("recognizes a successful runtime publish as the day's guard", () => {
    const runtime = {
      version: 1 as const,
      items: {
        yesterday: { status: "PUBLISHED" as const, updatedAt: "2026-09-05T14:00:00.000Z", publishedAt: "2026-09-05T14:00:00.000Z", attemptCount: 1 },
        today: { status: "PUBLISHED" as const, updatedAt: "2026-09-05T15:30:00.000Z", publishedAt: "2026-09-05T15:30:00.000Z", attemptCount: 1 },
      },
    };
    expect(publishedContentForKstDate(runtime, "2026-09-06")).toBe("today");
  });
});
