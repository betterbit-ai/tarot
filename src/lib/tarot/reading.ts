import { lookupReading, type ReadingSource } from "@/domain/tarot";
import { getCardsByIds, type TarotCard } from "@/lib/tarot/cards";
import { SAMPLE_READING_OVERRIDES } from "@/lib/tarot/sample-readings";

export type ReadingSection = {
  headline: string;
  story: string;
  advice: string;
  closing: string;
};

export type RitualReading = ReadingSection & {
  cards: TarotCard[];
  canonicalKey: string;
  source: ReadingSource;
};

export function createRitualReading(ids: readonly number[]): RitualReading {
  const result = lookupReading(ids, { overrides: SAMPLE_READING_OVERRIDES });

  return {
    cards: getCardsByIds(result.orderedCards),
    canonicalKey: result.combination,
    source: result.source,
    ...result.reading,
  };
}
