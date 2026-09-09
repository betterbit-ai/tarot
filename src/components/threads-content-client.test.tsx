import type { HTMLAttributes } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThreadsContentClient } from "./threads-content-client";
import type { ContentQueue } from "@/domain/content";
import type { DailyGrowthReport } from "@/lib/analytics/funnel";

vi.mock("next/image", () => ({ default: ({ alt, ...props }: HTMLAttributes<HTMLDivElement> & { alt?: string }) => <div aria-label={alt} {...props} /> }));

const queue: ContentQueue = {
  version: 1,
  generatedAt: "2026-08-30T00:00:00.000Z",
  items: [
    { id: "mr-tarot-0001", status: "READY", format: "PICK_3", topic: "LOVE", hook: "첫 번째 카드", mainPost: "첫 번째 본문", cardIds: [0, 1, 2], replies: ["1번\n\n첫 번째 결과", "2번\n\n두 번째 결과", "3번\n\n세 번째 결과", "첫 번째 CTA"], cta: "첫 번째 CTA", imageAsset: "/threads/generated/mr-tarot-0001.png", altText: "첫 번째 이미지", createdAt: "2026-08-30T00:00:00.000Z", scheduledAt: null, publishedAt: null, threadsPostId: null, threadsContainerId: null, replyPostIds: [], attemptCount: 0, lastError: null, metrics: {}, semanticSignature: "one" },
    { id: "mr-tarot-0002", status: "READY", format: "YES_NO_NOT_YET", topic: "GENERAL", hook: "두 번째 카드", mainPost: "두 번째 본문", cardIds: [3, 4, 5], replies: ["1번\n\n두 번째 첫 해석", "2번\n\n두 번째 둘 해석", "3번\n\n두 번째 셋 해석", "두 번째 CTA"], cta: "두 번째 CTA", imageAsset: null, altText: null, createdAt: "2026-08-30T00:00:00.000Z", scheduledAt: null, publishedAt: null, threadsPostId: null, threadsContainerId: null, replyPostIds: [], attemptCount: 0, lastError: null, metrics: {}, semanticSignature: "two" },
  ],
};

const funnelReports: DailyGrowthReport[] = [{
  date: "2026-09-09",
  counts: { landing_view: 10, ritual_started: 6, cards_confirmed: 5, result_viewed: 4, affiliate_viewed: 3, affiliate_skipped: 2, affiliate_clicked: 1, result_shared: 1 },
  contentIds: ["mr-tarot-0009"],
  threads: { views: 120, likes: 8, replies: 4 },
}];

describe("ThreadsContentClient", () => {
  afterEach(() => cleanup());

  it("shows queue status and changes the selected content", () => {
    render(<ThreadsContentClient queue={queue} funnelReports={funnelReports} />);
    expect(screen.getByText("READY 2")).not.toBeNull();
    expect(screen.getByText("첫 번째 본문")).not.toBeNull();
    expect(screen.getByText("Threads → 타로 → 쿠팡")).not.toBeNull();
    expect(screen.getByText("25%")).not.toBeNull();
    expect(screen.getByText("가장 큰 이탈은 페이지 유입 뒤예요. Threads CTA와 첫 화면 약속이 같은 장면을 말하는지 먼저 점검하세요.")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /#0002/ }));
    expect(screen.getByText("두 번째 본문")).not.toBeNull();
    expect(screen.queryByText("첫 번째 이미지")).toBeNull();
  });
});
