import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { parseBody, z } from "@/lib/validation";
import { enforceRateLimit } from "@/lib/ratelimit";

const WaitlistSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email("Ogiltig e-post").max(254),
  favorite_team: z.string().trim().max(80).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const blocked = await enforceRateLimit("write", req);
  if (blocked) return blocked;

  const parsed = await parseBody(req, WaitlistSchema);
  if (!parsed.ok) return parsed.response;
  const { name, email, favorite_team } = parsed.data;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true }); // dev: silently succeed
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from("waitlist")
    .insert({ name, email, favorite_team: favorite_team || null });

  if (error && error.code !== "23505") { // 23505 = unique violation (duplicate email)
    return NextResponse.json({ error: "db error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
