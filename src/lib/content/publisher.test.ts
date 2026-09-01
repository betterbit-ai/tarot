import { describe, expect, it, vi } from "vitest";
import type { ThreadsContent } from "@/domain/content";
import { applyRuntimeState, EMPTY_RUNTIME_QUEUE, publishNextContent, type ContentRuntimeQueue } from "./publisher";

const item: ThreadsContent = {
  id: "mr-tarot-test", status: "READY", format: "PICK_3", topic: "LOVE", hook: "test", mainPost: "main", cardIds: [0, 1, 2], replies: ["reply", "cta"], cta: "visit", imageAsset: "/threads/generated/mr-tarot-test.svg", altText: "test image", createdAt: "2026-08-30T00:00:00.000Z", scheduledAt: null, publishedAt: null, threadsPostId: null, threadsContainerId: null, replyPostIds: [], attemptCount: 0, lastError: null, metrics: {}, semanticSignature: "test",
};

function memoryStore() {
  let state: ContentRuntimeQueue = EMPTY_RUNTIME_QUEUE;
  return { read: async () => state, write: async (next: ContentRuntimeQueue) => { state = next; }, state: () => state };
}

describe("Threads publisher", () => {
  it("does not call Threads in review or dry-run mode", async () => {
    const store = memoryStore();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const preview = await publishNextContent([item], store, { apiBaseUrl: "https://graph.threads.net/v1.0", mode: "review", dryRun: true, maxAttempts: 2, siteUrl: "https://mr-tarot.netlify.app" });

    expect(preview.mode).toBe("dry-run");
    expect(preview.replies.at(-1)).toContain("utm_content=mr-tarot-test");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(store.state().items[item.id]?.status).toBe("READY");
    vi.unstubAllGlobals();
  });

  it("persists containers before publishing the main post and replies", async () => {
    const store = memoryStore();
    const responses = [
      new Response(JSON.stringify({ id: "main-container" }), { status: 200 }),
      new Response(JSON.stringify({ status: "FINISHED" }), { status: 200 }),
      new Response(JSON.stringify({ id: "main-post" }), { status: 200 }),
      new Response(JSON.stringify({ id: "reply-container" }), { status: 200 }),
      new Response(JSON.stringify({ id: "reply-post" }), { status: 200 }),
      new Response(JSON.stringify({ id: "cta-container" }), { status: 200 }),
      new Response(JSON.stringify({ id: "cta-post" }), { status: 200 }),
    ];
    vi.stubGlobal("fetch", vi.fn(async () => responses.shift()));
    const preview = await publishNextContent([item], store, { apiBaseUrl: "https://graph.threads.net/v1.0", mode: "auto", dryRun: false, maxAttempts: 2, siteUrl: "https://mr-tarot.netlify.app", accessToken: "token", userId: "user" });

    expect(preview.mode).toBe("published");
    expect(store.state().items[item.id]).toMatchObject({ status: "PUBLISHED", mainContainerId: "main-container", mainPostId: "main-post", replyPostIds: ["reply-post", "cta-post"] });
    vi.unstubAllGlobals();
  });

  it("materializes runtime status for operational status screens", () => {
    const items = applyRuntimeState([item], { version: 1, items: { [item.id]: { status: "PUBLISHED", updatedAt: "2026-08-30T00:00:00.000Z", attemptCount: 1, mainPostId: "post-1", metrics: { views: 10 } } } });

    expect(items[0]).toMatchObject({ status: "PUBLISHED", threadsPostId: "post-1", metrics: { views: 10 } });
  });
});
