import { NextResponse } from "next/server";
import { getClutchRows } from "@/lib/stats/advanced";
import { jsonContract } from "@/lib/api-contract";
import { ClutchResponseSchema } from "@/lib/api-schemas";

export const revalidate = 3600;

export async function GET() {
  const rows = await getClutchRows();
  return jsonContract(ClutchResponseSchema,
    { rows },
    { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200" } }
  );
}
