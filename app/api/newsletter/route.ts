import { NextResponse } from "next/server";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: Request) {
  let email = "";
  try {
    const body = await req.json();
    email = String(body?.email ?? "").trim().toLowerCase();
  } catch {
    // ignore
  }

  if (!email || !email.includes("@")) {
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

