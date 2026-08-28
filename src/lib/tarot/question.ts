import { classifyQuestion, getTarotCards, type ReadingIntent } from "@/domain/tarot";
import type { TarotCard } from "@/lib/tarot/cards";

export type QuestionIntent = ReadingIntent;

export type QuestionProfile = {
  kindLabel: string;
  excerpt: string;
};

const QUESTION_LABELS: Record<QuestionIntent, string> = {
  love: "관계",
  rest: "휴식",
  career: "일",
  money: "돈",
  energy: "활동",
  general: "지금",
};

export function inferQuestionIntent(question: string, cards: readonly TarotCard[] = []): QuestionIntent {
  return classifyQuestion(question, getTarotCards(cards.map((card) => card.id)));
}

export function describeQuestionIntent(intent: QuestionIntent): string {
  return QUESTION_LABELS[intent];
}

export function summarizeQuestion(question: string): QuestionProfile | null {
  const normalized = question.trim().replace(/\s+/g, " ");
  if (!normalized) return null;

  return {
    kindLabel: describeQuestionIntent(classifyQuestion(normalized)),
    excerpt: normalized.length <= 28 ? normalized : `${normalized.slice(0, 27).trimEnd()}…`,
  };
}
