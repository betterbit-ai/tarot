"use client";

import { useState, useTransition } from "react";
import { shareReading } from "@/lib/sharing/client";
import { trackTarotEvent } from "@/lib/analytics/events";

type ShareActionsProps = {
  cardIds: readonly number[];
};

export function ShareActions({ cardIds }: ShareActionsProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            try {
              const method = await shareReading(cardIds, "세 장의 흐름을 함께 읽어보세요.");
              trackTarotEvent({ type: "result_shared", method });
              setMessage(method === "native-share" ? "공유 창을 열었어요." : "링크를 복사했어요.");
            } catch {
              setMessage("공유를 열지 못했어요.");
            }
          });
        }}
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#d2aa67] px-5 text-sm font-medium text-[#24190f] transition hover:bg-[#e0bb7c] disabled:opacity-70"
      >
        {isPending ? "준비 중" : "공유하기"}
      </button>
      <p className="min-h-6 text-sm text-[#4d4337]" role="status" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
