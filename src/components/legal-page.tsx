import type { ReactNode } from "react";
import Link from "next/link";

type LegalPageProps = {
  eyebrow: string;
  title: string;
  updatedAt: string;
  children: ReactNode;
};

export function LegalPage({ eyebrow, title, updatedAt, children }: LegalPageProps) {
  return (
    <main className="min-h-dvh px-5 py-10 text-[#f0eadf] sm:px-8 sm:py-16">
      <article className="mx-auto max-w-2xl rounded-[2rem] border border-[#d3aa68]/25 bg-[#0b1512]/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur sm:p-10">
        <Link className="inline-flex text-sm text-[#d3aa68] underline underline-offset-4" href="/">
          미스터 타로로 돌아가기
        </Link>
        <p className="mt-10 text-xs tracking-[0.22em] text-[#cfb17d]">{eyebrow}</p>
        <h1 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm text-[#c8c0b3]">최종 업데이트: {updatedAt}</p>
        <div className="mt-10 space-y-8 text-[15px] leading-7 text-[#e4ddd1] sm:text-base">{children}</div>
      </article>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-xl text-[#f0eadf]">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
