import type { Metadata } from "next";
import { ThreadsContentClient } from "@/components/threads-content-client";
import { getContentQueue } from "@/lib/content/queue";

export const metadata: Metadata = {
  title: "Threads 콘텐츠 큐 | 미스터 타로",
  description: "미스터 타로의 준비된 Threads 콘텐츠 큐를 확인하고 복사하세요.",
};

export default function ThreadsPage() {
  return <ThreadsContentClient queue={getContentQueue()} />;
}
