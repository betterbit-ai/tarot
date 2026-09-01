export type ThreadsTokenState = {
  accessToken: string;
  refreshedAt: string;
  expiresAt: string | null;
  userId?: string;
};

export type ThreadsTokenConfig = {
  accessToken?: string;
  apiBaseUrl: string;
  dryRun: boolean;
};

export type TokenRefreshResult = { mode: "dry-run" | "skipped" | "refreshed" | "failed"; token?: ThreadsTokenState; reason?: string };

export async function refreshThreadsToken(config: ThreadsTokenConfig): Promise<TokenRefreshResult> {
  if (config.dryRun) return { mode: "dry-run" };
  if (!config.accessToken) return { mode: "skipped", reason: "Missing THREADS_ACCESS_TOKEN" };
  try {
    const url = new URL(`${config.apiBaseUrl}/refresh_access_token`);
    url.search = new URLSearchParams({ grant_type: "th_refresh_token", access_token: config.accessToken }).toString();
    const response = await fetch(url);
    if (!response.ok) return { mode: "failed", reason: `Token refresh failed: ${response.status}` };
    const payload = await response.json() as { access_token?: string; expires_in?: number };
    if (!payload.access_token) return { mode: "failed", reason: "Token refresh returned no access token" };
    const refreshedAt = new Date();
    return {
      mode: "refreshed",
      token: {
        accessToken: payload.access_token,
        refreshedAt: refreshedAt.toISOString(),
        expiresAt: typeof payload.expires_in === "number" ? new Date(refreshedAt.getTime() + payload.expires_in * 1000).toISOString() : null,
      },
    };
  } catch (error) {
    return { mode: "failed", reason: error instanceof Error ? error.message : String(error) };
  }
}
