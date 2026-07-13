import { NextResponse } from "next/server";
import { getScoutPool } from "@/lib/team-hub/scout";
import { getUserPlan } from "@/lib/user-plan";
import { canAccess } from "@/lib/access-rules";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const plan = await getUserPlan();
    if (!canAccess("smartRanking", plan)) {
      return NextResponse.json(
        { error: "PRO krävs för Scout Mode." },
        { status: 403 }
      );
    }
    const pool = await getScoutPool();
    return NextResponse.json({ pool }, { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" } });
  } catch {
    return NextResponse.json({ pool: [] }, { status: 500 });
  }
}
