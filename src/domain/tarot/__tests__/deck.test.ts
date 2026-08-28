import { describe, expect, it } from "vitest";

import { createOrderedCardIds, cryptoRandomIndex, shuffleCardIds } from "../deck";
import { createDeterministicRandomIndex } from "./fixtures";

describe("tarot deck", () => {
  it("creates the ordered full deck", () => {
    expect(createOrderedCardIds()).toEqual(Array.from({ length: 78 }, (_, index) => index));
  });

  it("shuffles into a full permutation with an injectable rng", () => {
    const shuffled = shuffleCardIds(createOrderedCardIds(), createDeterministicRandomIndex(42));

    expect(shuffled).toHaveLength(78);
    expect(new Set(shuffled).size).toBe(78);
    expect([...shuffled].sort((left, right) => left - right)).toEqual(createOrderedCardIds());
    expect(shuffled).not.toEqual(createOrderedCardIds());
  });

  it("rejects invalid rng outputs and invalid crypto bounds", () => {
    expect(() => shuffleCardIds(createOrderedCardIds(), () => 999)).toThrow(/out of range/i);
    expect(() => cryptoRandomIndex(0)).toThrow(/positive integer/i);
  });
});
