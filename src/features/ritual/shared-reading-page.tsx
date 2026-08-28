import Link from "next/link";
import { ResultPaper } from "@/components/result-paper";
import { ShareActions } from "@/components/share-actions";
import { createRitualReading } from "@/lib/tarot/reading";

type SharedReadingPageProps = {
  cardIds: [number, number, number];
};

export function SharedReadingPage({ cardIds }: SharedReadingPageProps) {
  const reading = createRitualReading(cardIds);

  return (
    <main className="min-h-dvh bg-[#0b1512] px-4 py-5 text-[#f4ead7] sm:px-6 sm:py-8">
      <div className="mx-auto max-w-4xl space-y-5">
        <header className="rounded-[2rem] border border-[#b38e62]/18 bg-[#15110d]/82 px-5 py-6 shadow-[0_24px_64px_rgba(0,0,0,0.32)] sm:px-7">
          <p className="text-xs tracking-[0.22em] text-[#cfb17d]">미스터 타로</p>
          <h1 className="mt-3 font-serif text-[2rem] leading-tight text-[#f2e7d5]">누군가 고른 세 장을 같이 볼게요.</h1>
          <p className="mt-3 max-w-[30rem] text-sm leading-7 text-[#e4d7c4]">
            질문은 담지 않고 카드 순서만 남겼어요. 읽어본 뒤에는 당신의 카드도 다시 펼칠 수 있어요.
          </p>
        </header>

        <ResultPaper reading={reading} title="누군가 고른 세 장" />

        <section className="rounded-[1.75rem] border border-[#c8aa7b]/18 bg-[#efe6d8] px-5 py-5 text-[#241d15] shadow-[0_24px_64px_rgba(0,0,0,0.18)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-[#5b5041]">이 세 장을 그대로 다시 공유할 수도 있어요.</p>
              <p className="mt-1 text-sm text-[#5b5041]">질문은 링크에 포함되지 않습니다.</p>
            </div>
            <ShareActions cardIds={cardIds} tone="light" />
          </div>
          <Link
            href="/"
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-[#d2aa67] px-6 text-sm font-medium text-[#24190f] transition hover:bg-[#e0bb7a]"
          >
            나도 세 장 다시 뽑기
          </Link>
        </section>
      </div>
    </main>
  );
}
