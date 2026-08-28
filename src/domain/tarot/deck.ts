import { TAROT_CARD_IDS, TAROT_CARDS } from "./cards";
import type { CardId, TarotCard } from "./types";

export type RandomIndexSource = (maxExclusive: number) => number;

const UINT32_RANGE = 0x1_0000_0000;

function fallbackRandomIndex(maxExclusive: number): number {
  return Math.floor(Math.random() * maxExclusive);
}

export function cryptoRandomIndex(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new RangeError(`maxExclusive must be a positive integer. Received ${maxExclusive}`);
  }

  const cryptoObject = globalThis.crypto;

  if (!cryptoObject?.getRandomValues) {
    return fallbackRandomIndex(maxExclusive);
  }

  const bucketSize = UINT32_RANGE - (UINT32_RANGE % maxExclusive);
  const buffer = new Uint32Array(1);

  while (true) {
    cryptoObject.getRandomValues(buffer);
    const candidate = buffer[0];

    if (candidate < bucketSize) {
      return candidate % maxExclusive;
    }
  }
}

export function createOrderedCardIds(): CardId[] {
  return [...TAROT_CARD_IDS];
}

export function createOrderedDeck(): TarotCard[] {
  return [...TAROT_CARDS];
}

export function shuffleCardIds(
  cardIds: readonly CardId[] = TAROT_CARD_IDS,
  randomIndex: RandomIndexSource = cryptoRandomIndex,
): CardId[] {
  const deck = [...cardIds];

  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);

    if (!Number.isInteger(swapIndex) || swapIndex < 0 || swapIndex > index) {
      throw new RangeError(`Random index ${swapIndex} is out of range for ${index + 1} choices`);
    }

    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }

  return deck;
}

export function shuffleDeck(
  deck: readonly TarotCard[] = TAROT_CARDS,
  randomIndex: RandomIndexSource = cryptoRandomIndex,
): TarotCard[] {
  return shuffleCardIds(deck.map((card) => card.id), randomIndex).map((cardId) =>
    deck.find((card) => card.id === cardId) ?? TAROT_CARDS[cardId],
  );
}
