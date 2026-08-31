import { describe, expect, it, vi } from "vitest";
import { EMPTY_RUNTIME_QUEUE } from "./publisher";
import { createUpstashContentStateStore, createUpstashJsonStore } from "./upstash-store";

const env = {
  UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "server-only-token",
};

describe("Upstash JSON store", () => {
  it("is unavailable until both server-only variables exist", () => {
    expect(createUpstashJsonStore({})).toBeNull();
    expect(createUpstashJsonStore({ UPSTASH_REDIS_REST_URL: env.UPSTASH_REDIS_REST_URL })).toBeNull();
  });

  it("uses the REST token in an authorization header without exposing it in the key", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ result: "OK" }), { status: 200 }));
    const store = createUpstashJsonStore(env, fetcher)!;

    await store.set("state", { version: 1 });

    expect(fetcher).toHaveBeenCalledWith(env.UPSTASH_REDIS_REST_URL, expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ authorization: "Bearer server-only-token" }),
      body: JSON.stringify(["SET", "state", JSON.stringify({ version: 1 })]),
    }));
  });

  it("hydrates an empty content queue when no runtime state has been written", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ result: null }), { status: 200 }));
    const store = createUpstashContentStateStore(env, fetcher)!;

    await expect(store.read()).resolves.toEqual(EMPTY_RUNTIME_QUEUE);
  });
});
