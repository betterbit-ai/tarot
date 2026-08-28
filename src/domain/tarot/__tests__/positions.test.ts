import { describe, expect, it } from "vitest";

import { mapCardsToPositions } from "../positions";

describe("tarot positions", () => {
  it("maps the chosen order onto the three ritual positions", () => {
    const positionedCards = mapCardsToPositions([10, 20, 30]);

    expect(positionedCards.map(({ card }) => card.id)).toEqual([10, 20, 30]);
    expect(positionedCards.map(({ position }) => position.label)).toEqual([
      "지금까지 이어져온 흐름",
      "지금 마주한 핵심",
      "앞으로 열릴 방향",
    ]);
  });
});
