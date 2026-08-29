import type { HTMLAttributes, ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SharedReadingPage } from "@/features/ritual/shared-reading-page";

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    section: ({ children, ...props }: HTMLAttributes<HTMLElement>) => <section {...props}>{children}</section>,
  },
  useReducedMotion: () => true,
}));

describe("SharedReadingPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders shared cards without referencing a question", () => {
    render(<SharedReadingPage cardIds={[0, 1, 2]} />);

    expect(screen.queryByText(/질문은 담지 않고/)).not.toBeNull();
    expect(screen.getByText(/뽑은 카드: 바보 · 마법사 · 여사제/)).not.toBeNull();
    expect(screen.getByRole("heading", { name: "카드마다 보이는 것" })).not.toBeNull();
    expect(screen.getByRole("link", { name: "나도 세 장 다시 뽑기" }).getAttribute("href")).toBe("/");
  });
});
