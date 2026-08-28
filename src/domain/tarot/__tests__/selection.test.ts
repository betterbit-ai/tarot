import { describe, expect, it } from "vitest";

import { canConfirmSelection, initialSelectionState, selectionReducer, toggleSelectedCard } from "../selection";

describe("tarot selection reducer", () => {
  it("selects, deselects, and caps the spread at three cards", () => {
    expect(toggleSelectedCard([], 5)).toEqual([5]);
    expect(toggleSelectedCard([5], 5)).toEqual([]);
    expect(toggleSelectedCard([1, 2, 3], 4)).toEqual([1, 2, 3]);
  });

  it("only confirms once three unique cards are selected", () => {
    const pickedState = [1, 2, 3].reduce(
      (state, cardId) => selectionReducer(state, { type: "toggle", cardId }),
      initialSelectionState,
    );

    expect(canConfirmSelection([1, 2])).toBe(false);
    expect(canConfirmSelection(pickedState.selectedIds)).toBe(true);

    const confirmedState = selectionReducer(pickedState, { type: "confirm" });
    expect(confirmedState.confirmedIds).toEqual([1, 2, 3]);

    const resetState = selectionReducer(confirmedState, { type: "reset" });
    expect(resetState).toEqual(initialSelectionState);
  });
});
