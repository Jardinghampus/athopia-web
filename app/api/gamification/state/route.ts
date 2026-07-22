/**
 * GET /api/gamification/state
 * Server-side gamification snapshot for the signed-in user.
 * Replaces browser Supabase reads (anon key + unclear RLS) on user tables.
 */
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { enforceRateLimit } from "@/lib/ratelimit";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blocked = await enforceRateLimit("read", req, userId);
  if (blocked) return blocked;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "DB ej konfigurerad" }, { status: 503 });
  }

  const supabase = createServerClient();

  const [league, iq, streak, cards, badges, activeRound] = await Promise.all([
    supabase
      .from("user_league_memberships")
      .select("*, fan_leagues(*)")
      .eq("clerk_user_id", userId)
      .maybeSingle(),
    supabase
      .from("user_football_iq")
      .select("*")
      .eq("clerk_user_id", userId)
      .maybeSingle(),
    supabase
      .from("user_season_streak")
      .select("*")
      .eq("clerk_user_id", userId)
      .maybeSingle(),
    supabase
      .from("match_cards")
      .select("*")
      .eq("clerk_user_id", userId)
      .order("match_date", { ascending: false })
      .limit(5),
    supabase
      .from("user_badges")
      .select("*")
      .eq("clerk_user_id", userId)
      .order("earned_at", { ascending: false }),
    supabase.from("match_rounds").select("*").eq("is_active", true).maybeSingle(),
  ]);

  let currentRoundRing = null;
  const round = activeRound.data as {
    id: string;
    round_number: number;
  } | null;

  if (round) {
    const { data: ring } = await supabase
      .from("round_ring_progress")
      .select("*")
      .eq("clerk_user_id", userId)
      .eq("round_id", round.id)
      .maybeSingle();

    currentRoundRing = ring
      ? { ...ring, round_number: round.round_number }
      : {
          round_id: round.id,
          round_number: round.round_number,
          read_match_report: false,
          read_statistics: false,
          read_preview: false,
          ring_completed: false,
          completed_at: null,
        };
  }

  return NextResponse.json({
    league: league.data ?? null,
    iq: iq.data ?? null,
    streak: streak.data ?? null,
    recentCards: cards.data ?? [],
    badges: badges.data ?? [],
    currentRoundRing,
  });
}
