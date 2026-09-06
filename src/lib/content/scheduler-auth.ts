export function schedulerRequestIsAuthorized(request: Request, env: Record<string, string | undefined> = process.env): boolean {
  const secret = env.CONTENT_SCHEDULER_SECRET?.trim();
  return Boolean(secret) && request.headers.get("x-mr-tarot-scheduler") === secret;
}

export function vercelCronRequestIsAuthorized(request: Request, env: Record<string, string | undefined> = process.env): boolean {
  const secret = env.CRON_SECRET?.trim();
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}
