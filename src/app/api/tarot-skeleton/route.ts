import { NextResponse } from "next/server";
import { assertCardTriple } from "@/domain/tarot";
import { loadReadingSkeleton } from "@/lib/tarot/skeleton-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { cardIds?: unknown };
    if (!Array.isArray(body.cardIds)) return NextResponse.json({ error: "Invalid cards" }, { status: 400 });
    assertCardTriple(body.cardIds);
    const skeleton = await loadReadingSkeleton(body.cardIds);
    return NextResponse.json({ skeleton });
  } catch {
    return NextResponse.json({ error: "Unable to load skeleton" }, { status: 400 });
  }
}
