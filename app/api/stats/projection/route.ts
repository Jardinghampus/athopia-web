import { NextResponse } from "next/server";
import { getProjectionRows } from "@/lib/stats/advanced";

export const revalidate = 3600;

export async function GET() {
  const rows = await getProjectionRows();
  return NextResponse.json(
    { rows },
    { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200" } }
  );
}
