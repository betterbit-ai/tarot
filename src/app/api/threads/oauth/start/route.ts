import { createOAuthBinding, createOAuthState, createThreadsAuthorizationUrl, getThreadsOAuthConfig } from "@/lib/content/threads-oauth";

export const runtime = "nodejs";

export function GET() {
  const config = getThreadsOAuthConfig();
  if (!config.stateSecret) return new Response("Threads OAuth state secret is not configured", { status: 503 });
  const binding = createOAuthBinding();
  const url = createThreadsAuthorizationUrl(config, createOAuthState(binding, config.stateSecret));
  if (!url) return new Response("Threads OAuth is not configured", { status: 503 });
  return new Response(null, {
    status: 302,
    headers: {
      location: url.toString(),
      "set-cookie": `mr_t_oauth=${binding}; HttpOnly; Secure; SameSite=Lax; Path=/api/threads/oauth; Max-Age=600`,
    },
  });
}
