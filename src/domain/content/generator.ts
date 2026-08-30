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
  LOVE: ["PICK_5", "PICK_3", "YES_NO_NOT_YET", "LOVE", "ONE_CARD", "CONVERSATION"],
  GENERAL: ["PICK_5", "PICK_3", "YES_NO_NOT_YET", "ONE_CARD", "CONVERSATION"],
  CAREER: ["PICK_3", "YES_NO_NOT_YET", "CAREER", "ONE_CARD", "CONVERSATION"],
  MONEY: ["PICK_3", "YES_NO_NOT_YET", "MONEY", "ONE_CARD"],
  DECISION: ["YES_NO_NOT_YET", "PICK_3", "ONE_CARD", "CONVERSATION"],
  EXPERIMENTAL: ["CONVERSATION", "ONE_CARD", "PICK_3"],
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
const CONVERSATION_FRAMES = [
  "왜 그 단어가 남았는지",
  "그 단어를 떠올릴 때 가장 먼저 보이는 장면이 무엇인지",
  "그 단어를 피하고 싶은지 붙잡고 싶은지",
  "그 단어를 누구에게도 말하지 못한 이유가 있는지",
  "그 단어가 오늘의 선택과 어떤 관계가 있는지",
] as const;

const CONVERSATION_CLOSINGS = [
  "오늘은 한 단어면 충분해요.",
  "길게 설명하지 않아도 괜찮아요.",
  "지금 떠오른 말 그대로면 돼요.",
  "답을 찾기 전에 이름부터 붙여봐요.",
  "그 단어를 적는 것부터 시작해요.",
  "마음이 먼저 고른 말을 남겨주세요.",
  "생각이 길어지기 전에 적어봐요.",
  "아무에게도 말하지 못한 단어여도 괜찮아요.",
  "그 단어가 오늘의 시작점이 될 수 있어요.",
  "한 번 적고 나서 천천히 봐도 돼요.",
  "정답 대신 그 단어부터 꺼내봐요.",
] as const;

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

const HOOK_PREFIXES = ["오늘", "요즘", "잠깐 멈춰서", "혼자 있을 때", "지금", "문득"] as const;

function hookFor(format: ContentFormat, prompt: string, index: number): string {
  const prefix = HOOK_PREFIXES[index % HOOK_PREFIXES.length] ?? "오늘";
  switch (format) {
    case "PICK_5": return `${prompt}${objectParticle(prompt)} 생각하면서`;
    case "PICK_3": return `${prompt}${subjectParticle(prompt)} 계속 걸린다면`;
    case "YES_NO_NOT_YET": return `${prompt}${objectParticle(prompt)} 두고 답을 내려야 한다면`;
    case "LOVE": return `${prompt}${objectParticle(prompt)} 두고 내가 모르는 부분`;
    case "CAREER": return `${prompt}을 두고 망설인다면`;
    case "MONEY": return `${prompt}${objectParticle(prompt)} 고르기 전이라면`;
    case "ONE_CARD": return `${prefix} 필요한 한 장`;
    case "CONVERSATION": return `${prompt}${objectParticle(prompt)} 한 단어로 남긴다면`;
  }
}

function cardIdsFor(seed: number, format: ContentFormat): number[] {
  if (format === "CONVERSATION") return [];
  const count = format === "PICK_5" ? 5 : format === "ONE_CARD" ? 1 : 3;
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

function mainPost(format: ContentFormat, prompt: string, hook: string, number: number): string {
  const label = String(number).padStart(2, "0");
  switch (format) {
    case "PICK_5": return `${hook}\n다섯 장 중 하나를 골라보세요.\n\n오래 고르지 말고, 먼저 멈춘 숫자로요.\n결과는 댓글에 남겨둘게요.\n\n1  2  3  4  5`;
    case "PICK_3": return `${hook}\n1, 2, 3 중 하나를 골라보세요.\n\n이번에는 큰 예언보다\n지금 눈에 걸리는 한 가지를 볼게요.\n\n1  2  3`;
    case "YES_NO_NOT_YET": return `${hook}\nYES / NO / NOT YET 중 하나만 고른다면?\n\n카드가 말하는 건 정답보다\n지금 덜 무리한 방향이에요.\n\n1 YES  2 NOT YET  3 NO`;
    case "LOVE": return `${hook}\n\n마음이 먼저인지, 행동이 먼저인지\n세 장 중 하나를 고르며 살펴봐요.\n\n1  2  3`;
    case "CAREER": return `${hook}\n\n더 버틸지, 다른 곳을 볼지\n세 장 중 하나를 고르며 살펴봐요.\n\n1  2  3`;
    case "MONEY": return `${hook}\n\n돈 이야기는 숫자만으로 끝나지 않아요.\n세 장 중 하나를 골라보세요.\n\n1  2  3`;
    case "ONE_CARD": return `${hook}\n\n${prompt}${objectParticle(prompt)} 떠올리고\n카드 하나를 골라보세요.\n\n${label}`;
    case "CONVERSATION": return `${hook}\n\n답을 정해드리기보다\n${CONVERSATION_FRAMES[number % CONVERSATION_FRAMES.length]} 같이 볼게요.\n${CONVERSATION_CLOSINGS[number % CONVERSATION_CLOSINGS.length]}`;
  }
}

function replyLines(cardIds: readonly number[], topic: ContentTopic, format: ContentFormat): string[] {
  if (format === "CONVERSATION") return ["남겨준 단어를 보고 다음 글의 카드를 고를게요.", CTA];
  return [...cardIds.map((cardId, index) => `${index + 1}번\n\n${resultLine(cardId, topic)}`), CTA];
}

function imageAsset(id: string, format: ContentFormat): string | null {
  void format;
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
    const cardIds = cardIdsFor(index + 1, format);
    const prompt = TOPIC_PROMPTS[topic][Math.floor(index / 6) % TOPIC_PROMPTS[topic].length] ?? "지금 떠오르는 일";
    const hook = hookFor(format, prompt, index);
    const main = mainPost(format, prompt, hook, index + 1);
    const item: ThreadsContent = {
      id,
      status: "READY",
      format,
      topic,
      hook,
      mainPost: main,
      cardIds,
      replies: replyLines(cardIds, topic, format),
      cta: CTA,
      imageAsset: imageAsset(id, format),
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
    if (item.format === "CONVERSATION" ? item.cardIds.length !== 0 : item.cardIds.length === 0) errors.push(`${item.id}: invalid card count`);
    for (const cardId of item.cardIds) {
      try { getTarotCard(cardId); } catch { errors.push(`${item.id}: invalid card id ${cardId}`); }
    }
    const fullText = [item.hook, item.mainPost, ...item.replies, item.cta].join(" ");
    for (const phrase of banned) if (fullText.includes(phrase)) errors.push(`${item.id}: banned phrase ${phrase}`);
  }
  if (queue.items.length < 100) errors.push("queue: fewer than 100 items");
  return errors;
}
