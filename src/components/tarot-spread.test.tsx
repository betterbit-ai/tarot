import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TarotSpread } from "@/components/tarot-spread";

describe("TarotSpread", () => {
  afterEach(cleanup);

  it("renders all 78 cached backs without revealing identity", () => {
    const onToggle = vi.fn();
    render(
      <TarotSpread
        deckOrder={Array.from({ length: 78 }, (_, index) => index)}
        selectedIds={[4, 19]}
        onToggle={onToggle}
        reducedMotion={false}
      />,
    );

    expect(screen.getAllByRole("button")).toHaveLength(78);
    expect(screen.getByRole("button", { name: "1번째로 고른 카드" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "2번째로 고른 카드" })).toBeTruthy();
    expect(within(screen.getByRole("button", { name: "1번째로 고른 카드" })).getByText("1")).toBeTruthy();
    expect(screen.queryByText("바보")).toBeNull();
    expect(screen.queryByText("The Fool")).toBeNull();
    expect(document.querySelectorAll('[style*="tarot-card-back.png"]')).toHaveLength(78);

    fireEvent.click(screen.getByRole("button", { name: "펼쳐진 카드 1 선택" }));
    expect(onToggle).toHaveBeenCalledWith(0);
  });

  it("removes the entrance animation for reduced motion", () => {
    const { container } = render(
      <TarotSpread
        deckOrder={Array.from({ length: 78 }, (_, index) => index)}
        selectedIds={[]}
        onToggle={vi.fn()}
        reducedMotion
      />,
    );

    expect(container.querySelector(".tarot-spread-enter")).toBeNull();
  });
});
