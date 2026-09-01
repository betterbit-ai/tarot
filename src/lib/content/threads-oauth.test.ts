import { describe, expect, it, vi } from "vitest";
import { createThreadsAuthorizationUrl, exchangeThreadsOAuthCode, getThreadsOAuthConfig } from "./threads-oauth";

describe("Threads OAuth", () => {
  const config = {
    appId: "threads-app-id",
    appSecret: "threads-app-secret",
    redirectUri: "https://tarot.example.com/api/threads/oauth/callback",
    apiBaseUrl: "https://graph.threads.net",
    scopes: ["threads_basic", "threads_content_publish"],
  };

  it("creates an authorization URL only when a public callback is configured", () => {
    const url = createThreadsAuthorizationUrl(config);
    expect(url?.origin).toBe("https://threads.net");
    expect(url?.searchParams.get("redirect_uri")).toBe(config.redirectUri);
    expect(url?.searchParams.get("scope")).toBe("threads_basic,threads_content_publish");
    expect(createThreadsAuthorizationUrl({ ...config, appId: undefined })).toBeNull();
  });

  it("derives the callback URL from a verified Vercel origin", () => {
    expect(getThreadsOAuthConfig({ NEXT_PUBLIC_SITE_URL: "https://tarot.example.com", THREADS_APP_ID: "id" }).redirectUri).toBe("https://tarot.example.com/api/threads/oauth/callback");
    expect(getThreadsOAuthConfig({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000", THREADS_APP_ID: "id" }).redirectUri).toBeUndefined();
  });

  it("exchanges a code and persists only a long-lived token shape", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "short", user_id: "user-123" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "long", expires_in: 60 }), { status: 200 }));

    const result = await exchangeThreadsOAuthCode("authorization-code", config, fetcher, () => new Date("2026-09-01T00:00:00.000Z"));

    expect(result).toEqual({
      userId: "user-123",
      token: { accessToken: "long", userId: "user-123", refreshedAt: "2026-09-01T00:00:00.000Z", expiresAt: "2026-09-01T00:01:00.000Z" },
    });
    expect(fetcher.mock.calls[0]?.[0].toString()).toContain("grant_type=authorization_code");
    expect(fetcher.mock.calls[1]?.[1]).toMatchObject({ headers: { authorization: "Bearer short" } });
  });
});
