import { type NextRequest, NextResponse } from "next/server";
import { resolveAffiliateTarget } from "@/lib/affiliate/config";

export function GET(request: NextRequest) {
  const target = resolveAffiliateTarget();
  const fallback = new URL("/", request.url);

  if (!target) {
    return NextResponse.redirect(fallback);
  }

  return NextResponse.redirect(target);
}
