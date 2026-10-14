import { describe, expect, it, vi } from "vitest";
import type { ThreadsContent } from "@/domain/content";
import { generateCommercePilot } from "@/domain/content";
import type { AffiliateProduct } from "@/lib/affiliate/products";
import { applyRuntimeState, EMPTY_RUNTIME_QUEUE, materializeThreadReplies, publishNextContent, repairMissingReadingReplies, type ContentRuntimeQueue } from "./publisher";

const item: ThreadsContent = {
  id: "mr-tarot-test", status: "READY", format: "PICK_3", topic: "LOVE", hook: "test", mainPost: "main", cardIds: [0, 1, 2], replies: ["1번\n\nreading one", "2번\n\nreading two", "3번\n\nreading three", "visit"], cta: "visit", imageAsset: "/threads/generated/mr-tarot-test.svg", altText: "test image", createdAt: "2026-08-30T00:00:00.000Z", scheduledAt: null, publishedAt: null, threadsPostId: null, threadsContainerId: null, replyPostIds: [], attemptCount: 0, lastError: null, metrics: {}, semanticSignature: "test",
};

const affiliateProducts: AffiliateProduct[] = ["organization", "new-start", "rest", "self-care", "focus"].map((category, index) => ({
  id: `product-${index}`,
  categories: [category as AffiliateProduct["categories"][number]],
  title: `${category} 추천 상품`,
  imageSrc: "https://image1.coupangcdn.com/image/example.jpg",
  imageAlt: "추천 상품",
  disclosure: "이 링크는 쿠팡 파트너스 활동의 일환으로 일정액의 수수료를 제공받을 수 있습니다.",
  ctaLabel: "쿠팡에서 보기",
  weight: 1,
  active: true,
  partnerUrl: `https://link.coupang.com/a/example-${index}`,
}));

function memoryStore(initialState: ContentRuntimeQueue = EMPTY_RUNTIME_QUEUE) {
  let state: ContentRuntimeQueue = initialState;
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
      new Response(JSON.stringify({ id: "reply-one-container" }), { status: 200 }),
      new Response(JSON.stringify({ id: "reply-two-container" }), { status: 200 }),
      new Response(JSON.stringify({ id: "reply-three-container" }), { status: 200 }),
      new Response(JSON.stringify({ id: "cta-container" }), { status: 200 }),
    ];
    vi.stubGlobal("fetch", vi.fn(async () => responses.shift()));
    const preview = await publishNextContent([item], store, { apiBaseUrl: "https://graph.threads.net/v1.0", mode: "auto", dryRun: false, maxAttempts: 2, siteUrl: "https://mr-tarot.netlify.app", accessToken: "token", userId: "user" });

    expect(preview.mode).toBe("published");
    expect(store.state().items[item.id]).toMatchObject({ status: "PUBLISHED", mainContainerId: "main-container", mainPostId: "main-post", replyPostIds: ["reply-one-container", "reply-two-container", "reply-three-container", "cta-container"], requiresReconciliation: false });
    expect(store.state().items[item.id]?.lastError).toBeUndefined();
    vi.unstubAllGlobals();
  });

  it("keeps a processing container retryable without exhausting attempts", async () => {
    const store = memoryStore();
    const responses = [
      new Response(JSON.stringify({ id: "main-container" }), { status: 200 }),
      new Response(JSON.stringify({ status: "IN_PROGRESS" }), { status: 200 }),
      new Response(JSON.stringify({ status: "IN_PROGRESS" }), { status: 200 }),
      new Response(JSON.stringify({ status: "IN_PROGRESS" }), { status: 200 }),
    ];
    vi.stubGlobal("fetch", vi.fn(async () => responses.shift()));
    const preview = await publishNextContent([item], store, { apiBaseUrl: "https://graph.threads.net/v1.0", mode: "auto", dryRun: false, maxAttempts: 2, siteUrl: "https://mr-tarot.netlify.app", accessToken: "token", userId: "user" });

    expect(preview.mode).toBe("failed");
    expect(preview.error).toBe("media container is still processing");
    expect(store.state().items[item.id]).toMatchObject({ status: "READY", attemptCount: 0, requiresReconciliation: false, mainContainerId: "main-container" });
    vi.unstubAllGlobals();
  });

  it("refuses an incomplete reading before making an external call", async () => {
    const store = memoryStore();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const incomplete = { ...item, cardIds: [0, 1], replies: ["1번\n\nreading one", "visit"] };

    const preview = await publishNextContent([incomplete], store, { apiBaseUrl: "https://graph.threads.net/v1.0", mode: "auto", dryRun: false, maxAttempts: 2, siteUrl: "https://mr-tarot.netlify.app", accessToken: "token", userId: "user" });

    expect(preview).toMatchObject({ mode: "failed", error: "Refusing to publish incomplete reading: expected 3 selectable cards, received 2" });
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("adds only the three missing readings to a confirmed published post", async () => {
    const store = memoryStore({ version: 1, items: { [item.id]: { status: "PUBLISHED", updatedAt: "2026-09-08T00:00:00.000Z", mainPostId: "existing-main", attemptCount: 1 } } });
    const responses = [
      new Response(JSON.stringify({ id: "repair-one" }), { status: 200 }),
      new Response(JSON.stringify({ id: "repair-two" }), { status: 200 }),
      new Response(JSON.stringify({ id: "repair-three" }), { status: 200 }),
    ];
    vi.stubGlobal("fetch", vi.fn(async () => responses.shift()));

    const preview = await repairMissingReadingReplies([item], item.id, store, { apiBaseUrl: "https://graph.threads.net/v1.0", mode: "auto", dryRun: false, maxAttempts: 2, siteUrl: "https://mr-tarot.netlify.app", accessToken: "token", userId: "user" });

    expect(preview).toMatchObject({ mode: "repaired", replies: item.replies.slice(0, 3) });
    expect(store.state().items[item.id]?.supplementalReplyPostIds).toEqual(["repair-one", "repair-two", "repair-three"]);
    vi.unstubAllGlobals();
  });

  it("materializes runtime status for operational status screens", () => {
    const items = applyRuntimeState([item], { version: 1, items: { [item.id]: { status: "PUBLISHED", updatedAt: "2026-08-30T00:00:00.000Z", attemptCount: 1, mainPostId: "post-1", metrics: { views: 10 } } } });

    expect(items[0]).toMatchObject({ status: "PUBLISHED", threadsPostId: "post-1", metrics: { views: 10 } });
  });

  it("adds a verified contextual Coupang product to every complete reading set", () => {
    const pilot = generateCommercePilot("2026-10-15T00:00:00.000Z")[0];
    if (!pilot) throw new Error("pilot fixture is missing");

    const result = materializeThreadReplies(pilot, { siteUrl: "https://mr-tarot.vercel.app", affiliateProducts });

    expect(result.error).toBeUndefined();
    expect(result.replies).toHaveLength(4);
    expect(result.replies.slice(0, 3).every((reply) => reply.includes("/out/coupang?") && reply.includes("content=mr-tarot-0047") && reply.includes("쿠팡 파트너스"))).toBe(true);
    expect(result.replies.every((reply) => reply.length <= 500)).toBe(true);
    expect(result.replies.at(-1)).toContain("utm_content=mr-tarot-0047");
  });

  it("fails closed before Threads when a complete set has no verified product", async () => {
    const pilot = generateCommercePilot("2026-10-15T00:00:00.000Z")[0];
    if (!pilot) throw new Error("pilot fixture is missing");
    const store = memoryStore();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const preview = await publishNextContent([pilot], store, { apiBaseUrl: "https://graph.threads.net/v1.0", mode: "auto", dryRun: false, maxAttempts: 2, siteUrl: "https://mr-tarot.vercel.app", accessToken: "token", userId: "user", affiliateProducts: [] });

    expect(preview.mode).toBe("failed");
    expect(preview.error).toContain("missing verified affiliate product");
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
