export type TarotAnalyticsEvent =
  | { type: "landing_view" }
  | { type: "ritual_started"; hasQuestion: boolean }
  | { type: "cards_confirmed"; cards: [number, number, number] }
  | { type: "reveal_completed"; cards: [number, number, number] }
  | { type: "result_viewed" }
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

const ATTRIBUTION_KEY = "mr-tarot:threads-attribution";
const SENT_EVENT_PREFIX = "mr-tarot:funnel-sent";
const CONTENT_ID_PATTERN = /^(mr-tarot-\d{4}|link_in_bio)$/;
const FUNNEL_EVENT_TYPES = new Set([
  "landing_view",
  "ritual_started",
  "cards_confirmed",
  "result_viewed",
  "affiliate_viewed",
  "affiliate_skipped",
  "affiliate_clicked",
  "result_shared",
]);

function attributedContentId(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("utm_source") === "threads" ? params.get("utm_content") : null;
    if (requested && CONTENT_ID_PATTERN.test(requested)) {
      window.sessionStorage.setItem(ATTRIBUTION_KEY, requested);
      return requested;
    }
    const stored = window.sessionStorage.getItem(ATTRIBUTION_KEY);
    return stored && CONTENT_ID_PATTERN.test(stored) ? stored : null;
  } catch {
    return null;
  }
}

function sendAttributedFunnelEvent(type: string): void {
  if (!FUNNEL_EVENT_TYPES.has(type)) return;
  const contentId = attributedContentId();
  if (!contentId) return;
  const sentKey = `${SENT_EVENT_PREFIX}:${contentId}:${type}`;
  try {
    if (window.sessionStorage.getItem(sentKey)) return;
    window.sessionStorage.setItem(sentKey, "1");
  } catch {
    return;
  }

  const body = JSON.stringify({ event: type, contentId });
  if (typeof navigator.sendBeacon === "function") {
    const accepted = navigator.sendBeacon("/api/analytics/event", new Blob([body], { type: "application/json" }));
    if (accepted) return;
  }
  void window.fetch("/api/analytics/event", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

export function trackTarotEvent(event: TarotAnalyticsEvent): void {
  if (typeof window === "undefined") {
    return;
  }

  const payload = { event: event.type, ...event };
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(payload);
  window.dispatchEvent(new CustomEvent("tarot-analytics", { detail: payload }));
  sendAttributedFunnelEvent(event.type);
}
