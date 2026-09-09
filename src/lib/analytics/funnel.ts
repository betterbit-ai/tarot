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

export const THREADS_PROFILE_CONTENT_ID = "link_in_bio";

export type FunnelEvent = (typeof FUNNEL_EVENTS)[number];
export type FunnelCounts = Record<FunnelEvent, number>;
export type DailyFunnelReport = { date: string; counts: FunnelCounts };
export type DailyGrowthReport = DailyFunnelReport & { contentIds: string[]; threads: ContentMetrics };
export type FunnelDiagnosis = { kind: "insufficient" | "healthy" | "landing_to_start" | "start_to_result" | "affiliate_to_click"; message: string };

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

export function isThreadsAttributionId(value: unknown): value is string {
  return typeof value === "string" && (value === THREADS_PROFILE_CONTENT_ID || /^mr-tarot-\d{4}$/.test(value));
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

export async function readDailyFunnelReport(store: FunnelCounterStore, date: string): Promise<DailyFunnelReport> {
  const stored = await store.readHash(totalKey(date));
  const counts = emptyCounts();
  for (const event of FUNNEL_EVENTS) counts[event] = stored[event] ?? 0;
  return { date, counts };
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

export function diagnoseFunnel(reports: readonly DailyFunnelReport[]): FunnelDiagnosis {
  const totals = reports.reduce<FunnelCounts>((sum, report) => {
    for (const event of FUNNEL_EVENTS) sum[event] += report.counts[event];
    return sum;
  }, emptyCounts());
  if (totals.landing_view < 10) return { kind: "insufficient", message: "아직 유입 표본이 10회 미만이에요. 다음 게시물까지 수집한 뒤 판단합니다." };

  const candidates: Array<{ kind: Exclude<FunnelDiagnosis["kind"], "insufficient" | "healthy">; rate: number; message: string }> = [
    { kind: "landing_to_start", rate: totals.ritual_started / totals.landing_view, message: "가장 큰 이탈은 페이지 유입 뒤예요. Threads CTA와 첫 화면 약속이 같은 장면을 말하는지 먼저 점검하세요." },
    { kind: "start_to_result", rate: totals.ritual_started > 0 ? totals.result_viewed / totals.ritual_started : 0, message: "가장 큰 이탈은 리딩 시작 뒤예요. 카드 선택과 공개까지의 호흡이 길거나 어려운지 점검하세요." },
  ];
  if (totals.affiliate_viewed >= 10) candidates.push({ kind: "affiliate_to_click", rate: totals.affiliate_clicked / totals.affiliate_viewed, message: "가장 큰 이탈은 제휴 제안 뒤예요. 카드 분위기와 상품 이유, 이미지, 문장을 먼저 점검하세요." });
  const weakest = candidates.sort((left, right) => left.rate - right.rate)[0];
  return weakest && weakest.rate < 0.7 ? weakest : { kind: "healthy", message: "아직 뚜렷한 이탈 구간은 없어요. 다음 게시물까지 같은 기준으로 관찰합니다." };
}
