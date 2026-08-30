import { describe, expect, it } from "vitest";
import { getCardsByIds } from "@/lib/tarot/cards";
import { inferAffiliateCategory, inferAffiliateThemes, selectAffiliateProduct } from "@/lib/affiliate/products";

describe("affiliate products", () => {
  it("combines question and card themes instead of mapping one keyword to one product", () => {
    expect(inferAffiliateThemes("지금 이직이 맞을까요?", getCardsByIds([6, 37, 38]))).toEqual(expect.arrayContaining(["focus", "new-start", "relationship"]));
    expect(inferAffiliateCategory("이 관계를 이어가도 될까요?", getCardsByIds([1, 50, 62]))).toBe("relationship");
    expect(inferAffiliateCategory("", getCardsByIds([64, 67, 71]))).toBe("organization");
  });

  it("only returns a product when the verified curated pool matches the reading", () => {
    const product = selectAffiliateProduct("이 관계를 이어가도 될까요?", getCardsByIds([41, 37, 49]));

    expect(product?.title).toBe("블루 드 샤넬 오 드 빠르펭 50ml");
    expect(product?.imageSrc).toBe("/affiliate/bleu-de-chanel.avif");
    expect(product?.reason).toContain("관계 생각");
    expect(product).not.toHaveProperty("price");
    expect(product?.ctaLabel).toBe("쿠팡에서 보기");
    expect(selectAffiliateProduct("지금 빚을 갚아야 할까요?", getCardsByIds([64, 67, 71]))).toBeNull();
  });
});
