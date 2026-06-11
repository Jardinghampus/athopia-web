import { NextResponse } from "next/server";
import { getScoutPool } from "@/lib/team-hub/scout";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pool = await getScoutPool();
    return NextResponse.json({ pool }, { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" } });
  } catch {
    return NextResponse.json({ pool: [] }, { status: 500 });
  }
}
