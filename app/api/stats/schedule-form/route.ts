import { NextResponse } from "next/server";
import { getScheduleFormRows } from "@/lib/stats/advanced";

export const revalidate = 3600;

export async function GET() {
  const rows = await getScheduleFormRows();
  return NextResponse.json(
    { rows },
    { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200" } }
  );
}
