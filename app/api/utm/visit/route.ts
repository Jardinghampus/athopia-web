/**
 * POST /api/utm/visit
 * Polsia 2.0 S2 — growth loop capture. Fire-and-forget from a tiny client
 * component (see components/growth/UtmVisitTracker.tsx), once per pageview,
 * only when ?utm_campaign is present. No auth — anonymous visit signal.
 */
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { enforceRateLimit } from "@/lib/ratelimit";
import { cookies } from "next/headers";

const UTM_CAMPAIGN_RE = /^[a-z0-9_-]{3,64}$/;

export async function POST(req: Request) {
  const blocked = await enforceRateLimit("write", req);
  if (blocked) return blocked;

  const jar = await cookies();
  if (jar.get("athopia_analytics_consent")?.value !== "granted") {
    return new NextResponse(null, { status: 204 });
  }

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

  const existingSessionId =
    jar.get("athopia_attribution_session")?.value ?? null;
  const sessionId = existingSessionId ?? crypto.randomUUID();

  try {
    const supabase = createServiceClient();
    const visit = {
      campaign,
      path,
      event: "visit",
      session_id: sessionId,
    };
    let { error } = await supabase.from("utm_events").insert(visit);
    // Backward-compatible during the deployment window before the OS migration
    // reaches Supabase. Visits must not disappear because one additive column
    // has not reached PostgREST's schema cache yet.
    if (error?.message.includes("'session_id' column")) {
      ({ error } = await supabase.from("utm_events").insert({
        campaign,
        path,
        event: "visit",
      }));
    }
    if (error) {
      console.error("[utm-visit] insert fel:", error.message);
      return NextResponse.json({ error: "DB-fel" }, { status: 500 });
    }
  } catch (err) {
    console.error("[utm-visit] kastade:", err);
    return NextResponse.json({ error: "DB-fel" }, { status: 500 });
  }

  const response = NextResponse.json({ received: true });
  response.cookies.set("athopia_utm", campaign, {
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  if (!existingSessionId) {
    response.cookies.set("athopia_attribution_session", sessionId, {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
  }
  return response;
}
