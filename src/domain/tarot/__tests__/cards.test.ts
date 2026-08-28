import { describe, expect, it } from "vitest";

import { TAROT_CARD_IDS, TAROT_CARDS, getTarotCard } from "../cards";

describe("tarot cards", () => {
  it("contains exactly 78 unique cards in stable id order", () => {
    expect(TAROT_CARDS).toHaveLength(78);
    expect(new Set(TAROT_CARD_IDS).size).toBe(78);
    expect(TAROT_CARD_IDS[0]).toBe(0);
    expect(TAROT_CARD_IDS.at(-1)).toBe(77);
    expect(getTarotCard(0).name).toBe("바보");
    expect(getTarotCard(77).name).toBe("펜타클 킹");
  });

  it("keeps the expected arcana and suit distribution", () => {
    const majors = TAROT_CARDS.filter((card) => card.arcana === "major");
    const minors = TAROT_CARDS.filter((card) => card.arcana === "minor");

    expect(majors).toHaveLength(22);
    expect(minors).toHaveLength(56);
    expect(minors.filter((card) => card.suit === "wands")).toHaveLength(14);
    expect(minors.filter((card) => card.suit === "cups")).toHaveLength(14);
    expect(minors.filter((card) => card.suit === "swords")).toHaveLength(14);
    expect(minors.filter((card) => card.suit === "pentacles")).toHaveLength(14);
  });
});
