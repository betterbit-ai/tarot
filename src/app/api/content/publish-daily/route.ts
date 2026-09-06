import sourceQueue from "../../../../../data/content/threads-queue.json";
import type { ContentQueue } from "@/domain/content";
import { getThreadsPublisherConfig, withStoredThreadsToken } from "@/lib/content/config";
import { kstCalendarDate, publishedContentForKstDate, type DailyPublishMarker } from "@/lib/content/daily-publish";
import { publishNextContent } from "@/lib/content/publisher";
import { schedulerRequestIsAuthorized, vercelCronRequestIsAuthorized } from "@/lib/content/scheduler-auth";
import { createUpstashContentStateStore, createUpstashJsonStore, UPSTASH_DAILY_PUBLISH_KEY, UPSTASH_DAILY_PUBLISH_LOCK_KEY, UPSTASH_TOKEN_STATE_KEY } from "@/lib/content/upstash-store";
import type { ThreadsTokenState } from "@/lib/content/token";

export const runtime = "nodejs";

async function publishDaily(request: Request) {
  if (!schedulerRequestIsAuthorized(request) && !vercelCronRequestIsAuthorized(request)) return new Response("Unauthorized", { status: 401 });
  const contentStore = createUpstashContentStateStore();
  const jsonStore = createUpstashJsonStore();
  if (!contentStore || !jsonStore) return new Response("Upstash runtime state is not configured", { status: 503 });

  const today = kstCalendarDate();
  const [runtimeState, marker] = await Promise.all([
    contentStore.read(),
    jsonStore.get<DailyPublishMarker>(UPSTASH_DAILY_PUBLISH_KEY),
  ]);
  const runtimePublishedId = publishedContentForKstDate(runtimeState, today);
  if (marker?.publishedKstDate === today || runtimePublishedId) {
    return Response.json({ mode: "already-published", contentId: marker?.contentId ?? runtimePublishedId, kstDate: today });
  }

  const lockKey = `${UPSTASH_DAILY_PUBLISH_LOCK_KEY}:${today}`;
  const hasLock = await jsonStore.setIfAbsent(lockKey, { startedAt: new Date().toISOString() }, 900);
  if (!hasLock) return Response.json({ mode: "publish-in-progress", kstDate: today }, { status: 202 });

  try {
    // Re-read after the atomic lease. A parallel request can finish between the
    // initial guard and this request acquiring the lease.
    const [lockedRuntimeState, lockedMarker, refreshed] = await Promise.all([
      contentStore.read(),
      jsonStore.get<DailyPublishMarker>(UPSTASH_DAILY_PUBLISH_KEY),
      jsonStore.get<ThreadsTokenState>(UPSTASH_TOKEN_STATE_KEY),
    ]);
    const lockedRuntimePublishedId = publishedContentForKstDate(lockedRuntimeState, today);
    if (lockedMarker?.publishedKstDate === today || lockedRuntimePublishedId) {
      return Response.json({ mode: "already-published", contentId: lockedMarker?.contentId ?? lockedRuntimePublishedId, kstDate: today });
    }

    const config = getThreadsPublisherConfig();
    const result = await publishNextContent((sourceQueue as ContentQueue).items, contentStore, {
      ...withStoredThreadsToken(config, refreshed),
      userId: refreshed?.userId ?? config.userId,
    });
    if (result.mode === "published") {
      const publishedAt = new Date().toISOString();
      await jsonStore.set(UPSTASH_DAILY_PUBLISH_KEY, { version: 1, publishedKstDate: today, contentId: result.id, publishedAt } satisfies DailyPublishMarker);
      return Response.json({ ...result, kstDate: today });
    }
    const status = result.mode === "failed" ? 502 : 200;
    return Response.json({ ...result, kstDate: today }, { status });
  } finally {
    // A failure must not block later GitHub recovery attempts. The expiry is a
    // final safeguard if this invocation is interrupted before reaching here.
    try {
      await jsonStore.delete(lockKey);
    } catch (error) {
      console.error("Unable to release the daily Threads publishing lease", error);
    }
  }
}

export async function POST(request: Request) {
  return publishDaily(request);
}

export async function GET(request: Request) {
  return publishDaily(request);
}
