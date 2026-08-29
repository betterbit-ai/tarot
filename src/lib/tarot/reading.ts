import {
  createCanonicalCombinationKey,
  interpretStructuredReading,
  type NarrativeLabels,
  type NarrativePattern,
  type ReadingSource,
  type ReadingCardInsight,
  type ReadingSkeleton,
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
  cardSummary: string;
  majorSummary: string;
  cardInsights: readonly ReadingCardInsight[];
  flow: string;
  application: string;
  mindset: string;
};

export type RitualReading = ReadingSection & {
  cards: TarotCard[];
  canonicalKey: string;
  source: ReadingSource;
};

function buildReading(ids: readonly number[], question: string, skeleton?: ReadingSkeleton): RitualReading {
  const reading = interpretStructuredReading(ids, question, skeleton);

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
    cardSummary: reading.cardSummary,
    majorSummary: reading.majorSummary,
    cardInsights: reading.cardInsights,
    flow: reading.flow,
    application: reading.application,
    mindset: reading.mindset,
  };
}

export function createRitualReading(ids: readonly number[]): RitualReading {
  return buildReading(ids, "");
}

export function createQuestionAwareRitualReading(ids: readonly number[], question: string, skeleton?: ReadingSkeleton): RitualReading {
  return buildReading(ids, question, skeleton);
}
