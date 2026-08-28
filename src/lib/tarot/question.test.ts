import { describe, expect, it } from "vitest";
import { getTarotCard } from "@/lib/tarot/cards";
import { inferQuestionIntent, summarizeQuestion } from "@/lib/tarot/question";

describe("question intent helpers", () => {
  it("summarizes the question with a human label and excerpt", () => {
    expect(summarizeQuestion("지금 이직이 맞을까요?")).toEqual({
      kindLabel: "일",
      excerpt: "지금 이직이 맞을까요?",
    });
  });

  it("uses card signals when keyword scoring is weak", () => {
    const cards = [getTarotCard(36), getTarotCard(37), getTarotCard(38)];

    expect(inferQuestionIntent("무엇이 먼저 보일까요?", cards)).toBe("love");
  });
});
