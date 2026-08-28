import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SharedReadingPage } from "@/features/ritual/shared-reading-page";
import { createRitualReading } from "@/lib/tarot/reading";
import { parseShareToken } from "@/lib/sharing/token";

type SharePageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { token } = await params;
  const cardIds = parseShareToken(token);

  if (!cardIds) {
    return {
      title: "미스터 타로",
      description: "세 장을 직접 고르고, 조용히 이야기를 읽어보세요.",
    };
  }

  const reading = createRitualReading(cardIds);

  return {
    title: `${reading.cards.map((card) => card.label).join(", ")} | 미스터 타로`,
    description: reading.headline,
    openGraph: {
      title: "미스터 타로에서 고른 세 장",
      description: reading.headline,
      images: [`/share/${token}/opengraph-image`],
    },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const cardIds = parseShareToken(token);

  if (!cardIds) {
    redirect("/");
  }

  return <SharedReadingPage cardIds={cardIds as [number, number, number]} />;
}
