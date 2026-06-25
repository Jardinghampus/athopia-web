import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { name, email, favorite_team } = await req.json();

  if (!email || !name) {
    return NextResponse.json({ error: "name and email required" }, { status: 400 });
  }

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
