import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";
import { getThreadsTokenConfig } from "../../src/lib/content/config";
import { refreshThreadsToken } from "../../src/lib/content/token";

const TOKEN_KEY = "threads-token.json";

const handler = async () => {
  const result = await refreshThreadsToken(getThreadsTokenConfig());
  if (result.token) {
    const blob = getStore("mr-tarot-growth", { consistency: "strong" });
    await blob.set(TOKEN_KEY, JSON.stringify(result.token));
  }
  console.log(JSON.stringify({ ...result, token: result.token ? { refreshedAt: result.token.refreshedAt, expiresAt: result.token.expiresAt } : undefined }));
  return new Response(JSON.stringify({ mode: result.mode, reason: result.reason }), { headers: { "content-type": "application/json" } });
};

export default handler;
export const config: Config = { schedule: "5 0 * * *" };
