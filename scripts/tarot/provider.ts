import {
  DEFAULT_MODEL,
  DEFAULT_PROMPT_VERSION,
  DEFAULT_PROVIDER,
  TarotCard,
} from "./shared";

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

const POSITION_LABELS = [
  "지금까지 이어져온 흐름",
  "지금 마주한 핵심",
  "앞으로 열릴 방향",
] as const;

const CLOSINGS = [
  "서두르기보다 흐름을 고르면 이 조합이 더 또렷해집니다.",
  "작게 정리한 한 걸음이 다음 장면을 부드럽게 엽니다.",
  "지금 필요한 건 큰 결론보다 맞는 순서를 찾는 일입니다.",
  "답을 단정하기보다 몸에 남는 신호를 먼저 믿어 보세요.",
] as const;

const MAJOR_PATTERNS = [
  "큰 흐름이 이미 판을 움직이고 있어 사소한 기분보다 방향 감각이 중요합니다.",
  "상황의 축이 선명해서 망설임보다 기준을 세우는 쪽이 힘이 됩니다.",
  "바깥 사건보다 안쪽 결심이 더 크게 작동하는 조합입니다.",
] as const;

const MINOR_PATTERNS = [
  "생활의 리듬과 관계의 거리감이 결과를 바꾸는 현실적인 조합입니다.",
  "작은 선택이 연달아 쌓이며 전체 분위기를 만들고 있습니다.",
  "거창한 전환보다 손에 잡히는 조정이 먼저 필요한 흐름입니다.",
] as const;

export const deterministicLocalProvider: TarotReadingProvider = {
  name: DEFAULT_PROVIDER,
  model: DEFAULT_MODEL,
  promptVersion: DEFAULT_PROMPT_VERSION,
  buildReading(cards) {
    const seed = cards.reduce((sum, card) => sum + card.id, 0);
    const majorCount = cards.filter((card) => card.arcana === "major").length;
    const suitLabels = cards
      .map((card) => card.suit)
      .filter((value): value is NonNullable<typeof value> => value !== null);
    const distinctSuitCount = new Set(suitLabels).size;

    const headline = `${cards[0].name}, ${cards[1].name}, ${cards[2].name}가 한 흐름으로 이어집니다.`;
    const story = [
      `이 조합의 바탕에는 ${cards[0].light}과 ${cards[1].light}이 함께 깔려 있습니다.`,
      majorCount > 0
        ? MAJOR_PATTERNS[seed % MAJOR_PATTERNS.length]
        : MINOR_PATTERNS[seed % MINOR_PATTERNS.length],
      distinctSuitCount >= 2
        ? `감정과 판단, 혹은 의지와 현실이 한자리에서 만나 균형을 다시 잡으라고 말합니다.`
        : `${cards[2].name}는 같은 결을 밀어 주지만, 지나치면 ${cards[2].shadow}으로 기울 수 있습니다.`,
    ].join(" ");

    const advice = cards
      .map((card, index) => {
        const caution = index === 1 ? card.shadow : card.light;
        return `${POSITION_LABELS[index]}에서는 ${card.name}의 결을 따라 ${caution}을 살피세요.`;
      })
      .join(" ");

    const closing = CLOSINGS[seed % CLOSINGS.length];
    return { headline, story, advice, closing };
  },
};
