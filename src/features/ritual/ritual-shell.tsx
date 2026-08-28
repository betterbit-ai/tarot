"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useReducer } from "react";
import { AffiliateSheet } from "@/components/affiliate-sheet";
import { ResultPaper } from "@/components/result-paper";
import { ShareActions } from "@/components/share-actions";
import { TarotCardBackButton } from "@/components/tarot-card-back-button";
import { TarotCardFace } from "@/components/tarot-card-face";
import { trackTarotEvent } from "@/lib/analytics/events";
import type { AffiliateConfig } from "@/lib/affiliate/config";
import { createShuffledDeck, getTarotCard } from "@/lib/tarot/cards";
import { createRitualReading } from "@/lib/tarot/reading";
import { createInitialRitualState, ritualReducer } from "@/features/ritual/state";

const TIMINGS = {
  preparing: {
    normal: 1100,
    reduced: 260,
  },
  reveal: {
    normal: 640,
    reduced: 160,
  },
  pause: {
    normal: 1450,
    reduced: 260,
  },
};

const POSITION_SHORT_LABELS = ["이어진 흐름", "지금 핵심", "열릴 방향"] as const;

type TarotRitualProps = {
  affiliateConfig: AffiliateConfig;
};

function StageFrame({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="w-full"
    >
      {children}
    </motion.section>
  );
}

function QuestionStage({
  question,
  onChange,
  onStart,
}: {
  question: string;
  onChange: (value: string) => void;
  onStart: () => void;
}) {
  return (
    <StageFrame>
      <div className="overflow-hidden rounded-[1.25rem] border border-[#b08b5d]/18 bg-[#120f0c]/92 shadow-[0_28px_70px_rgba(0,0,0,0.3)]">
        <div
          className="relative h-[270px] bg-cover sm:h-[340px]"
          style={{
            backgroundImage: "url(/images/tarot-reader-table.png)",
            backgroundPosition: "center 12%",
          }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,16,12,0.05),rgba(8,16,12,0.1)_48%,rgba(8,16,12,0.9))]" />
          <div className="absolute inset-x-0 bottom-0 px-5 pb-5 sm:px-8 sm:pb-7">
            <p className="font-serif text-[2.15rem] leading-tight text-[#f4e8d4] sm:text-[2.8rem]">왔네요.</p>
            <p className="mt-2 text-sm leading-6 text-[#e5d6c0]">오늘은 무엇이 궁금한가요?</p>
          </div>
        </div>
        <div className="px-5 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-6">
          <p className="max-w-[28rem] text-sm leading-7 text-[#d8c9b3]">
            질문은 적어도 되고, 마음속에만 두어도 괜찮아요.
          </p>
          <label className="mt-7 block">
            <span className="mb-2 block text-sm text-[#eddcc4]">지금 마음에 걸린 질문</span>
            <input
              value={question}
              onChange={(event) => onChange(event.target.value)}
              placeholder="예: 지금 잡고 있는 일의 흐름이 궁금해요"
              className="min-h-12 w-full rounded-[1rem] border border-[#d6bc95]/24 bg-[#f3ebdf]/95 px-4 text-[#241c15] placeholder:text-[#7b6955] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200"
            />
          </label>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onStart}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#d3aa68] px-6 text-sm font-medium text-[#21170f] transition hover:bg-[#e0bb7a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200"
            >
              카드를 볼게요
            </button>
            <p className="flex items-center text-xs leading-5 text-[#bfae97]">입력한 문장은 저장하거나 공유하지 않아요.</p>
          </div>
        </div>
      </div>
    </StageFrame>
  );
}

function PreparingStage() {
  return (
    <StageFrame>
      <div className="rounded-[2rem] border border-[#ad8857]/18 bg-[#18130f]/88 px-5 py-8 shadow-[0_26px_70px_rgba(0,0,0,0.34)] sm:px-8">
        <p className="text-xs tracking-[0.24em] text-[#d0b17a]">카드를 정리하는 중</p>
        <div className="mt-6 flex justify-center">
          <div className="relative h-[220px] w-[180px]">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                initial={{ rotate: 0, y: 16, opacity: 0 }}
                animate={{ rotate: -9 + index * 8, y: 0, opacity: 1 }}
                transition={{ delay: index * 0.12, duration: 0.38, ease: "easeOut" }}
                className="absolute left-1/2 top-1/2 h-[160px] w-[104px] -translate-x-1/2 -translate-y-1/2 rounded-[1.4rem] border border-[#ad8d64]/38 bg-cover bg-center shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
                style={{ backgroundImage: "url(/images/tarot-card-back.png)" }}
              />
            ))}
          </div>
        </div>
        <h2 className="mt-3 text-center font-serif text-[1.9rem] text-[#f3e6d0]">세 번 천천히 섞고 있어요.</h2>
        <p className="mx-auto mt-3 max-w-[26rem] text-center text-sm leading-7 text-[#dcccba]">
          잠깐 숨을 고르는 사이에 카드를 펼쳐둘게요. 이어서 세 장만 직접 골라주세요.
        </p>
      </div>
    </StageFrame>
  );
}

function SelectionStage({
  deckOrder,
  selectedIds,
  onToggle,
  onConfirm,
}: {
  deckOrder: number[];
  selectedIds: number[];
  onToggle: (cardId: number) => void;
  onConfirm: () => void;
}) {
  return (
    <StageFrame>
      <div className="space-y-5 rounded-[2rem] border border-[#b28d60]/18 bg-[#16120f]/86 p-5 shadow-[0_26px_70px_rgba(0,0,0,0.34)] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs tracking-[0.22em] text-[#cfb17d]">세 장 선택</p>
            <h2 className="mt-2 font-serif text-[1.65rem] leading-snug text-[#f4e8d4] sm:text-[1.8rem]">손이 먼저 가는 카드를 세 장 골라보세요.</h2>
          </div>
          <p className="rounded-full border border-[#c8aa7c]/28 px-4 py-2 text-sm text-[#e6d5bc]">
            {selectedIds.length}/3 선택됨
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[0, 1, 2].map((slot) => {
            const cardId = selectedIds[slot];
            return (
              <div
                key={slot}
                className="min-h-[86px] rounded-[1rem] border border-dashed border-[#b89567]/24 bg-[#0f0c0a]/38 px-3 py-3 sm:min-h-[92px] sm:px-4 sm:py-4"
              >
                <p className="text-[0.65rem] tracking-[0.08em] text-[#caa978] sm:text-xs">{POSITION_SHORT_LABELS[slot]}</p>
                <p className="mt-2 text-xs leading-5 text-[#f0e1cb] sm:mt-3 sm:text-sm">{typeof cardId === "number" ? getTarotCard(cardId).label : "비어 있음"}</p>
              </div>
            );
          })}
        </div>

        <div className="overflow-x-auto pb-1" aria-label="78장 카드 선택 레일">
          <div className="flex min-w-max px-2 py-5">
            {deckOrder.map((cardId, index) => {
              const selectionOrder = selectedIds.indexOf(cardId) + 1;
              return (
                <div key={cardId} className={index === 0 ? "" : "-ml-10 sm:-ml-12"}>
                  <TarotCardBackButton
                    index={index}
                    isSelected={selectionOrder > 0}
                    selectionOrder={selectionOrder}
                    onToggle={() => onToggle(cardId)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-[#d8cab6]">선택한 카드는 다시 누르면 바로 내려놓을 수 있어요.</p>
          <button
            type="button"
            disabled={selectedIds.length !== 3}
            onClick={onConfirm}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#d3aa68] px-6 text-sm font-medium text-[#24190f] transition hover:bg-[#e0bb7a] disabled:cursor-not-allowed disabled:bg-[#7b6b56] disabled:text-[#e5d6c1]"
          >
            세 장 펼쳐 보기
          </button>
        </div>
      </div>
    </StageFrame>
  );
}

function RevealStage({
  selectedIds,
  revealedCount,
  message,
}: {
  selectedIds: number[];
  revealedCount: number;
  message: string;
}) {
  return (
    <StageFrame>
      <div className="rounded-[2rem] border border-[#b18a5d]/18 bg-[#17120e]/86 p-5 shadow-[0_26px_70px_rgba(0,0,0,0.34)] sm:p-6">
        <p className="text-xs tracking-[0.2em] text-[#cfb17c]">카드 공개</p>
        <h2 className="mt-2 font-serif text-[1.8rem] text-[#f2e7d5]">{message}</h2>
        <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
          {selectedIds.map((cardId, index) => {
            const isRevealed = index < revealedCount;
            return (
              <div key={`${cardId}-${index}`} className="space-y-3">
                <p className="text-[0.68rem] leading-4 text-[#e4d6c1] sm:text-sm">{POSITION_SHORT_LABELS[index]}</p>
                <motion.div
                  initial={false}
                  animate={{ rotateY: isRevealed ? 180 : 0 }}
                  transition={{ duration: 0.62, ease: "easeOut" }}
                  className="relative h-[238px] sm:h-[310px] md:h-[390px] [transform-style:preserve-3d]"
                >
                  <div aria-hidden={!isRevealed} className="absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden]">
                    <TarotCardFace card={cardId} priority />
                  </div>
                  <div
                    aria-hidden={isRevealed}
                    className="absolute inset-0 rounded-[1.25rem] border border-[#8d724d]/55 bg-cover bg-center shadow-[0_18px_50px_rgba(0,0,0,0.22)] [backface-visibility:hidden]"
                    style={{ backgroundImage: "url(/images/tarot-card-back.png)" }}
                  />
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </StageFrame>
  );
}

export function TarotRitual({ affiliateConfig }: TarotRitualProps) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [state, dispatch] = useReducer(ritualReducer, createShuffledDeck(), createInitialRitualState);
  const reading = state.selectedIds.length === 3 ? createRitualReading(state.selectedIds) : null;

  useEffect(() => {
    if (state.stage !== "preparing") {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      dispatch({ type: "prepared" });
    }, prefersReducedMotion ? TIMINGS.preparing.reduced : TIMINGS.preparing.normal);

    return () => window.clearTimeout(timer);
  }, [prefersReducedMotion, state.stage]);

  useEffect(() => {
    if (state.stage !== "revealing") {
      return undefined;
    }

    if (state.revealedCount < state.selectedIds.length) {
      const timer = window.setTimeout(() => {
        dispatch({ type: "cardRevealed" });
      }, prefersReducedMotion ? TIMINGS.reveal.reduced : TIMINGS.reveal.normal);

      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      dispatch({ type: "revealsCompleted" });
      trackTarotEvent({
        type: "reveal_completed",
        cards: state.selectedIds as [number, number, number],
      });
    }, prefersReducedMotion ? 60 : 160);

    return () => window.clearTimeout(timer);
  }, [prefersReducedMotion, state.revealedCount, state.selectedIds, state.stage]);

  useEffect(() => {
    if (state.stage !== "pause") {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      const showAffiliate = affiliateConfig.enabled;
      if (showAffiliate) {
        trackTarotEvent({ type: "affiliate_viewed", hasTarget: Boolean(affiliateConfig.outHref) });
      }
      dispatch({ type: "pauseCompleted", showAffiliate });
    }, prefersReducedMotion ? TIMINGS.pause.reduced : TIMINGS.pause.normal);

    return () => window.clearTimeout(timer);
  }, [affiliateConfig.enabled, affiliateConfig.outHref, prefersReducedMotion, state.stage]);

  const stageContent = (() => {
    switch (state.stage) {
      case "intro":
        return (
          <QuestionStage
            question={state.question}
            onChange={(question) => dispatch({ type: "questionChanged", question })}
            onStart={() => {
              trackTarotEvent({ type: "ritual_started", hasQuestion: Boolean(state.question.trim()) });
              dispatch({ type: "started", deckOrder: createShuffledDeck() });
            }}
          />
        );
      case "preparing":
        return <PreparingStage />;
      case "selecting":
        return (
          <SelectionStage
            deckOrder={state.deckOrder}
            selectedIds={state.selectedIds}
            onToggle={(cardId) => dispatch({ type: "cardToggled", cardId })}
            onConfirm={() => {
              trackTarotEvent({
                type: "cards_confirmed",
                cards: state.selectedIds as [number, number, number],
              });
              dispatch({ type: "confirmed" });
            }}
          />
        );
      case "revealing":
        return (
          <RevealStage
            selectedIds={state.selectedIds}
            revealedCount={state.revealedCount}
            message={`${Math.min(state.revealedCount + 1, 3)}번째 카드를 조용히 뒤집고 있어요.`}
          />
        );
      case "pause":
        return <RevealStage selectedIds={state.selectedIds} revealedCount={3} message="세 장의 흐름을 한 줄로 묶고 있어요." />;
      case "affiliate":
        return (
          <StageFrame>
            <AffiliateSheet
              href={affiliateConfig.outHref}
              onClick={() => {
                trackTarotEvent({ type: "affiliate_clicked" });
                dispatch({ type: "affiliateDismissed" });
              }}
              onSkip={() => {
                trackTarotEvent({ type: "affiliate_skipped" });
                dispatch({ type: "affiliateDismissed" });
              }}
            />
          </StageFrame>
        );
      case "result":
        return reading ? (
          <StageFrame>
            <div className="space-y-5">
              <ResultPaper
                reading={reading}
                title={state.question.trim() ? "당신이 붙잡고 있던 질문의 결" : "지금의 흐름"}
                subtitle={
                  state.question.trim()
                    ? "마음속에 두었던 질문을 카드의 흐름으로 풀어 읽었습니다."
                    : "질문 없이 고른 세 장도 충분히 하나의 이야기로 이어집니다."
                }
              />
              <div className="flex flex-col gap-4 rounded-[1.75rem] border border-[#c8aa7b]/18 bg-[#efe6d8] px-5 py-5 text-[#241d15] sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-[#5b5041]">질문은 공유되지 않고, 카드 순서만 링크에 담깁니다.</p>
                  <p className="mt-1 text-sm text-[#5b5041]">다시 시작하면 지금 화면의 임시 상태도 함께 정리돼요.</p>
                </div>
                <ShareActions cardIds={state.selectedIds} />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    trackTarotEvent({ type: "ritual_restarted", source: "result" });
                    dispatch({ type: "restarted", deckOrder: createShuffledDeck() });
                  }}
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#d2aa67] px-6 text-sm font-medium text-[#24190f] transition hover:bg-[#e0bb7a]"
                >
                  새 질문으로 다시 보기
                </button>
                <p className="flex min-h-12 items-center text-sm text-[#efe1cd]">같은 카드 흐름은 바로 위의 공유 버튼으로 보낼 수 있어요.</p>
              </div>
            </div>
          </StageFrame>
        ) : null;
      default:
        return null;
    }
  })();

  return (
    <main className="min-h-dvh bg-[#0b1512] text-[#f3e9d5]">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-5 sm:px-6 sm:py-8">
        <header className="mb-4 flex items-center justify-between text-xs text-[#baa179]">
          <span className="font-serif text-sm tracking-[0.06em] text-[#e7d6ba]">오늘의 타로</span>
          <span>질문은 이 화면에만 머물러요</span>
        </header>
        <AnimatePresence mode="wait">{stageContent}</AnimatePresence>
      </div>
    </main>
  );
}
