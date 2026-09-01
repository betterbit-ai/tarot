import { createThreadsAuthorizationUrl, getThreadsOAuthConfig } from "@/lib/content/threads-oauth";

export const runtime = "nodejs";

export function GET() {
  const url = createThreadsAuthorizationUrl(getThreadsOAuthConfig());
  if (!url) return new Response("Threads OAuth is not configured", { status: 503 });
  return Response.redirect(url, 302);
}
