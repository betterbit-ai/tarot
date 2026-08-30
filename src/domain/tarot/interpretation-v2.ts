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
  cardSummary: string;
  majorSummary: string;
  cardInsights: readonly ReadingCardInsight[];
  flow: string;
  application: string;
  mindset: string;
};

export type ReadingCardInsight = {
  cardId: number;
  name: string;
  keywords: string;
  visualEvidence: string;
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
  | "return"
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
const RETURN_PHRASES = ["컴백", "복귀", "돌아오", "재결합", "재개"];

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
  const asksAboutReturn = RETURN_PHRASES.some((phrase) => normalized.includes(phrase));
  const action: ReadingAction =
    asksAboutAnotherPerson ? "other-person" :
    asksAboutFuture ? "future" :
    asksAboutReturn ? "return" :
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
    ["marry", "change-job", "stay-job", "end-relationship", "contact", "repay-debt", "invest", "spend", "finish", "continue", "start", "wait"].includes(action) || (action === "return" && /(할까요|해야|맞을까요)/.test(normalized)) || /(결정을 내려|결정할|선택을)/.test(normalized) ? "decision" : "open";

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
  if (profile.action === "return") return "돌아오는 일보다, 어떤 모습으로 돌아올지가 더 중요해 보여요.";
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

const MINOR_READING_MEANINGS: Record<Suit, Record<string, { light: string; shadow: string }>> = {
    wands: {
      ace: { light: "새로운 열정과 시작", shadow: "불만 남고 끝나는 충동" }, two: { light: "다음 계획을 세우는 시야", shadow: "계획만 세우며 머무는 망설임" }, three: { light: "가능성을 넓히는 확장", shadow: "기대만 키우는 기다림" }, four: { light: "함께 누리는 안정", shadow: "익숙한 자리만 지키는 안일함" }, five: { light: "경쟁 속에서 실력을 겨루는 힘", shadow: "소모적인 충돌" }, six: { light: "인정을 받는 성취", shadow: "칭찬에 기대는 마음" }, seven: { light: "자기 자리를 지키는 버팀", shadow: "방어에 지치는 상태" }, eight: { light: "빠르게 진행되는 소식", shadow: "쫓기듯 움직이는 속도" }, nine: { light: "끝까지 버티는 회복력", shadow: "경계심이 높아진 피로" }, ten: { light: "책임을 다하는 완수", shadow: "혼자 떠안은 과부하" }, page: { light: "새 아이디어를 반기는 호기심", shadow: "가벼운 흥분에 휩쓸림" }, knight: { light: "거침없이 나아가는 추진력", shadow: "브레이크 없는 돌진" }, queen: { light: "자신 있게 드러내는 창의성", shadow: "상대를 누르는 자신감" }, king: { light: "방향을 이끄는 리더십", shadow: "강하게 밀어붙이는 독단" },
    },
    cups: {
      ace: { light: "새로 열리는 감정", shadow: "감정에 휩쓸리는 기대" }, two: { light: "서로 통하는 마음", shadow: "상대에게 맞추느라 잃는 중심" }, three: { light: "함께 기뻐하는 관계", shadow: "분위기에 휩쓸리는 가벼움" }, four: { light: "마음을 쉬게 하는 멈춤", shadow: "아무것도 하고 싶지 않은 무기력" }, five: { light: "상실을 인정하고 회복하는 마음", shadow: "지나간 일에 머무는 후회" }, six: { light: "따뜻한 기억과 익숙함", shadow: "과거를 미화하는 그리움" }, seven: { light: "여러 가능성을 상상하는 마음", shadow: "환상에 빠져 선택을 미루는 상태" }, eight: { light: "더 맞는 곳을 찾아 떠나는 결심", shadow: "마음을 닫고 도망치는 거리" }, nine: { light: "원하는 것을 누리는 만족", shadow: "혼자만의 만족에 갇힘" }, ten: { light: "함께 만드는 정서적 안정", shadow: "겉으로만 평온한 관계" }, page: { light: "솔직한 감정의 소식", shadow: "감정적으로 서툰 반응" }, knight: { light: "마음을 전하는 다정한 제안", shadow: "말만 앞서는 낭만" }, queen: { light: "감정을 다루는 성숙함", shadow: "감정을 대신 책임지려는 통제" }, king: { light: "감정의 중심을 잡는 안정감", shadow: "감정을 숨긴 채 버티는 태도" },
    },
    swords: {
      ace: { light: "흐릿함을 가르는 명확한 판단", shadow: "말로 상대를 베는 날카로움" }, two: { light: "양쪽을 살피는 신중함", shadow: "결정을 미루며 굳어 있는 상태" }, three: { light: "아픈 사실을 마주하는 정직함", shadow: "상처를 반복해서 되새김" }, four: { light: "생각을 쉬게 하는 회복", shadow: "멈춤이 길어지는 정체" }, five: { light: "불편한 쟁점을 드러내는 용기", shadow: "이겨도 남는 소모" }, six: { light: "복잡한 곳을 벗어나는 이동", shadow: "문제를 두고 떠나는 회피" }, seven: { light: "상황을 읽고 움직이는 전략", shadow: "숨기거나 빠져나가려는 태도" }, eight: { light: "두려움의 틀을 알아차리는 시선", shadow: "스스로를 묶는 불안" }, nine: { light: "걱정을 말로 꺼내는 정직함", shadow: "밤마다 커지는 불안" }, ten: { light: "한 갈등을 끝내는 결단", shadow: "이미 끝난 싸움을 붙듦" }, page: { light: "빠르게 배우고 살피는 관찰력", shadow: "경계가 지나친 신경질" }, knight: { light: "즉시 움직이는 결단력", shadow: "생각보다 앞서는 돌진" }, queen: { light: "사실을 가르는 분별력", shadow: "감정을 잘라내는 냉정함" }, king: { light: "논리로 방향을 세우는 권위", shadow: "자기 판단만 옳다고 믿는 완고함" },
    },
    pentacles: {
      ace: { light: "손에 잡히는 새로운 기회", shadow: "기회만 좇는 욕심" }, two: { light: "돈과 시간을 조율하는 감각", shadow: "여러 일을 감당하지 못하는 흔들림" }, three: { light: "기술을 함께 다듬는 협업", shadow: "인정받으려는 조급함" }, four: { light: "가진 것을 지키는 안정감", shadow: "잃을까 봐 움켜쥐는 집착" }, five: { light: "어려움을 함께 견디는 연대", shadow: "부족함에 갇힌 고립" }, six: { light: "공평하게 주고받는 균형", shadow: "도움에 기대거나 생색내는 태도" }, seven: { light: "시간을 들여 결과를 기다리는 인내", shadow: "성과를 재촉하는 조급함" }, eight: { light: "반복하며 쌓는 실력", shadow: "일에 몰입해 좁아지는 시야" }, nine: { light: "혼자서도 세우는 생활 기반", shadow: "혼자 감당하려는 고립" }, ten: { light: "오래 이어지는 생활의 기반", shadow: "가족과 책임에 눌리는 부담" }, page: { light: "현실적인 배움과 기회", shadow: "준비만 하며 늦어지는 실행" }, knight: { light: "꾸준히 이어가는 성실함", shadow: "변화를 거부하는 느린 고집" }, queen: { light: "생활을 돌보는 실용성", shadow: "모든 것을 통제하려는 걱정" }, king: { light: "현실을 안정시키는 능력", shadow: "성과로 사람을 판단하는 태도" },
    },
};

function cardMeaningCore(card: TarotCard, tone: "light" | "shadow"): string {
  const minorMeanings = MINOR_READING_MEANINGS;
  if (card.suit && card.rank !== null) {
    const meaning = minorMeanings[card.suit][card.rank];
    if (meaning) return meaning[tone];
  }
  const prefixes: Record<string, string> = {
    wands: tone === "light" ? "열정에 불을 붙이며 " : "열기에 휩쓸려 ",
    cups: tone === "light" ? "감정의 흐름을 살피며 " : "감정에 잠겨 ",
    swords: tone === "light" ? "판단을 또렷하게 하며 " : "생각이 과열되어 ",
    pentacles: tone === "light" ? "현실을 단단히 만들며 " : "안정에만 매여 ",
  };
  const prefix = card.suit ? prefixes[card.suit] : undefined;
  return prefix && card.meaning[tone].startsWith(prefix) ? card.meaning[tone].slice(prefix.length) : card.meaning[tone];
}

export function getEditorialCardMeaning(cardId: number): { light: string; shadow: string } {
  const card = getTarotCards([cardId])[0];
  if (!card) throw new RangeError(`Unknown tarot card id: ${cardId}`);
  return { light: cardMeaningCore(card, "light"), shadow: cardMeaningCore(card, "shadow") };
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
  if (profile.action === "return") return "예전의 모습을 그대로 되돌리려 하기보다, 이번에 새로 보여줄 한 가지를 정해보세요.";
  if (stance === "wait" || skeleton.direction === "pause") return "오늘 결론을 내리지 않아도 괜찮아요. 지금 빠뜨린 조건이 없는지만 살펴보세요.";
  if (skeleton.direction === "release") return "이미 끝난 일을 붙잡고 있는 부분이 무엇인지부터 보면, 다음 선택이 조금 가벼워질 거예요.";
  if (skeleton.direction === "stabilize") return "이번에는 마음이 급해지는 순간보다 생활이 흔들리지 않는 쪽을 먼저 고르는 편이 낫겠어요.";
  return "오늘 바로 할 수 있는 작은 일 하나를 정하고, 나머지는 조금 더 지켜보세요.";
}

const MAJOR_VISUAL_CUES: Readonly<Record<number, string>> = {
  0: "절벽 끝의 인물이 하늘을 보며 첫발을 내디뎌요. 준비보다 호기심이 앞선 장면이에요.",
  1: "탁자 위 도구를 앞에 둔 인물이 한 손을 들어요. 가진 것을 행동으로 꺼내는 모습이에요.",
  2: "두 기둥 사이에 앉은 인물이 두루마리를 품고 있어요. 드러난 말보다 안쪽의 감각을 보게 해요.",
  3: "숲과 곡식 사이에 앉은 인물이 주변을 돌봐요. 서두르기보다 키우는 힘을 보여줘요.",
  4: "돌로 된 왕좌에 앉은 인물이 곧게 앞을 봐요. 기준과 책임을 세우는 모습이에요.",
  5: "두 사람 앞에 선 인물이 의식을 이끌어요. 배운 원칙을 삶에 맞출지 묻는 장면이에요.",
  6: "두 사람이 나무 사이에서 서로를 마주 봐요. 끌림보다 선택과 약속을 생각하게 해요.",
  7: "전차 위 인물이 서로 다른 힘을 한 방향으로 몰아요. 의지를 모아 나아가는 장면이에요.",
  8: "인물이 사자의 입을 부드럽게 다뤄요. 억누르기보다 감정을 길들이는 힘을 보여줘요.",
  9: "등불을 든 인물이 산길에 혼자 서 있어요. 바깥 답보다 자기 속도를 확인하게 해요.",
  10: "하늘의 수레바퀴가 계속 돌아가요. 흐름이 바뀌는 순간을 읽게 해요.",
  11: "저울과 검을 든 인물이 정면을 봐요. 감정보다 사실을 같은 자리에 놓는 장면이에요.",
  12: "한 발을 묶은 인물이 거꾸로 매달려 있어요. 멈춤 속에서 관점을 바꾸는 모습이에요.",
  13: "검은 말 위의 기사가 길을 지나가요. 한 장면을 끝내고 다음으로 넘어가는 변화예요.",
  14: "천사가 두 컵의 물을 천천히 섞어요. 서로 다른 리듬을 맞추는 장면이에요.",
  15: "사슬에 묶인 두 사람이 악마 앞에 서 있어요. 익숙해서 붙든 관계를 돌아보게 해요.",
  16: "번개가 탑을 가르고 사람들이 아래로 떨어져요. 숨겨 둔 균열이 드러나는 순간이에요.",
  17: "밤하늘 아래 인물이 두 그릇의 물을 흘려보내요. 조용히 다시 믿는 힘을 보여줘요.",
  18: "달빛 아래 개와 늑대가 길을 바라봐요. 확실하지 않은 신호를 구분하게 해요.",
  19: "아이와 말이 밝은 해 아래 드러나 있어요. 숨김없이 확인할 수 있는 생기를 보여줘요.",
  20: "관 속 사람들이 나팔 소리에 일어나요. 지나온 일을 다시 불러내는 각성이에요.",
  21: "인물이 월계관 안에서 춤추고 네 상징이 주변을 둘러싸요. 한 주기를 닫는 완성이에요.",
};

const MINOR_VISUAL_CUES: Readonly<Record<Suit, string>> = {
  wands: "그림 속 막대와 인물의 자세가 움직이려는 기세를 드러내요.",
  cups: "컵의 간격과 물의 흐름이 감정의 거리와 교환을 보여줘요.",
  swords: "검의 방향과 인물의 표정이 판단과 긴장을 드러내요.",
  pentacles: "동전과 손의 위치가 돈과 생활의 조건을 보여줘요.",
};

const MINOR_RANK_VISUAL_CUES: Readonly<Record<string, string>> = {
  ace: "하나의 상징이 크게 놓여 시작점을 만들어요.",
  two: "두 요소가 마주해 선택과 균형을 보여줘요.",
  three: "세 요소가 이어져 협력과 확장을 보여줘요.",
  four: "정돈된 구도가 머물 자리와 안정을 보여줘요.",
  five: "인물들의 엇갈린 자세가 부딪힘을 드러내요.",
  six: "주고받는 장면이 균형과 관계의 흐름을 보여줘요.",
  seven: "인물이 경계를 세운 모습에서 버팀이 느껴져요.",
  eight: "반복되는 상징이 꾸준히 쌓는 시간을 보여줘요.",
  nine: "혼자 지켜보는 인물에서 마지막 고비의 긴장이 보여요.",
  ten: "여러 상징이 한 화면에 모여 결과와 부담을 함께 보여줘요.",
  page: "젊은 인물이 상징을 살피며 새 소식을 기다려요.",
  knight: "움직이는 인물이 속도와 추진을 드러내요.",
  queen: "앉아서 장면을 바라보는 인물이 상황을 품는 태도를 보여줘요.",
  king: "정면을 지키는 인물이 방향을 이끄는 힘을 보여줘요.",
};

function visualEvidenceFor(card: TarotCard): string {
  if (card.arcana === "major") return MAJOR_VISUAL_CUES[card.id] ?? "그림의 인물과 상징이 지금의 질문을 한 장면으로 압축해 보여줘요.";
  return `${MINOR_VISUAL_CUES[card.suit ?? "swords"]} ${MINOR_RANK_VISUAL_CUES[card.rank] ?? "장면의 인물과 상징이 지금 필요한 태도를 보여줘요."}`;
}

function createCardInsights(cards: readonly TarotCard[]): readonly ReadingCardInsight[] {
  return cards.map((card) => ({
    cardId: card.id,
    name: card.name,
    keywords: `${cardMeaningCore(card, "light")} · 주의할 점은 ${cardMeaningCore(card, "shadow")}`,
    visualEvidence: visualEvidenceFor(card),
  }));
}

function majorSummaryFor(cards: readonly TarotCard[]): string {
  const count = cards.filter((card) => card.arcana === "major").length;
  if (count === 0) return "메이저 카드는 포함되지 않았어요. 이번 리딩은 일상의 선택과 행동에 더 가까워요.";
  return `메이저 카드 ${count}장이 포함되어 있어요. 개인의 기분보다 오래 남을 기준을 함께 살펴봐요.`;
}

function flowFor(cards: readonly TarotCard[]): string {
  const [first, middle, last] = cards;
  const middleShadow = cardMeaningCore(middle, "shadow");
  return `처음에는 ${first.name}의 ${cardMeaningCore(first, "light")}이 먼저 보여요. 가운데 ${middle.name}에서 ${middleShadow}${objectParticle(middleShadow)} 한 번 살펴봐요. 마지막 ${last.name}에서는 ${cardMeaningCore(last, "light")} 쪽으로 기울어요.`;
}

function applicationFor(profile: StructuredQuestionProfile, skeleton: ReadingSkeleton): string {
  const direction = skeleton.direction === "advance" ? "작게 움직이면 다음 단서가 생길 수 있어요." : skeleton.direction === "pause" ? "서두르면 같은 고민이 반복될 수 있어요." : skeleton.direction === "release" ? "기존 방식을 놓을수록 다음 선택이 선명해질 수 있어요." : skeleton.direction === "stabilize" ? "생활 조건을 먼저 확인하면 흔들림을 줄일 수 있어요." : skeleton.direction === "clarify" ? "기준을 적어두면 대화와 판단이 선명해질 수 있어요." : "익숙한 방식을 한 군데 바꾸면 흐름이 달라질 수 있어요.";
  const context: Partial<Record<ReadingAction, string>> = {
    marry: "결혼을 묻는 상황이라면, 마음보다 두 사람이 합의한 생활 계획이 먼저 드러날 수 있어요.",
    "change-job": "이직을 묻는 상황이라면, 현재의 답답함보다 새 자리의 조건을 비교하는 일이 먼저예요.",
    "stay-job": "회사에 남을지 묻는 상황이라면, 버티는 이유와 얻는 것을 따로 적어보는 편이 좋아요.",
    contact: "연락을 묻는 상황이라면, 상대의 반응을 기다리기보다 내가 원하는 대화의 범위를 정해야 해요.",
    "end-relationship": "관계를 정리할지 묻는 상황이라면, 반복되는 말보다 실제 행동을 기준으로 보게 돼요.",
    "repay-debt": "빚을 갚는 상황이라면, 상환 속도와 생활비 사이의 균형이 핵심이 됩니다.",
    invest: "투자를 묻는 상황이라면, 기대 수익보다 감당할 수 있는 손실부터 확인해야 해요.",
    spend: "큰 지출을 묻는 상황이라면, 사고 싶은 마음과 실제 사용 계획을 나눠봐야 해요.",
    future: "앞날을 묻는 상황이라면, 결과를 기다리는 동안 준비할 수 있는 일이 먼저 보여요.",
    return: "컴백이나 복귀를 묻는 상황이라면, 과거의 아쉬움을 정리한 뒤 팀의 역할과 새 방향을 맞추는 과정이 먼저 생길 수 있어요.",
    "other-person": "상대의 마음을 묻는 상황이라면, 추측보다 오간 말과 행동이 더 정확한 기준이에요.",
  };
  return `${context[profile.action] ?? "일과 관계, 생활 중 지금 가장 걸리는 장면에 이 흐름을 대입해보세요."} ${direction}`;
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
      : profile.action === "return"
        ? "돌아온 뒤 오래 이어갈 방식까지 함께 정해보세요."
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
  const cardInsights = createCardInsights(cards);
  return {
    headline,
    story,
    advice,
    closing,
    intent: profile.intent,
    questionType: profile.questionType,
    stance,
    signals: skeleton.signals,
    characterCount,
    pattern: skeleton.relationships.includes("conflict") ? "conflict" : skeleton.relationships.includes("same-suit") ? "same-direction" : skeleton.signals.majorCount >= 2 ? "major" : skeleton.direction === "transform" ? "turn" : "middle",
    labels,
    cardSummary: `뽑은 카드: ${cards.map((card) => card.name).join(" · ")}`,
    majorSummary: majorSummaryFor(cards),
    cardInsights,
    flow: flowFor(cards),
    application: applicationFor(profile, skeleton),
    mindset: closing,
  };
}

export function interpretTarotV2(cardIds: readonly number[], question = ""): InterpretationV2 {
  return interpretStructuredReading(cardIds, question);
}
