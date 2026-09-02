import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { createCoupangAuthorization, refreshCoupangPool } from "./coupang-api";

describe("Coupang Partners adapter", () => {
  it("creates the documented HMAC authorization string", () => {
    const now = new Date("2026-09-02T01:02:03.000Z");
    const datetime = "260902T010203Z";
    const path = "/v2/providers/affiliate_open_api/apis/openapi/v1/products/search";
    const query = "keyword=%EC%BB%A4%ED%94%8C%20%EC%84%A0%EB%AC%BC&limit=5";
    const signature = createHmac("sha256", "secret").update(`${datetime}GET${path}${query}`).digest("hex");
    expect(createCoupangAuthorization("GET", path, query, "access", "secret", now)).toBe(`CEA algorithm=HmacSHA256, access-key=access, signed-date=${datetime}, signature=${signature}`);
  });

  it("refreshes one verified deep link per internal theme", async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/products/search")) {
        const keyword = new URL(url).searchParams.get("keyword") ?? "상품";
        return new Response(JSON.stringify({ rCode: "0", data: [{ productId: keyword, productName: `${keyword} 추천 상품`, productImage: "https://thumbnail.coupangcdn.com/example.jpg", productUrl: "https://www.coupang.com/vp/products/example" }] }), { status: 200, headers: { "content-type": "application/json" } });
      }
      expect(init?.method).toBe("POST");
      return new Response(JSON.stringify({ rCode: "0", data: [{ shortenUrl: "https://link.coupang.com/a/example" }] }), { status: 200, headers: { "content-type": "application/json" } });
    });

    const products = await refreshCoupangPool({ accessKey: "access", secretKey: "secret", fetcher, now: new Date("2026-09-02T01:02:03.000Z") });
    expect(products).toHaveLength(6);
    expect(products.every((product) => product.partnerUrl?.startsWith("https://link.coupang.com/"))).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(12);
  });
});
