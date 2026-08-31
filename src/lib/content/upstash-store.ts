import { EMPTY_RUNTIME_QUEUE, type ContentRuntimeQueue, type ContentStateStore } from "./publisher";

const RUNTIME_STATE_KEY = "mr-tarot:threads-runtime-state:v1";
const TOKEN_STATE_KEY = "mr-tarot:threads-token:v1";

type Fetcher = typeof fetch;
type Environment = Record<string, string | undefined>;

type UpstashResponse = {
  result?: unknown;
  error?: string;
};

export type UpstashJsonStore = {
  get: <Value>(key: string) => Promise<Value | null>;
  set: (key: string, value: unknown) => Promise<void>;
};

function configFrom(env: Environment) {
  const url = env.UPSTASH_REDIS_REST_URL?.trim();
  const token = env.UPSTASH_REDIS_REST_TOKEN?.trim();
  return url && token ? { url, token } : null;
}

export function createUpstashJsonStore(env: Environment = process.env, fetcher: Fetcher = fetch): UpstashJsonStore | null {
  const config = configFrom(env);
  if (!config) return null;
  const { url, token } = config;

  async function command<Result>(input: unknown[]): Promise<Result> {
    const response = await fetcher(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    });
    const payload = await response.json() as UpstashResponse;
    if (!response.ok || payload.error) {
      throw new Error(payload.error ?? `Upstash request failed: ${response.status}`);
    }
    return payload.result as Result;
  }

  return {
    async get<Value>(key: string): Promise<Value | null> {
      const result = await command<string | null>(["GET", key]);
      if (result === null) return null;
      return JSON.parse(result) as Value;
    },
    async set(key: string, value: unknown): Promise<void> {
      await command<string>(["SET", key, JSON.stringify(value)]);
    },
  };
}

export function createUpstashContentStateStore(env: Environment = process.env, fetcher: Fetcher = fetch): ContentStateStore | null {
  const store = createUpstashJsonStore(env, fetcher);
  if (!store) return null;
  return {
    async read(): Promise<ContentRuntimeQueue> {
      return await store.get<ContentRuntimeQueue>(RUNTIME_STATE_KEY) ?? EMPTY_RUNTIME_QUEUE;
    },
    async write(state: ContentRuntimeQueue): Promise<void> {
      await store.set(RUNTIME_STATE_KEY, state);
    },
  };
}

export const UPSTASH_TOKEN_STATE_KEY = TOKEN_STATE_KEY;
