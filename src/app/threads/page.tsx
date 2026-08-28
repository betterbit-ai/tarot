import type { Metadata } from "next";
import { ThreadsContentClient } from "@/components/threads-content-client";
import { THREADS_WEEK_ONE } from "@/lib/threads/week-one";

export const metadata: Metadata = {
  title: "Threads 게시물 | 미스터 타로",
  description: "미스터 타로 Threads Week 01 게시물을 복사하고 이미지를 저장하세요.",
};

export default function ThreadsPage() {
  return <ThreadsContentClient days={THREADS_WEEK_ONE} />;
}
