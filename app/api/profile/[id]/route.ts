import { NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

// GET /api/profile/[id] — publika profilfält för profilkort (id = clerk_user_id)
// Exponerar ENBART säkra kolumner. Aldrig e-post, plan eller hemlig info.
export const revalidate = 120;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isSupabaseConfigured()) return NextResponse.json(null);

  try {
    const db = createServerClient();
    const { data } = await db
      .from("profiles")
      .select("clerk_user_id, nickname, display_name, avatar_url, bio, verified, role, favourite_team_id, created_at")
      .eq("clerk_user_id", id)
      .maybeSingle();

    return NextResponse.json(data ?? null, {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" },
    });
  } catch {
    return NextResponse.json(null);
  }
}
