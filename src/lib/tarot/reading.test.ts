import { describe, expect, it } from "vitest";
import { createQuestionAwareRitualReading, createRitualReading } from "@/lib/tarot/reading";

describe("runtime reading adapter", () => {
  it("uses interpretation v2 for a no-question reading", () => {
    const reading = createRitualReading([2, 0, 1]);

    expect(reading.canonicalKey).toBe("00-01-02");
    expect(reading.cards.map((card) => card.id)).toEqual([2, 0, 1]);
    expect(reading.story).toContain("질문 없이 고른 세 장");
    expect(reading.advice).toContain("가운데 놓인");
  });

  it("threads the actual question into a direct, concrete reading", () => {
    const reading = createQuestionAwareRitualReading([29, 67, 5], "지금 이직하는 게 맞을까요?");

    expect(reading.story).toContain("지금 이직하는 게 맞을까요?");
    expect(reading.story).toMatch(/당장 회사를|움직일 여지|해보는 쪽/);
    expect(reading.advice).toContain("펜타클 4");
    expect(reading.closing).toContain("새 자리");
  });
});
