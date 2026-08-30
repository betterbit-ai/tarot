import { describe, expect, it, vi } from "vitest";
import { EMPTY_RUNTIME_QUEUE, type ContentRuntimeQueue } from "./publisher";
import { syncThreadsMetrics } from "./metrics";

describe("Threads metrics sync", () => {
  it("does not call the API in dry run", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await syncThreadsMetrics({ read: async () => EMPTY_RUNTIME_QUEUE, write: async () => undefined }, { apiBaseUrl: "https://graph.threads.net/v1.0", accessToken: "token", metrics: ["views"], dryRun: true });
    expect(result).toEqual({ mode: "dry-run", updated: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("stores only metrics returned by Threads", async () => {
    let state: ContentRuntimeQueue = { version: 1, items: { one: { status: "PUBLISHED", updatedAt: "2026-08-30T00:00:00.000Z", attemptCount: 1, mainPostId: "post-1" } } };
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ data: [{ name: "views", values: [{ value: 12 }] }, { name: "likes", values: [{ value: 3 }] }] }), { status: 200 })));
    const result = await syncThreadsMetrics({ read: async () => state, write: async (next) => { state = next; } }, { apiBaseUrl: "https://graph.threads.net/v1.0", accessToken: "token", metrics: ["views", "likes"], dryRun: false });
    expect(result).toEqual({ mode: "synced", updated: 1 });
    expect(state.items.one?.metrics).toMatchObject({ views: 12, likes: 3 });
    vi.unstubAllGlobals();
  });
});
