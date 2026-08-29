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
        <h2 className="mt-2 max-w-[28rem] font-serif text-[1.65rem] leading-[1.35] text-[#f4e8d5] sm:text-[2rem]">{reading.headline}</h2>

        <div className="mt-6 rounded-2xl border border-[#a88b5f]/20 bg-[#111b17]/72 px-4 py-4 sm:px-5">
          <p className="text-sm font-medium text-[#f0dfc4]">{reading.cardSummary}</p>
          <p className="mt-2 text-sm leading-6 text-[#cdbda8]">{reading.majorSummary}</p>
        </div>

        <div className="mt-8 space-y-8 text-[0.98rem] leading-7 text-[#dfd2bf]">
          <section>
            <h3 className="font-serif text-[1.2rem] text-[#eedcc0]">카드마다 보이는 것</h3>
            <div className="mt-3 divide-y divide-[#a88b5f]/16 border-y border-[#a88b5f]/16">
              {reading.cardInsights.map((insight, index) => (
                <article key={`${insight.cardId}-${index}`} className="py-4 first:pt-3 last:pb-3">
                  <h4 className="text-sm font-medium text-[#f0dfc4]">{index + 1}. {insight.name}</h4>
                  <p className="mt-1 text-sm leading-6 text-[#d6c6b1]">핵심 키워드: {insight.keywords}</p>
                  <p className="mt-1 text-sm leading-6 text-[#c7b7a2]">그림에서 읽히는 근거: {insight.visualEvidence}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="border-t border-[#a88b5f]/16 pt-7">
            <h3 className="font-serif text-[1.2rem] text-[#eedcc0]">세 장의 흐름</h3>
            <p className="mt-2">{reading.flow}</p>
          </section>

          <section className="border-t border-[#a88b5f]/16 pt-7">
            <h3 className="font-serif text-[1.2rem] text-[#eedcc0]">질문에 대입하면</h3>
            <p className="mt-2">{reading.application}</p>
          </section>

          <section className="border-t border-[#a88b5f]/16 pt-7">
            <h3 className="font-serif text-[1.2rem] text-[#eedcc0]">가져갈 태도</h3>
            <p className="mt-2 text-[#f0dfc4]">{reading.mindset}</p>
          </section>
        </div>
      </div>
    </section>
  );
}
