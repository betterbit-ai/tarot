export const TOTAL_TAROT_CARDS = 78 as const;
export const TAROT_SELECTION_SIZE = 3 as const;
export const COMBINATION_KEY_SEGMENT_WIDTH = 2 as const;
export const SHARE_TOKEN_VERSION = "v1" as const;

export type Arcana = "major" | "minor";
export type Suit = "wands" | "cups" | "swords" | "pentacles";
export type MinorRank =
  | "ace"
  | "two"
  | "three"
  | "four"
  | "five"
  | "six"
  | "seven"
  | "eight"
  | "nine"
  | "ten"
  | "page"
  | "knight"
  | "queen"
  | "king";
export type MajorRank = `major-${number}`;
export type Rank = MajorRank | MinorRank;
export type CardId = number;
export type CardTriple = readonly [CardId, CardId, CardId];
export type CombinationKey = string;

export interface TarotMeaning {
  light: string;
  shadow: string;
}

export interface TarotCard {
  id: CardId;
  key: string;
  name: string;
  arcana: Arcana;
  suit: Suit | null;
  rank: Rank;
  meaning: TarotMeaning;
}

export interface ReadingText {
  headline: string;
  story: string;
  advice: string;
  closing: string;
}

export interface ReadingGenerationMeta {
  provider: string;
  model: string;
  promptVersion: string;
  batch: number;
  generatedAt: string;
}

export interface ReadingRecord {
  combination: CombinationKey;
  cards: CardTriple;
  reading: ReadingText;
  version: number;
  generation?: ReadingGenerationMeta;
}

export function isCardId(value: number): value is CardId {
  return Number.isInteger(value) && value >= 0 && value < TOTAL_TAROT_CARDS;
}

export function assertCardId(value: number, context = "card id"): asserts value is CardId {
  if (!isCardId(value)) {
    throw new RangeError(`Invalid ${context}: ${value}`);
  }
}

export function assertUniqueCardIds(cardIds: readonly number[], expectedSize?: number): void {
  if (expectedSize !== undefined && cardIds.length !== expectedSize) {
    throw new RangeError(`Expected ${expectedSize} cards, received ${cardIds.length}`);
  }

  const seen = new Set<number>();

  for (const cardId of cardIds) {
    assertCardId(cardId);

    if (seen.has(cardId)) {
      throw new RangeError(`Duplicate card id: ${cardId}`);
    }

    seen.add(cardId);
  }
}

export function assertCardTriple(cardIds: readonly number[]): asserts cardIds is CardTriple {
  assertUniqueCardIds(cardIds, TAROT_SELECTION_SIZE);
}

export function asCardTriple(cardIds: readonly number[]): CardTriple {
  assertCardTriple(cardIds);
  return [cardIds[0], cardIds[1], cardIds[2]];
}
