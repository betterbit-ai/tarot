import { describe, expect, it, vi } from "vitest";
import { refreshThreadsToken } from "./token";

describe("Threads token refresh", () => {
  it("never calls Meta in dry run", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await refreshThreadsToken({ accessToken: "token", apiBaseUrl: "https://graph.threads.net/v1.0", dryRun: true })).toEqual({ mode: "dry-run" });
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("keeps the refreshed token and expiry only when Meta returns a token", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ access_token: "new-token", expires_in: 60 }), { status: 200 })));
    const result = await refreshThreadsToken({ accessToken: "old-token", apiBaseUrl: "https://graph.threads.net/v1.0", dryRun: false });
    expect(result.mode).toBe("refreshed");
    expect(result.token).toMatchObject({ accessToken: "new-token" });
    expect(result.token?.expiresAt).not.toBeNull();
    vi.unstubAllGlobals();
  });
});
