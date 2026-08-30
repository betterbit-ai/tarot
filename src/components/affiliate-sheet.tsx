import Image from "next/image";
import type { AffiliateSelection } from "@/lib/affiliate/products";

type AffiliateSheetProps = {
  product: AffiliateSelection;
  href: string | null;
  onSkip: () => void;
  onClick: () => void;
};

export function AffiliateSheet({ product, href, onSkip, onClick }: AffiliateSheetProps) {
  return (
    <section
      aria-label="제휴 안내"
      className="mx-auto max-w-3xl overflow-hidden border-y border-[#c8a87a]/18 bg-[#14120f] text-[#f2e7d3]"
    >
      <div className="grid gap-0 sm:grid-cols-[0.82fr_1.18fr]">
        <div className="relative min-h-[250px] border-b border-[#c8a87a]/12 bg-[#e8e6e1] sm:min-h-[420px] sm:border-b-0 sm:border-r">
          <Image
            src={product.imageSrc}
            alt={product.imageAlt}
            fill
            sizes="(max-width: 639px) 100vw, 340px"
            className="object-contain p-7 sm:p-10"
          />
        </div>

        <div className="flex flex-col justify-center gap-5 p-5 sm:p-8">
          <div>
            <p className="text-xs tracking-[0.12em] text-[#c8ad82]">오늘은 이런 걸 골랐어요</p>
            <h2 className="mt-3 font-serif text-[1.55rem] leading-tight text-[#f5ead7] sm:text-[1.9rem]">{product.title}</h2>
            <p className="mt-4 max-w-[38ch] text-sm leading-7 text-[#dfd0bb]">{product.reason}</p>
          </div>

          <div className="flex flex-col gap-3">
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                onClick={onClick}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#d3aa68] px-5 text-sm font-medium text-[#23180f] transition hover:bg-[#e1bb7c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200"
              >
                {product.ctaLabel}
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#56493a] px-5 text-sm font-medium text-[#d9cab2] opacity-75"
              >
                {product.ctaLabel}
              </button>
            )}
            <button
              type="button"
              onClick={onSkip}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#c8aa7f]/24 px-5 text-sm text-[#f0e4d1] transition hover:bg-[#241d17] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200"
            >
              건너뛰고 결과 보기
            </button>
          </div>

          <p className="text-[0.68rem] leading-5 text-[#a99375]">{product.disclosure}</p>
        </div>
      </div>
    </section>
  );
}
