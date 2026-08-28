import type { HTMLAttributes, ReactNode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TarotRitual } from "@/features/ritual/ritual-shell";

const shareReadingMock = vi.fn();
const trackTarotEventMock = vi.fn();

vi.mock("motion/react", async () => {
  const React = await import("react");

  const motion = new Proxy(
    {},
    {
      get: (_, tag: string) =>
        React.forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(function MotionPrimitive(props, ref) {
          const { animate: _animate, exit: _exit, initial: _initial, transition: _transition, ...rest } = props as HTMLAttributes<HTMLElement> & {
            animate?: unknown;
            exit?: unknown;
            initial?: unknown;
            transition?: unknown;
          };
          void _animate;
          void _exit;
          void _initial;
          void _transition;
          return React.createElement(tag, { ...rest, ref }, props.children);
        }),
    },
  );

  return {
    AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
    motion,
    useReducedMotion: () => true,
  };
});

vi.mock("@/lib/sharing/client", () => ({
  shareReading: (...args: unknown[]) => shareReadingMock(...args),
}));

vi.mock("@/lib/analytics/events", () => ({
  trackTarotEvent: (...args: unknown[]) => trackTarotEventMock(...args),
}));

describe("TarotRitual", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    shareReadingMock.mockReset();
    shareReadingMock.mockResolvedValue("copy-link");
    trackTarotEventMock.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  async function moveToSelection() {
    fireEvent.click(screen.getByRole("button", { name: "카드를 볼게요" }));
    await advanceRitualTimers(2);
  }

  function selectThreeCards() {
    fireEvent.click(screen.getByRole("button", { name: "펼쳐진 카드 1 선택" }));
    fireEvent.click(screen.getByRole("button", { name: "펼쳐진 카드 2 선택" }));
    fireEvent.click(screen.getByRole("button", { name: "펼쳐진 카드 3 선택" }));
  }

  async function advanceRitualTimers(cycles = 8) {
    for (let index = 0; index < cycles; index += 1) {
      act(() => {
        vi.advanceTimersByTime(300);
      });
      await Promise.resolve();
    }
  }

  async function flushMicrotasks() {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  it("keeps confirmation gated until exactly three cards are selected and supports deselect", async () => {
    render(<TarotRitual affiliateConfig={{ enabled: false, outHref: null }} />);

    fireEvent.change(screen.getByLabelText("지금 마음에 걸린 질문"), { target: { value: "지금 이 일의 흐름" } });
    await moveToSelection();
    expect(screen.queryByText("바보")).toBeNull();
    expect(screen.queryByText("The Fool")).toBeNull();

    const confirmButton = screen.getByRole("button", { name: "세 장을 펼쳐볼게요" });
    expect((confirmButton as HTMLButtonElement).disabled).toBe(true);

    selectThreeCards();
    expect((screen.getByRole("button", { name: "세 장을 펼쳐볼게요" }) as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "2번째로 고른 카드" }));
    expect((confirmButton as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByText("한 장만 더 골라보세요.")).not.toBeNull();
  });

  it("goes from reveal to result when affiliate is disabled", async () => {
    render(<TarotRitual affiliateConfig={{ enabled: false, outHref: null }} />);

    await moveToSelection();
    selectThreeCards();
    fireEvent.click(screen.getByRole("button", { name: "세 장을 펼쳐볼게요" }));

    await advanceRitualTimers();

    expect(screen.queryByRole("button", { name: "공유하기" })).not.toBeNull();
    expect(screen.queryByText("질문은 빼고, 세 장과 한 문장만 공유해요.")).not.toBeNull();
  });

  it("shows the affiliate interstitial and allows skip when enabled without a target url", async () => {
    render(<TarotRitual affiliateConfig={{ enabled: true, outHref: null }} />);

    await moveToSelection();
    selectThreeCards();
    fireEvent.click(screen.getByRole("button", { name: "세 장을 펼쳐볼게요" }));

    await advanceRitualTimers();

    expect(screen.queryByRole("button", { name: "건너뛰고 결과 보기" })).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "건너뛰고 결과 보기" }));

    expect(screen.queryByText("질문은 빼고, 세 장과 한 문장만 공유해요.")).not.toBeNull();
  });

  it("falls back to copy sharing and restarts without reload", async () => {
    render(<TarotRitual affiliateConfig={{ enabled: false, outHref: null }} />);

    fireEvent.change(screen.getByLabelText("지금 마음에 걸린 질문"), { target: { value: "내일의 마음" } });
    await moveToSelection();
    selectThreeCards();
    fireEvent.click(screen.getByRole("button", { name: "세 장을 펼쳐볼게요" }));

    await advanceRitualTimers();

    fireEvent.click(screen.getByRole("button", { name: "공유하기" }));

    await flushMicrotasks();
    expect(screen.queryByText("링크를 복사했어요.")).not.toBeNull();
    expect(shareReadingMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "새 질문으로 다시 보기" }));

    expect(screen.queryByText("왔네요.")).not.toBeNull();
    expect((screen.getByLabelText("지금 마음에 걸린 질문") as HTMLInputElement).value).toBe("");
  });
});
