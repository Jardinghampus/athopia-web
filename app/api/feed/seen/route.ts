import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function POST() {
  const { userId } = await auth();
  const today = new Date().toISOString().split("T")[0];

  // Anonyma användare spåras inte (rate-limiting hanteras via plan-gate)
  if (!userId) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createServiceClient();
  await supabase.rpc("increment_feed_usage", {
    p_clerk_user_id: userId,
    p_date: today,
  });

  return NextResponse.json({ ok: true });
}
