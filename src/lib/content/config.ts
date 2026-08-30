import type { PublishMode, ThreadsPublisherConfig } from "./publisher";

const enabled = (value: string | undefined) => value?.trim().toLowerCase() === "true";

export function getThreadsPublisherConfig(env = process.env): ThreadsPublisherConfig {
  const mode: PublishMode = env.PUBLISH_MODE?.trim().toLowerCase() === "auto" ? "auto" : "review";
  return {
    accessToken: env.THREADS_ACCESS_TOKEN?.trim() || undefined,
    userId: env.THREADS_USER_ID?.trim() || undefined,
    siteUrl: env.NEXT_PUBLIC_SITE_URL?.trim() || "https://mr-tarot.netlify.app",
    apiBaseUrl: env.THREADS_API_BASE_URL?.trim() || "https://graph.threads.net/v1.0",
    mode,
    dryRun: env.DRY_RUN === undefined ? true : enabled(env.DRY_RUN),
    maxAttempts: Math.max(1, Number(env.THREADS_MAX_ATTEMPTS ?? "2")),
  };
}

export function getThreadsMetricsConfig(env = process.env) {
  return {
    accessToken: env.THREADS_ACCESS_TOKEN?.trim() || undefined,
    apiBaseUrl: env.THREADS_API_BASE_URL?.trim() || "https://graph.threads.net/v1.0",
    metrics: (env.THREADS_INSIGHT_METRICS?.trim() || "views,likes,replies,reposts,quotes").split(",").map((metric) => metric.trim()).filter(Boolean),
    dryRun: env.DRY_RUN === undefined ? true : enabled(env.DRY_RUN),
  };
}

export function getThreadsTokenConfig(env = process.env) {
  return {
    accessToken: env.THREADS_ACCESS_TOKEN?.trim() || undefined,
    apiBaseUrl: env.THREADS_API_BASE_URL?.trim() || "https://graph.threads.net/v1.0",
    dryRun: env.DRY_RUN === undefined ? true : enabled(env.DRY_RUN),
  };
}
