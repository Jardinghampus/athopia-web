import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { jsonContract } from "@/lib/api-contract";
import { MatchTimelineResponseSchema } from "@/lib/api-schemas";
import { buildMatchTimeline } from "@/lib/match/events";

export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fixtureId: string }> }
) {
  const { fixtureId } = await params;
  const id = parseInt(fixtureId, 10);
  if (Number.isNaN(id)) return NextResponse.json(null, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json(null, { status: 503 });

  const db = createServerClient();
  const timeline = await buildMatchTimeline(db, id);

  return jsonContract(MatchTimelineResponseSchema, timeline, {
    headers: { "Cache-Control": "no-store" },
  });
}
