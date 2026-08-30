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

function reasonForTheme(theme: AffiliateTheme): string {
  switch (theme) {
    case "relationship": return "관계 생각을 덮고 일상으로 돌아갈 때, 분위기를 가볍게 바꿔볼 수 있는 물건이에요.";
    case "rest": return "생각을 오래 끌기보다, 잠깐 나를 돌보는 시간에 어울리는 제안이에요.";
    case "new-start": return "새로운 장면을 시작하기 전에, 내 기분부터 정돈하고 싶은 날에 어울려요.";
    case "self-care": return "리딩 뒤에 나를 한 번 돌보고 싶은 날을 위한 작은 제안이에요.";
    case "focus": return "지금은 이 카테고리에 맞는 검증 상품을 준비 중이에요.";
    case "organization": return "지금은 이 카테고리에 맞는 검증 상품을 준비 중이에요.";
  }
}

export function inferAffiliateThemes(question: string, cards: readonly TarotCard[], signals?: RelationshipSignals): readonly AffiliateTheme[] {
  const themes = [...themeFromQuestion(inferQuestionIntent(question, cards)), ...themeFromCards(cards, signals)];
  return [...new Set(themes)];
}

export function inferAffiliateCategory(question: string, cards: readonly TarotCard[], signals?: RelationshipSignals): AffiliateTheme {
  return inferAffiliateThemes(question, cards, signals)[0] ?? "self-care";
}

export function selectAffiliateProduct(question: string, cards: readonly TarotCard[], signals?: RelationshipSignals): AffiliateSelection | null {
  const themes = inferAffiliateThemes(question, cards, signals);
  const candidates = CURATED_AFFILIATE_PRODUCTS.filter((product) => product.active && product.categories.some((theme) => themes.includes(theme)));
  if (!candidates.length) return null;

  const rotationSeed = cards.reduce((total, card) => total + card.id, 0);
  const product = candidates[rotationSeed % candidates.length] ?? candidates[0];
  const category = product.categories.find((theme) => themes.includes(theme)) ?? product.categories[0];
  return { ...product, category, reason: reasonForTheme(category) };
}
