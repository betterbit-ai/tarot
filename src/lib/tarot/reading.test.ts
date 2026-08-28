import { describe, expect, it } from "vitest";
import { createRitualReading } from "@/lib/tarot/reading";

describe("runtime reading adapter", () => {
  it("uses authored sample overrides through the domain lookup seam", () => {
    const reading = createRitualReading([2, 0, 1]);

    expect(reading.source).toBe("authored");
    expect(reading.canonicalKey).toBe("00-01-02");
    expect(reading.cards.map((card) => card.id)).toEqual([2, 0, 1]);
    expect(reading.headline).toBe("가볍게 연 문이 곧 기준이 됩니다.");
  });

  it("uses one connected deterministic fallback for non-sample combinations", () => {
    const reading = createRitualReading([3, 20, 71]);

    expect(reading.source).toBe("fallback");
    expect(reading.story).toContain("지금까지는");
    expect(reading.story).toContain("중심에 놓인");
    expect(reading.story).toContain("마지막");
  });
});
