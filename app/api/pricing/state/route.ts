/**
 * Publik pott-flagga för landningen. ISR bakade tidigare in Founder i HTML
 * i 120 s — checkout var atomär, UI:t ljög. Klienten fail-closed (false)
 * tills det här svaret kommer.
 */

import { NextResponse } from "next/server";
import { isFounderOfferPublic } from "@/lib/founder-offer";

export async function GET() {
  const founderPublic = await isFounderOfferPublic();
  return NextResponse.json(
    { founderPublic },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=15",
      },
    },
  );
}
