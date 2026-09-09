import { beforeEach, describe, expect, it, vi } from "vitest";
import { trackTarotEvent } from "./events";

const sendBeaconMock = vi.fn<(url: string, data?: BodyInit | null) => boolean>(() => true);

describe("Threads session attribution", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sendBeaconMock.mockClear();
    Object.defineProperty(navigator, "sendBeacon", { configurable: true, value: sendBeaconMock });
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/?utm_source=threads&utm_medium=social&utm_content=mr-tarot-0009");
    window.dataLayer = [];
    vi.unstubAllGlobals();
  });

  it("sends only event type and content id once per session stage", async () => {
    trackTarotEvent({ type: "landing_view" });
    trackTarotEvent({ type: "landing_view" });

    expect(sendBeaconMock).toHaveBeenCalledTimes(1);
    expect(sendBeaconMock.mock.calls[0]?.[0]).toBe("/api/analytics/event");
    await expect((sendBeaconMock.mock.calls[0]?.[1] as Blob).text()).resolves.toBe(JSON.stringify({ event: "landing_view", contentId: "mr-tarot-0009" }));
  });

  it("keeps content attribution after the UTM query is no longer visible", async () => {
    trackTarotEvent({ type: "landing_view" });
    window.history.replaceState({}, "", "/");

    trackTarotEvent({ type: "result_viewed" });

    await expect((sendBeaconMock.mock.calls[1]?.[1] as Blob).text()).resolves.toBe(JSON.stringify({ event: "result_viewed", contentId: "mr-tarot-0009" }));
  });

  it("counts the Threads profile link without pretending it is a post id", async () => {
    window.history.replaceState({}, "", "/?utm_source=threads&utm_content=link_in_bio");
    trackTarotEvent({ type: "landing_view" });

    await expect((sendBeaconMock.mock.calls[0]?.[1] as Blob).text()).resolves.toBe(JSON.stringify({ event: "landing_view", contentId: "link_in_bio" }));
  });

  it("does not send unattributed direct traffic or question contents", () => {
    window.history.replaceState({}, "", "/");

    trackTarotEvent({ type: "ritual_started", hasQuestion: true });

    expect(sendBeaconMock).not.toHaveBeenCalled();
    expect(window.dataLayer?.[0]).toMatchObject({ event: "ritual_started", hasQuestion: true });
  });
});
