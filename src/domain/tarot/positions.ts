import { getTarotCard } from "./cards";
import { asCardTriple, type TarotCard } from "./types";

export type TarotPositionKey = "past-flow" | "present-core" | "future-direction";

export interface TarotPosition {
  key: TarotPositionKey;
  label: string;
}

export interface PositionedTarotCard {
  order: 1 | 2 | 3;
  position: TarotPosition;
  card: TarotCard;
}

export const TAROT_POSITIONS: readonly [TarotPosition, TarotPosition, TarotPosition] = [
  { key: "past-flow", label: "지금까지 이어져온 흐름" },
  { key: "present-core", label: "지금 마주한 핵심" },
  { key: "future-direction", label: "앞으로 열릴 방향" },
];

export function mapCardsToPositions(cardIds: readonly number[]): PositionedTarotCard[] {
  const [first, second, third] = asCardTriple(cardIds);

  return [first, second, third].map((cardId, index) => ({
    order: (index + 1) as 1 | 2 | 3,
    position: TAROT_POSITIONS[index],
    card: getTarotCard(cardId),
  }));
}
