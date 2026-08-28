import { describe, expect, it } from "vitest";
import { getCardsByIds } from "@/lib/tarot/cards";
import { inferAffiliateCategory, selectAffiliateProduct } from "@/lib/affiliate/products";

describe("affiliate products", () => {
  it("chooses a category from explicit question intent before card signals", () => {
    expect(inferAffiliateCategory("지금 이직이 맞을까요?", getCardsByIds([6, 37, 38]))).toBe("career");
    expect(inferAffiliateCategory("이 관계를 이어가도 될까요?", getCardsByIds([1, 50, 62]))).toBe("love");
    expect(inferAffiliateCategory("", getCardsByIds([64, 67, 71]))).toBe("money");
  });

  it("returns the actual configured product without an unverified price", () => {
    const product = selectAffiliateProduct("지금 이직이 맞을까요?", getCardsByIds([29, 67, 5]));

    expect(product.title).toBe("블루 드 샤넬 오 드 빠르펭 50ml");
    expect(product.imageSrc).toBe("/affiliate/bleu-de-chanel.avif");
    expect(product.reason).toContain("면접이나 첫 출근");
    expect(product).not.toHaveProperty("price");
    expect(product.ctaLabel).toBe("쿠팡에서 보기");
  });
});
