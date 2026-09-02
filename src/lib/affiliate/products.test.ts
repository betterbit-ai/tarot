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

  it("selects from a refreshed pool without changing theme inference", () => {
    const product = selectAffiliateProduct("이직을 고민하고 있어요", getCardsByIds([2, 8, 14]), undefined, [{
      id: "coupang-focus",
      categories: ["focus"],
      title: "집중을 돕는 정리함",
      imageSrc: "https://thumbnail.coupangcdn.com/example.jpg",
      imageAlt: "정리함 상품 이미지",
      disclosure: "제휴 안내",
      ctaLabel: "쿠팡에서 보기",
      weight: 1,
      active: true,
      partnerUrl: "https://link.coupang.com/a/example",
    }]);

    expect(product?.id).toBe("coupang-focus");
    expect(product?.partnerUrl).toContain("link.coupang.com");
  });
});
