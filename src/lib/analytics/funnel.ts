import { kstCalendarDate } from "@/lib/content/daily-publish";
import type { ContentMetrics } from "@/domain/content";
import type { ContentRuntimeQueue } from "@/lib/content/publisher";

export const FUNNEL_EVENTS = [
  "landing_view",
  "ritual_started",
  "cards_confirmed",
  "result_viewed",
  "affiliate_viewed",
  "affiliate_skipped",
  "affiliate_clicked",
  "result_shared",
] as const;

export type FunnelEvent = (typeof FUNNEL_EVENTS)[number];
export type FunnelCounts = Record<FunnelEvent, number>;
export type DailyFunnelReport = { date: string; counts: FunnelCounts };
export type DailyGrowthReport = DailyFunnelReport & { contentIds: string[]; threads: ContentMetrics };

export type FunnelCounterStore = {
  incrementHash: (key: string, field: string, amount: number, expirationSeconds: number) => Promise<number>;
  readHash: (key: string) => Promise<Record<string, number>>;
};

const FUNNEL_PREFIX = "mr-tarot:funnel:v1";
const RETENTION_SECONDS = 120 * 24 * 60 * 60;
const EVENT_SET = new Set<string>(FUNNEL_EVENTS);

function emptyCounts(): FunnelCounts {
  return Object.fromEntries(FUNNEL_EVENTS.map((event) => [event, 0])) as FunnelCounts;
}

function totalKey(date: string): string {
  return `${FUNNEL_PREFIX}:day:${date}`;
}

function contentKey(date: string, contentId: string): string {
  return `${FUNNEL_PREFIX}:content:${date}:${contentId}`;
}

export function isFunnelEvent(value: unknown): value is FunnelEvent {
  return typeof value === "string" && EVENT_SET.has(value);
}

export function isThreadsContentId(value: unknown): value is string {
  return typeof value === "string" && /^mr-tarot-\d{4}$/.test(value);
}

export function isSameOriginAnalyticsRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}

export async function recordFunnelEvent(store: FunnelCounterStore, event: FunnelEvent, contentId: string, at = new Date()): Promise<void> {
  const date = kstCalendarDate(at);
  await Promise.all([
    store.incrementHash(totalKey(date), event, 1, RETENTION_SECONDS),
    store.incrementHash(contentKey(date, contentId), event, 1, RETENTION_SECONDS),
  ]);
}

function previousKstDate(date: string, daysAgo: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day - daysAgo));
  return value.toISOString().slice(0, 10);
}

export async function readRecentFunnelReports(store: FunnelCounterStore, days = 7, at = new Date()): Promise<DailyFunnelReport[]> {
  const today = kstCalendarDate(at);
  const dates = Array.from({ length: days }, (_, index) => previousKstDate(today, index));
  return await Promise.all(dates.map(async (date) => {
    const stored = await store.readHash(totalKey(date));
    const counts = emptyCounts();
    for (const event of FUNNEL_EVENTS) counts[event] = stored[event] ?? 0;
    return { date, counts };
  }));
}

export function combineDailyGrowthReports(reports: readonly DailyFunnelReport[], runtime: ContentRuntimeQueue): DailyGrowthReport[] {
  return reports.map((report) => {
    const published = Object.entries(runtime.items).filter(([, state]) => state.status === "PUBLISHED" && state.publishedAt && kstCalendarDate(new Date(state.publishedAt)) === report.date);
    const threads: ContentMetrics = {};
    for (const metric of ["views", "likes", "replies", "reposts", "quotes"] as const) {
      const values = published.map(([, state]) => state.metrics?.[metric]).filter((value): value is number => typeof value === "number");
      if (values.length) threads[metric] = values.reduce((sum, value) => sum + value, 0);
    }
    return { ...report, contentIds: published.map(([contentId]) => contentId), threads };
  });
}
