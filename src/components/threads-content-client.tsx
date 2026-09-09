"use client";

import { useState } from "react";
import Image from "next/image";
import type { ContentQueue, ThreadsContent } from "@/domain/content";
import type { DailyGrowthReport } from "@/lib/analytics/funnel";

type ThreadsContentClientProps = { queue: ContentQueue; funnelReports?: readonly DailyGrowthReport[] };

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

const TOPIC_LABELS: Record<ThreadsContent["topic"], string> = {
  LOVE: "관계", GENERAL: "일상", CAREER: "일", MONEY: "돈", DECISION: "결정", EXPERIMENTAL: "실험",
};

const FORMAT_LABELS: Record<ThreadsContent["format"], string> = {
  PICK_3: "PICK 3", YES_NO_NOT_YET: "YES / NO", LOVE: "LOVE", CAREER: "CAREER", MONEY: "MONEY",
};

function conversionRate(numerator: number, denominator: number): string {
  return denominator > 0 ? `${Math.round((numerator / denominator) * 100)}%` : "-";
}

export function ThreadsContentClient({ queue, funnelReports = [] }: ThreadsContentClientProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [message, setMessage] = useState("");
  const item = queue.items[selectedIndex] ?? queue.items[0];
  if (!item) return null;
  const counts = queue.items.reduce<Record<string, number>>((all, content) => ({ ...all, [content.status]: (all[content.status] ?? 0) + 1 }), {});
  const visibleItems = queue.items.slice(0, 24);

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
          <h1 className="mt-3 font-serif text-[2.2rem] leading-tight sm:text-[3rem]">준비된 콘텐츠 큐</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#cbbba3]">기본값은 REVIEW와 DRY RUN입니다. 여기서는 글과 이미지를 확인·복사하고, 실제 게시 여부는 scheduler 설정에서 결정됩니다.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-[#d3aa68]/50 bg-[#d3aa68]/10 px-3 py-1.5 text-[#edd5a5]">READY {counts.READY ?? 0}</span>
            <span className="rounded-full border border-[#a88b5f]/25 px-3 py-1.5 text-[#cbbba3]">TOTAL {queue.items.length}</span>
            <span className="rounded-full border border-[#a88b5f]/25 px-3 py-1.5 text-[#cbbba3]">NEXT {queue.items.find((content) => content.status === "READY")?.id ?? "없음"}</span>
          </div>
        </header>

        <section aria-labelledby="funnel-heading" className="mt-6 rounded-2xl border border-[#a88b5f]/20 bg-[#101d18] p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs tracking-[0.16em] text-[#c8ad82]">RECENT 7 DAYS</p>
              <h2 id="funnel-heading" className="mt-2 font-serif text-2xl">Threads → 타로 → 쿠팡</h2>
            </div>
            <p className="text-xs text-[#91816b]">익명 세션 단계별 1회 집계</p>
          </div>
          {funnelReports.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[840px] w-full text-left text-xs">
                <thead className="text-[#a99478]">
                  <tr><th className="pb-2 pr-4">날짜·콘텐츠</th><th className="pb-2 pr-4">Threads 조회</th><th className="pb-2 pr-4">사이트 유입</th><th className="pb-2 pr-4">리딩 시작</th><th className="pb-2 pr-4">결과 도달</th><th className="pb-2 pr-4">쿠팡 클릭</th><th className="pb-2">전환</th></tr>
                </thead>
                <tbody className="divide-y divide-[#a88b5f]/12 text-[#e4d3b9]">
                  {funnelReports.map(({ date, counts, contentIds, threads }) => (
                    <tr key={date}>
                      <td className="py-3 pr-4">{date.slice(5)} <span className="text-[#8f806c]">{contentIds.join(", ") || "게시 없음"}</span></td>
                      <td className="py-3 pr-4">{threads.views ?? "미수집"}</td>
                      <td className="py-3 pr-4">{counts.landing_view}</td>
                      <td className="py-3 pr-4">{counts.ritual_started} <span className="text-[#8f806c]">({conversionRate(counts.ritual_started, counts.landing_view)})</span></td>
                      <td className="py-3 pr-4">{counts.result_viewed} <span className="text-[#8f806c]">({conversionRate(counts.result_viewed, counts.ritual_started)})</span></td>
                      <td className="py-3 pr-4">{counts.affiliate_clicked}</td>
                      <td className="py-3">{conversionRate(counts.affiliate_clicked, counts.result_viewed)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="mt-4 text-sm text-[#a99478]">아직 저장된 Threads 유입 데이터가 없어요. 새 UTM 방문부터 집계합니다.</p>}
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
          <nav aria-label="콘텐츠 큐" className="flex gap-2 overflow-x-auto pb-1 lg:max-h-[72vh] lg:flex-col lg:overflow-y-auto lg:pr-2">
            {visibleItems.map((content, index) => (
              <button
                key={content.id}
                type="button"
                onClick={() => { setSelectedIndex(index); setMessage(""); }}
                className={`shrink-0 rounded-full border px-4 py-2 text-left text-sm transition lg:rounded-xl ${index === selectedIndex ? "border-[#d3aa68] bg-[#d3aa68] text-[#20170f]" : "border-[#a88b5f]/25 text-[#d9c9b1] hover:bg-[#18261f]"}`}
              >
                {content.id.replace("mr-tarot-", "#")}
                <span className="ml-2 lg:block lg:ml-0 lg:mt-1 lg:text-xs lg:opacity-80">{TOPIC_LABELS[content.topic]} · {FORMAT_LABELS[content.format]}</span>
              </button>
            ))}
          </nav>

          <section className="min-w-0" aria-live="polite">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#a88b5f]/16 pb-4">
              <div>
                <p className="text-xs tracking-[0.16em] text-[#c8ad82]">{item.status} · {FORMAT_LABELS[item.format]}</p>
                <h2 className="mt-2 font-serif text-[1.7rem]">{item.hook}</h2>
                <p className="mt-1 text-sm text-[#a99478]">{item.id} · {TOPIC_LABELS[item.topic]}</p>
                <p className="mt-2 text-xs text-[#91816b]">
                  {item.metricsUnavailableStatus
                    ? `Threads 인사이트 제공 불가 (${item.metricsUnavailableStatus})`
                    : `Threads 누적 · 조회 ${item.metrics.views ?? "미수집"} · 좋아요 ${item.metrics.likes ?? "미수집"} · 답글 ${item.metrics.replies ?? "미수집"}`}
                </p>
              </div>
              {item.imageAsset ? <a href={item.imageAsset} download className="rounded-full border border-[#a88b5f]/30 px-4 py-2 text-xs text-[#e6d5bb] hover:bg-[#18261f]">이미지 저장</a> : null}
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_280px]">
              <div className="space-y-4">
                <CopyBlock title="본문" text={item.mainPost} onCopy={() => handleCopy("본문", item.mainPost)} />
                {item.replies.slice(0, -1).map((reply, index) => <CopyBlock key={`${item.id}-${index}`} title={`결과 댓글 ${index + 1}`} text={reply} onCopy={() => handleCopy(`결과 댓글 ${index + 1}`, reply)} />)}
                <CopyBlock title="마지막 CTA 댓글" text={item.cta} onCopy={() => handleCopy("CTA", item.cta)} />
              </div>
              {item.imageAsset ? <div className="order-first xl:order-last">
                <div className="overflow-hidden rounded-2xl border border-[#a88b5f]/20 bg-[#102019]">
                  <Image src={item.imageAsset} alt={item.altText ?? "미스터 타로 Threads 선택 이미지"} width={1080} height={1350} className="h-auto w-full" />
                </div>
                <p className="mt-2 text-xs leading-5 text-[#91816b]">DRY RUN에서는 이 이미지 URL과 댓글 묶음이 출력됩니다.</p>
              </div> : null}
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
