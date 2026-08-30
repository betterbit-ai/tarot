import type { ContentMetrics } from "@/domain/content";
import type { ContentRuntimeQueue, ContentStateStore } from "./publisher";

export type ThreadsMetricsConfig = {
  accessToken?: string;
  apiBaseUrl: string;
  metrics: readonly string[];
  dryRun: boolean;
};

export type MetricsSyncResult = { mode: "dry-run" | "skipped" | "synced"; updated: number; reason?: string };

function metricValue(payload: unknown): ContentMetrics {
  const data = (payload as { data?: Array<{ name?: string; values?: Array<{ value?: number }> }> }).data ?? [];
  return data.reduce<ContentMetrics>((metrics, row) => {
    const value = row.values?.[0]?.value;
    if (typeof value !== "number") return metrics;
    if (row.name === "views") metrics.views = value;
    if (row.name === "likes") metrics.likes = value;
    if (row.name === "replies") metrics.replies = value;
    if (row.name === "reposts") metrics.reposts = value;
    if (row.name === "quotes") metrics.quotes = value;
    return metrics;
  }, {});
}

export async function syncThreadsMetrics(store: ContentStateStore, config: ThreadsMetricsConfig): Promise<MetricsSyncResult> {
  if (config.dryRun) return { mode: "dry-run", updated: 0 };
  if (!config.accessToken) return { mode: "skipped", updated: 0, reason: "Missing THREADS_ACCESS_TOKEN" };
  const queue = await store.read();
  const published = Object.entries(queue.items).filter(([, state]) => state.status === "PUBLISHED" && state.mainPostId);
  let next: ContentRuntimeQueue = queue;
  let updated = 0;
  for (const [id, state] of published) {
    const response = await fetch(`${config.apiBaseUrl}/${state.mainPostId}/insights?metric=${encodeURIComponent(config.metrics.join(","))}`, { headers: { authorization: `Bearer ${config.accessToken}` } });
    if (!response.ok) continue;
    const metrics = { ...metricValue(await response.json()), syncedAt: new Date().toISOString() };
    next = { ...next, items: { ...next.items, [id]: { ...state, metrics, updatedAt: new Date().toISOString() } } };
    updated += 1;
  }
  if (updated) await store.write(next);
  return { mode: "synced", updated };
}
