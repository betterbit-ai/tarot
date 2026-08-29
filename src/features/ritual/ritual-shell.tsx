"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useReducer, useState } from "react";
import { AffiliateSheet } from "@/components/affiliate-sheet";
import { ResultPaper } from "@/components/result-paper";
import { ShareActions } from "@/components/share-actions";
import { TarotCardFace } from "@/components/tarot-card-face";
import { TarotSpread } from "@/components/tarot-spread";
import { trackTarotEvent } from "@/lib/analytics/events";
import type { AffiliateConfig } from "@/lib/affiliate/config";
import { createShuffledDeck } from "@/lib/tarot/cards";
import { createQuestionAwareRitualReading } from "@/lib/tarot/reading";
import { createCanonicalCombinationKey, type ReadingSkeleton } from "@/domain/tarot";
import { summarizeQuestion } from "@/lib/tarot/question";
import { selectAffiliateProduct } from "@/lib/affiliate/products";
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

const POSITION_SHORT_LABELS = ["첫 장", "가운데", "마지막"] as const;
const SELECTION_SLOT_LABELS = ["첫 번째", "두 번째", "세 번째"] as const;

function revealMessage(revealedCount: number, reading: ReturnType<typeof createQuestionAwareRitualReading> | null): string {
  if (revealedCount === 0) return "첫 장부터 볼게요.";
  if (!reading) return "잠깐만요. 세 장을 같이 볼게요.";
  if (revealedCount >= 3) {
    if (reading.signals.contradiction) return "첫 장과 마지막 장이 꽤 다르네요. 잠깐 볼게요.";
    if (reading.signals.repeatedSuit) return "두 장이 같은 얘기를 하고 있네요. 잠깐 볼게요.";
    if (reading.signals.majorCount >= 2) return "이번 조합은 무게가 있네요. 잠깐 볼게요.";
    if (reading.signals.pauseCount >= 2) return "가운데 카드가 조금 걸리네요. 잠깐 볼게요.";
    return "잠깐만요. 이 세 장은 같이 봐야겠네요.";
  }
  if (reading.signals.contradiction) return "첫 장과 마지막 장이 어떻게 만나는지 볼게요.";
  if (reading.signals.repeatedSuit) return "같은 무늬가 이어지는지 볼게요.";
  if (reading.signals.majorCount >= 2) return "이번 조합은 무게가 있네요.";
  return `${revealedCount + 1}번째 카드를 뒤집을게요.`;
}

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
            <p className="font-serif text-[2.15rem] leading-tight text-[#f4e8d4] sm:text-[2.8rem]">왔군요.</p>
            <p className="mt-2 text-sm leading-6 text-[#e5d6c0]">무슨 일이 마음에 걸리나요?</p>
          </div>
        </div>
        <div className="px-5 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-6">
          <p className="max-w-[28rem] text-sm leading-7 text-[#d8c9b3]">
            말로 적어도 좋고, 마음속에만 두어도 괜찮아요.
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
            <p className="flex items-center text-xs leading-5 text-[#9f927f]">질문은 저장되지 않아요.</p>
          </div>
        </div>
      </div>
    </StageFrame>
  );
}

function PreparingStage() {
  return (
    <StageFrame>
      <div className="py-8 text-center sm:py-12">
        <div className="flex justify-center">
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
        <h2 className="mt-3 font-serif text-[1.9rem] text-[#f3e6d0]">카드를 섞을게요.</h2>
        <p className="mx-auto mt-3 max-w-[26rem] text-center text-sm leading-7 text-[#dcccba]">
          잠깐 숨을 고르고, 손이 가는 세 장을 골라보세요.
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
  reducedMotion,
}: {
  deckOrder: number[];
  selectedIds: number[];
  onToggle: (cardId: number) => void;
  onConfirm: () => void;
  reducedMotion: boolean;
}) {
  const remaining = 3 - selectedIds.length;
  const guidance =
    remaining === 3
      ? "천천히 훑어보다가 손이 멈추는 곳을 눌러보세요."
      : remaining === 2
        ? "두 장을 더 골라보세요."
        : remaining === 1
          ? "한 장만 더 골라보세요."
        : "그럼, 이 세 장을 볼게요.";

  return (
    <StageFrame>
      <div className="py-2 sm:py-4">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="whitespace-nowrap font-serif text-[1.2rem] leading-snug text-[#f4e8d4] sm:text-[2rem]">
            손이 가는 카드 세 장을 골라보세요.
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#cbbba3]" aria-live="polite">
            {guidance}
          </p>
        </div>

        <div className="mx-auto mt-4 flex w-fit items-center gap-3" aria-label={`세 장 중 ${selectedIds.length}장 선택`}>
          {SELECTION_SLOT_LABELS.map((label, slot) => (
            <span
              key={label}
              className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs transition ${
                selectedIds[slot] !== undefined
                  ? "border-[#efd6a5] bg-[#efd6a5] text-[#251d14]"
                  : "border-[#a88b5f]/35 text-[#aa9679]"
              }`}
              aria-label={`${label} 카드 ${selectedIds[slot] !== undefined ? "선택 완료" : "선택 전"}`}
            >
              {selectedIds[slot] !== undefined ? "✓" : slot + 1}
            </span>
          ))}
        </div>

        <div className="mt-4">
          <TarotSpread deckOrder={deckOrder} selectedIds={selectedIds} onToggle={onToggle} reducedMotion={reducedMotion} />
        </div>

        <div className="mx-auto mt-4 flex max-w-xl flex-col items-center gap-3">
          <p className="text-xs text-[#a99478]">잘못 골랐다면 같은 카드를 다시 누르세요.</p>
          <button
            type="button"
            disabled={selectedIds.length !== 3}
            onClick={onConfirm}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#d3aa68] px-6 text-sm font-medium text-[#24190f] transition hover:bg-[#e0bb7a] disabled:cursor-not-allowed disabled:bg-[#4b4338] disabled:text-[#a89b87] sm:w-auto"
          >
            세 장을 펼쳐볼게요
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
      <div className="py-3 sm:py-5">
        <h2 className="text-center font-serif text-[1.7rem] text-[#f2e7d5] sm:text-[1.9rem]">{message}</h2>
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
                  {isRevealed ? (
                    <div className="absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden]">
                      <TarotCardFace card={cardId} priority />
                    </div>
                  ) : null}
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
  const [precomputedSkeleton, setPrecomputedSkeleton] = useState<ReadingSkeleton | undefined>();
  const questionProfile = summarizeQuestion(state.question);
  const skeletonForSelection = state.selectedIds.length === 3 && precomputedSkeleton?.canonicalKey === createCanonicalCombinationKey(state.selectedIds) ? precomputedSkeleton : undefined;
  const reading = state.selectedIds.length === 3 ? createQuestionAwareRitualReading(state.selectedIds, state.question, skeletonForSelection) : null;
  const affiliateProduct = reading ? selectAffiliateProduct(state.question, reading.cards) : null;

  useEffect(() => {
    if (state.selectedIds.length !== 3) {
      return undefined;
    }
    if (typeof fetch === "undefined") return undefined;
    let cancelled = false;
    fetch("/api/tarot-skeleton", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cardIds: state.selectedIds }),
    })
      .then(async (response) => response.ok ? response.json() as Promise<{ skeleton: ReadingSkeleton }> : undefined)
      .then((payload) => {
        if (!cancelled && payload?.skeleton) setPrecomputedSkeleton(payload.skeleton);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [state.selectedIds]);

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
            reducedMotion={prefersReducedMotion}
          />
        );
      case "revealing":
        return (
          <RevealStage
            selectedIds={state.selectedIds}
            revealedCount={state.revealedCount}
            message={revealMessage(state.revealedCount, reading)}
          />
        );
      case "pause":
        return <RevealStage selectedIds={state.selectedIds} revealedCount={3} message={revealMessage(3, reading)} />;
      case "affiliate": {
        if (!affiliateProduct) return null;
        return (
          <StageFrame>
            <AffiliateSheet
              href={affiliateConfig.outHref}
              product={affiliateProduct}
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
      }
      case "result":
        return reading ? (
          <StageFrame>
            <div className="space-y-5">
              <ResultPaper
                reading={reading}
                title={questionProfile ? questionProfile.excerpt : "지금 가장 마음에 걸린 일"}
              />
              <div className="flex flex-col gap-4 border-t border-[#a88b5f]/18 py-5 text-[#eadfcd] sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-[#cbbba3]">질문은 빼고, 세 장과 한 문장만 공유해요.</p>
                </div>
                <ShareActions cardIds={state.selectedIds} tone="dark" />
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
        <header className="mb-4 text-center text-xs text-[#baa179]">
          <span className="font-serif text-sm tracking-[0.06em] text-[#e7d6ba]">미스터 타로</span>
        </header>
        <AnimatePresence mode="wait">{stageContent}</AnimatePresence>
      </div>
    </main>
  );
}
