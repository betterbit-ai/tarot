import type { Metadata, Viewport } from "next";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: "미스터 타로",
  description: "세 장을 직접 고르고, 조용히 이야기를 읽어보세요.",
  applicationName: "미스터 타로",
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
