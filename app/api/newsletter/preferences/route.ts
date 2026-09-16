import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/ratelimit";
import { parseBody } from "@/lib/validation";
import { NewsletterPreferencesPatchSchema } from "@/lib/newsletter/schema";
import {
  getOwnNewsletterPreferences,
  NewsletterNotFoundError,
  NewsletterTeamNotFoundError,
  patchOwnNewsletterPreferences,
  unsubscribeOwnNewsletter,
} from "@/lib/newsletter/service";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const current = await getOwnNewsletterPreferences(userId);
    if (!current) return NextResponse.json({ subscribed: false });
    return NextResponse.json({
      subscribed: true,
      status: current.subscriber.status,
      plan: current.subscriber.plan_snapshot,
      cadence: current.preference.cadence,
      enabled: current.preference.enabled,
      followProfileTeam: current.preference.follow_profile_team,
      team: current.team,
      syncStatus: current.subscriber.sync_status,
    });
  } catch (error) {
    console.error(
      "[newsletter preferences] read failed",
      error instanceof Error ? error.message : "unknown",
    );
    return NextResponse.json({ error: "Kunde inte läsa Lagbrief." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const blocked = await enforceRateLimit("write", req, userId);
  if (blocked) return blocked;
  const parsed = await parseBody(req, NewsletterPreferencesPatchSchema);
  if (!parsed.ok) return parsed.response;

  try {
    await patchOwnNewsletterPreferences(userId, parsed.data);
    return NextResponse.json({ ok: true, state: "pending" });
  } catch (error) {
    if (error instanceof NewsletterNotFoundError) {
      return NextResponse.json(
        { error: "Ingen Lagbrief-prenumeration finns." },
        { status: 404 },
      );
    }
    if (error instanceof NewsletterTeamNotFoundError) {
      return NextResponse.json(
        { error: "Laget hittades inte.", field: "teamSlug" },
        { status: 400 },
      );
    }
    console.error(
      "[newsletter preferences] patch failed",
      error instanceof Error ? error.message : "unknown",
    );
    return NextResponse.json({ error: "Kunde inte spara Lagbrief." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const blocked = await enforceRateLimit("write", req, userId);
  if (blocked) return blocked;
  try {
    await unsubscribeOwnNewsletter(userId);
    return NextResponse.json({ ok: true, state: "pending" });
  } catch (error) {
    console.error(
      "[newsletter preferences] delete failed",
      error instanceof Error ? error.message : "unknown",
    );
    return NextResponse.json(
      { error: "Kunde inte avsluta Lagbrief." },
      { status: 500 },
    );
  }
}
