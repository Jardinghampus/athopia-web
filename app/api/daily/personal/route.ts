/**
 * Slice 5.2 — GET /api/daily/personal. Exposes the personal reading brief
 * (incl. `punditIntro` when AI_PUNDIT is on) as a typed contract so clients
 * (iOS, future web) can consume it instead of the SSR-only /min-dag page.
 *
 * Behind PERSONLIG_DAILY (404 when off, mirroring the page's notFound()).
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { jsonContract } from "@/lib/api-contract";
import { PersonalDailyResponseSchema } from "@/lib/api-schemas";
import { getPersonalDaily } from "@/lib/daily/personal-daily";
import { isPersonligDailyEnabled } from "@/lib/daily/isPersonligDailyEnabled";

export const dynamic = "force-dynamic";

const ALLOWED_MINUTES = [3, 5, 7];
function parseMinutes(raw: string | null): number {
  const n = Number(raw);
  return ALLOWED_MINUTES.includes(n) ? n : 5;
}

export async function GET(request: NextRequest) {
  if (!isPersonligDailyEnabled()) return NextResponse.json(null, { status: 404 });

  const { userId } = await auth();
  if (!userId) return NextResponse.json(null, { status: 401 });

  const minutes = parseMinutes(request.nextUrl.searchParams.get("min"));
  const daily = await getPersonalDaily(userId, minutes);

  return jsonContract(PersonalDailyResponseSchema, daily);
}
