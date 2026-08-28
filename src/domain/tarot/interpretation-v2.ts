import { getTarotCards } from "./cards";
import { asCardTriple, type ReadingText, type Suit, type TarotCard } from "./types";

export type ReadingIntent = "love" | "rest" | "career" | "money" | "energy" | "general";

export type RelationshipSignals = {
  repeatedSuit: Suit | null;
  repeatedSuitCount: number;
  majorCount: number;
  finalMajor: boolean;
  activeCount: number;
  pauseCount: number;
  supportiveCount: number;
  difficultCount: number;
  courtCount: number;
  progression: "ascending" | "descending" | "mixed" | null;
  contradiction: boolean;
};

export type InterpretationV2 = ReadingText & {
  intent: ReadingIntent;
  signals: RelationshipSignals;
  characterCount: number;
};

const INTENT_KEYWORDS: Record<Exclude<ReadingIntent, "general">, readonly string[]> = {
  love: ["연애", "사랑", "썸", "관계", "재회", "결혼", "데이트", "소개팅", "연락", "짝", "애정", "헤어질"],
  rest: ["휴식", "번아웃", "지쳤", "피곤", "수면", "회복", "불안", "쉬어", "쉬고", "버틸"],
  career: ["이직", "회사", "직장", "커리어", "면접", "업무", "프로젝트", "승진", "퇴사", "취업", "진로", "합격", "사업"],
  money: ["돈", "재정", "연봉", "지출", "예산", "투자", "저축", "소비", "월급", "금전", "부채", "수입"],
  energy: ["의욕", "시작", "추진", "실행", "도전", "행동", "체력", "운동", "공부", "준비"],
};

const SUIT_LABELS: Record<Suit, string> = {
  wands: "완드",
  cups: "컵",
  swords: "소드",
  pentacles: "펜타클",
};

const SUPPORTIVE_IDS = new Set([6, 8, 14, 17, 19, 21, 37, 44, 45, 69, 72, 73]);
const DIFFICULT_IDS = new Set([13, 15, 16, 18, 40, 43, 52, 54, 57, 58, 59, 68]);
const ACTIVE_IDS = new Set([0, 1, 7, 19, 20, 22, 29, 33, 50, 61]);
const PAUSE_IDS = new Set([2, 9, 12, 14, 18, 39, 51, 53, 70]);
const ATTACHMENT_IDS = new Set([15, 39, 42, 67]);
const UNCERTAINTY_IDS = new Set([18, 42, 51, 57]);
const AUTHORITY_IDS = new Set([4, 5, 11]);
const BURDEN_IDS = new Set([31, 59, 73]);

const RANK_NUMBER: Record<string, number> = {
  ace: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

function normalizeQuestion(question: string): string {
  return question.trim().replace(/\s+/g, " ");
}

function excerptQuestion(question: string): string {
  const normalized = normalizeQuestion(question);
  return normalized.length <= 44 ? normalized : `${normalized.slice(0, 43).trimEnd()}…`;
}

function hasBatchim(text: string): boolean {
  const lastCharacter = [...text.trim()].at(-1);
  if (!lastCharacter) return false;
  if (/\d/.test(lastCharacter)) return new Set(["0", "1", "3", "6", "7", "8"]).has(lastCharacter);
  const code = lastCharacter.charCodeAt(0);
  return code >= 0xac00 && code <= 0xd7a3 ? (code - 0xac00) % 28 !== 0 : false;
}

function withSubject(text: string): string {
  return `${text}${hasBatchim(text) ? "이" : "가"}`;
}

function withObject(text: string): string {
  return `${text}${hasBatchim(text) ? "을" : "를"}`;
}

export function classifyQuestion(question: string, cards: readonly TarotCard[] = []): ReadingIntent {
  const normalized = normalizeQuestion(question).toLowerCase();

  if (normalized) {
    let explicitIntent: ReadingIntent = "general";
    let explicitScore = 0;

    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS) as [Exclude<ReadingIntent, "general">, readonly string[]][]) {
      const score = keywords.reduce((total, keyword) => total + (normalized.includes(keyword) ? 1 : 0), 0);
      if (score > explicitScore) {
        explicitIntent = intent;
        explicitScore = score;
      }
    }

    if (explicitScore > 0) {
      return explicitIntent;
    }
  }

  const suitCounts: Partial<Record<Suit, number>> = {};
  for (const card of cards) {
    if (card.suit) suitCounts[card.suit] = (suitCounts[card.suit] ?? 0) + 1;
  }

  const dominantSuit = (Object.entries(suitCounts) as [Suit, number][]).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (dominantSuit === "cups") return "love";
  if (dominantSuit === "pentacles") return "money";
  if (dominantSuit === "wands") return "energy";
  if (dominantSuit === "swords") return "career";
  if (cards.some((card) => [9, 12, 14, 18].includes(card.id))) return "rest";
  return "general";
}

export function analyzeRelationships(cards: readonly TarotCard[]): RelationshipSignals {
  const suitCounts: Partial<Record<Suit, number>> = {};
  for (const card of cards) {
    if (card.suit) suitCounts[card.suit] = (suitCounts[card.suit] ?? 0) + 1;
  }

  const [repeatedSuit, repeatedSuitCount = 0] = (Object.entries(suitCounts) as [Suit, number][])
    .sort((a, b) => b[1] - a[1])
    .find(([, count]) => count >= 2) ?? [null, 0];

  const numericRanks = cards
    .map((card) => (card.arcana === "minor" ? RANK_NUMBER[card.rank] : undefined))
    .filter((value): value is number => typeof value === "number");
  let progression: RelationshipSignals["progression"] = null;
  if (numericRanks.length === 3) {
    if (numericRanks[0] < numericRanks[1] && numericRanks[1] < numericRanks[2]) progression = "ascending";
    else if (numericRanks[0] > numericRanks[1] && numericRanks[1] > numericRanks[2]) progression = "descending";
    else progression = "mixed";
  }

  const activeCount = cards.filter((card) => card.suit === "wands" || ACTIVE_IDS.has(card.id)).length;
  const pauseCount = cards.filter((card) => card.suit === "cups" || PAUSE_IDS.has(card.id)).length;
  const supportiveCount = cards.filter((card) => SUPPORTIVE_IDS.has(card.id)).length;
  const difficultCount = cards.filter((card) => DIFFICULT_IDS.has(card.id)).length;

  return {
    repeatedSuit,
    repeatedSuitCount,
    majorCount: cards.filter((card) => card.arcana === "major").length,
    finalMajor: cards[2]?.arcana === "major",
    activeCount,
    pauseCount,
    supportiveCount,
    difficultCount,
    courtCount: cards.filter((card) => ["page", "knight", "queen", "king"].includes(card.rank)).length,
    progression,
    contradiction: (activeCount > 0 && pauseCount > 0) || (supportiveCount > 0 && difficultCount > 0),
  };
}

function directAnswer(intent: ReadingIntent, question: string, signals: RelationshipSignals): string {
  const prefix = question ? `“${excerptQuestion(question)}”라는 질문으로 보면, ` : "질문 없이 고른 세 장은, 지금 가장 마음에 걸린 일을 기준으로 보면 ";
  const moving = signals.activeCount > signals.pauseCount && signals.supportiveCount >= signals.difficultCount;

  if (intent === "career") {
    const moveQuestion = /(이직|퇴사|회사|직장)/.test(question);
    if (moveQuestion && moving) return `${prefix}움직일 여지는 있어요. 다만 지금 회사를 떠나고 싶은 이유와 새 회사를 원하는 이유를 분리해서 봐야 해요.`;
    if (moveQuestion) return `${prefix}카드만 놓고 보면 지금 당장 회사를 뛰쳐나가라는 쪽은 아니에요. 떠나고 싶은 이유와 잃기 싫은 조건을 먼저 가를 필요가 있어요.`;
    return `${prefix}결정을 밀어붙이기보다 역할과 조건을 따로 보는 쪽이 맞아요.`;
  }
  if (intent === "love") return `${prefix}마음이 없는 쪽보다는 서로 기대하는 속도가 어긋난 쪽에 가까워 보여요.`;
  if (intent === "money") return `${prefix}지금 바로 돈을 넣거나 빼라는 답은 아니에요. 감당할 수 있는 범위를 먼저 정해야 해요.`;
  if (intent === "rest") return `${prefix}더 버티라는 답은 아니에요. 이미 지친 이유를 줄이는 쪽이 먼저예요.`;
  if (intent === "energy") return `${prefix}시작해도 괜찮지만 처음부터 크게 벌이지는 말라는 쪽이에요.`;
  return `${prefix}마음속에서 정한 답과 현실 조건이 어디서 어긋나는지 먼저 보라고 해요.`;
}

function firstCardLine(card: TarotCard): string {
  if (card.suit === "cups") return `첫 카드 ${withObject(card.name)} 보면, 마음은 이미 어느 쪽으로 기울어 있고 그 감정을 오래 붙잡고 있어요.`;
  if (card.suit === "wands") return `첫 카드 ${withObject(card.name)} 보면, 해보고 싶은 마음이 판단보다 한발 앞서 있어요.`;
  if (card.suit === "swords") return `첫 카드 ${withObject(card.name)} 보면, 장단점을 오래 따진 끝에 마음속 답은 어느 정도 정해 둔 것 같아요.`;
  if (card.suit === "pentacles") return `첫 카드 ${withObject(card.name)} 보면, 안전한 조건과 이미 가진 것을 잃지 않으려는 마음이 먼저 보여요.`;
  return `첫 카드 ${card.name}에는 ${card.meaning.light} 쪽의 마음이 이미 배경에 깔려 있어요.`;
}

function relationshipLine(cards: readonly TarotCard[], signals: RelationshipSignals): string {
  if (signals.repeatedSuit) return `${withSubject(SUIT_LABELS[signals.repeatedSuit])} ${signals.repeatedSuitCount}장 겹쳐서, 세 장이 서로 다른 이야기를 하기보다 같은 문제를 거듭 짚고 있어요.`;
  if (signals.courtCount >= 2) return "인물 카드가 겹쳐서 상황 자체보다 누가 기준을 쥐고 있고 누가 반응하고 있는지가 더 중요해 보여요.";
  if (signals.progression === "ascending") return "숫자가 앞으로 이어져, 작은 선택을 실제 행동으로 옮길수록 답이 선명해지는 배열이에요.";
  if (signals.progression === "descending") return "숫자가 내려가고 있어, 더 밀어붙이기보다 부담을 덜어내야 다음 장면이 열리는 배열이에요.";
  if (signals.contradiction) return "첫 장의 속도와 가운데 장의 멈춤이 부딪혀서, 하고 싶은 마음과 지키고 싶은 조건을 동시에 만족시키기는 어려워 보여요.";
  if (signals.majorCount >= 2) return "큰 카드가 두 장 이상이라 사소한 기분보다 앞으로도 납득할 기준을 고르는 문제에 가까워요.";
  const [first, second] = cards;
  if (first.suit && second.suit && first.suit !== second.suit) return `${SUIT_LABELS[first.suit]}에서 ${SUIT_LABELS[second.suit]}로 넘어가며, 마음의 문제를 현실적인 판단으로 바꾸라고 해요.`;
  return "세 장의 온도는 크게 다르지 않지만, 가운데 카드에서 한 번 속도를 조절해야 해요.";
}

function middleCardLine(card: TarotCard): string {
  if (ATTACHMENT_IDS.has(card.id)) return "이 선택이 싫어서라기보다 이미 가진 것을 잃는 게 싫어서 망설이고 있을 가능성이 커 보여요.";
  if (UNCERTAINTY_IDS.has(card.id)) return "정보가 전혀 없어서가 아니라 결정을 미루는 동안 불안과 상상이 커진 모습에 가까워요.";
  if (AUTHORITY_IDS.has(card.id)) return "내가 원하는 답보다 회사, 가족, 주변의 기준을 먼저 맞추려는 태도가 결정을 무겁게 만들고 있어요.";
  if (PAUSE_IDS.has(card.id)) return "답이 없다는 뜻이 아니라 지금 결론을 서두르면 놓치는 조건이 있다는 쪽에 가까워요.";
  if (BURDEN_IDS.has(card.id)) return "선택 자체보다 그 뒤에 떠안을 책임을 너무 크게 보고 있어서 첫걸음이 무거워진 것 같아요.";
  if (card.suit === "cups") return "사실보다 상대의 반응이나 내 기분을 먼저 예상하고 있는 점이 판단을 흔들 수 있어요.";
  if (card.suit === "swords") return "생각을 충분히 했는데도 같은 장단점을 반복해서 비교하는 것이 오히려 결정을 늦추고 있어요.";
  if (card.suit === "pentacles") return "좋고 싫음보다 돈, 안정, 익숙한 환경을 잃을 가능성이 더 크게 걸려 있어요.";
  if (card.suit === "wands") return "빨리 움직이고 싶은 마음이 커서 준비가 덜 된 부분을 작게 보고 있을 수 있어요.";
  return `${card.meaning.shadow} 쪽으로 기울지 않도록, 지금 세운 기준이 내 것인지 먼저 확인해야 해요.`;
}

function finalCardLine(card: TarotCard, finalMajor: boolean): string {
  const special: Partial<Record<number, string>> = {
    5: "이번 선택은 순간적으로 좋아 보이느냐보다 앞으로도 내가 이 기준을 납득할 수 있느냐가 더 중요해져요.",
    11: "감정적인 확신보다 조건을 같은 표 위에 놓고 비교해야 결론이 나요.",
    13: "이미 끝난 조건을 붙잡지 말고 정리할 것을 먼저 끝내야 다음 선택이 가능해요.",
    14: "둘 중 하나를 급히 고르기보다 속도와 조건을 조절하는 제3의 방법도 남아 있어요.",
    16: "지금까지 당연하다고 본 전제 하나가 이미 흔들렸다는 사실부터 인정해야 해요.",
    17: "큰 반전보다 작게 회복되는 방향을 오래 가져가는 편이 맞아요.",
    19: "숨겨 둔 조건을 솔직하게 꺼낼수록 결론이 단순해져요.",
    21: "결론을 미루기보다 한 단계를 닫고 다음으로 넘어갈 시점에 가까워요.",
  };
  const specialLine = special[card.id];
  if (specialLine) return specialLine;
  if (finalMajor) return `${card.name}까지 이어지면, 당장의 편안함보다 ${card.meaning.light}을 오래 지킬 수 있는지를 보라는 쪽이에요.`;
  if (card.suit === "pentacles") return "마지막에는 말보다 조건표, 돈, 시간처럼 손에 잡히는 기준이 답을 정해요.";
  if (card.suit === "swords") return "마지막에는 상대의 기대보다 내가 납득할 한 문장을 분명히 정해야 해요.";
  if (card.suit === "cups") return "마지막에는 옳은 선택보다 하고 난 뒤 마음이 오래 편할 선택을 보게 돼요.";
  return "마지막에는 오래 고민하는 것보다 준비한 만큼 먼저 움직여 보는 쪽으로 기웁니다.";
}

function conclusionLine(intent: ReadingIntent): string {
  if (intent === "career") return "그래서 이 질문에는 좋아 보이는 자리인지를 따지기보다, 떠나는 이유와 새 자리의 조건이 서로 맞는지를 보는 게 더 중요해요.";
  if (intent === "love") return "그래서 이 질문에는 상대의 마음을 추측하기보다 서로 감당할 수 있는 관계의 속도를 확인하는 게 맞아요.";
  if (intent === "money") return "그래서 이 질문에는 수익 기대보다 감당 가능한 손실과 유지할 현금을 먼저 정하는 게 맞아요.";
  if (intent === "rest") return "그래서 이 질문에는 더 버틸 방법보다 당장 덜어낼 일 하나를 고르는 게 맞아요.";
  if (intent === "energy") return "그래서 이 질문에는 완벽한 계획보다 오늘 끝낼 수 있는 첫 동작을 고르는 게 맞아요.";
  return "그래서 지금은 좋아 보이는 답보다 오래 가져가도 후회가 적을 기준을 고르는 게 맞아요.";
}

function actionLine(intent: ReadingIntent): string {
  if (intent === "career") return "현재 회사를 떠나고 싶은 이유 3개와 새 자리에서 반드시 확인할 조건 3개를 나눠 적어 보세요.";
  if (intent === "love") return "상대에게 확인하고 싶은 것을 한 문장으로 줄인 뒤, 추측 대신 실제로 한 번 물어보세요.";
  if (intent === "money") return "이번 결정에 쓸 수 있는 상한 금액과 잃어도 버틸 수 있는 금액을 각각 적어 보세요.";
  if (intent === "rest") return "오늘 일정에서 하나를 빼고, 30분 쉬는 시간을 먼저 달력에 넣어 두세요.";
  if (intent === "energy") return "15분 안에 끝낼 수 있는 첫 동작 하나만 지금 시작해 보세요.";
  return "가장 마음에 걸린 선택의 장점과 잃을 것을 각각 세 줄로 적어 보세요.";
}

export function interpretTarotV2(cardIds: readonly number[], question = ""): InterpretationV2 {
  const ordered = asCardTriple(cardIds);
  const cards = getTarotCards(ordered);
  const intent = normalizeQuestion(question) ? classifyQuestion(question, cards) : "general";
  const signals = analyzeRelationships(cards);
  const [first, second, third] = cards;

  const headlines: Record<ReadingIntent, string> = {
    love: "마음보다 서로의 속도를 먼저 확인해 보세요.",
    rest: "더 버티기보다 하나를 덜어낼 때예요.",
    career: signals.activeCount > signals.pauseCount ? "움직일 여지는 있어요." : "지금 당장 뛰쳐나가라는 쪽은 아니에요.",
    money: "기대 수익보다 감당할 범위를 먼저 정하세요.",
    energy: "크게 벌이기보다 작은 시작이 맞아요.",
    general: "마음속 답과 현실 조건을 나눠 볼 때예요.",
  };
  const reading: ReadingText = {
    headline: headlines[intent],
    story: `${directAnswer(intent, question, signals)}\n\n카드를 같이 보면, ${firstCardLine(first)} ${relationshipLine(cards, signals)}`,
    advice: `특히 걸리는 건 가운데 놓인 ${second.name} 카드예요. ${middleCardLine(second)}\n\n마지막 ${third.name}까지 이어지면, ${finalCardLine(third, signals.finalMajor)} ${conclusionLine(intent)}`,
    closing: actionLine(intent),
  };
  const characterCount = [reading.headline, reading.story, reading.advice, reading.closing].join(" ").length;

  return { ...reading, intent, signals, characterCount };
}
