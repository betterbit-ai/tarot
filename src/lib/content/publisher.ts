import type { ContentMetrics, ContentStatus, ThreadsContent } from "@/domain/content";

export type PublishMode = "review" | "auto";

export type ContentRuntimeState = {
  status: ContentStatus;
  updatedAt: string;
  mainContainerId?: string;
  mainPostId?: string;
  publishedAt?: string;
  replyContainerIds?: string[];
  replyPostIds?: string[];
  attemptCount: number;
  lastError?: string;
  requiresReconciliation?: boolean;
  metrics?: ContentMetrics;
};

export type ContentRuntimeQueue = {
  version: 1;
  items: Record<string, ContentRuntimeState>;
};

export type ContentStateStore = {
  read: () => Promise<ContentRuntimeQueue>;
  write: (state: ContentRuntimeQueue) => Promise<void>;
};

export type ThreadsPublisherConfig = {
  accessToken?: string;
  userId?: string;
  siteUrl?: string;
  apiBaseUrl: string;
  mode: PublishMode;
  dryRun: boolean;
  maxAttempts: number;
};

export type PublishPreview = {
  id: string;
  mode: "dry-run" | "review" | "published" | "failed" | "nothing-ready";
  main: string;
  imageUrl: string | null;
  replies: string[];
  error?: string;
};

export const EMPTY_RUNTIME_QUEUE: ContentRuntimeQueue = { version: 1, items: {} };

export function applyRuntimeState(source: readonly ThreadsContent[], runtime: ContentRuntimeQueue): ThreadsContent[] {
  return source.map((item) => {
    const state = runtime.items[item.id];
    if (!state) return item;
    return {
      ...item,
      status: state.status,
      publishedAt: state.publishedAt ?? item.publishedAt,
      threadsPostId: state.mainPostId ?? item.threadsPostId,
      threadsContainerId: state.mainContainerId ?? item.threadsContainerId,
      replyPostIds: state.replyPostIds ?? item.replyPostIds,
      attemptCount: state.attemptCount,
      lastError: state.lastError ?? item.lastError,
      metrics: state.metrics ?? item.metrics,
    };
  });
}

function now(): string {
  return new Date().toISOString();
}

function stateFor(queue: ContentRuntimeQueue, item: ThreadsContent): ContentRuntimeState {
  return queue.items[item.id] ?? { status: item.status, updatedAt: item.createdAt, attemptCount: 0 };
}

function siteCta(item: ThreadsContent, siteUrl?: string): string {
  if (!siteUrl) return item.cta;
  const url = new URL(siteUrl);
  url.searchParams.set("utm_source", "threads");
  url.searchParams.set("utm_medium", "social");
  url.searchParams.set("utm_campaign", "growth-engine");
  url.searchParams.set("utm_content", item.id);
  return `${item.cta}\n${url.toString()}`;
}

function applyState(queue: ContentRuntimeQueue, id: string, next: ContentRuntimeState): ContentRuntimeQueue {
  return { ...queue, items: { ...queue.items, [id]: next } };
}

async function threadsError(response: Response, fallback: string): Promise<Error> {
  const raw = await response.text();
  try {
    const payload = JSON.parse(raw) as { error?: { message?: string } };
    if (payload.error?.message) return new Error(`${fallback}: ${payload.error.message}`);
  } catch {
    // Keep the status-only fallback when the provider does not return JSON.
  }
  return new Error(fallback);
}

async function requestContainer(config: ThreadsPublisherConfig, text: string, replyToId?: string, imageUrl?: string, altText?: string): Promise<string> {
  const body = new URLSearchParams({ text, media_type: imageUrl ? "IMAGE" : "TEXT" });
  if (replyToId) body.set("reply_to_id", replyToId);
  if (imageUrl) body.set("image_url", imageUrl);
  if (altText) body.set("alt_text", altText);
  const response = await fetch(`${config.apiBaseUrl}/${config.userId}/threads`, {
    method: "POST",
    headers: { authorization: `Bearer ${config.accessToken}`, "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) throw await threadsError(response, `container request failed: ${response.status}`);
  const payload = await response.json() as { id?: string };
  if (!payload.id) throw new Error("container request returned no id");
  return payload.id;
}

async function waitForContainer(config: ThreadsPublisherConfig, containerId: string): Promise<void> {
  if (!config.accessToken) throw new Error("Threads access token is not configured");

  const maxChecks = 12;
  for (let check = 0; check < maxChecks; check += 1) {
    const response = await fetch(`${config.apiBaseUrl}/${containerId}?fields=status,error_message`, {
      headers: { authorization: `Bearer ${config.accessToken}` },
    });
    if (!response.ok) throw await threadsError(response, `container status request failed: ${response.status}`);

    const payload = await response.json() as { status?: string; error_message?: string };
    if (payload.status === "FINISHED") return;
    if (payload.status === "ERROR") throw new Error(`container processing failed: ${payload.error_message ?? "unknown error"}`);
    if (check < maxChecks - 1) await new Promise((resolve) => setTimeout(resolve, 400));
  }

  throw new Error("media container is still processing");
}

async function publishContainer(config: ThreadsPublisherConfig, containerId: string): Promise<string> {
  const response = await fetch(`${config.apiBaseUrl}/${config.userId}/threads_publish`, {
    method: "POST",
    headers: { authorization: `Bearer ${config.accessToken}`, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ creation_id: containerId }),
  });
  if (!response.ok) throw await threadsError(response, `publish request failed: ${response.status}`);
  const payload = await response.json() as { id?: string };
  if (!payload.id) throw new Error("publish request returned no id");
  return payload.id;
}

export async function publishNextContent(source: readonly ThreadsContent[], store: ContentStateStore, config: ThreadsPublisherConfig): Promise<PublishPreview> {
  let queue = await store.read();
  const item = source.find((candidate) => stateFor(queue, candidate).status === "READY");
  if (!item) return { id: "", mode: "nothing-ready", main: "", imageUrl: null, replies: [] };

  const cta = siteCta(item, config.siteUrl);
  const replies = item.replies.map((reply, index) => index === item.replies.length - 1 ? cta : reply);
  const imageUrl = item.imageAsset && config.siteUrl ? new URL(item.imageAsset, config.siteUrl).toString() : null;

  if (config.dryRun || config.mode === "review") {
    const status = config.dryRun ? stateFor(queue, item).status : "SCHEDULED";
    queue = applyState(queue, item.id, { ...stateFor(queue, item), status, updatedAt: now() });
    await store.write(queue);
    return { id: item.id, mode: config.dryRun ? "dry-run" : "review", main: item.mainPost, imageUrl, replies };
  }

  if (!config.accessToken || !config.userId || !config.siteUrl) {
    return { id: item.id, mode: "failed", main: item.mainPost, imageUrl, replies, error: "Missing Threads credentials or site URL" };
  }

  let runtime = stateFor(queue, item);
  if (runtime.requiresReconciliation || runtime.attemptCount >= config.maxAttempts) {
    return { id: item.id, mode: "failed", main: item.mainPost, imageUrl, replies, error: runtime.lastError ?? "Manual reconciliation required" };
  }

  runtime = { ...runtime, status: "PUBLISHING", updatedAt: now(), attemptCount: runtime.attemptCount + 1 };
  queue = applyState(queue, item.id, runtime);
  await store.write(queue);

  try {
    const mainContainerId = runtime.mainContainerId ?? await requestContainer(config, item.mainPost, undefined, imageUrl ?? undefined, item.altText ?? undefined);
    if (!runtime.mainContainerId) {
      runtime = { ...runtime, mainContainerId, updatedAt: now() };
      queue = applyState(queue, item.id, runtime);
      await store.write(queue);
    }
    await waitForContainer(config, mainContainerId);
    const mainPostId = runtime.mainPostId ?? await publishContainer(config, mainContainerId);
    runtime = { ...runtime, mainPostId, updatedAt: now() };
    queue = applyState(queue, item.id, runtime);
    await store.write(queue);

    const replyPostIds = [...(runtime.replyPostIds ?? [])];
    const replyContainerIds = [...(runtime.replyContainerIds ?? [])];
    for (let index = replyPostIds.length; index < replies.length; index += 1) {
      const containerId = replyContainerIds[index] ?? await requestContainer(config, replies[index] ?? "", mainPostId);
      replyContainerIds[index] = containerId;
      runtime = { ...runtime, replyContainerIds, replyPostIds, updatedAt: now() };
      queue = applyState(queue, item.id, runtime);
      await store.write(queue);
      await waitForContainer(config, containerId);
      replyPostIds[index] = await publishContainer(config, containerId);
      runtime = { ...runtime, replyContainerIds, replyPostIds, updatedAt: now() };
      queue = applyState(queue, item.id, runtime);
      await store.write(queue);
    }

    runtime = { ...runtime, status: "PUBLISHED", updatedAt: now(), publishedAt: now(), replyContainerIds, replyPostIds };
    queue = applyState(queue, item.id, runtime);
    await store.write(queue);
    return { id: item.id, mode: "published", main: item.mainPost, imageUrl, replies };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    runtime = { ...runtime, status: "FAILED", updatedAt: now(), lastError: message, requiresReconciliation: true };
    queue = applyState(queue, item.id, runtime);
    await store.write(queue);
    return { id: item.id, mode: "failed", main: item.mainPost, imageUrl, replies, error: message };
  }
}
