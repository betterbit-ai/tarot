import type { Metadata } from "next";
import { TarotRitual } from "@/features/ritual/ritual-shell";
import { getAffiliateConfig } from "@/lib/affiliate/config";

export const metadata: Metadata = {
  title: "미스터 타로",
  description: "세 장을 직접 고르고, 조용히 이야기를 읽어보세요.",
  openGraph: {
    title: "미스터 타로",
    description: "질문은 남기지 않고, 세 장을 조용히 읽어보세요.",
    images: ["/opengraph-image"],
  },
};

export default function HomePage() {
  return <TarotRitual affiliateConfig={getAffiliateConfig()} />;
}
