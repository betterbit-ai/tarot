import { createCanonicalCombinationKey } from "./combination";
import { getTarotCard } from "./cards";
import { mapCardsToPositions, type PositionedTarotCard } from "./positions";
import { asCardTriple, type CardTriple, type CombinationKey, type ReadingRecord, type ReadingText } from "./types";

export type ReadingSource = "authored" | "fallback";

export interface ReadingLookupResult {
  source: ReadingSource;
  combination: CombinationKey;
  orderedCards: CardTriple;
  canonicalCards: CardTriple;
  cards: PositionedTarotCard[];
  reading: ReadingText;
  version: number;
}

export interface LookupReadingOptions {
  overrides?: ReadonlyMap<CombinationKey, ReadingRecord> | readonly ReadingRecord[];
}

export function buildReadingIndex(records: readonly ReadingRecord[]): Map<CombinationKey, ReadingRecord> {
  return new Map(records.map((record) => [record.combination, record]));
}

function isReadingRecordArray(
  overrides: ReadonlyMap<CombinationKey, ReadingRecord> | readonly ReadingRecord[],
): overrides is readonly ReadingRecord[] {
  return Array.isArray(overrides);
}

function normalizeOverrides(
  overrides?: ReadonlyMap<CombinationKey, ReadingRecord> | readonly ReadingRecord[],
): ReadonlyMap<CombinationKey, ReadingRecord> | undefined {
  if (!overrides) {
    return undefined;
  }

  if (isReadingRecordArray(overrides)) {
    return buildReadingIndex(overrides);
  }

  return overrides;
}

function hasBatchim(text: string): boolean {
  const lastHangul = [...text].reverse().find((character) => {
    const code = character.charCodeAt(0);
    return code >= 0xac00 && code <= 0xd7a3;
  });

  return lastHangul ? (lastHangul.charCodeAt(0) - 0xac00) % 28 !== 0 : false;
}

function withSubject(text: string): string {
  return `${text}${hasBatchim(text) ? "이" : "가"}`;
}

function withObject(text: string): string {
  return `${text}${hasBatchim(text) ? "을" : "를"}`;
}

function buildFallbackReading(cards: PositionedTarotCard[]): ReadingText {
  const [first, second, third] = cards;
  const majorCount = cards.filter(({ card }) => card.arcana === "major").length;
  const headline =
    majorCount >= 2
      ? "큰 흐름이 이미 방향을 정하고 있어요."
      : cards.some(({ card }) => card.suit === "pentacles")
        ? "지금은 감정보다 바닥을 다지는 리듬이 중요해요."
        : "지금의 선택은 속도보다 결을 고르는 쪽에 가까워요.";

  return {
    headline,
    story: [
      `지금까지는 ${withSubject(first.card.meaning.light)} 이 질문의 배경에 있었습니다.`,
      `그런데 중심에 놓인 ${second.card.name} 카드는 흐름을 잠시 멈춰 세웁니다. ${withSubject(second.card.meaning.light)} 필요한 때지만, ${withSubject(second.card.meaning.shadow)} 판단을 서두르게 할 수 있습니다.`,
      `마지막 ${third.card.name} 카드는 이 긴장을 ${third.card.meaning.light} 쪽으로 옮겨갑니다.`,
      `세 장을 함께 보면, 첫 카드가 만든 바탕이 ${second.card.name}에서 기준을 고른 뒤 마지막 카드가 보여 준 방식으로 정리되는 흐름입니다.`,
    ].join(" "),
    advice: `오늘은 ${withObject(first.card.meaning.shadow)} 되풀이하지 않는 데서 시작해 보세요. ${withObject(second.card.meaning.light)} 중심에 두고, 결론은 ${third.card.meaning.light} 쪽으로 한 걸음만 옮기는 편이 좋겠습니다.`,
    closing: `빠른 답을 내기보다 ${withSubject(third.card.name)} 보여 준 태도를 오늘 한 번 실천해 보세요.`,
  };
}

export function lookupReading(
  orderedCardIds: readonly number[],
  options: LookupReadingOptions = {},
): ReadingLookupResult {
  const orderedCards = asCardTriple(orderedCardIds);
  const combination = createCanonicalCombinationKey(orderedCards);
  const canonicalCards = asCardTriple([...orderedCards].sort((left, right) => left - right));
  const overrideIndex = normalizeOverrides(options.overrides);
  const authoredRecord = overrideIndex?.get(combination);

  if (authoredRecord) {
    return {
      source: "authored",
      combination,
      orderedCards,
      canonicalCards,
      cards: mapCardsToPositions(orderedCards),
      reading: authoredRecord.reading,
      version: authoredRecord.version,
    };
  }

  const cards = mapCardsToPositions(orderedCards);

  return {
    source: "fallback",
    combination,
    orderedCards,
    canonicalCards,
    cards,
    reading: buildFallbackReading(cards),
    version: 1,
  };
}

export function createReadingPreview(cardIds: readonly number[]): string {
  const [first, second, third] = asCardTriple(cardIds).map((cardId) => getTarotCard(cardId).name);
  return `${first}, ${second}, ${third}`;
}
