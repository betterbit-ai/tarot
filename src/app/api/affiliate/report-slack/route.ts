import { getCoupangCommissionSummary, previousKstReportDate } from "@/lib/affiliate/coupang-api";
import { formatCoupangDailySlackReport, sendCoupangDailySlackReport } from "@/lib/affiliate/coupang-report";
import { readDailyFunnelReport } from "@/lib/analytics/funnel";
import { schedulerRequestIsAuthorized } from "@/lib/content/scheduler-auth";
import { createUpstashJsonStore } from "@/lib/content/upstash-store";

export const runtime = "nodejs";

const REPORT_PREFIX = "mr-tarot:coupang-slack-report:v1";
const MARKER_TTL_SECONDS = 400 * 24 * 60 * 60;
const LOCK_TTL_SECONDS = 15 * 60;

type ReportMarker = { sentAt: string; reportDate: string };

function enabled(): boolean {
  return process.env.COUPANG_PARTNERS_REPORT_ENABLED?.trim().toLowerCase() === "true";
}

function slackWebhookUrl(): string | null {
  const value = process.env.SLACK_WEBHOOK_URL?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "hooks.slack.com" ? url.toString() : null;
  } catch {
    return null;
  }
}

async function releaseLock(store: NonNullable<ReturnType<typeof createUpstashJsonStore>>, key: string): Promise<void> {
  try { await store.delete(key); } catch { /* expiry remains the final safeguard */ }
}

export async function POST(request: Request) {
  if (!schedulerRequestIsAuthorized(request)) return new Response("Unauthorized", { status: 401 });
  if (!enabled()) return new Response("Coupang Slack report is disabled", { status: 503 });

  const accessKey = process.env.COUPANG_PARTNERS_ACCESS_KEY?.trim();
  const secretKey = process.env.COUPANG_PARTNERS_SECRET_KEY?.trim();
  const webhookUrl = slackWebhookUrl();
  const store = createUpstashJsonStore();
  if (!accessKey || !secretKey || !webhookUrl || !store) return new Response("Coupang Slack report is not configured", { status: 503 });

  const reportDate = previousKstReportDate();
  const markerKey = `${REPORT_PREFIX}:sent:${reportDate}`;
  const lockKey = `${REPORT_PREFIX}:lock:${reportDate}`;
  const marker = await store.get<ReportMarker>(markerKey);
  if (marker?.reportDate === reportDate) return Response.json({ mode: "already-sent", reportDate });
  const hasLock = await store.setIfAbsent(lockKey, { startedAt: new Date().toISOString() }, LOCK_TTL_SECONDS);
  if (!hasLock) return Response.json({ mode: "report-in-progress", reportDate }, { status: 202 });

  try {
    const [summary, funnel] = await Promise.all([
      getCoupangCommissionSummary({ accessKey, secretKey }, reportDate),
      readDailyFunnelReport(store, reportDate),
    ]);
    await sendCoupangDailySlackReport({ webhookUrl }, formatCoupangDailySlackReport(summary, funnel.counts));
    await store.setWithExpiration(markerKey, { sentAt: new Date().toISOString(), reportDate } satisfies ReportMarker, MARKER_TTL_SECONDS);
    return Response.json({ mode: "sent", reportDate, click: summary.click, order: summary.order, cancel: summary.cancel, gmv: summary.gmv, commission: summary.commission });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Coupang Slack report failed";
    return Response.json({ mode: "failed", reportDate, error: message }, { status: 502 });
  } finally {
    await releaseLock(store, lockKey);
  }
}
