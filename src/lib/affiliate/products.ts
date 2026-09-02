import type { RelationshipSignals } from "@/domain/tarot";
import type { TarotCard } from "@/lib/tarot/cards";
import { inferQuestionIntent, type QuestionIntent } from "@/lib/tarot/question";

export type AffiliateTheme = "relationship" | "self-care" | "rest" | "focus" | "new-start" | "organization";

export type AffiliateProduct = {
  id: string;
  categories: readonly AffiliateTheme[];
  title: string;
  imageSrc: string;
  imageAlt: string;
  disclosure: string;
  ctaLabel: string;
  weight: number;
  active: boolean;
  partnerUrl?: string;
  sourceProductId?: string;
  refreshedAt?: string;
};

export type AffiliateSelection = AffiliateProduct & {
  category: AffiliateTheme;
  reason: string;
};

const DISCLOSURE = "이 추천은 쿠팡 파트너스 활동의 일환으로, 구매 시 일정액의 수수료를 제공받습니다.";

// Only operator-verified product assets and destinations may become active here.
// Prices are intentionally absent because the project has no trusted live price source.
export const CURATED_AFFILIATE_PRODUCTS: readonly AffiliateProduct[] = [
  {
    id: "bleu-de-chanel-edp-50ml",
    categories: ["relationship", "self-care", "rest", "new-start"],
    title: "블루 드 샤넬 오 드 빠르펭 50ml",
    imageSrc: "/affiliate/bleu-de-chanel.avif",
    imageAlt: "짙은 남색 블루 드 샤넬 오 드 빠르펭 50ml 보틀",
    disclosure: DISCLOSURE,
    ctaLabel: "쿠팡에서 보기",
    weight: 1,
    active: true,
  },
];

function themeFromQuestion(intent: QuestionIntent): AffiliateTheme[] {
  switch (intent) {
    case "love": return ["relationship", "self-care"];
    case "rest": return ["rest", "self-care"];
    case "career": return ["focus", "new-start"];
    case "money": return ["organization"];
    case "energy": return ["new-start", "self-care"];
    case "general": return ["self-care"];
  }
}

function themeFromCards(cards: readonly TarotCard[], signals?: RelationshipSignals): AffiliateTheme[] {
  const suits = cards.reduce<Record<string, number>>((counts, card) => {
    if (card.suit) counts[card.suit] = (counts[card.suit] ?? 0) + 1;
    return counts;
  }, {});
  const themes: AffiliateTheme[] = [];
  if ((suits.cups ?? 0) >= 2) themes.push("relationship", "self-care");
  if ((suits.swords ?? 0) >= 2 || (signals?.pauseCount ?? 0) >= 2) themes.push("rest");
  if ((suits.wands ?? 0) >= 2 || (signals?.activeCount ?? 0) >= 2) themes.push("new-start");
  if ((suits.pentacles ?? 0) >= 2) themes.push("organization");
  if ((signals?.majorCount ?? 0) >= 2) themes.push("self-care");
  return themes;
}

function hasFinalConsonant(value: string): boolean {
  const last = value.charCodeAt(value.length - 1);
  return last >= 0xac00 && last <= 0xd7a3 ? (last - 0xac00) % 28 !== 0 : false;
}

function objectParticle(value: string): "을" | "를" {
  return hasFinalConsonant(value) ? "을" : "를";
}

function reasonForTheme(theme: AffiliateTheme, title: string): string {
  const object = `${title}${objectParticle(title)}`;
  switch (theme) {
    case "relationship": return `관계에 얽힌 마음을 잠시 환기하는 흐름이라, 오늘은 ${object} 골라봤어요.`;
    case "rest": return `생각을 잠깐 내려놓고 쉬어야 하는 흐름이라, ${object} 제안해요.`;
    case "new-start": return `새로운 시작을 준비하는 흐름이라, ${object} 골라봤어요.`;
    case "self-care": return `지금은 나를 돌보는 시간이 필요한 흐름이라, ${object} 제안해요.`;
    case "focus": return `흩어진 일을 정리하고 집중하는 흐름이라, ${object} 골라봤어요.`;
    case "organization": return `생활과 돈의 조건을 정리하는 흐름이라, ${object} 제안해요.`;
  }
}

export function inferAffiliateThemes(question: string, cards: readonly TarotCard[], signals?: RelationshipSignals): readonly AffiliateTheme[] {
  const themes = [...themeFromQuestion(inferQuestionIntent(question, cards)), ...themeFromCards(cards, signals)];
  return [...new Set(themes)];
}

export function inferAffiliateCategory(question: string, cards: readonly TarotCard[], signals?: RelationshipSignals): AffiliateTheme {
  return inferAffiliateThemes(question, cards, signals)[0] ?? "self-care";
}

export function selectAffiliateProduct(question: string, cards: readonly TarotCard[], signals?: RelationshipSignals, products: readonly AffiliateProduct[] = CURATED_AFFILIATE_PRODUCTS): AffiliateSelection | null {
  const themes = inferAffiliateThemes(question, cards, signals);
  const candidates = products.filter((product) => product.active && product.categories.some((theme) => themes.includes(theme)));
  if (!candidates.length) return null;

  const rotationSeed = cards.reduce((total, card) => total + card.id, 0);
  const product = candidates[rotationSeed % candidates.length] ?? candidates[0];
  const category = product.categories.find((theme) => themes.includes(theme)) ?? product.categories[0];
  return { ...product, category, reason: reasonForTheme(category, product.title) };
}
