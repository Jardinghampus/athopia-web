import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { enforceRateLimit } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const { userId } = await auth();
  const today = new Date().toISOString().split("T")[0];

  // Anonyma användare spåras inte (rate-limiting hanteras via plan-gate)
  if (!userId) {
    return NextResponse.json({ ok: true });
  }

  // Skydd mot konstgjord uppräkning av feed-usage
  const blocked = await enforceRateLimit("read", req, userId);
  if (blocked) return blocked;

  const supabase = createServiceClient();
  await supabase.rpc("increment_feed_usage", {
    p_clerk_user_id: userId,
    p_date: today,
  });

  return NextResponse.json({ ok: true });
}
