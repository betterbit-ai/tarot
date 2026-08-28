import { TAROT_CARD_IDS } from "./cards";
import {
  COMBINATION_KEY_SEGMENT_WIDTH,
  TAROT_SELECTION_SIZE,
  asCardTriple,
  assertCardId,
  assertUniqueCardIds,
  type CardId,
  type CardTriple,
  type CombinationKey,
} from "./types";

export function formatCardIdSegment(cardId: CardId): string {
  assertCardId(cardId);
  return String(cardId).padStart(COMBINATION_KEY_SEGMENT_WIDTH, "0");
}

export function sortCardIds(cardIds: readonly CardId[]): CardId[] {
  return [...cardIds].sort((left, right) => left - right);
}

export function createCanonicalCombinationKey(cardIds: readonly CardId[]): CombinationKey {
  assertUniqueCardIds(cardIds, TAROT_SELECTION_SIZE);
  return sortCardIds(cardIds).map(formatCardIdSegment).join("-");
}

export function parseCombinationKey(key: string): CardTriple {
  const segments = key.split("-");

  if (segments.length !== TAROT_SELECTION_SIZE) {
    throw new RangeError(`Invalid combination key: ${key}`);
  }

  const cardIds = segments.map((segment) => {
    if (!/^\d{2}$/.test(segment)) {
      throw new RangeError(`Invalid combination segment: ${segment}`);
    }

    return Number(segment);
  });

  return asCardTriple(cardIds);
}

export function enumerateCardTriples(cardIds: readonly CardId[] = TAROT_CARD_IDS): CardTriple[] {
  const uniqueOrderedCardIds = [...new Set(cardIds)];
  assertUniqueCardIds(uniqueOrderedCardIds);

  const triples: CardTriple[] = [];

  for (let firstIndex = 0; firstIndex < uniqueOrderedCardIds.length - 2; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < uniqueOrderedCardIds.length - 1; secondIndex += 1) {
      for (let thirdIndex = secondIndex + 1; thirdIndex < uniqueOrderedCardIds.length; thirdIndex += 1) {
        triples.push([
          uniqueOrderedCardIds[firstIndex],
          uniqueOrderedCardIds[secondIndex],
          uniqueOrderedCardIds[thirdIndex],
        ]);
      }
    }
  }

  return triples;
}

export function enumerateCombinationKeys(cardIds: readonly CardId[] = TAROT_CARD_IDS): CombinationKey[] {
  return enumerateCardTriples(cardIds).map((cardIds) => createCanonicalCombinationKey(cardIds));
}
