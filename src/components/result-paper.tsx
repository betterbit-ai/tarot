import { TarotCardFace } from "@/components/tarot-card-face";
import type { RitualReading } from "@/lib/tarot/reading";

type ResultPaperProps = {
  reading: RitualReading;
  title: string;
};

export function ResultPaper({ reading, title }: ResultPaperProps) {
  return (
    <section className="border-y border-[#a88b5f]/16 py-5 text-[#eee3d2] sm:py-7" aria-label="리딩 결과">
      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        {reading.cards.map((card, index) => (
          <div key={`${card.id}-${index}`} className="min-h-[270px]">
            <TarotCardFace card={card} compact label={`${index + 1}번째 카드 ${card.label}`} />
          </div>
        ))}
      </div>

      <div className="mx-auto mt-7 max-w-2xl">
        <p className="text-sm text-[#bda98b]">{title}</p>
        <h2 className="mt-2 font-serif text-[1.7rem] leading-snug text-[#f4e8d5] sm:text-[2rem]">{reading.headline}</h2>

        <div className="mt-7 space-y-7 text-[0.98rem] leading-7 text-[#dfd2bf]">
          <div>
            <h3 className="font-serif text-[1.15rem] text-[#eedcc0]">카드를 같이 보면</h3>
            <p className="mt-2 whitespace-pre-line">{reading.story}</p>
          </div>
          <div className="border-t border-[#a88b5f]/16 pt-6">
            <h3 className="font-serif text-[1.15rem] text-[#eedcc0]">특히 걸리는 건</h3>
            <p className="mt-2 whitespace-pre-line">{reading.advice}</p>
          </div>
          <div className="border-t border-[#a88b5f]/16 pt-6">
            <h3 className="font-serif text-[1.15rem] text-[#eedcc0]">지금 해볼 것</h3>
            <p className="mt-2 text-[#f0dfc4]">{reading.closing}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
