import { TAROT_SELECTION_SIZE, asCardTriple, assertCardId, type CardId, type CardTriple } from "./types";

export interface SelectionState {
  selectedIds: readonly CardId[];
  confirmedIds: CardTriple | null;
  maxSelections: number;
}

export type SelectionAction =
  | { type: "toggle"; cardId: CardId }
  | { type: "confirm" }
  | { type: "reset" };

export const initialSelectionState: SelectionState = {
  selectedIds: [],
  confirmedIds: null,
  maxSelections: TAROT_SELECTION_SIZE,
};

export function canConfirmSelection(selectedIds: readonly CardId[]): selectedIds is CardTriple {
  return selectedIds.length === TAROT_SELECTION_SIZE;
}

export function toggleSelectedCard(selectedIds: readonly CardId[], cardId: CardId): CardId[] {
  assertCardId(cardId);

  if (selectedIds.includes(cardId)) {
    return selectedIds.filter((selectedId) => selectedId !== cardId);
  }

  if (selectedIds.length >= TAROT_SELECTION_SIZE) {
    return [...selectedIds];
  }

  return [...selectedIds, cardId];
}

export function selectionReducer(state: SelectionState, action: SelectionAction): SelectionState {
  switch (action.type) {
    case "toggle": {
      const nextSelectedIds = toggleSelectedCard(state.selectedIds, action.cardId);

      return {
        ...state,
        selectedIds: nextSelectedIds,
        confirmedIds:
          state.confirmedIds && nextSelectedIds.length === TAROT_SELECTION_SIZE
            ? asCardTriple(nextSelectedIds)
            : null,
      };
    }

    case "confirm":
      if (!canConfirmSelection(state.selectedIds)) {
        return state;
      }

      return {
        ...state,
        confirmedIds: asCardTriple(state.selectedIds),
      };

    case "reset":
      return initialSelectionState;

    default:
      return state;
  }
}
