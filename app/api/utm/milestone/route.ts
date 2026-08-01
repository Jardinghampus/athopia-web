/**
 * POST /api/utm/milestone
 * Authenticated milestone writer for team_selected / activated.
 * trial_start is written from the Stripe webhook (no browser cookie).
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { enforceRateLimit } from "@/lib/ratelimit";
import { recordUtmMilestone, type UtmMilestone } from "@/lib/utm-attribution";

const ALLOWED: ReadonlySet<UtmMilestone> = new Set(["team_selected", "activated"]);

export async function POST(req: Request) {
  const blocked = await enforceRateLimit("write", req);
  if (blocked) return blocked;

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  let body: { event?: unknown; path?: unknown; sourceTeaserId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig body" }, { status: 400 });
  }

  const event = typeof body.event === "string" ? (body.event as UtmMilestone) : null;
  if (!event || !ALLOWED.has(event)) {
    return NextResponse.json({ error: "Ogiltigt event" }, { status: 400 });
  }

  const path = typeof body.path === "string" ? body.path.slice(0, 500) : null;
  const sourceTeaserId =
    typeof body.sourceTeaserId === "string" ? body.sourceTeaserId : null;

  const recorded = await recordUtmMilestone({
    event,
    clerkUserId: userId,
    path,
    sourceTeaserId,
  });

  return NextResponse.json({ recorded });
}
