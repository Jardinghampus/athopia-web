import { NextResponse } from "next/server";
import { getScoutPool } from "@/lib/team-hub/scout";
import { getUserPlan } from "@/lib/user-plan";
import { canAccess } from "@/lib/access-rules";
import { jsonContract } from "@/lib/api-contract";
import { ScoutPoolResponseSchema } from "@/lib/api-schemas";

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
    return jsonContract(ScoutPoolResponseSchema, { pool }, { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" } });
  } catch {
    return NextResponse.json({ pool: [] }, { status: 500 });
  }
}
