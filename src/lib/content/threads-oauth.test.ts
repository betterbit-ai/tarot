import { describe, expect, it, vi } from "vitest";
import { createOAuthState, createThreadsAuthorizationUrl, exchangeThreadsOAuthCode, fetchThreadsIdentity, getThreadsOAuthConfig, validateOAuthState } from "./threads-oauth";

describe("Threads OAuth", () => {
  const config = {
    appId: "threads-app-id",
    appSecret: "threads-app-secret",
    redirectUri: "https://tarot.example.com/api/threads/oauth/callback",
    apiBaseUrl: "https://graph.threads.net",
    scopes: ["threads_basic", "threads_content_publish"],
    expectedUsername: "mr._.tarot",
  };

  it("creates an authorization URL only when a public callback is configured", () => {
    const url = createThreadsAuthorizationUrl(config, "signed-state");
    expect(url?.origin).toBe("https://threads.net");
    expect(url?.searchParams.get("redirect_uri")).toBe(config.redirectUri);
    expect(url?.searchParams.get("scope")).toBe("threads_basic,threads_content_publish");
    expect(url?.searchParams.get("state")).toBe("signed-state");
    expect(createThreadsAuthorizationUrl({ ...config, appId: undefined }, "state")).toBeNull();
  });

  it("derives the callback URL from a verified Vercel origin", () => {
    expect(getThreadsOAuthConfig({ NEXT_PUBLIC_SITE_URL: "https://tarot.example.com", THREADS_APP_ID: "id" }).redirectUri).toBe("https://tarot.example.com/api/threads/oauth/callback");
    expect(getThreadsOAuthConfig({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000", THREADS_APP_ID: "id" }).redirectUri).toBeUndefined();
  });

  it("exchanges a code and persists only a long-lived token shape", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "short", user_id: "user-123" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "user-123", username: "mr._.tarot" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "long", expires_in: 60 }), { status: 200 }));

    const result = await exchangeThreadsOAuthCode("authorization-code", config, fetcher, () => new Date("2026-09-01T00:00:00.000Z"));

    expect(result).toEqual({
      userId: "user-123",
      token: { accessToken: "long", userId: "user-123", refreshedAt: "2026-09-01T00:00:00.000Z", expiresAt: "2026-09-01T00:01:00.000Z" },
    });
    expect(fetcher.mock.calls[0]?.[0]).toBe("https://graph.threads.net/oauth/access_token");
    expect(String((fetcher.mock.calls[0]?.[1] as RequestInit).body)).toContain("grant_type=authorization_code");
    expect(fetcher.mock.calls[1]?.[1]).toMatchObject({ headers: { authorization: "Bearer short" } });
    expect(fetcher.mock.calls[2]?.[0].toString()).toContain("access_token=short");
  });

  it("binds the callback to a short-lived signed browser state", () => {
    const state = createOAuthState("browser-binding", "state-secret", 1_000);
    expect(validateOAuthState(state, "browser-binding", "state-secret", 1_001)).toBe(true);
    expect(validateOAuthState(state, "other-browser", "state-secret", 1_001)).toBe(false);
    expect(validateOAuthState(state, "browser-binding", "state-secret", 700_000)).toBe(false);
  });

  it("rejects a token that is not owned by the expected Threads account", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "other", username: "other" }), { status: 200 }));
    await expect(fetchThreadsIdentity("token", config, fetcher)).rejects.toThrow("unexpected account");
  });
});
