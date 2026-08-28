import {
  DEFAULT_MODEL,
  DEFAULT_PROMPT_VERSION,
  DEFAULT_PROVIDER,
  TarotCard,
} from "./shared";
import { interpretTarotV2 } from "../../src/domain/tarot/interpretation-v2";

export interface TarotReadingProvider {
  name: string;
  model: string;
  promptVersion: string;
  buildReading: (cards: TarotCard[], combination: string) => {
    headline: string;
    story: string;
    advice: string;
    closing: string;
  };
}

export const deterministicLocalProvider: TarotReadingProvider = {
  name: DEFAULT_PROVIDER,
  model: DEFAULT_MODEL,
  promptVersion: DEFAULT_PROMPT_VERSION,
  buildReading(cards) {
    const reading = interpretTarotV2(cards.map((card) => card.id));
    return {
      headline: reading.headline,
      story: reading.story,
      advice: reading.advice,
      closing: reading.closing,
    };
  },
};
