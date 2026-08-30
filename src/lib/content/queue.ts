import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ContentQueue } from "@/domain/content";

export function getContentQueue(): ContentQueue {
  return JSON.parse(readFileSync(resolve(process.cwd(), "data/content/threads-queue.json"), "utf8")) as ContentQueue;
}
