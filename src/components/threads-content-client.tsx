"use client";

import { useState } from "react";
import Image from "next/image";
import type { ThreadDay } from "@/lib/threads/week-one";

type ThreadsContentClientProps = { days: ThreadDay[] };

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

export function ThreadsContentClient({ days }: ThreadsContentClientProps) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [message, setMessage] = useState("");
  const day = days[selectedDay];

  async function handleCopy(label: string, text: string) {
    await copyText(text);
    setMessage(`${label}을 클립보드에 복사했어요.`);
    window.setTimeout(() => setMessage(""), 2200);
  }

  return (
    <main className="min-h-dvh bg-[#0b1512] px-4 py-5 text-[#f2e7d5] sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <header className="border-b border-[#a88b5f]/20 pb-6">
          <p className="text-xs tracking-[0.2em] text-[#d3aa68]">MR. TAROT · THREADS</p>
          <h1 className="mt-3 font-serif text-[2.2rem] leading-tight sm:text-[3rem]">이번 주 게시물</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#cbbba3]">날짜를 고르고, 필요한 블록의 복사 버튼을 누르세요. 게시 버튼은 직접 누릅니다.</p>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
          <nav aria-label="게시물 날짜" className="flex gap-2 overflow-x-auto pb-1 lg:flex-col">
            {days.map((item, index) => (
              <button
                key={item.day}
                type="button"
                onClick={() => { setSelectedDay(index); setMessage(""); }}
                className={`shrink-0 rounded-full border px-4 py-2 text-left text-sm transition lg:rounded-xl ${index === selectedDay ? "border-[#d3aa68] bg-[#d3aa68] text-[#20170f]" : "border-[#a88b5f]/25 text-[#d9c9b1] hover:bg-[#18261f]"}`}
              >
                DAY {String(item.day).padStart(2, "0")}
                <span className="ml-2 lg:block lg:ml-0 lg:mt-1 lg:text-xs lg:opacity-80">{item.title}</span>
              </button>
            ))}
          </nav>

          <section className="min-w-0" aria-live="polite">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#a88b5f]/16 pb-4">
              <div>
                <p className="text-xs tracking-[0.16em] text-[#c8ad82]">DAY {String(day.day).padStart(2, "0")} · {day.goal}</p>
                <h2 className="mt-2 font-serif text-[1.7rem]">{day.title}</h2>
                <p className="mt-1 text-sm text-[#a99478]">topic: {day.topic}</p>
              </div>
              <a href={day.imageSrc} download className="rounded-full border border-[#a88b5f]/30 px-4 py-2 text-xs text-[#e6d5bb] hover:bg-[#18261f]">이미지 저장</a>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_280px]">
              <div className="space-y-4">
                <CopyBlock title="본문" text={day.main} onCopy={() => handleCopy("본문", day.main)} />
                {day.comments.map((comment, index) => <CopyBlock key={`${day.day}-${index}`} title={`댓글 ${index + 1}`} text={comment} onCopy={() => handleCopy(`댓글 ${index + 1}`, comment)} />)}
                <CopyBlock title="마지막 CTA 댓글" text={day.cta} onCopy={() => handleCopy("CTA", day.cta)} />
              </div>
              <div className="order-first xl:order-last">
                <div className="overflow-hidden rounded-2xl border border-[#a88b5f]/20 bg-[#102019]">
                  <Image src={day.imageSrc} alt={`DAY ${day.day} Threads 선택 이미지`} width={1080} height={1350} className="h-auto w-full" />
                </div>
                <p className="mt-2 text-xs leading-5 text-[#91816b]">본문을 올린 뒤 이 이미지를 첨부하세요.</p>
              </div>
            </div>
            {message ? <p className="fixed bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#d3aa68] px-5 py-3 text-sm text-[#20170f] shadow-xl">{message}</p> : null}
          </section>
        </div>
      </div>
    </main>
  );
}

function CopyBlock({ title, text, onCopy }: { title: string; text: string; onCopy: () => void }) {
  return (
    <article className="rounded-2xl border border-[#a88b5f]/18 bg-[#101d18] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm text-[#e7d6bc]">{title}</h3>
        <button type="button" onClick={onCopy} className="rounded-full bg-[#d3aa68] px-3 py-1.5 text-xs font-medium text-[#21170f] hover:bg-[#e0bb7a]">복사</button>
      </div>
      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#d8c9b4]">{text}</p>
    </article>
  );
}
