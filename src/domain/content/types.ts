export const CONTENT_STATUSES = ["DRAFT", "READY", "SCHEDULED", "PUBLISHING", "PUBLISHED", "FAILED", "SKIPPED"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const CONTENT_FORMATS = ["PICK_5", "PICK_3", "YES_NO_NOT_YET", "LOVE", "CAREER", "MONEY", "ONE_CARD", "CONVERSATION"] as const;
export type ContentFormat = (typeof CONTENT_FORMATS)[number];

export const CONTENT_TOPICS = ["LOVE", "GENERAL", "CAREER", "MONEY", "DECISION", "EXPERIMENTAL"] as const;
export type ContentTopic = (typeof CONTENT_TOPICS)[number];

export type ContentMetrics = {
  views?: number;
  likes?: number;
  replies?: number;
  reposts?: number;
  quotes?: number;
  syncedAt?: string;
};

export type ThreadsContent = {
  id: string;
  status: ContentStatus;
  format: ContentFormat;
  topic: ContentTopic;
  hook: string;
  mainPost: string;
  cardIds: number[];
  replies: string[];
  cta: string;
  imageAsset: string | null;
  altText: string | null;
  createdAt: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  threadsPostId: string | null;
  threadsContainerId: string | null;
  replyPostIds: string[];
  attemptCount: number;
  lastError: string | null;
  metrics: ContentMetrics;
  semanticSignature: string;
};

export type ContentQueue = {
  version: 1;
  generatedAt: string;
  items: ThreadsContent[];
};
