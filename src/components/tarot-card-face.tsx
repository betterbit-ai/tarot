import Image from "next/image";
import { getTarotCard, type TarotCard } from "@/lib/tarot/cards";

type TarotCardFaceProps = {
  card: TarotCard | number;
  label?: string;
  compact?: boolean;
  priority?: boolean;
};

export function TarotCardFace({ card, label, compact = false, priority = false }: TarotCardFaceProps) {
  const resolvedCard = typeof card === "number" ? getTarotCard(card) : card;

  return (
    <article
      aria-label={label ?? `${resolvedCard.label}, ${resolvedCard.nameEn}`}
      className="relative flex h-full w-full flex-col overflow-hidden rounded-[1.25rem] border border-[#c7aa7b]/55 bg-[#e9deca] text-[#1d1a14] shadow-[0_18px_50px_rgba(0,0,0,0.24)]"
    >
      <div className={`relative w-full flex-1 bg-[#d8c9ad] ${compact ? "min-h-[210px]" : "min-h-0"}`}>
        <Image
          src={resolvedCard.imagePath}
          alt={`${resolvedCard.label} (${resolvedCard.nameEn}) Rider-Waite-Smith 카드`}
          fill
          priority={priority}
          sizes={compact ? "(max-width: 767px) 70vw, 220px" : "(max-width: 767px) 82vw, 340px"}
          className="object-cover object-center"
        />
      </div>
      <div className={`border-t border-[#8f6c45]/28 bg-[#f0e8db] text-center ${compact ? "px-3 py-3" : "px-2 py-2 sm:px-4 sm:py-4"}`}>
        <h3 className="font-serif text-[0.78rem] leading-snug tracking-[0.02em] sm:text-[1.05rem]">{resolvedCard.label}</h3>
        <p className="mt-1 text-[0.48rem] uppercase leading-tight tracking-[0.05em] text-[#705b41] sm:text-[0.68rem] sm:tracking-[0.12em]">{resolvedCard.nameEn}</p>
      </div>
    </article>
  );
}
