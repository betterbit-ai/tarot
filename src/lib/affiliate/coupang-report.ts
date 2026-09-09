import type { FunnelCounts } from "@/lib/analytics/funnel";
import type { CoupangCommissionSummary } from "./coupang-api";

export type SlackReportConfig = {
  webhookUrl: string;
  fetcher?: typeof fetch;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatWon(value: number): string {
  return `${formatNumber(value)}원`;
}

export function formatCoupangDailySlackReport(summary: CoupangCommissionSummary, funnel: FunnelCounts): string {
  const formattedDate = `${summary.date.slice(0, 4)}-${summary.date.slice(4, 6)}-${summary.date.slice(6, 8)}`;
  return [
    `*미스터 타로 일일 리포트 · ${formattedDate}*`,
    "*쿠팡 파트너스 공식 집계*",
    `클릭 ${formatNumber(summary.click)} · 주문 ${formatNumber(summary.order)} · 취소 ${formatNumber(summary.cancel)}`,
    `거래액 ${formatWon(summary.gmv)} · 수수료 ${formatWon(summary.commission)}`,
    "*미스터 타로 웹 퍼널*",
    `Threads 유입 ${formatNumber(funnel.landing_view)} · 리딩 시작 ${formatNumber(funnel.ritual_started)} · 결과 ${formatNumber(funnel.result_viewed)} · 쿠팡 클릭 ${formatNumber(funnel.affiliate_clicked)}`,
    "쿠팡 클릭은 주문이나 수수료를 뜻하지 않습니다.",
  ].join("\n");
}

export async function sendCoupangDailySlackReport(config: SlackReportConfig, text: string): Promise<void> {
  const response = await (config.fetcher ?? fetch)(config.webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error(`Slack webhook request failed: ${response.status}`);
}
