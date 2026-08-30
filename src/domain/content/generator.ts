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

const FORMAT_CYCLE: readonly ContentFormat[] = ["PICK_5", "PICK_3", "YES_NO_NOT_YET", "LOVE", "CAREER", "MONEY", "ONE_CARD", "CONVERSATION"];

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
  const topicLead: Record<ContentTopic, string> = {
    LOVE: "관계에서는",
    GENERAL: "지금은",
    CAREER: "일에서는",
    MONEY: "돈을 볼 때는",
    DECISION: "결정 앞에서는",
    EXPERIMENTAL: "오늘은",
  };
  return `${card.name}\n${topicLead[topic]} ${card.meaning.light}이 먼저 보여요. ${card.meaning.shadow} 쪽으로만 가지 않게 한 번 멈춰보세요.`;
}

function mainPost(format: ContentFormat, prompt: string, number: number): string {
  const label = String(number).padStart(2, "0");
  switch (format) {
    case "PICK_5": return `${prompt}을 생각하면서\n다섯 장 중 하나를 골라보세요.\n\n오래 고르지 말고, 먼저 멈춘 숫자로요.\n결과는 댓글에 남겨둘게요.\n\n1  2  3  4  5`;
    case "PICK_3": return `${prompt}을 생각하면서\n1, 2, 3 중 하나를 골라보세요.\n\n이번에는 큰 예언보다\n지금 눈에 걸리는 한 가지를 볼게요.\n\n1  2  3`;
    case "YES_NO_NOT_YET": return `${prompt}에\nYES / NO / NOT YET 중 하나만 고른다면?\n\n카드가 말하는 건 정답보다\n지금 덜 무리한 방향이에요.\n\n1 YES  2 NOT YET  3 NO`;
    case "LOVE": return `연애는 마음이 먼저인지, 행동이 먼저인지 헷갈릴 때가 있어요.\n\n${prompt}을 생각하면서\n세 장 중 하나를 골라보세요.\n\n1  2  3`;
    case "CAREER": return `일이 답답할 때는\n더 버틸지, 다른 곳을 볼지부터 헷갈려요.\n\n${prompt}을 생각하면서 하나 골라보세요.\n\n1  2  3`;
    case "MONEY": return `돈 이야기는 숫자만으로 끝나지 않아요.\n\n${prompt}을 생각하면서\n세 장 중 하나를 골라보세요.\n\n1  2  3`;
    case "ONE_CARD": return `오늘 필요한 한 장이에요.\n\n${prompt}을 떠올리고\n카드 하나를 골라보세요.\n\n${label}`;
    case "CONVERSATION": return `${prompt}을\n한 단어로만 남겨주세요.\n\n답을 정해드리기보다\n${CONVERSATION_FRAMES[number % CONVERSATION_FRAMES.length]} 같이 볼게요.`;
  }
}

function replyLines(cardIds: readonly number[], topic: ContentTopic, format: ContentFormat): string[] {
  if (format === "CONVERSATION") return ["남겨준 단어를 보고 다음 글의 카드를 고를게요.", CTA];
  return [...cardIds.map((cardId, index) => `${index + 1}번\n\n${resultLine(cardId, topic)}`), CTA];
}

function imageAsset(id: string, format: ContentFormat): string | null {
  return format === "CONVERSATION" ? null : `/threads/generated/${id}.svg`;
}

function signature(item: Pick<ThreadsContent, "format" | "topic" | "cardIds" | "mainPost">): string {
  return [item.format, item.topic, [...item.cardIds].sort((a, b) => a - b).join("-"), item.mainPost.replace(/\d|\s|[.,!?/]/g, "")].join("|");
}

export function generateContentQueue(count = 105, createdAt = new Date().toISOString()): ContentQueue {
  const plannedTopics = TOPIC_PLAN.flatMap(({ topic, count: topicCount }) => Array.from({ length: topicCount }, () => topic)).slice(0, count);
  const items = plannedTopics.map((topic, index): ThreadsContent => {
    const format = FORMAT_CYCLE[index % FORMAT_CYCLE.length] ?? "PICK_3";
    const id = `mr-tarot-${String(index + 1).padStart(4, "0")}`;
    const cardIds = cardIdsFor(index + 1, format);
    const prompt = TOPIC_PROMPTS[topic][Math.floor(index / FORMAT_CYCLE.length) % TOPIC_PROMPTS[topic].length] ?? "지금 떠오르는 일";
    const main = mainPost(format, prompt, index + 1);
    const item: ThreadsContent = {
      id,
      status: "READY",
      format,
      topic,
      hook: main.split("\n")[0] ?? main,
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
