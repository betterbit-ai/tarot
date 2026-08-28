export type TarotAnalyticsEvent =
  | { type: "ritual_started"; hasQuestion: boolean }
  | { type: "cards_confirmed"; cards: [number, number, number] }
  | { type: "reveal_completed"; cards: [number, number, number] }
  | { type: "affiliate_viewed"; hasTarget: boolean }
  | { type: "affiliate_skipped" }
  | { type: "affiliate_clicked" }
  | { type: "result_shared"; method: "native-share" | "copy-link" }
  | { type: "ritual_restarted"; source: "result" | "shared" };

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function trackTarotEvent(event: TarotAnalyticsEvent): void {
  if (typeof window === "undefined") {
    return;
  }

  const payload = { event: event.type, ...event };
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(payload);
  window.dispatchEvent(new CustomEvent("tarot-analytics", { detail: payload }));
}
