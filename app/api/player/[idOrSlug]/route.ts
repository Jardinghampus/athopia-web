import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { jsonContract } from "@/lib/api-contract";
import { PlayerProfileResponseSchema } from "@/lib/api-schemas";
import { buildPlayerProfile } from "@/lib/player/profile";

export const revalidate = 300;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ idOrSlug: string }> }
) {
  const { idOrSlug } = await params;
  if (!idOrSlug || idOrSlug.length > 120) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const db = createServerClient();
  const profile = await buildPlayerProfile(db, decodeURIComponent(idOrSlug));

  if (!profile.player) {
    return NextResponse.json(profile, { status: 404 });
  }

  return jsonContract(PlayerProfileResponseSchema, profile, {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    },
  });
}
