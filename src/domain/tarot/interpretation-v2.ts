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
      return { story: "처음과 끝이 다른 속도로 가요", advice: "마음이 멈춘 자리", closing: "오늘 해볼 일" };
    case "same-direction":
      return { story: "세 장이 한 가지를 반복해요", advice: "계속 눈에 밟히는 것", closing: "작게 시작할 일" };
    case "turn":
      return { story: "끝에서 흐름이 바뀌어요", advice: "마지막 카드가 남긴 말", closing: "다음에 볼 것" };
    case "major":
      return { story: "이번 조합의 무게", advice: "가볍게 넘기기 어려운 대목", closing: "오늘의 기준" };
    case "middle":
    default:
      return { story: "가운데 카드에 답이 모여요", advice: "그 자리에서 걸린 것", closing: "지금 해볼 것" };
  }
}


export function createQuestionProfile(question: string, cards: readonly TarotCard[]): StructuredQuestionProfile {
  const normalized = normalizeQuestion(question);
  const asksAboutAnotherPerson = OTHER_PERSON_PHRASES.some((phrase) => normalized.includes(phrase));
  const asksAboutFuture = FUTURE_PHRASES.some((phrase) => normalized.includes(phrase));
  const action: ReadingAction =
    asksAboutAnotherPerson ? "other-person" :
    asksAboutFuture ? "future" :
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
    "open";

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

function verdictLine(profile: StructuredQuestionProfile, stance: ReadingStance, skeleton?: ReadingSkeleton): string {
  if (profile.action === "open") {
    if (skeleton?.direction === "release") return "이미 바뀐 흐름을 인정할 때예요.";
    if (skeleton?.direction === "advance") return "움직일 힘은 있어요. 다만 속도는 직접 정해야 해요.";
    if (skeleton?.direction === "stabilize") return "이번 선택은 생활의 바닥부터 살펴야 해요.";
    if (skeleton?.direction === "clarify") return "생각을 줄이고 기준을 한 줄로 세울 때예요.";
    if (skeleton?.direction === "transform") return "익숙한 방식을 그대로 두지 말고, 한 군데부터 바꿔볼 때예요.";
    return "답을 서두르기보다, 멈춘 이유부터 볼 때예요.";
  }
  const actionLabel: Partial<Record<ReadingAction, string>> = {
    marry: "결혼",
    "change-job": "이직",
    "stay-job": "지금 회사에 남는 일",
    "end-relationship": "관계를 정리하는 일",
    contact: "연락",
    "repay-debt": "빚을 갚는 일",
    invest: "투자",
    spend: "큰 지출",
    finish: "이 일을 마무리하는 것",
    continue: "계속 이어가는 것",
    start: "새로 시작하는 일",
    wait: "조금 더 기다리는 것",
  };
  const label = actionLabel[profile.action];
  const generic: Record<ReadingStance, string> = {
    yes: `${label ?? "이번 선택"} 쪽으로 가도 괜찮아 보여요.`,
    "lean-yes": `${label ?? "이번 선택"} 쪽으로 한 걸음 옮겨도 괜찮아 보여요.`,
    "conditional-yes": `${label ?? "그 방향"}${objectParticle(label ?? "그 방향")} 말리지는 않아요. 다만 먼저 풀어야 할 조건이 하나 있어요.`,
    wait: `${label ?? "이번 선택"}은 지금 바로 결정하기보다 조금 더 살펴보는 쪽이 좋아 보여요.`,
    conditional: `${label ?? "그 선택"}${objectParticle(label ?? "그 선택")} 막지는 않지만, 지금 방식은 한 번 손볼 필요가 있어요.`,
    "lean-no": `${label ?? "그 선택"}${objectParticle(label ?? "그 선택")} 오래 끌고 가기는 어려워 보여요.`,
    no: "이번에는 멈춰서 다시 따져보는 편이 좋아 보여요.",
    unclear: "카드만으로 상대 마음을 단정하긴 어려워요.",
  };
  if (profile.action === "marry" && stance === "conditional-yes") return "결혼 자체를 말리는 조합은 아니에요. 다만 지금 관계의 방식 그대로 서두르는 건 조금 걸려요.";
  if (profile.action === "repay-debt" && stance === "conditional-yes") return "빚을 먼저 정리하는 쪽에 무게가 실려요. 다만 생활비까지 흔들 정도로 몰아붙이라는 뜻은 아니에요.";
  if (profile.action === "finish" && stance === "lean-yes") return "이 일은 한 번 닫고 다음으로 넘어가도 괜찮아 보여요.";
  if (profile.action === "other-person") return "마음이 없다고 단정할 조합은 아니에요. 그렇다고 행동으로 옮길 만큼 분명하다고도 보기 어려워요.";
  if (profile.action === "future") return "앞날을 단정하기보다, 지금 준비할 수 있는 부분부터 살펴봐요.";
  return generic[stance];
}

function cardSituation(card: TarotCard, role: "background" | "tension" | "direction"): string {
  const special: Partial<Record<number, string>> = {
    13: "실제 죽음을 뜻하기보다, 지금까지 통하던 방식 하나를 끝내야 한다는 쪽에 가까워요.",
    16: "이미 금이 간 전제를 그대로 밀면 더 크게 흔들릴 수 있다고 말해요.",
    21: "한 단계를 닫고 다음으로 넘어갈 준비가 되어 있다고 읽혀요.",
    41: "두 사람 사이에 이미 쌓인 시간과 익숙함이 먼저 읽혀요.",
    35: "관계나 일을 자기 속도로 끌고 가려는 태도가 느껴져요.",
    67: "싫어서 못 움직이기보다, 지금 가진 것을 잃기 싫어 멈춘 모습에 가까워요.",
    71: "새로운 곳으로 가기 전에, 지금 쌓은 실력과 준비가 실제로 통하는지 확인하라고 해요.",
    33: "움직일 힘은 충분해요. 다만 방향 없는 속도는 오히려 피곤하게 만들 수 있어요.",
    5: "남의 기준을 따르기보다, 오래 납득할 기준을 세우라는 쪽에 가까워요.",
    17: "지금 기대하는 일을 너무 빨리 접지 않아도 된다고 말해요.",
  };
  const specialLine = special[card.id];
  if (specialLine) return `${card.name}${topicParticle(card.name)} ${specialLine}`;
  const light = cardMeaningCore(card, "light");
  const shadow = cardMeaningCore(card, "shadow");
  if (role === "background") {
    const variants = [
      `${card.name}${subjectParticle(card.name)} 첫 자리에 놓이면서 ${light}${subjectParticle(light)} 지금까지의 바탕으로 읽혀요.`,
      `처음부터 ${light} 쪽으로 마음이 기울어 있었어요. 첫 장의 ${card.name}${subjectParticle(card.name)} 그 흐름을 짚어요.`,
      `지금까지의 마음에는 ${light}${subjectParticle(light)} 먼저 깔려 있었어요. ${card.name}${subjectParticle(card.name)} 그 흐름을 말해요.`,
    ];
    return variants[card.id % variants.length];
  }
  if (role === "tension") {
    const variants = [
      `가운데 ${card.name}${subjectParticle(card.name)} ${light}${objectParticle(light)} 살릴지, ${shadow}${objectParticle(shadow)} 피할지 묻고 있어요.`,
      `가운데 놓인 ${card.name}${subjectParticle(card.name)} ${light}${objectParticle(light)} 살리려면 ${shadow}${objectParticle(shadow)} 먼저 살펴야 한다고 말해요.`,
      `${card.name} 앞에서 마음이 멈춘 이유는 ${shadow}${subjectParticle(shadow)} 가까워요. 반대로 ${light}${objectParticle(light)} 선택하면 다음 장면이 달라져요.`,
    ];
    return variants[card.id % variants.length];
  }
  const variants = [
    `마지막 ${card.name}${subjectParticle(card.name)} ${light}${objectParticle(light)} 다음 기준으로 남겨요.`,
    `끝에 놓인 ${card.name}${subjectParticle(card.name)} ${light} 쪽으로 한 걸음 옮겨 보라고 해요.`,
    `마지막에는 ${light}${subjectParticle(light)} 필요해 보여요. ${card.name}${subjectParticle(card.name)} 그 방향을 가리켜요.`,
  ];
  return variants[card.id % variants.length];
}

function cardMeaningCore(card: TarotCard, tone: "light" | "shadow"): string {
  const prefixes: Record<string, string> = {
    wands: tone === "light" ? "열정에 불을 붙이며 " : "열기에 휩쓸려 ",
    cups: tone === "light" ? "감정의 흐름을 살피며 " : "감정에 잠겨 ",
    swords: tone === "light" ? "판단을 또렷하게 하며 " : "생각이 과열되어 ",
    pentacles: tone === "light" ? "현실을 단단히 만들며 " : "안정에만 매여 ",
  };
  const prefix = card.suit ? prefixes[card.suit] : undefined;
  return prefix && card.meaning[tone].startsWith(prefix) ? card.meaning[tone].slice(prefix.length) : card.meaning[tone];
}

function hasFinalConsonant(value: string): boolean {
  const last = value.charCodeAt(value.length - 1);
  if (last >= 0xac00 && last <= 0xd7a3) return (last - 0xac00) % 28 !== 0;
  const digitJongseong: Record<string, boolean> = { "0": true, "1": true, "2": false, "3": true, "4": false, "5": false, "6": true, "7": true, "8": true, "9": false };
  return digitJongseong[value.at(-1) ?? ""] ?? false;
}

function subjectParticle(value: string): "이" | "가" {
  return hasFinalConsonant(value) ? "이" : "가";
}

function topicParticle(value: string): "은" | "는" {
  return hasFinalConsonant(value) ? "은" : "는";
}

function objectParticle(value: string): "을" | "를" {
  return hasFinalConsonant(value) ? "을" : "를";
}

function relationshipSituation(skeleton: ReadingSkeleton, cards: readonly TarotCard[]): string {
  if (skeleton.relationships.includes("same-suit") && cards[0].suit) {
    const repeated = cards[0].suit === "cups" ? "감정" : cards[0].suit === "pentacles" ? "생활 조건" : cards[0].suit === "wands" ? "움직이고 싶은 마음" : "생각과 판단";
    return `${repeated}${subjectParticle(repeated)} 세 장에 이어져요. 한 문제를 서로 다른 각도에서 보고 있는 조합이에요.`;
  }
  if (skeleton.relationships.includes("court-dynamic")) return "인물 카드가 겹쳐서 상황보다 누가 속도를 정하고, 누가 맞추고 있는지가 더 중요해 보여요.";
  if (skeleton.relationships.includes("rank-progression")) return "숫자가 이어져서, 작은 선택이 실제 결과로 커지는 순서를 보여줘요.";
  if (skeleton.relationships.includes("conflict")) {
    if (skeleton.direction === "pause") return "처음의 마음은 서두르라고 하지만 끝의 카드는 감정을 정리한 뒤 보라고 해요. 지금은 속도를 하나로 맞추는 일이 먼저예요.";
    if (skeleton.direction === "release") return "처음에는 붙잡고 싶고 끝에서는 정리하라고 해요. 둘을 한꺼번에 지키려 하지 말고, 먼저 내려놓을 것을 골라야 해요.";
    return "처음의 마음과 끝의 요구가 달라요. 무엇을 먼저 선택할지 정하면 흐름이 훨씬 또렷해져요.";
  }
  if (skeleton.relationships.includes("major-weight")) return "메이저 카드가 두 장 이상이라, 기분 하나보다 앞으로도 납득할 기준을 고르는 문제에 가까워요.";
  return `처음 카드 ${cards[0].name}에서 보인 마음을 ${cards[1].name}에서 확인한 뒤, ${cards[2].name} 쪽으로 옮겨 가는 흐름이에요.`;
}

function closingFor(profile: StructuredQuestionProfile, stance: ReadingStance, skeleton: ReadingSkeleton): string {
  if (profile.action === "open") {
    if (skeleton.direction === "pause") return "오늘은 결론 대신, 빠뜨린 조건 하나만 적어두세요.";
    if (skeleton.direction === "release") return "이미 끝난 대화나 습관 중 하나를 오늘은 내려놓아 보세요.";
    if (skeleton.direction === "advance") return "미루던 일에서 가장 작은 첫 동작을 오늘 해보세요.";
    if (skeleton.direction === "stabilize") return "돈과 시간을 흔들지 않는 선에서 할 일을 하나만 정해보세요.";
    if (skeleton.direction === "clarify") return "마음을 흔드는 이유를 한 문장으로 적고, 내일 다시 읽어보세요.";
    return "익숙한 방법 하나를 바꿔서 작게 시험해보세요.";
  }
  if (profile.action === "marry") return "결혼하면 자연스럽게 풀릴 거라며 미뤄둔 문제가 있다면, 그 얘기부터 두 사람이 해보는 게 좋겠어요.";
  if (profile.action === "change-job") return stance === "wait" ? "그만둘 이유와 갈 곳에서 꼭 얻고 싶은 조건이 같은 답인지 먼저 보세요." : "움직이기 전에 새 자리에서 절대 양보하지 않을 조건 하나만 정해두세요.";
  if (profile.action === "repay-debt") return "갚을 금액보다 먼저, 갚고도 남아야 할 생활비를 정해두는 편이 안전해요.";
  if (profile.action === "end-relationship") return "마지막으로 확인할 사실 하나만 정하고, 그 뒤에는 같은 대화를 되풀이하지 않는 편이 낫겠어요.";
  if (profile.action === "other-person") return "상대의 침묵을 해석하기보다, 실제로 오간 말과 행동을 기준으로 두세요.";
  if (profile.action === "future") return "아직 오지 않은 결과를 재촉하기보다, 이번 주에 준비할 수 있는 한 가지를 정해보세요.";
  if (stance === "wait" || skeleton.direction === "pause") return "오늘 결론을 내리지 않아도 괜찮아요. 지금 빠뜨린 조건이 없는지만 살펴보세요.";
  if (skeleton.direction === "release") return "이미 끝난 일을 붙잡고 있는 부분이 무엇인지부터 보면, 다음 선택이 조금 가벼워질 거예요.";
  if (skeleton.direction === "stabilize") return "이번에는 마음이 급해지는 순간보다 생활이 흔들리지 않는 쪽을 먼저 고르는 편이 낫겠어요.";
  return "오늘 바로 할 수 있는 작은 일 하나를 정하고, 나머지는 조금 더 지켜보세요.";
}

export function interpretStructuredReading(cardIds: readonly number[], question = "", precomputed?: ReadingSkeleton): InterpretationV2 {
  const ordered = asCardTriple(cardIds);
  const cards = getTarotCards(ordered);
  const skeleton = precomputed ? bindReadingSkeleton(precomputed, ordered) : createReadingSkeleton(ordered);
  const profile = createQuestionProfile(question, cards);
  const stance = stanceFor(profile, skeleton, cards);
  const [first, middle, last] = cards;
  const labels = narrativeLabels(skeleton.relationships.includes("conflict") ? "conflict" : skeleton.relationships.includes("same-suit") ? "same-direction" : skeleton.signals.majorCount >= 2 ? "major" : skeleton.direction === "transform" ? "turn" : "middle");
  const headline = verdictLine(profile, stance, skeleton);
  const story = `${question ? `“${excerptQuestion(question)}”라는 질문에 세 장을 같이 놓고 보면, ` : "질문 없이 고른 세 장에서는, "}${cardSituation(first, "background")} ${cardSituation(middle, "tension")} ${relationshipSituation(skeleton, cards)}`;
  const adviceBridge = profile.action === "other-person"
    ? "상대의 다음 행동을 기다리는 대신, 내가 확인할 사실 하나를 정해보세요."
    : profile.action === "future"
      ? "이번 주에 준비할 수 있는 작은 행동 하나로 좁혀보세요."
      : skeleton.relationships.includes("conflict")
        ? "앞의 마음과 끝의 요구를 한꺼번에 만족시키려 하지 말고, 먼저 움직일 한 가지를 정해보세요."
    : skeleton.direction === "advance"
      ? "이번 주 안에 작게라도 시작해보세요."
      : skeleton.direction === "stabilize"
        ? "숫자 하나로 확인해보면 감정에 휩쓸리지 않아요."
        : skeleton.direction === "clarify"
          ? "말로만 돌지 않게 기준을 한 줄로 적어보세요."
          : skeleton.direction === "pause"
            ? "하루 정도 거리를 두고 다시 읽어보세요."
            : skeleton.direction === "release"
              ? "이미 끝난 것과 계속할 것을 나눠 적어보세요."
              : "익숙한 방식 하나만 바꿔서 시험해보세요.";
  const advice = `${cardSituation(last, "direction")} ${adviceBridge}`;
  const closing = closingFor(profile, stance, skeleton);
  const characterCount = [headline, story, advice, closing].join(" ").length;
  return { headline, story, advice, closing, intent: profile.intent, questionType: profile.questionType, stance, signals: skeleton.signals, characterCount, pattern: skeleton.relationships.includes("conflict") ? "conflict" : skeleton.relationships.includes("same-suit") ? "same-direction" : skeleton.signals.majorCount >= 2 ? "major" : skeleton.direction === "transform" ? "turn" : "middle", labels };
}

export function interpretTarotV2(cardIds: readonly number[], question = ""): InterpretationV2 {
  return interpretStructuredReading(cardIds, question);
}
