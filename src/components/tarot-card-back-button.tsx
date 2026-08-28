type TarotCardBackButtonProps = {
  index: number;
  isSelected: boolean;
  selectionOrder: number;
  onToggle: () => void;
};

export function TarotCardBackButton({ index, isSelected, selectionOrder, onToggle }: TarotCardBackButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isSelected}
      aria-label={
        isSelected
          ? `${index + 1}번째 카드, ${selectionOrder}번째로 선택됨`
          : `${index + 1}번째 카드 선택`
      }
      className={`relative h-[168px] w-[108px] shrink-0 rounded-[1rem] border transition duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200 ${
        isSelected
          ? "z-10 -translate-y-4 border-[#e3c48c] shadow-[0_20px_40px_rgba(0,0,0,0.42)]"
          : "border-[#8d724d]/55 shadow-[0_14px_24px_rgba(0,0,0,0.28)] hover:-translate-y-1"
      }`}
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(5,14,10,0.05), rgba(5,14,10,0.32)), url(/images/tarot-card-back.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <span className="sr-only">{isSelected ? `선택 순서 ${selectionOrder}` : "미선택"}</span>
      {isSelected ? (
        <span className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full border border-[#f6dfb8] bg-[#f5dfbc] text-sm text-[#2f2518]">
          {selectionOrder}
        </span>
      ) : null}
    </button>
  );
}
