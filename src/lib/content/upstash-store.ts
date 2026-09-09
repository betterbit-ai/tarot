import { EMPTY_RUNTIME_QUEUE, type ContentRuntimeQueue, type ContentStateStore } from "./publisher";

const RUNTIME_STATE_KEY = "mr-tarot:threads-runtime-state:v1";
const TOKEN_STATE_KEY = "mr-tarot:threads-token:v1";
const DAILY_PUBLISH_KEY = "mr-tarot:threads-daily-publish:v1";
const DAILY_PUBLISH_LOCK_KEY = "mr-tarot:threads-daily-publish-lock:v1";
export const AFFILIATE_POOL_KEY = "mr-tarot:affiliate-pool:v1";

type Fetcher = typeof fetch;
type Environment = Record<string, string | undefined>;

type UpstashResponse = {
  result?: unknown;
  error?: string;
};

export type UpstashJsonStore = {
  get: <Value>(key: string) => Promise<Value | null>;
  set: (key: string, value: unknown) => Promise<void>;
  setIfAbsent: (key: string, value: unknown, expirationSeconds: number) => Promise<boolean>;
  delete: (key: string) => Promise<void>;
  incrementHash: (key: string, field: string, amount: number, expirationSeconds: number) => Promise<number>;
  readHash: (key: string) => Promise<Record<string, number>>;
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

  async function transaction<Result>(inputs: unknown[][]): Promise<Result[]> {
    const endpoint = `${url.replace(/\/$/, "")}/multi-exec`;
    const response = await fetcher(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(inputs),
    });
    const payload = await response.json() as UpstashResponse[] | UpstashResponse;
    if (!response.ok || !Array.isArray(payload)) {
      throw new Error(Array.isArray(payload) ? `Upstash transaction failed: ${response.status}` : payload.error ?? `Upstash transaction failed: ${response.status}`);
    }
    const error = payload.find((item) => item.error)?.error;
    if (error) throw new Error(error);
    return payload.map((item) => item.result as Result);
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
    async setIfAbsent(key: string, value: unknown, expirationSeconds: number): Promise<boolean> {
      const result = await command<string | null>(["SET", key, JSON.stringify(value), "NX", "EX", String(expirationSeconds)]);
      return result === "OK";
    },
    async delete(key: string): Promise<void> {
      await command<number>(["DEL", key]);
    },
    async incrementHash(key: string, field: string, amount: number, expirationSeconds: number): Promise<number> {
      const [result] = await transaction<number>([
        ["HINCRBY", key, field, String(amount)],
        ["EXPIRE", key, String(expirationSeconds)],
      ]);
      return result ?? 0;
    },
    async readHash(key: string): Promise<Record<string, number>> {
      const result = await command<string[] | Record<string, string> | null>(["HGETALL", key]);
      if (!result) return {};
      if (!Array.isArray(result)) {
        return Object.fromEntries(Object.entries(result).map(([field, raw]) => [field, Number(raw)]).filter(([, value]) => Number.isFinite(value)));
      }
      const output: Record<string, number> = {};
      for (let index = 0; index < result.length; index += 2) {
        const field = result[index];
        const raw = result[index + 1];
        if (!field || raw === undefined) continue;
        const value = Number(raw);
        if (Number.isFinite(value)) output[field] = value;
      }
      return output;
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
export const UPSTASH_DAILY_PUBLISH_KEY = DAILY_PUBLISH_KEY;
export const UPSTASH_DAILY_PUBLISH_LOCK_KEY = DAILY_PUBLISH_LOCK_KEY;
