type AffiliateSheetProps = {
  href: string | null;
  onSkip: () => void;
  onClick: () => void;
};

export function AffiliateSheet({ href, onSkip, onClick }: AffiliateSheetProps) {
  return (
    <section
      aria-label="제휴 안내"
      className="rounded-[2rem] border border-[#c8a87a]/20 bg-[#201a14]/95 p-6 text-[#f2e7d3] shadow-[0_24px_64px_rgba(0,0,0,0.34)]"
    >
      <p className="text-xs leading-6 text-[#d8c4a4]">
        이 게시물은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
      </p>
      <h2 className="mt-4 font-serif text-[1.7rem] leading-tight">결과를 보기 전, 잠깐 둘러볼 수 있어요.</h2>
      <p className="mt-3 text-sm leading-6 text-[#dfd0b8]">
        결과는 바로 이어서 열립니다. 마음이 가면 잠깐 보고, 아니면 그대로 건너뛰어도 괜찮아요.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            onClick={onClick}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#d3aa68] px-5 text-sm font-medium text-[#23180f] transition hover:bg-[#e1bb7c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200"
          >
            쿠팡에서 보기
          </a>
        ) : null}
        <button
          type="button"
          onClick={onSkip}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#c8aa7f]/35 px-5 text-sm text-[#f0e4d1] transition hover:bg-[#2b241d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200"
        >
          건너뛰고 결과 보기
        </button>
      </div>
    </section>
  );
}
