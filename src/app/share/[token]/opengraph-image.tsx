import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { createRitualReading } from "@/lib/tarot/reading";
import { parseShareToken } from "@/lib/sharing/token";
import { loadKoreanOgFont } from "@/lib/og/font";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

type ShareOgProps = {
  params: Promise<{ token: string }>;
};

export default async function ShareOpengraphImage({ params }: ShareOgProps) {
  const { token } = await params;
  const cardIds = parseShareToken(token);
  if (!cardIds) {
    notFound();
  }
  const reading = createRitualReading(cardIds);
  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
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
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            border: "1px solid rgba(211,170,104,0.24)",
            borderRadius: "36px",
            padding: "44px",
            background: "rgba(16, 13, 10, 0.58)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "760px" }}>
            <div style={{ fontSize: 20, letterSpacing: "0.28em", color: "#d3aa68" }}>공유된 세 장</div>
            <div style={{ fontSize: 58, lineHeight: 1.15, fontWeight: 600 }}>{reading.headline}</div>
            <div style={{ fontSize: 28, lineHeight: 1.45, color: "#e2d4bf" }}>{reading.cards.map((card) => card.label).join(", ")}</div>
          </div>
          <div style={{ display: "flex", gap: "20px" }}>
            {reading.cards.map((card) => (
              <div
                key={card.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "170px",
                  height: "294px",
                  borderRadius: "18px",
                  overflow: "hidden",
                  background: "#f0e8db",
                  color: "#241c15",
                }}
              >
                <img
                  src={new URL(card.imagePath, siteOrigin).toString()}
                  alt=""
                  width="170"
                  height="240"
                  style={{ objectFit: "cover" }}
                />
                <div style={{ display: "flex", flexDirection: "column", padding: "10px 14px", gap: "3px" }}>
                  <div style={{ fontSize: 19, fontWeight: 600 }}>{card.label}</div>
                  <div style={{ fontSize: 11, color: "#725f48", textTransform: "uppercase" }}>{card.nameEn}</div>
                </div>
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
