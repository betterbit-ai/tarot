import type { Metadata } from "next";
import { ThreadsContentClient } from "@/components/threads-content-client";
import { combineDailyGrowthReports, readRecentFunnelReports, type DailyGrowthReport } from "@/lib/analytics/funnel";
import { applyRuntimeState } from "@/lib/content/publisher";
import { getContentQueue } from "@/lib/content/queue";
import { createUpstashContentStateStore, createUpstashJsonStore } from "@/lib/content/upstash-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Threads 콘텐츠 큐 | 미스터 타로",
  description: "미스터 타로의 준비된 Threads 콘텐츠 큐를 확인하고 복사하세요.",
  robots: { index: false, follow: false },
};

export default async function ThreadsPage() {
  const source = getContentQueue();
  const contentStore = createUpstashContentStateStore();
  const counterStore = createUpstashJsonStore();
  let queue = source;
  let funnelReports: DailyGrowthReport[] = [];

  try {
    const [runtime, reports] = await Promise.all([
      contentStore?.read(),
      counterStore ? readRecentFunnelReports(counterStore) : Promise.resolve([]),
    ]);
    if (runtime) {
      queue = { ...source, items: applyRuntimeState(source.items, runtime) };
      funnelReports = combineDailyGrowthReports(reports, runtime);
    } else {
      funnelReports = reports.map((report) => ({ ...report, contentIds: [], threads: {} }));
    }
  } catch {
    // Operations data must never make the queue dashboard unavailable.
  }

  return <ThreadsContentClient queue={queue} funnelReports={funnelReports} />;
}
