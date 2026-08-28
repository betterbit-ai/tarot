export type RitualStage = "intro" | "preparing" | "selecting" | "revealing" | "pause" | "affiliate" | "result";

export type RitualState = {
  question: string;
  stage: RitualStage;
  deckOrder: number[];
  selectedIds: number[];
  revealedCount: number;
};

export type RitualAction =
  | { type: "questionChanged"; question: string }
  | { type: "started"; deckOrder: number[] }
  | { type: "prepared" }
  | { type: "cardToggled"; cardId: number }
  | { type: "confirmed" }
  | { type: "cardRevealed" }
  | { type: "revealsCompleted" }
  | { type: "pauseCompleted"; showAffiliate: boolean }
  | { type: "affiliateDismissed" }
  | { type: "restarted"; deckOrder: number[] };

export function createInitialRitualState(deckOrder: number[]): RitualState {
  return {
    question: "",
    stage: "intro",
    deckOrder,
    selectedIds: [],
    revealedCount: 0,
  };
}

export function ritualReducer(state: RitualState, action: RitualAction): RitualState {
  switch (action.type) {
    case "questionChanged":
      if (state.stage !== "intro") {
        return state;
      }
      return { ...state, question: action.question };
    case "started":
      if (state.stage !== "intro") {
        return state;
      }
      return {
        ...state,
        deckOrder: action.deckOrder,
        selectedIds: [],
        revealedCount: 0,
        stage: "preparing",
      };
    case "prepared":
      if (state.stage !== "preparing") {
        return state;
      }
      return {
        ...state,
        stage: "selecting",
      };
    case "cardToggled": {
      if (state.stage !== "selecting") {
        return state;
      }

      const alreadySelected = state.selectedIds.includes(action.cardId);
      if (alreadySelected) {
        return {
          ...state,
          selectedIds: state.selectedIds.filter((cardId) => cardId !== action.cardId),
        };
      }

      if (state.selectedIds.length >= 3) {
        return state;
      }

      return {
        ...state,
        selectedIds: [...state.selectedIds, action.cardId],
      };
    }
    case "confirmed":
      if (state.stage !== "selecting" || state.selectedIds.length !== 3) {
        return state;
      }
      return {
        ...state,
        stage: "revealing",
        revealedCount: 0,
      };
    case "cardRevealed":
      if (state.stage !== "revealing" || state.revealedCount >= state.selectedIds.length) {
        return state;
      }
      return {
        ...state,
        revealedCount: state.revealedCount + 1,
      };
    case "revealsCompleted":
      if (state.stage !== "revealing" || state.revealedCount !== state.selectedIds.length) {
        return state;
      }
      return {
        ...state,
        stage: "pause",
      };
    case "pauseCompleted":
      if (state.stage !== "pause") {
        return state;
      }
      return {
        ...state,
        stage: action.showAffiliate ? "affiliate" : "result",
      };
    case "affiliateDismissed":
      if (state.stage !== "affiliate") {
        return state;
      }
      return {
        ...state,
        stage: "result",
      };
    case "restarted":
      return createInitialRitualState(action.deckOrder);
    default:
      return state;
  }
}
