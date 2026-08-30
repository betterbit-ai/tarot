import type { HTMLAttributes } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThreadsContentClient } from "./threads-content-client";
import type { ContentQueue } from "@/domain/content";

vi.mock("next/image", () => ({ default: ({ alt, ...props }: HTMLAttributes<HTMLDivElement> & { alt?: string }) => <div aria-label={alt} {...props} /> }));

const queue: ContentQueue = {
  version: 1,
  generatedAt: "2026-08-30T00:00:00.000Z",
  items: [
    { id: "mr-tarot-0001", status: "READY", format: "PICK_3", topic: "LOVE", hook: "첫 번째 카드", mainPost: "첫 번째 본문", cardIds: [0, 1, 2], replies: ["첫 번째 결과", "첫 번째 CTA"], cta: "첫 번째 CTA", imageAsset: "/threads/generated/mr-tarot-0001.png", altText: "첫 번째 이미지", createdAt: "2026-08-30T00:00:00.000Z", scheduledAt: null, publishedAt: null, threadsPostId: null, threadsContainerId: null, replyPostIds: [], attemptCount: 0, lastError: null, metrics: {}, semanticSignature: "one" },
    { id: "mr-tarot-0002", status: "READY", format: "CONVERSATION", topic: "GENERAL", hook: "두 번째 카드", mainPost: "두 번째 본문", cardIds: [], replies: ["두 번째 CTA"], cta: "두 번째 CTA", imageAsset: null, altText: null, createdAt: "2026-08-30T00:00:00.000Z", scheduledAt: null, publishedAt: null, threadsPostId: null, threadsContainerId: null, replyPostIds: [], attemptCount: 0, lastError: null, metrics: {}, semanticSignature: "two" },
  ],
};

describe("ThreadsContentClient", () => {
  afterEach(() => cleanup());

  it("shows queue status and changes the selected content", () => {
    render(<ThreadsContentClient queue={queue} />);
    expect(screen.getByText("READY 2")).not.toBeNull();
    expect(screen.getByText("첫 번째 본문")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /#0002/ }));
    expect(screen.getByText("두 번째 본문")).not.toBeNull();
    expect(screen.queryByText("첫 번째 이미지")).toBeNull();
  });
});
