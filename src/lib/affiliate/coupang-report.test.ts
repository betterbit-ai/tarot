import { describe, expect, it, vi } from "vitest";
import { formatCoupangDailySlackReport, sendCoupangDailySlackReport } from "./coupang-report";

const funnel = { landing_view: 10, ritual_started: 6, cards_confirmed: 5, result_viewed: 4, affiliate_viewed: 3, affiliate_skipped: 2, affiliate_clicked: 1, result_shared: 0 };

describe("Coupang Slack report", () => {
  it("formats aggregate values without order or product details", () => {
    const text = formatCoupangDailySlackReport({ date: "20260908", click: 13, order: 3, cancel: 1, gmv: 16000, commission: 480, rows: 2 }, funnel);

    expect(text).toContain("클릭 13 · 주문 3 · 취소 1");
    expect(text).toContain("거래액 16,000원 · 수수료 480원");
    expect(text).toContain("쿠팡 클릭은 주문이나 수수료를 뜻하지 않습니다.");
    expect(text).not.toContain("orderId");
  });

  it("sends only the formatted text to the configured webhook", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    await sendCoupangDailySlackReport({ webhookUrl: "https://hooks.slack.com/services/example", fetcher }, "report");

    expect(fetcher).toHaveBeenCalledWith("https://hooks.slack.com/services/example", expect.objectContaining({ body: JSON.stringify({ text: "report" }) }));
  });
});
