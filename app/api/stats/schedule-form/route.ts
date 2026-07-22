import { NextResponse } from "next/server";
import { getScheduleFormRows } from "@/lib/stats/advanced";
import { jsonContract } from "@/lib/api-contract";
import { ScheduleFormResponseSchema } from "@/lib/api-schemas";

export const revalidate = 3600;

export async function GET() {
  const rows = await getScheduleFormRows();
  return jsonContract(ScheduleFormResponseSchema,
    { rows },
    { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200" } }
  );
}
