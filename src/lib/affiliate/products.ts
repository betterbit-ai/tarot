import type { TarotCard } from "@/lib/tarot/cards";
import { inferQuestionIntent, type QuestionIntent } from "@/lib/tarot/question";

export type AffiliateProductCategory = QuestionIntent;

export type AffiliateProduct = {
  id: string;
  category: AffiliateProductCategory;
  title: string;
  reason: string;
  imageSrc: string;
  imageAlt: string;
  disclosure: string;
  ctaLabel: string;
};

const BLEU_DE_CHANEL = {
  id: "bleu-de-chanel-edp-50ml",
  title: "블루 드 샤넬 오 드 빠르펭 50ml",
  imageSrc: "/affiliate/bleu-de-chanel.avif",
  imageAlt: "짙은 남색 블루 드 샤넬 오 드 빠르펭 50ml 보틀",
  disclosure: "이 추천은 쿠팡 파트너스 활동의 일환으로, 구매 시 일정액의 수수료를 제공받습니다.",
  ctaLabel: "쿠팡에서 보기",
} as const;

function reasonForCategory(category: AffiliateProductCategory, cards: readonly TarotCard[]): string {
  const lastCard = cards[2]?.label ?? "마지막 카드";

  switch (category) {
    case "love":
      return `${lastCard}까지 보고 나면 말보다 분위기를 바꾸는 쪽이 먼저예요. 관계의 온도를 조금 달리하고 싶은 날에 어울리는 우디 향을 골랐어요.`;
    case "rest":
      return `${lastCard}가 남긴 여운처럼, 생각을 오래 끌기보다 한 번 끊어 주는 감각이 필요해 보여요. 익숙한 공간의 분위기를 바꾸는 짙은 우디 향이에요.`;
    case "career":
      return `${lastCard}가 마지막에 놓인 날은 새 환경에서 어떤 인상을 남길지도 현실적인 조건이 됩니다. 면접이나 첫 출근 전에 차분하게 정돈하기 좋은 향을 골랐어요.`;
    case "money":
      return "소비를 늘리라는 뜻은 아니에요. 원래 향수를 바꾸려던 참이라면 충동구매 대신 오래 쓸 한 가지를 비교해 보라는 제안에 가까워요.";
    case "energy":
      return `${lastCard}처럼 먼저 움직여야 하는 날에는 옷차림보다 빠르게 분위기를 바꾸는 물건이 잘 맞아요. 선명하지만 무겁지 않은 우디 향을 골랐어요.`;
    case "general":
    default:
      return "카드를 덮고 일상으로 돌아갈 때 분위기를 한 번 바꿔 줄 물건을 골랐어요. 짙고 차분한 우디 계열 향수예요.";
  }
}

export function inferAffiliateCategory(question: string, cards: readonly TarotCard[]): AffiliateProductCategory {
  return inferQuestionIntent(question, cards);
}

export function selectAffiliateProduct(question: string, cards: readonly TarotCard[]): AffiliateProduct {
  const category = inferAffiliateCategory(question, cards);
  return {
    ...BLEU_DE_CHANEL,
    category,
    reason: reasonForCategory(category, cards),
  };
}
