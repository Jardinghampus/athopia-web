/**
 * POST /api/utm/visit
 * Polsia 2.0 S2 — growth loop capture. Fire-and-forget from a tiny client
 * component (see components/growth/UtmVisitTracker.tsx), once per pageview,
 * only when ?utm_campaign is present. No auth — anonymous visit signal.
 */
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

const UTM_CAMPAIGN_RE = /^[a-z0-9_-]{3,64}$/;

export async function POST(req: Request) {
  let body: { campaign?: unknown; path?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig body" }, { status: 400 });
  }

  const campaign = typeof body.campaign === "string" ? body.campaign : "";
  const path = typeof body.path === "string" ? body.path.slice(0, 500) : null;

  if (!UTM_CAMPAIGN_RE.test(campaign)) {
    return NextResponse.json({ error: "Ogiltig campaign" }, { status: 400 });
  }

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("utm_events").insert({
      campaign,
      path,
      event: "visit",
    });
    if (error) {
      console.error("[utm-visit] insert fel:", error.message);
      return NextResponse.json({ error: "DB-fel" }, { status: 500 });
    }
  } catch (err) {
    console.error("[utm-visit] kastade:", err);
    return NextResponse.json({ error: "DB-fel" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
