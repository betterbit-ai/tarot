"use client";

import type { CSSProperties } from "react";

type TarotSpreadProps = {
  deckOrder: number[];
  selectedIds: number[];
  onToggle: (cardId: number) => void;
  reducedMotion: boolean;
};

const CARDS_PER_ROW = 26;
const ROW_TOP = [19, 50, 81] as const;
const ROW_ROTATION = [-7, 0, 7] as const;

function cardStyle(localIndex: number, row: number, selectedOrder: number): CSSProperties {
  const centerOffset = localIndex - (CARDS_PER_ROW - 1) / 2;
  const arcOffset = Math.abs(centerOffset) * (row === 1 ? -0.18 : 0.34);
  const rotationDelta = centerOffset * (row === 1 ? -0.12 : 0.24);

  return {
    left: `calc(50% + (${centerOffset} * var(--spread-step)))`,
    top: `calc(${ROW_TOP[row]}% + ${arcOffset}px)`,
    zIndex: selectedOrder > 0 ? 200 + selectedOrder : 40 + localIndex,
    translate: selectedOrder > 0 ? "-50% calc(-50% - 18px)" : "-50% -50%",
    rotate: `${ROW_ROTATION[row] + rotationDelta}deg`,
    scale: selectedOrder > 0 ? "1.08" : "1",
  };
}

export function TarotSpread({ deckOrder, selectedIds, onToggle, reducedMotion }: TarotSpreadProps) {
  return (
    <div
      className="relative -mx-5 overflow-hidden border-y border-[#92794f]/14 bg-[#0c100d] sm:-mx-6 [--spread-step:11.2px] sm:[--spread-step:13px] md:[--spread-step:16px]"
      aria-label="펼쳐진 78장 카드"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-[center_58%] opacity-45"
        style={{ backgroundImage: "url(/images/tarot-reader-table.png)" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(216,176,106,0.12),transparent_48%),linear-gradient(180deg,rgba(7,14,11,0.28),rgba(7,14,11,0.72))]" />

      <div className={`relative h-[356px] sm:h-[390px] md:h-[430px] ${reducedMotion ? "" : "tarot-spread-enter"}`}>
        {deckOrder.map((cardId, index) => {
          const row = Math.floor(index / CARDS_PER_ROW);
          const localIndex = index % CARDS_PER_ROW;
          const selectedOrder = selectedIds.indexOf(cardId) + 1;
          const isSelected = selectedOrder > 0;

          return (
            <button
              key={cardId}
              type="button"
              aria-label={isSelected ? `${selectedOrder}번째로 고른 카드` : `펼쳐진 카드 ${index + 1} 선택`}
              aria-pressed={isSelected}
              onClick={() => onToggle(cardId)}
              className={`absolute h-[108px] w-[70px] rounded-[0.8rem] border bg-cover bg-center transition-[translate,scale,box-shadow,border-color] duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 sm:h-[120px] sm:w-[78px] md:h-[136px] md:w-[88px] ${
                isSelected
                  ? "border-[#f0d39b] shadow-[0_20px_42px_rgba(0,0,0,0.5)]"
                  : "border-[#876c49]/68 shadow-[0_10px_22px_rgba(0,0,0,0.26)] hover:border-[#d7be90]/85"
              }`}
              style={{
                ...cardStyle(localIndex, row, selectedOrder),
                backgroundImage:
                  "linear-gradient(180deg, rgba(5,14,10,0.02), rgba(5,14,10,0.3)), url(/images/tarot-card-back.png)",
              }}
            >
              <span className="sr-only">{isSelected ? `${selectedOrder}번째 선택 완료` : "아직 고르지 않은 카드"}</span>
              {isSelected ? (
                <span className="absolute left-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-[#f4dfb4] bg-[#f0d39b] text-xs font-semibold text-[#261d13] shadow-[0_4px_12px_rgba(0,0,0,0.28)]">
                  {selectedOrder}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
