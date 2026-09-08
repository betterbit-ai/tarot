import { getEditorialCardMeaning } from "@/domain/tarot/interpretation-v2";
import { getTarotCard } from "@/domain/tarot/cards";
import type { ContentFormat, ContentQueue, ContentTopic, ThreadsContent } from "./types";

type TopicPlan = { topic: ContentTopic; count: number };

const TOPIC_PLAN: readonly TopicPlan[] = [
  { topic: "LOVE", count: 37 },
  { topic: "GENERAL", count: 26 },
  { topic: "CAREER", count: 16 },
  { topic: "MONEY", count: 11 },
  { topic: "DECISION", count: 10 },
  { topic: "EXPERIMENTAL", count: 5 },
];

const TOPIC_FORMATS: Record<ContentTopic, readonly ContentFormat[]> = {
  LOVE: ["PICK_3", "YES_NO_NOT_YET", "LOVE"],
  GENERAL: ["PICK_3", "YES_NO_NOT_YET"],
  CAREER: ["PICK_3", "YES_NO_NOT_YET", "CAREER"],
  MONEY: ["PICK_3", "YES_NO_NOT_YET", "MONEY"],
  DECISION: ["YES_NO_NOT_YET", "PICK_3"],
  EXPERIMENTAL: ["PICK_3"],
};

const CTA = "세 장을 직접 고르고 싶다면 프로필의 미스터 타로에서 이어서 봐요.";
function hasFinalConsonant(value: string): boolean {
  const last = value.charCodeAt(value.length - 1);
  return last >= 0xac00 && last <= 0xd7a3 ? (last - 0xac00) % 28 !== 0 : false;
}

function objectParticle(value: string): "을" | "를" {
  return hasFinalConsonant(value) ? "을" : "를";
}

function subjectParticle(value: string): "이" | "가" {
  return hasFinalConsonant(value) ? "이" : "가";
}

const TOPIC_HOOKS: Record<ContentTopic, readonly string[]> = {
  LOVE: [
    "밤 11시에 답장창을 열었다가 이름만 보고 닫은 적 있나요?",
    "3일째 먼저 연락할지 고민하며 같은 대화를 다시 읽고 있다면.",
    "새벽 2시에 끝난 대화를 다시 열어 마지막 문장을 확인했다면.",
    "답장을 7번 고쳐 쓰고도 보내기 버튼을 누르지 못했다면.",
    "2주 전 지운 사진을 오늘 다시 찾아봤다면.",
  ],
  GENERAL: [
    "아침 8시 알람을 끄자마자 어제 미룬 일이 떠올랐다면.",
    "5분이면 끝날 일을 오늘만 3번 뒤로 미뤘다면.",
    "밤 12시에 불을 끄고도 같은 걱정을 다시 검색했다면.",
    "10분 동안 할 일 목록 첫 줄만 썼다 지웠다면.",
    "7일째 같은 생각 때문에 잠들기 전 화면을 다시 켰다면.",
  ],
  CAREER: [
    "출근 10분 만에 채용 공고를 다시 열어본 적 있나요?",
    "점심 1시간 동안 이력서 첫 문장만 고쳐 썼다면.",
    "3개월째 퇴근길마다 그만둘 날짜를 계산하고 있다면.",
    "오전 9시 회의가 끝나자마자 다른 회사 이름을 검색했다면.",
    "이번 주만 2번 사직서를 썼다가 저장하지 않았다면.",
  ],
  MONEY: [
    "결제 버튼 앞에서 20분째 가격표만 다시 보고 있다면.",
    "월급날 3일 전인데 통장 앱을 5번 넘게 열어봤다면.",
    "10만원을 쓰기 전에 장바구니를 3번 비웠다면.",
    "밤 11시에 이번 달 카드 명세서를 다시 내려받았다면.",
    "30일 뒤 잔액이 걱정돼 오늘 살 물건을 다시 내려놓았다면.",
  ],
  DECISION: [
    "24시간 안에 답해야 하는데 메모장에 장단점만 다시 적고 있다면.",
    "같은 질문을 5번 듣고도 매번 다른 답을 했다면.",
    "3초 만에 고른 답을 1시간째 의심하고 있다면.",
    "이번 주만 4번 결정을 다음 주 달력으로 옮겼다면.",
    "딱 1번만 더 확인한 뒤 정하겠다는 말을 반복하고 있다면.",
  ],
  EXPERIMENTAL: [
    "오늘 같은 숫자를 3번 마주치고도 그냥 넘기지 못했다면.",
    "15분 전 들은 한 문장이 아직 머릿속에서 반복된다면.",
    "아침 7시에 꾼 꿈의 마지막 장면만 선명하게 남았다면.",
    "10초 안에 떠오른 단어를 지우고 다른 답을 찾고 있다면.",
    "앞으로 3일 안에 바꾸고 싶은 한 가지를 아직 적지 못했다면.",
  ],
};

const HOOK_ACTION_PATTERN = /열|닫|읽|확인|쓰|썼|누르|찾|미루|미뤘|검색|켜|끄|고쳐|계산|내려|비우|놓|적|답|고르|의심|옮기|옮겼|반복|마주|듣|남|떠오르|지우|바꾸|보|잠|결제/;

export function hookQualityError(hook: string): string | null {
  if (!/\d/.test(hook)) return "hook must contain a concrete number or time";
  if (!HOOK_ACTION_PATTERN.test(hook)) return "hook must contain an observable action or scene";
  if (hook.length > 100) return "hook is longer than 100 characters";
  return null;
}

function hookFor(topic: ContentTopic, index: number): string {
  const hooks = TOPIC_HOOKS[topic];
  return hooks[index % hooks.length] ?? hooks[0];
}

function cardIdsFor(seed: number): number[] {
  // Every generated Threads post leads into Mr. Tarot's core three-card ritual.
  const count = 3;
  const start = (seed * 17 + 6) % 78;
  const step = 11 + (seed % 5) * 2;
  const ids: number[] = [];
  let candidate = start;
  while (ids.length < count) {
    if (!ids.includes(candidate)) ids.push(candidate);
    candidate = (candidate + step) % 78;
  }
  return ids;
}

function resultLine(cardId: number, topic: ContentTopic): string {
  const card = getTarotCard(cardId);
  const meaning = getEditorialCardMeaning(cardId);
  const topicLead: Record<ContentTopic, string> = {
    LOVE: "관계에서는",
    GENERAL: "지금은",
    CAREER: "일에서는",
    MONEY: "돈을 볼 때는",
    DECISION: "결정 앞에서는",
    EXPERIMENTAL: "오늘은",
  };
  const variants = [
    `${topicLead[topic]} ${meaning.light}${subjectParticle(meaning.light)} 먼저 걸려요. ${meaning.shadow}${objectParticle(meaning.shadow)} 조심하세요.`,
    `${topicLead[topic]} ${meaning.light}${objectParticle(meaning.light)} 택하는 편이 좋아요. ${meaning.shadow}에만 머물지는 마세요.`,
    `${topicLead[topic]} ${meaning.light} 쪽으로 가도 괜찮아요. 다만 ${meaning.shadow}${subjectParticle(meaning.shadow)} 커지는지 보세요.`,
  ];
  return `${card.name}\n${variants[cardId % variants.length]}`;
}

function mainPost(format: ContentFormat, hook: string): string {
  switch (format) {
    case "PICK_3": return `${hook}\n1, 2, 3 중 하나를 골라보세요.\n\n이번에는 큰 예언보다\n지금 눈에 걸리는 한 가지를 볼게요.\n\n1  2  3`;
    case "YES_NO_NOT_YET": return `${hook}\nYES / NO / NOT YET 중 하나만 고른다면?\n\n카드가 말하는 건 정답보다\n지금 덜 무리한 방향이에요.\n\n1 YES  2 NOT YET  3 NO`;
    case "LOVE": return `${hook}\n\n마음이 먼저인지, 행동이 먼저인지\n세 장 중 하나를 고르며 살펴봐요.\n\n1  2  3`;
    case "CAREER": return `${hook}\n\n더 버틸지, 다른 곳을 볼지\n세 장 중 하나를 고르며 살펴봐요.\n\n1  2  3`;
    case "MONEY": return `${hook}\n\n돈 이야기는 숫자만으로 끝나지 않아요.\n세 장 중 하나를 골라보세요.\n\n1  2  3`;
  }
}

function replyLines(cardIds: readonly number[], topic: ContentTopic): string[] {
  return [...cardIds.map((cardId, index) => `${index + 1}번\n\n${resultLine(cardId, topic)}`), CTA];
}

/**
 * A Threads card-choice post is only useful when a reader can select one of
 * three cards and immediately receive all three prepared reading replies.
 * The publisher repeats this check directly before the external API call.
 */
export function readingThreadValidationError(item: Pick<ThreadsContent, "cardIds" | "replies" | "cta">): string | null {
  if (item.cardIds.length !== 3) return `expected 3 selectable cards, received ${item.cardIds.length}`;
  if (item.replies.length !== 4) return `expected 3 reading replies and one CTA, received ${item.replies.length}`;
  for (let index = 0; index < 3; index += 1) {
    if (!item.replies[index]?.startsWith(`${index + 1}번\n\n`)) return `missing prepared reading for choice ${index + 1}`;
  }
  if (item.replies[3] !== item.cta) return "final reply must be the configured CTA";
  return null;
}

function imageAsset(id: string): string | null {
  return `/threads/generated/${id}.png`;
}

function signature(item: Pick<ThreadsContent, "format" | "topic" | "cardIds" | "mainPost">): string {
  return [item.format, item.topic, [...item.cardIds].sort((a, b) => a - b).join("-"), item.mainPost.replace(/\d|\s|[.,!?/]/g, "")].join("|");
}

export function generateContentQueue(count = 105, createdAt = new Date().toISOString()): ContentQueue {
  const plannedTopics = TOPIC_PLAN.flatMap(({ topic, count: topicCount }) => Array.from({ length: topicCount }, () => topic)).slice(0, count);
  const items = plannedTopics.map((topic, index): ThreadsContent => {
    const formats = TOPIC_FORMATS[topic];
    const format = formats[index % formats.length] ?? "PICK_3";
    const id = `mr-tarot-${String(index + 1).padStart(4, "0")}`;
    const cardIds = cardIdsFor(index + 1);
    const hook = hookFor(topic, index);
    const main = mainPost(format, hook);
    const item: ThreadsContent = {
      id,
      status: "READY",
      format,
      topic,
      hook,
      mainPost: main,
      cardIds,
      replies: replyLines(cardIds, topic),
      cta: CTA,
      imageAsset: imageAsset(id),
      altText: cardIds.length ? `${topic} 주제의 미스터 타로 선택 카드 ${cardIds.length}장` : null,
      createdAt,
      scheduledAt: null,
      publishedAt: null,
      threadsPostId: null,
      threadsContainerId: null,
      replyPostIds: [],
      attemptCount: 0,
      lastError: null,
      metrics: {},
      semanticSignature: "",
    };
    return { ...item, semanticSignature: signature(item) };
  });
  return { version: 1, generatedAt: createdAt, items };
}

export function validateContentQueue(queue: ContentQueue): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const signatures = new Set<string>();
  const banned = ["긍정적인 에너지", "내면의 목소리", "새로운 가능성이 열립니다", "균형을 찾아보세요"];

  for (const item of queue.items) {
    if (ids.has(item.id)) errors.push(`${item.id}: duplicate id`);
    ids.add(item.id);
    if (signatures.has(item.semanticSignature)) errors.push(`${item.id}: semantic duplicate`);
    signatures.add(item.semanticSignature);
    if (!item.hook || !item.mainPost || !item.cta) errors.push(`${item.id}: missing required copy`);
    const hookError = hookQualityError(item.hook);
    if (hookError) errors.push(`${item.id}: ${hookError}`);
    if (item.status !== "READY") errors.push(`${item.id}: generated item is not READY`);
    if (item.mainPost.length > 500) errors.push(`${item.id}: main post too long`);
    const readingError = readingThreadValidationError(item);
    if (readingError) errors.push(`${item.id}: ${readingError}`);
    for (const cardId of item.cardIds) {
      try { getTarotCard(cardId); } catch { errors.push(`${item.id}: invalid card id ${cardId}`); }
    }
    const fullText = [item.hook, item.mainPost, ...item.replies, item.cta].join(" ");
    for (const phrase of banned) if (fullText.includes(phrase)) errors.push(`${item.id}: banned phrase ${phrase}`);
  }
  if (queue.items.length < 100) errors.push("queue: fewer than 100 items");
  return errors;
}
