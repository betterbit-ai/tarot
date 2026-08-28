import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "오늘의 타로",
  description: "세 장을 직접 고르고, 하나의 흐름으로 읽어보세요.",
  applicationName: "오늘의 타로",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b1512",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preload" as="image" href="/images/tarot-card-back.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
