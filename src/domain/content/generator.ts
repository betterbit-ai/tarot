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

const TOPIC_PROMPTS: Record<ContentTopic, readonly string[]> = {
  LOVE: ["지금 떠오르는 사람", "요즘 마음이 쓰이는 관계", "연락할지 망설이는 사람"],
  GENERAL: ["오늘 자꾸 걸리는 일", "이번 주의 마음", "요즘 나를 붙잡는 생각"],
  CAREER: ["일에서 고르고 싶은 방향", "이직이나 새 업무", "지금 버티는 이유"],
  MONEY: ["돈을 쓰기 전의 마음", "생활을 정리하고 싶은 부분", "이번 달의 선택"],
  DECISION: ["미루고 있는 결정", "YES와 NOT YET 사이의 고민", "지금 멈춘 선택"],
  EXPERIMENTAL: ["오늘 마음에 남은 한 단어", "요즘 나를 설명하는 장면", "지금 나에게 필요한 거리"],
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

function instrumentalParticle(value: string): "으로" | "로" {
  const last = value.charCodeAt(value.length - 1);
  if (last < 0xac00 || last > 0xd7a3) return "로";
  const jongseong = (last - 0xac00) % 28;
  return jongseong === 0 || jongseong === 8 ? "로" : "으로";
}

type HookContext = {
  prompt: string;
  subject: string;
  object: string;
  selection: string;
};

const THREADS_HOOK_BUILDERS: readonly ((context: HookContext) => string)[] = [
  ({ subject, selection }) => `${subject} 계속 마음에 남는 이유, ${selection}에서 먼저 볼게요.`,
  ({ object }) => `답을 서두르기 전에 ${object} 붙잡고 있는 마음부터 확인해보세요.`,
  ({ object, selection }) => `${object} 생각할 때 가장 먼저 눈에 들어온 ${selection}${objectParticle(selection)} 골라보세요.`,
  ({ object }) => `괜찮은 척했지만, ${object} 아직 놓지 못했다면.`,
  ({ subject }) => `${subject} 다시 움직일 때인지, 잠시 멈출 때인지 보겠습니다.`,
  () => "지금 가장 피하고 싶은 선택이 오히려 힌트일 수 있어요.",
  ({ object }) => `${object} 계속 미루는 데는 이유가 있어요.`,
  ({ selection }) => `이 고민의 다음 장면이 궁금한 날, ${selection}${objectParticle(selection)} 골라보세요.`,
  () => "잘될까요?보다 먼저 확인할 게 있어요.",
  () => "오늘은 정답 대신 덜 후회할 쪽을 고릅니다.",
  ({ object, selection }) => `${object} 친구에게 묻기 어려웠다면, ${selection}${objectParticle(selection)} 골라 확인해보세요.`,
  () => "마음이 먼저 고른 선택을 믿어도 될까요?",
  () => "세 선택지 중 유독 불편한 것이 있다면, 그 이유를 봅니다.",
  ({ subject }) => `${subject} 끝난 건지, 잠시 멈춘 건지 헷갈린다면.`,
  () => "지금 바꾸지 않으면 반복될 장면이 보여요.",
  ({ subject }) => `${subject} 계속 떠오른다면, 그 마음을 피하지 마세요.`,
  () => "당장 움직이기 전에 멈춰야 할 이유부터 확인해보세요.",
  () => "좋은 소식보다 먼저 살펴야 할 현실이 있어요.",
  ({ object }) => `${object} 놓치면 안 될 한 가지를 골라보세요.`,
  () => "이번에는 미래를 맞히지 않고, 오늘의 신호만 읽습니다.",
  ({ selection }) => `고른 뒤에 설명할게요. 먼저 ${selection}${objectParticle(selection)} 골라보세요.`,
  ({ subject }) => `${subject} 왜 자꾸 같은 장면으로 돌아오는지 볼게요.`,
  () => "이 선택에서 가장 아픈 부분부터 카드에 물어볼게요.",
  ({ object }) => `${object} 지금 다시 시작할 힘이 남아 있는지 확인해보세요.`,
  ({ selection }) => `마음은 이미 답을 골랐을지도 몰라요. ${selection}${instrumentalParticle(selection)} 확인해보세요.`,
  ({ subject }) => `${subject} 바라는 것과 두려운 것이 다르게 보일 수 있어요.`,
  () => "먼저 고른 쪽부터 천천히 읽어보세요.",
  () => "계속 걸린다면, 이번에는 오래 고르지 마세요.",
  ({ object }) => `${object} 기다릴지 움직일지, 카드가 보여주는 방향을 봅니다.`,
  () => "오늘 당신이 먼저 봐야 할 장면이 하나 있어요.",
] as const;

function hookFor(format: ContentFormat, prompt: string, index: number): string {
  const selection = "세 장 중 하나";
  const context: HookContext = {
    prompt,
    subject: `${prompt}${subjectParticle(prompt)}`,
    object: `${prompt}${objectParticle(prompt)}`,
    selection,
  };
  const builder = THREADS_HOOK_BUILDERS[index % THREADS_HOOK_BUILDERS.length] ?? THREADS_HOOK_BUILDERS[0];
  return builder(context);
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
    const prompt = TOPIC_PROMPTS[topic][Math.floor(index / 6) % TOPIC_PROMPTS[topic].length] ?? "지금 떠오르는 일";
    const hook = hookFor(format, prompt, index);
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
