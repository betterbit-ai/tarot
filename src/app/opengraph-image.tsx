import { ImageResponse } from "next/og";
import { loadKoreanOgFont } from "@/lib/og/font";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OpengraphImage() {
  const koreanFont = await loadKoreanOgFont();
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background: "linear-gradient(135deg, #0b1512 0%, #172119 45%, #221911 100%)",
          color: "#f2e7d4",
          padding: "56px",
          fontFamily: "Nanum Gothic",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            border: "1px solid rgba(211,170,104,0.24)",
            borderRadius: "36px",
            padding: "44px",
            background: "rgba(16, 13, 10, 0.58)",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "680px" }}>
            <div style={{ fontSize: 20, letterSpacing: "0.28em", color: "#d3aa68" }}>미스터 타로 · MR. TAROT</div>
            <div style={{ display: "flex", flexDirection: "column", fontSize: 68, lineHeight: 1.08, fontWeight: 700 }}>
              세 장을 직접 고르고
              <br />
              세 장을 천천히 읽어보세요.
            </div>
            <div style={{ fontSize: 28, lineHeight: 1.45, color: "#e2d4bf" }}>
              질문은 링크에 남지 않고, 고른 카드만 남습니다.
            </div>
          </div>
          <div style={{ display: "flex", gap: "20px" }}>
            {["1", "2", "3"].map((symbol, index) => (
              <div
                key={symbol}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  width: "190px",
                  height: `${290 - index * 20}px`,
                  borderRadius: "30px",
                  padding: "24px",
                  background: "#f0e8db",
                  color: "#241c15",
                }}
              >
                <div style={{ fontSize: 18, color: "#7d6244" }}>CARD</div>
                <div style={{ fontSize: 56, alignSelf: "center", color: "#c28e44" }}>{symbol}</div>
                <div style={{ fontSize: 24 }}>{index === 0 ? "흐름" : index === 1 ? "핵심" : "방향"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Nanum Gothic", data: koreanFont, weight: 400 }],
    },
  );
}
