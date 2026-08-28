import { describe, expect, it } from "vitest";

import { lookupReading } from "../reading";
import { AUTHORED_READING_FIXTURE } from "./fixtures";

describe("tarot reading lookup", () => {
  it("uses authored readings by canonical combination while preserving chosen order", () => {
    const result = lookupReading([3, 1, 2], { overrides: [AUTHORED_READING_FIXTURE] });

    expect(result.source).toBe("authored");
    expect(result.combination).toBe("01-02-03");
    expect(result.orderedCards).toEqual([3, 1, 2]);
    expect(result.canonicalCards).toEqual([1, 2, 3]);
    expect(result.cards.map(({ card }) => card.id)).toEqual([3, 1, 2]);
    expect(result.reading).toEqual(AUTHORED_READING_FIXTURE.reading);
    expect(result.version).toBe(7);
  });

  it("produces a connected deterministic fallback for any valid triple", () => {
    const result = lookupReading([0, 22, 77]);

    expect(result.source).toBe("fallback");
    expect(result.combination).toBe("00-22-77");
    expect(result.reading.headline.length).toBeGreaterThan(10);
    expect(result.reading.story).toContain("지금까지는");
    expect(result.reading.story).toContain("중심에 놓인");
    expect(result.reading.story).toContain("마지막");
    expect(result.reading.story).toContain("완드 에이스");
    expect(result.reading.story).toContain("펜타클 킹");
    expect(result.reading.advice.length).toBeGreaterThan(20);
    expect(result.reading.closing.length).toBeGreaterThan(10);
  });

  it("rejects repeated or invalid card triples", () => {
    expect(() => lookupReading([1, 1, 2])).toThrow(/duplicate/i);
    expect(() => lookupReading([1, 2, 99])).toThrow(/invalid card id/i);
  });
});
