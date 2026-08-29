import { getTarotCards } from "./cards";
import { createCanonicalCombinationKey } from "./combination";
import { asCardTriple, type ReadingText, type Suit, type TarotCard } from "./types";

export type ReadingIntent = "love" | "rest" | "career" | "money" | "energy" | "general";
export type QuestionType = "decision" | "other-person" | "future" | "open";

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
  pattern: NarrativePattern;
  labels: NarrativeLabels;
  questionType: QuestionType;
  stance: ReadingStance;
};

export type NarrativePattern = "middle" | "conflict" | "same-direction" | "turn" | "major";

export type NarrativeLabels = {
  story: string;
  advice: string;
  closing: string;
};

export type ReadingAction =
  | "marry"
  | "change-job"
  | "stay-job"
  | "end-relationship"
  | "contact"
  | "repay-debt"
  | "invest"
  | "spend"
  | "finish"
  | "continue"
  | "start"
  | "wait"
  | "other-person"
  | "future"
  | "open";

export type ReadingStance = "yes" | "lean-yes" | "conditional-yes" | "wait" | "conditional" | "lean-no" | "no" | "unclear";

export type StructuredQuestionProfile = {
  intent: ReadingIntent;
  questionType: QuestionType;
  action: ReadingAction;
};

export type ReadingSkeleton = {
  canonicalKey: string;
  orderedCardIds: readonly [number, number, number];
  dominantCardId: number;
  centralTension: "attachment" | "urgency" | "uncertainty" | "pressure" | "burden" | "release" | "conflict" | "none";
  direction: "advance" | "pause" | "release" | "stabilize" | "clarify" | "transform";
  relationships: readonly ("same-suit" | "major-weight" | "court-dynamic" | "rank-progression" | "conflict" | "handoff")[];
  signals: RelationshipSignals;
};

const INTENT_KEYWORDS: Record<Exclude<ReadingIntent, "general">, readonly string[]> = {
  love: ["연애", "사랑", "썸", "관계", "재회", "결혼", "데이트", "소개팅", "연락", "짝", "애정", "헤어질"],
  rest: ["휴식", "번아웃", "지쳤", "피곤", "수면", "회복", "불안", "쉬어", "쉬고", "버틸"],
  career: ["이직", "회사", "직장", "커리어", "면접", "업무", "프로젝트", "승진", "퇴사", "취업", "진로", "합격", "사업"],
  money: ["돈", "재정", "연봉", "지출", "예산", "투자", "저축", "소비", "월급", "금전", "부채", "수입"],
  energy: ["의욕", "시작", "추진", "실행", "도전", "행동", "체력", "운동", "공부", "준비"],
};

const OTHER_PERSON_PHRASES = ["그 사람이", "상대는", "상대방", "저를 좋아", "마음이 있을", "연락이 올", "전 애인"];
const FUTURE_PHRASES = ["올해", "언젠가", "할 수 있을까요", "될 수 있을까요", "생길까요"];

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


function narrativeLabels(pattern: NarrativePattern): NarrativeLabels {
  switch (pattern) {
    case "conflict":
      return { story: "첫 장과 마지막 장 사이에서", advice: "가운데서 멈춘 이유", closing: "지금 남길 것" };
    case "same-direction":
      return { story: "세 장이 같은 쪽을 보고 있어요", advice: "반복해서 보이는 것", closing: "한 가지만 해볼 것" };
    case "turn":
      return { story: "마지막 카드에서 달라져요", advice: "끝에서 바뀐 말", closing: "이제 볼 것" };
    case "major":
      return { story: "이번 조합은 무게가 있어요", advice: "가볍게 넘기기 어려운 대목", closing: "오늘의 기준" };
    case "middle":
    default:
      return { story: "가운데 카드가 먼저 말해요", advice: "그 카드가 걸리는 이유", closing: "지금 해볼 것" };
  }
}


export function createQuestionProfile(question: string, cards: readonly TarotCard[]): StructuredQuestionProfile {
  const normalized = normalizeQuestion(question);
  const action: ReadingAction =
    /결혼/.test(normalized) ? "marry" :
    /(이직|옮겨|퇴사|회사를 그만|직장을 그만)/.test(normalized) ? "change-job" :
    /(회사에 더 남|회사에 계속|직장에 남)/.test(normalized) ? "stay-job" :
    /(헤어|이별|관계를.*놓|관계를.*끝)/.test(normalized) ? "end-relationship" :
    /(연락|고백)/.test(normalized) ? "contact" :
    /(빚|대출|상환|갚)/.test(normalized) ? "repay-debt" :
    /투자/.test(normalized) ? "invest" :
    /(지출|소비|큰돈|사도)/.test(normalized) ? "spend" :
    /(끝내|정리|마무리)/.test(normalized) ? "finish" :
    /(계속|이어|지속)/.test(normalized) ? "continue" :
    /(시작|사업|준비)/.test(normalized) ? "start" :
    /(기다리|미루)/.test(normalized) ? "wait" :
    OTHER_PERSON_PHRASES.some((phrase) => normalized.includes(phrase)) ? "other-person" :
    FUTURE_PHRASES.some((phrase) => normalized.includes(phrase)) ? "future" : "open";

  const questionType: QuestionType =
    action === "other-person" ? "other-person" :
    action === "future" ? "future" :
    ["marry", "change-job", "stay-job", "end-relationship", "contact", "repay-debt", "invest", "spend", "finish", "continue", "start", "wait"].includes(action) || /(결정을 내려|결정할|선택을)/.test(normalized) ? "decision" : "open";

  return { intent: normalized ? classifyQuestion(normalized, cards) : "general", questionType, action };
}

function tensionFor(cards: readonly TarotCard[], signals: RelationshipSignals): ReadingSkeleton["centralTension"] {
  const middle = cards[1];
  if (ATTACHMENT_IDS.has(middle.id)) return "attachment";
  if (UNCERTAINTY_IDS.has(middle.id)) return "uncertainty";
  if (AUTHORITY_IDS.has(middle.id)) return "pressure";
  if (BURDEN_IDS.has(middle.id)) return "burden";
  if (DIFFICULT_IDS.has(cards[2].id) || [13, 16, 21].includes(cards[2].id)) return "release";
  if (signals.contradiction) return "conflict";
  if (middle.suit === "wands") return "urgency";
  return "none";
}

function directionFor(cards: readonly TarotCard[], signals: RelationshipSignals): ReadingSkeleton["direction"] {
  const last = cards[2];
  if ([13, 16, 21].includes(last.id)) return "release";
  if ([7, 17, 19, 20].includes(last.id) || last.suit === "wands") return "advance";
  if ([2, 9, 12, 14, 18].includes(last.id) || last.suit === "cups") return "pause";
  if (last.suit === "pentacles") return "stabilize";
  if (last.suit === "swords" || signals.courtCount >= 2) return "clarify";
  return "transform";
}

export function createReadingSkeleton(cardIds: readonly number[]): ReadingSkeleton {
  const orderedCardIds = asCardTriple(cardIds);
  const cards = getTarotCards(orderedCardIds);
  const signals = analyzeRelationships(cards);
  const relationships: ReadingSkeleton["relationships"][number][] = [];
  if (signals.repeatedSuit) relationships.push("same-suit");
  if (signals.majorCount >= 2) relationships.push("major-weight");
  if (signals.courtCount >= 2) relationships.push("court-dynamic");
  if (signals.progression && signals.progression !== "mixed") relationships.push("rank-progression");
  if (signals.contradiction) relationships.push("conflict");
  if (cards[0].suit !== cards[2].suit || cards[0].arcana !== cards[2].arcana) relationships.push("handoff");
  const centralTension = tensionFor(cards, signals);
  const last = cards[2];
  const dominantCardId = last.arcana === "major" || centralTension !== "none" ? last.arcana === "major" ? last.id : cards[1].id : cards[1].id;

  return {
    canonicalKey: createCanonicalCombinationKey(orderedCardIds),
    orderedCardIds,
    dominantCardId,
    centralTension,
    direction: directionFor(cards, signals),
    relationships,
    signals,
  };
}

export function bindReadingSkeleton(precomputed: ReadingSkeleton, orderedCardIds: readonly number[]): ReadingSkeleton {
  const runtime = createReadingSkeleton(orderedCardIds);
  if (runtime.canonicalKey !== precomputed.canonicalKey) {
    throw new Error("Precomputed skeleton does not match selected cards");
  }
  return {
    ...runtime,
    relationships: precomputed.relationships,
    signals: precomputed.signals,
  };
}

function stanceFor(profile: StructuredQuestionProfile, skeleton: ReadingSkeleton, cards: readonly TarotCard[]): ReadingStance {
  const finalId = cards[2].id;
  const hasReleaseFinal = [13, 16, 21].includes(finalId);
  const hardStop = [15, 16].includes(finalId) || (skeleton.signals.difficultCount >= 2 && skeleton.direction === "pause");

  if (profile.action === "marry") return hardStop ? "wait" : hasReleaseFinal ? "conditional-yes" : skeleton.direction === "advance" ? "lean-yes" : "conditional";
  if (["end-relationship", "finish"].includes(profile.action)) return hasReleaseFinal ? "lean-yes" : skeleton.direction === "pause" ? "wait" : "conditional";
  if (["change-job", "start"].includes(profile.action)) return skeleton.centralTension === "attachment" || hardStop ? "wait" : skeleton.direction === "advance" ? "lean-yes" : "conditional";
  if (profile.action === "stay-job") return skeleton.centralTension === "burden" || skeleton.signals.difficultCount >= 2 ? "lean-no" : "conditional";
  if (["repay-debt", "invest", "spend"].includes(profile.action)) return profile.action === "repay-debt" ? "conditional-yes" : skeleton.direction === "stabilize" || skeleton.centralTension === "uncertainty" ? "wait" : "conditional";
  if (profile.action === "contact") return skeleton.signals.supportiveCount > skeleton.signals.difficultCount && skeleton.direction === "advance" ? "conditional-yes" : "wait";
  if (profile.action === "other-person") return "unclear";
  if (profile.action === "future") return "conditional";
  return skeleton.direction === "release" ? "lean-yes" : skeleton.direction === "advance" ? "lean-yes" : "conditional";
}

function verdictLine(profile: StructuredQuestionProfile, stance: ReadingStance): string {
  const generic: Record<ReadingStance, string> = {
    yes: "저라면 해도 된다고 볼 것 같아요.",
    "lean-yes": "지금은 그쪽으로 움직여도 괜찮아 보여요.",
    "conditional-yes": "방향 자체를 말리지는 않아요. 다만 조건 하나는 먼저 풀어야 해요.",
    wait: "지금 바로 결정하지 않는 쪽으로 봐요.",
    conditional: "할 수는 있지만, 지금 방식 그대로는 조금 걸려요.",
    "lean-no": "지금은 그 선택을 오래 끌고 가기 어려워 보여요.",
    no: "저라면 이번에는 하지 않을 것 같아요.",
    unclear: "카드만으로 상대 마음을 단정하긴 어려워요.",
  };
  if (profile.action === "marry" && stance === "conditional-yes") return "결혼 자체를 말리는 조합은 아니에요. 다만 지금 관계의 방식 그대로 서두르는 건 조금 걸립니다.";
  if (profile.action === "repay-debt" && stance === "conditional-yes") return "빚을 먼저 정리하는 쪽에 무게가 실려요. 다만 생활비까지 흔들릴 정도로 몰아붙이라는 뜻은 아니에요.";
  if (profile.action === "finish" && stance === "lean-yes") return "이 일은 한 번 닫고 다음으로 넘어가도 괜찮아 보여요.";
  if (profile.action === "other-person") return "마음이 없다고 단정할 조합은 아니에요. 그렇다고 행동으로 옮길 만큼 분명하다고도 보기 어렵습니다.";
  return generic[stance];
}

function cardSituation(card: TarotCard, role: "background" | "tension" | "direction"): string {
  const special: Partial<Record<number, string>> = {
    13: "실제 죽음이 아니라, 지금까지 통하던 방식 하나를 끝내야 한다는 카드예요.",
    16: "이미 금이 간 전제를 그대로 밀면 더 크게 흔들릴 수 있다는 쪽이에요.",
    21: "한 단계를 닫고 다음으로 넘어갈 준비가 된 모습을 보여줘요.",
    41: "두 사람 사이에 이미 쌓인 시간과 익숙함을 보여줘요.",
    35: "누군가가 관계나 일을 자기 속도로 앞으로 끌고 가려는 태도에 가까워요.",
    67: "싫어서 못 움직이는 것보다, 지금 가진 것을 잃기 싫어 멈춘 모습에 가까워요.",
    71: "새로운 곳으로 가기 전에도, 지금 쌓아 둔 실력과 준비가 실제로 통하는지 확인하라는 쪽이에요.",
    33: "움직일 힘은 충분하지만, 방향을 정하지 않은 속도는 오히려 피곤해질 수 있다고 말해요.",
    5: "남의 기준을 따르라는 뜻보다, 오래 납득할 기준을 세우라는 쪽에 가까워요.",
    17: "지금 기대하는 일을 너무 빨리 접지 않아도 된다는 쪽이에요.",
  };
  const specialLine = special[card.id];
  if (specialLine) return `${card.name} 카드는 ${specialLine}`;
  if (role === "background") {
    if (card.suit === "cups") return `첫 장 ${card.name} 카드는 감정이나 관계의 기억이 이미 선택에 들어와 있다는 쪽이에요.`;
    if (card.suit === "pentacles") return `첫 장 ${card.name} 카드는 돈, 생활, 익숙한 조건을 쉽게 놓기 어렵다는 배경을 보여줘요.`;
    if (card.suit === "wands") return `첫 장 ${card.name} 카드는 더는 미루고 싶지 않은 마음이 이미 쌓였다는 배경에 가까워요.`;
    if (card.suit === "swords") return `첫 장 ${card.name} 카드는 장단점을 오래 따져 온 끝에 마음속 답이 어느 정도 생겼다는 쪽이에요.`;
    return `첫 장 ${card.name} 카드는 지금까지 무엇을 중요하게 여겨왔는지 보여줘요.`;
  }
  if (role === "tension") {
    if (card.suit === "swords") return `가운데 ${card.name} 카드는 생각을 너무 오래 비교하느라 판단이 늦어지는 대목에 가까워요.`;
    if (card.suit === "wands") return `가운데 ${card.name} 카드는 마음보다 속도가 먼저 나가려는 대목에 가까워요.`;
    if (card.suit === "cups") return `가운데 ${card.name} 카드는 사실보다 상대의 반응이나 내 기분을 먼저 예상하게 만드는 대목이에요.`;
    if (card.suit === "pentacles") return `가운데 ${card.name} 카드는 마음보다 준비, 돈, 시간 같은 현실 조건을 먼저 보게 하는 대목이에요.`;
    return `가운데 ${card.name} 카드는 지금 쉽게 넘기면 안 되는 기준 하나를 보여줘요.`;
  }
  if (card.suit === "pentacles") return `마지막 ${card.name} 카드는 말보다 돈, 시간, 생활 조건처럼 손에 잡히는 기준을 보라고 해요.`;
  if (card.suit === "swords") return `마지막 ${card.name} 카드는 스스로 납득할 한 문장을 정해야 한다는 쪽이에요.`;
  if (card.suit === "cups") return `마지막 ${card.name} 카드는 하고 난 뒤에도 마음이 오래 편할 선택을 보라고 해요.`;
  if (card.suit === "wands") return `마지막 ${card.name} 카드는 준비한 만큼은 실제로 움직여보라는 쪽이에요.`;
  return `마지막 ${card.name} 카드는 지금의 선택이 오래 남길 기준을 다시 보라고 해요.`;
}

function relationshipSituation(skeleton: ReadingSkeleton, cards: readonly TarotCard[]): string {
  if (skeleton.relationships.includes("same-suit") && cards[0].suit) return `${cards[0].suit === "cups" ? "감정" : cards[0].suit === "pentacles" ? "생활 조건" : cards[0].suit === "wands" ? "움직이고 싶은 마음" : "생각과 판단"}이 세 장에 반복돼, 한 가지 문제를 다른 장면에서 다시 보여주는 조합이에요.`;
  if (skeleton.relationships.includes("court-dynamic")) return "인물 카드가 겹쳐서 상황보다 누가 속도를 정하고, 누가 맞추고 있는지가 더 중요해 보여요.";
  if (skeleton.relationships.includes("rank-progression")) return "숫자가 이어져서, 작은 선택이 실제 결과로 커지는 순서를 보여줘요.";
  if (skeleton.relationships.includes("conflict")) {
    if (skeleton.direction === "pause") return "첫 장은 빨리 움직이게 하고 마지막 장은 감정을 정리한 뒤 보라고 해서, 지금은 속도를 하나로 맞추는 일이 먼저예요.";
    if (skeleton.direction === "release") return "첫 장이 붙잡는 것과 마지막 장이 끝내야 한다고 말하는 것이 달라서, 둘을 동시에 지키려 하면 더 답답해질 수 있어요.";
    return "첫 장이 원하는 것과 마지막 장이 요구하는 조건이 달라서, 무엇을 먼저 선택할지 정해야 해요.";
  }
  if (skeleton.relationships.includes("major-weight")) return "큰 카드가 겹쳐서 기분 하나보다, 앞으로도 납득할 기준을 고르는 문제에 가까워요.";
  return `${cards[0].name}이 먼저 붙잡은 마음을 ${cards[1].name}에서 현실적으로 확인한 뒤, ${cards[2].name} 쪽으로 움직이라는 순서에 가까워요.`;
}

function closingFor(profile: StructuredQuestionProfile, stance: ReadingStance, skeleton: ReadingSkeleton): string {
  if (profile.action === "marry") return "결혼하면 자연스럽게 풀릴 거라며 미뤄둔 문제가 있다면, 그 얘기부터 두 사람이 해보는 게 좋겠어요.";
  if (profile.action === "change-job") return stance === "wait" ? "그만둘 이유와 갈 곳에서 꼭 얻고 싶은 조건이 같은 답인지 먼저 보세요." : "움직이기 전에 새 자리에서 절대 양보하지 않을 조건 하나만 정해두세요.";
  if (profile.action === "repay-debt") return "갚을 금액보다 먼저, 갚고도 남아야 할 생활비를 정해두는 편이 안전해요.";
  if (profile.action === "end-relationship") return "마지막으로 확인할 사실 하나만 정하고, 그 뒤에는 같은 대화를 되풀이하지 않는 편이 낫겠어요.";
  if (profile.action === "other-person") return "상대의 침묵을 해석하기보다, 실제로 오간 말과 행동을 기준으로 두세요.";
  if (stance === "wait" || skeleton.direction === "pause") return "오늘 결론을 내리지 않아도 괜찮아요. 지금 빠뜨린 조건이 없는지만 보면 됩니다.";
  if (skeleton.direction === "release") return "이미 끝난 일을 붙잡고 있는 부분이 무엇인지부터 보면, 다음 선택이 조금 가벼워질 거예요.";
  if (skeleton.direction === "stabilize") return "이번에는 마음이 급해지는 순간보다 생활이 흔들리지 않는 쪽을 먼저 고르는 편이 낫겠어요.";
  return "오늘 바로 바꿀 수 있는 한 가지와, 더 시간을 두고 볼 한 가지를 나눠두세요.";
}

export function interpretStructuredReading(cardIds: readonly number[], question = "", precomputed?: ReadingSkeleton): InterpretationV2 {
  const ordered = asCardTriple(cardIds);
  const cards = getTarotCards(ordered);
  const skeleton = precomputed ? bindReadingSkeleton(precomputed, ordered) : createReadingSkeleton(ordered);
  const profile = createQuestionProfile(question, cards);
  const stance = stanceFor(profile, skeleton, cards);
  const [first, middle, last] = cards;
  const labels = narrativeLabels(skeleton.relationships.includes("conflict") ? "conflict" : skeleton.relationships.includes("same-suit") ? "same-direction" : skeleton.signals.majorCount >= 2 ? "major" : skeleton.direction === "transform" ? "turn" : "middle");
  const headline = verdictLine(profile, stance);
  const story = `${question ? `“${excerptQuestion(question)}”라는 질문에 세 장을 같이 놓고 보면, ` : "질문 없이 고른 세 장을 보면, "}${cardSituation(first, "background")} ${cardSituation(middle, "tension")} ${relationshipSituation(skeleton, cards)}`;
  const advice = `${cardSituation(last, "direction")} ${skeleton.relationships.includes("conflict") ? "그래서 앞의 마음과 마지막 선택을 한꺼번에 만족시키려 하기보다, 무엇을 먼저 바꿀지 정해야 해요." : "이 조건을 실제 선택 기준으로 삼으면 카드 세 장이 한쪽 이야기가 됩니다."}`;
  const closing = closingFor(profile, stance, skeleton);
  const characterCount = [headline, story, advice, closing].join(" ").length;
  return { headline, story, advice, closing, intent: profile.intent, questionType: profile.questionType, stance, signals: skeleton.signals, characterCount, pattern: labels.story.includes("첫 장") ? "conflict" : labels.story.includes("같은") ? "same-direction" : labels.story.includes("무게") ? "major" : labels.story.includes("마지막") ? "turn" : "middle", labels };
}

export function interpretTarotV2(cardIds: readonly number[], question = ""): InterpretationV2 {
  return interpretStructuredReading(cardIds, question);
}
