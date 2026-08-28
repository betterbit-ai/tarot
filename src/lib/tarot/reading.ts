import {
  createCanonicalCombinationKey,
  interpretTarotV2,
  type NarrativeLabels,
  type NarrativePattern,
  type ReadingSource,
  type RelationshipSignals,
} from "@/domain/tarot";
import { getCardsByIds, type TarotCard } from "@/lib/tarot/cards";

export type ReadingSection = {
  headline: string;
  story: string;
  advice: string;
  closing: string;
  labels: NarrativeLabels;
  pattern: NarrativePattern;
  signals: RelationshipSignals;
};

export type RitualReading = ReadingSection & {
  cards: TarotCard[];
  canonicalKey: string;
  source: ReadingSource;
};

function buildReading(ids: readonly number[], question: string): RitualReading {
  const reading = interpretTarotV2(ids, question);

  return {
    cards: getCardsByIds(ids),
    canonicalKey: createCanonicalCombinationKey(ids),
    source: "fallback",
    headline: reading.headline,
    story: reading.story,
    advice: reading.advice,
    closing: reading.closing,
    labels: reading.labels,
    pattern: reading.pattern,
    signals: reading.signals,
  };
}

export function createRitualReading(ids: readonly number[]): RitualReading {
  return buildReading(ids, "");
}

export function createQuestionAwareRitualReading(ids: readonly number[], question: string): RitualReading {
  return buildReading(ids, question);
}
