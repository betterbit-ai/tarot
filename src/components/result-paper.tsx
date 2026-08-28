import { TarotCardFace } from "@/components/tarot-card-face";
import type { RitualReading } from "@/lib/tarot/reading";

type ResultPaperProps = {
  reading: RitualReading;
  title: string;
  subtitle: string;
};

export function ResultPaper({ reading, title, subtitle }: ResultPaperProps) {
  return (
    <section
      className="rounded-[2rem] border border-[#d8bc8e]/18 bg-[#efe6d9] p-5 text-[#211c15] shadow-[0_32px_80px_rgba(0,0,0,0.24)] md:p-7"
      aria-label="리딩 결과"
    >
      <p className="text-xs tracking-[0.2em] text-[#705a3f]">{title}</p>
      <h2 className="mt-2 font-serif text-[1.7rem] leading-tight">{reading.headline}</h2>
      <p className="mt-3 text-sm leading-6 text-[#524535]">{subtitle}</p>

      <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        {reading.cards.map((card, index) => (
          <div key={`${card.id}-${index}`} className="min-h-[270px]">
            <TarotCardFace card={card} compact label={`${index + 1}번째 카드 ${card.label}`} />
          </div>
        ))}
      </div>

      <div className="mt-7 space-y-4 text-[0.97rem] leading-7 text-[#2f2519]">
        <div>
          <h3 className="text-sm tracking-[0.18em] text-[#705a3f]">흐름</h3>
          <p className="mt-2">{reading.story}</p>
        </div>
        <div>
          <h3 className="text-sm tracking-[0.18em] text-[#705a3f]">실마리</h3>
          <p className="mt-2">{reading.advice}</p>
        </div>
        <div>
          <h3 className="text-sm tracking-[0.18em] text-[#705a3f]">마무리</h3>
          <p className="mt-2">{reading.closing}</p>
        </div>
      </div>
    </section>
  );
}
