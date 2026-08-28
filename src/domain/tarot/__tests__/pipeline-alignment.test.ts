import { describe, expect, it } from "vitest";
import { listTarotCards } from "../../../../scripts/tarot/shared";
import { TAROT_CARDS } from "../cards";

describe("offline pipeline alignment", () => {
  it("keeps the generated-data catalog aligned with the runtime domain catalog", () => {
    const pipelineCards = listTarotCards();

    expect(pipelineCards).toHaveLength(TAROT_CARDS.length);
    expect(
      pipelineCards.map(({ id, name, arcana, suit }) => ({ id, name, arcana, suit })),
    ).toEqual(
      TAROT_CARDS.map(({ id, name, arcana, suit }) => ({ id, name, arcana, suit })),
    );
  });
});
