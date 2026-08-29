import { describe, expect, it } from "vitest";
import { createQuestionAwareRitualReading, createRitualReading } from "@/lib/tarot/reading";

describe("runtime reading adapter", () => {
  it("uses interpretation v2 for a no-question reading", () => {
    const reading = createRitualReading([2, 0, 1]);

    expect(reading.canonicalKey).toBe("00-01-02");
    expect(reading.cards.map((card) => card.id)).toEqual([2, 0, 1]);
    expect(reading.story).toContain("질문 없이 고른 세 장");
    expect(reading.advice.length).toBeGreaterThan(40);
  });

  it("threads the actual question into a direct, concrete reading", () => {
    const reading = createQuestionAwareRitualReading([29, 67, 5], "지금 이직하는 게 맞을까요?");

    expect(reading.story).toContain("지금 이직하는 게 맞을까요?");
    expect(reading.headline).toMatch(/결정하기보다|움직여도|할 수는/);
    expect(`${reading.story} ${reading.advice}`).toContain("펜타클 4");
    expect(reading.closing).toContain("그만둘 이유");
  });
});
