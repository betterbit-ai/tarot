import type { Metadata } from "next";
import { TarotRitual } from "@/features/ritual/ritual-shell";
import { getAffiliateConfig } from "@/lib/affiliate/config";

export const metadata: Metadata = {
  title: "오늘의 타로",
  description: "세 장을 직접 고르고, 하나의 흐름으로 읽어보세요.",
  openGraph: {
    title: "오늘의 타로",
    description: "질문은 남기지 않고, 세 장의 흐름만 조용히 읽어보세요.",
    images: ["/opengraph-image"],
  },
};

export default function HomePage() {
  return <TarotRitual affiliateConfig={getAffiliateConfig()} />;
}
