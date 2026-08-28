import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AffiliateSheet } from "@/components/affiliate-sheet";
import { selectAffiliateProduct } from "@/lib/affiliate/products";
import { getCardsByIds } from "@/lib/tarot/cards";

const product = selectAffiliateProduct("지금 쉬어야 할까요?", getCardsByIds([9, 18, 14]));

describe("AffiliateSheet", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders a contextual recommendation and keeps skip available when the href is missing", () => {
    render(<AffiliateSheet product={product} href={null} onSkip={vi.fn()} onClick={vi.fn()} />);

    expect(screen.getByText("오늘의 카드와 어울리는 것")).not.toBeNull();
    expect(screen.getByText(product.title)).not.toBeNull();
    expect((screen.getByRole("button", { name: "쿠팡에서 보기" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("button", { name: "건너뛰고 결과 보기" })).not.toBeNull();
  });
});
