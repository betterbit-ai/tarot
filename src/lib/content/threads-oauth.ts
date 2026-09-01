import type { ThreadsTokenState } from "./token";

type Environment = Record<string, string | undefined>;

const THREADS_API_BASE = "https://graph.threads.net";
const THREADS_AUTHORIZE_URL = "https://threads.net/oauth/authorize";
const DEFAULT_SCOPES = [
  "threads_basic",
  "threads_content_publish",
  "threads_read_replies",
  "threads_manage_replies",
  "threads_manage_insights",
] as const;

export type ThreadsOAuthConfig = {
  appId?: string;
  appSecret?: string;
  redirectUri?: string;
  apiBaseUrl: string;
  scopes: readonly string[];
};

export type ThreadsOAuthExchange = {
  token: ThreadsTokenState;
  userId: string;
};

function trim(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

export function getThreadsOAuthConfig(env: Environment = process.env): ThreadsOAuthConfig {
  const siteUrl = trim(env.NEXT_PUBLIC_SITE_URL);
  const defaultRedirectUri = siteUrl?.startsWith("https://") ? `${siteUrl.replace(/\/$/, "")}/api/threads/oauth/callback` : undefined;
  return {
    appId: trim(env.THREADS_APP_ID),
    appSecret: trim(env.THREADS_APP_SECRET),
    redirectUri: trim(env.THREADS_OAUTH_REDIRECT_URI) ?? defaultRedirectUri,
    apiBaseUrl: trim(env.THREADS_API_BASE_URL) ?? THREADS_API_BASE,
    scopes: DEFAULT_SCOPES,
  };
}

export function createThreadsAuthorizationUrl(config: ThreadsOAuthConfig): URL | null {
  if (!config.appId || !config.redirectUri) return null;
  const url = new URL(THREADS_AUTHORIZE_URL);
  url.searchParams.set("client_id", config.appId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("scope", config.scopes.join(","));
  url.searchParams.set("response_type", "code");
  return url;
}

export async function exchangeThreadsOAuthCode(
  code: string,
  config: ThreadsOAuthConfig,
  fetcher: typeof fetch = fetch,
  now: () => Date = () => new Date(),
): Promise<ThreadsOAuthExchange> {
  if (!config.appId || !config.appSecret || !config.redirectUri) throw new Error("Threads OAuth is not configured");

  const codeExchange = new URL(`${config.apiBaseUrl}/oauth/access_token`);
  codeExchange.search = new URLSearchParams({
    client_id: config.appId,
    client_secret: config.appSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri,
  }).toString();
  const codeResponse = await fetcher(codeExchange, { method: "POST" });
  if (!codeResponse.ok) throw new Error(`Threads OAuth code exchange failed: ${codeResponse.status}`);
  const codePayload = await codeResponse.json() as { access_token?: string; user_id?: string };
  if (!codePayload.access_token || !codePayload.user_id) throw new Error("Threads OAuth code exchange returned incomplete credentials");

  const longLived = new URL(`${config.apiBaseUrl}/access_token`);
  longLived.search = new URLSearchParams({ grant_type: "th_exchange_token", client_secret: config.appSecret }).toString();
  const longLivedResponse = await fetcher(longLived, { headers: { authorization: `Bearer ${codePayload.access_token}` } });
  if (!longLivedResponse.ok) throw new Error(`Threads long-lived token exchange failed: ${longLivedResponse.status}`);
  const longLivedPayload = await longLivedResponse.json() as { access_token?: string; expires_in?: number };
  if (!longLivedPayload.access_token) throw new Error("Threads long-lived token exchange returned no token");

  const refreshedAt = now();
  return {
    userId: codePayload.user_id,
    token: {
      accessToken: longLivedPayload.access_token,
      refreshedAt: refreshedAt.toISOString(),
      expiresAt: typeof longLivedPayload.expires_in === "number" ? new Date(refreshedAt.getTime() + longLivedPayload.expires_in * 1000).toISOString() : null,
      userId: codePayload.user_id,
    },
  };
}
