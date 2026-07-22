import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { enforceRateLimit } from "@/lib/ratelimit";

/**
 * Utgående klick-spårning → source_clicks. Anropas via navigator.sendBeacon
 * från OutboundLink när en användare klickar sig vidare till en källa.
 * Mäter hur mycket trafik vi skickar till varje site/podd (attribution-tillgång).
 * Publikt (ingen auth) — loggar bara källnamn + url, ingen persondata.
 */
export async function POST(req: NextRequest) {
  const blocked = await enforceRateLimit("write", req);
  if (blocked) return blocked;

  if (!isSupabaseConfigured()) return NextResponse.json({ ok: false }, { status: 503 });
  try {
    const body = await req.json().catch(() => null);
    const source = typeof body?.source === "string" ? body.source.slice(0, 200) : null;
    if (!source) return NextResponse.json({ ok: false }, { status: 400 });

    const url = typeof body?.url === "string" ? body.url.slice(0, 1000) : null;
    const kind = body?.kind === "podcast" ? "podcast" : "article";
    const sport = body?.sport === "golf" ? "golf" : "football";

    await createServerClient().from("source_clicks").insert({ source_name: source, url, kind, sport });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
