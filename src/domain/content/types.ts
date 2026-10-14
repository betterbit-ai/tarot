export const CONTENT_STATUSES = ["DRAFT", "READY", "SCHEDULED", "PUBLISHING", "PUBLISHED", "FAILED", "SKIPPED"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const CONTENT_FORMATS = ["PICK_3", "YES_NO_NOT_YET", "LOVE", "CAREER", "MONEY", "THREE_CARD_SETS"] as const;
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

export const CONTENT_AFFILIATE_THEMES = ["relationship", "self-care", "rest", "focus", "new-start", "organization"] as const;
export type ContentAffiliateTheme = (typeof CONTENT_AFFILIATE_THEMES)[number];

export type ThreadsReadingSet = {
  key: "A" | "B" | "C";
  symbol: string;
  cardIds: [number, number, number];
  reading: string;
  signal: string;
  action: string;
  affiliateTheme: ContentAffiliateTheme;
  productReason: string;
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
  metricsUnavailableStatus?: number;
  metricsUnavailableAt?: string;
  attemptCount: number;
  lastError: string | null;
  metrics: ContentMetrics;
  semanticSignature: string;
  readingSets?: ThreadsReadingSet[];
};

export type ContentQueue = {
  version: 1;
  generatedAt: string;
  items: ThreadsContent[];
};
