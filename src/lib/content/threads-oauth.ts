import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
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
  stateSecret?: string;
  expectedUsername?: string;
  apiBaseUrl: string;
  scopes: readonly string[];
};

export type ThreadsOAuthExchange = {
  token: ThreadsTokenState;
  userId: string;
};

type OAuthState = { binding: string; expiresAt: number };

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
    stateSecret: trim(env.THREADS_OAUTH_STATE_SECRET),
    expectedUsername: trim(env.THREADS_EXPECTED_USERNAME),
    apiBaseUrl: trim(env.THREADS_API_BASE_URL) ?? THREADS_API_BASE,
    scopes: DEFAULT_SCOPES,
  };
}

function signature(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createOAuthState(binding: string, secret: string, now = Date.now()): string {
  const payload: OAuthState = { binding, expiresAt: now + 10 * 60 * 1000 };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signature(encoded, secret)}`;
}

export function validateOAuthState(state: string | null, binding: string | undefined, secret: string | undefined, now = Date.now()): boolean {
  if (!state || !binding || !secret) return false;
  const [encoded, suppliedSignature] = state.split(".");
  if (!encoded || !suppliedSignature) return false;
  const expectedSignature = signature(encoded, secret);
  const received = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return false;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as OAuthState;
    return payload.binding === binding && payload.expiresAt >= now;
  } catch {
    return false;
  }
}

export function createOAuthBinding(): string {
  return randomUUID();
}

export function createThreadsAuthorizationUrl(config: ThreadsOAuthConfig, state: string): URL | null {
  if (!config.appId || !config.redirectUri || !state) return null;
  const url = new URL(THREADS_AUTHORIZE_URL);
  url.searchParams.set("client_id", config.appId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("scope", config.scopes.join(","));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  return url;
}

export async function exchangeThreadsOAuthCode(
  code: string,
  config: ThreadsOAuthConfig,
  fetcher: typeof fetch = fetch,
  now: () => Date = () => new Date(),
): Promise<ThreadsOAuthExchange> {
  if (!config.appId || !config.appSecret || !config.redirectUri || !config.expectedUsername) throw new Error("Threads OAuth is not configured");

  const codeExchangeBody = new URLSearchParams({
    client_id: config.appId,
    client_secret: config.appSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri,
  });
  const codeResponse = await fetcher(`${config.apiBaseUrl}/oauth/access_token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: codeExchangeBody,
  });
  if (!codeResponse.ok) throw new Error(`Threads OAuth code exchange failed: ${codeResponse.status}`);
  const codePayload = await codeResponse.json() as { access_token?: string; user_id?: string };
  if (!codePayload.access_token || !codePayload.user_id) throw new Error("Threads OAuth code exchange returned incomplete credentials");

  const identity = new URL(`${config.apiBaseUrl}/me`);
  identity.searchParams.set("fields", "id,username");
  const identityResponse = await fetcher(identity, { headers: { authorization: `Bearer ${codePayload.access_token}` } });
  if (!identityResponse.ok) throw new Error(`Threads identity check failed: ${identityResponse.status}`);
  const identityPayload = await identityResponse.json() as { id?: string; username?: string };
  if (identityPayload.id !== codePayload.user_id || identityPayload.username !== config.expectedUsername) {
    throw new Error("Threads OAuth authorized an unexpected account");
  }

  const longLived = new URL(`${config.apiBaseUrl}/access_token`);
  longLived.search = new URLSearchParams({ grant_type: "th_exchange_token", client_secret: config.appSecret, access_token: codePayload.access_token }).toString();
  const longLivedResponse = await fetcher(longLived);
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
