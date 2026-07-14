import { NextResponse } from "next/server";
import { getProjectionRows } from "@/lib/stats/advanced";
import { jsonContract } from "@/lib/api-contract";
import { ProjectionResponseSchema } from "@/lib/api-schemas";

export const revalidate = 3600;

export async function GET() {
  const rows = await getProjectionRows();
  return jsonContract(ProjectionResponseSchema,
    { rows },
    { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200" } }
  );
}
