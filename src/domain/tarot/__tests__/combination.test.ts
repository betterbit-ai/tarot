import { describe, expect, it } from "vitest";

import {
  createCanonicalCombinationKey,
  enumerateCardTriples,
  enumerateCombinationKeys,
  parseCombinationKey,
} from "../combination";

describe("tarot combinations", () => {
  it("creates deterministic canonical keys across permutations", () => {
    expect(createCanonicalCombinationKey([77, 0, 7])).toBe("00-07-77");
    expect(createCanonicalCombinationKey([7, 77, 0])).toBe("00-07-77");
    expect(parseCombinationKey("00-07-77")).toEqual([0, 7, 77]);
  });

  it("enumerates all 76,076 unique three-card combinations with no internal repeats", () => {
    const triples = enumerateCardTriples();
    const keys = enumerateCombinationKeys();

    expect(triples).toHaveLength(76076);
    expect(keys).toHaveLength(76076);
    expect(new Set(keys).size).toBe(76076);
    expect(triples.every((triple) => new Set(triple).size === 3)).toBe(true);
    expect(triples[0]).toEqual([0, 1, 2]);
    expect(triples.at(-1)).toEqual([75, 76, 77]);
  });
});
