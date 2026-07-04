import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { enforceRateLimit } from "@/lib/ratelimit";
import { parseBody, z } from "@/lib/validation";

const RateSchema = z.object({
  fixtureId: z.number().int().positive(),
  playerId: z.number().int().positive(),
  rating: z.number().int().min(1).max(10),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const blocked = await enforceRateLimit("write", req, userId);
  if (blocked) return blocked;

  const parsed = await parseBody(req, RateSchema);
  if (!parsed.ok) return parsed.response;
  const { fixtureId, playerId, rating } = parsed.data;

  if (!isSupabaseConfigured()) return NextResponse.json({ ok: true });

  const db = createServerClient();

  // Betyg tillåts bara på färdigspelade matcher
  const { data: fix } = await db
    .from("fixtures")
    .select("status")
    .eq("sportmonks_id", fixtureId)
    .maybeSingle();
  if (fix?.status !== "FT") {
    return NextResponse.json({ error: "Matchen är inte färdigspelad" }, { status: 400 });
  }

  const { error } = await db.from("player_ratings").upsert(
    { clerk_user_id: userId, fixture_id: fixtureId, player_id: playerId, rating },
    { onConflict: "clerk_user_id,fixture_id,player_id" },
  );
  if (error) return NextResponse.json({ error: "db error" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
