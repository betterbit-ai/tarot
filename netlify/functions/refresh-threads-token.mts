import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";
import { getThreadsTokenConfig } from "../../src/lib/content/config";
import { refreshThreadsToken, type ThreadsTokenState } from "../../src/lib/content/token";

const TOKEN_KEY = "threads-token.json";

const handler = async () => {
  const blob = getStore("mr-tarot-growth", { consistency: "strong" });
  const stored = await blob.get(TOKEN_KEY, { type: "json", consistency: "strong" }) as ThreadsTokenState | null;
  const config = getThreadsTokenConfig();
  const result = await refreshThreadsToken({ ...config, accessToken: stored?.accessToken ?? config.accessToken });
  if (result.token) {
    await blob.set(TOKEN_KEY, JSON.stringify(result.token));
  }
  console.log(JSON.stringify({ ...result, token: result.token ? { refreshedAt: result.token.refreshedAt, expiresAt: result.token.expiresAt } : undefined }));
  return new Response(JSON.stringify({ mode: result.mode, reason: result.reason }), { headers: { "content-type": "application/json" } });
};

export default handler;
export const config: Config = { schedule: "5 0 * * *" };
