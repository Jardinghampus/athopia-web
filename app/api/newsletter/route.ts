import { NextResponse } from "next/server";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase";
import { enforceRateLimit } from "@/lib/ratelimit";

export async function POST(req: Request) {
  // Anonym endpoint → rate-limit per IP (skydd mot spam-signups)
  const blocked = await enforceRateLimit("write", req);
  if (blocked) return blocked;

  let email = "";
  try {
    const body = await req.json();
    email = String(body?.email ?? "").trim().toLowerCase();
  } catch {
    // ignore
  }

  // Enkel men robust e-postvalidering
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ ok: false, error: "Ogiltig e-post" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, queued: true });
  }

  try {
    const supabase = createServiceClient();
    await supabase.from("subscribers").insert({ email });
    return NextResponse.json({ ok: true });
  } catch (e) {
    // Tabell kan saknas i dev → behandla som success för att inte blocka UI
    console.error("[newsletter]", e);
    return NextResponse.json({ ok: true, queued: true });
  }
}

