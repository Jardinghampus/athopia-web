import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { canAccess } from "@/lib/access-rules";
import { getUserPlan } from "@/lib/user-plan";

const AUDIO_BUCKET = "generated-audio";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")?.trim();
  const wantsJson = req.nextUrl.searchParams.get("format") === "json";
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const plan = await getUserPlan();
  if (!canAccess("briefAudio", plan)) {
    return NextResponse.json(
      {
        error: "PRO krävs för Athopia Daily.",
        code: "plan_required",
        feature: "briefAudio",
        requiredPlan: "pro",
        upgradePath: "/prenumerera",
      },
      { status: 403 },
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const db = createServerClient();
  const { data, error } = await db
    .from("generated_episodes" as never)
    .select("audio_storage_path, audio_url, status")
    .eq("slug", slug)
    .eq("sport", "football")
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Episode not found" }, { status: 404 });
  }

  const row = data as { audio_storage_path?: string | null; audio_url?: string | null };
  const storagePath = row.audio_storage_path?.trim();

  if (storagePath) {
    const { data: signed, error: signError } = await db.storage
      .from(AUDIO_BUCKET)
      .createSignedUrl(storagePath, 3600);

    if (signError || !signed?.signedUrl) {
      return NextResponse.json({ error: "Unable to sign audio URL" }, { status: 500 });
    }

    return wantsJson
      ? NextResponse.json({ url: signed.signedUrl, expiresIn: 3600 })
      : NextResponse.redirect(signed.signedUrl);
  }

  // Legacy rows uploaded before private bucket (fallback until re-generated).
  if (row.audio_url) {
    return wantsJson
      ? NextResponse.json({ url: row.audio_url, expiresIn: 3600 })
      : NextResponse.redirect(row.audio_url);
  }

  return NextResponse.json({ error: "No audio for episode" }, { status: 404 });
}
