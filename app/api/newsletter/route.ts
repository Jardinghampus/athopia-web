import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/ratelimit";
import { parseBody } from "@/lib/validation";
import { NewsletterSignupSchema } from "@/lib/newsletter/schema";
import {
  getNewsletterTeamBySlug,
  resolveNewsletterIdentity,
  subscribeToNewsletter,
} from "@/lib/newsletter/service";

export async function POST(req: Request) {
  const blocked = await enforceRateLimit("write", req);
  if (blocked) return blocked;

  const parsed = await parseBody(req, NewsletterSignupSchema);
  if (!parsed.ok) return parsed.response;
  // Bot-fällan får samma generiska svar som en riktig pending-request.
  if (parsed.data.honeypot) {
    return NextResponse.json(
      { ok: true, state: "pending", message: "Kontrollera din inkorg." },
      { status: 202 },
    );
  }

  const identity = await resolveNewsletterIdentity(parsed.data.email);
  if (!identity) {
    return NextResponse.json(
      { message: "E-post krävs när du inte är inloggad.", field: "email" },
      { status: 400 },
    );
  }

  const team = await getNewsletterTeamBySlug(parsed.data.teamSlug);
  if (!team) {
    return NextResponse.json(
      { message: "Laget hittades inte.", field: "teamSlug" },
      { status: 400 },
    );
  }

  try {
    const result = await subscribeToNewsletter({
      identity,
      team,
      cadence: parsed.data.cadence,
      request: req,
    });
    // Anonyma svar avslöjar aldrig om adressen redan finns. Inloggade får
    // däremot ett ärligt duplicate-state för sin sessionsägda identitet.
    const state = identity.clerkUserId ? result.state : "pending";
    return NextResponse.json(
      {
        ok: true,
        state,
        message: "Kontrollera din inkorg.",
      },
      { status: 202 },
    );
  } catch (error) {
    console.error(
      "[newsletter] signup failed",
      error instanceof Error ? error.message : "unknown",
    );
    return NextResponse.json(
      { ok: false, message: "Kunde inte spara din Lagbrief just nu." },
      { status: 500 },
    );
  }
}

