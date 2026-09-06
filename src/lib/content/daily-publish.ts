import type { ContentRuntimeQueue } from "./publisher";

export type DailyPublishMarker = {
  version: 1;
  publishedKstDate: string;
  contentId: string;
  publishedAt: string;
};

export function kstCalendarDate(value: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value).reduce<Record<string, string>>((result, part) => {
    result[part.type] = part.value;
    return result;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function publishedContentForKstDate(runtime: ContentRuntimeQueue, date: string): string | null {
  for (const [contentId, state] of Object.entries(runtime.items)) {
    if (state.status !== "PUBLISHED" || !state.publishedAt) continue;
    if (kstCalendarDate(new Date(state.publishedAt)) === date) return contentId;
  }
  return null;
}
