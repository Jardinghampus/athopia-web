import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Ej autentiserad" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON" }, { status: 400 });
  }

  // Tillåtna fält att uppdatera (aldrig plan-beroende premium-fält client-side)
  const allowed = [
    "sport",
    "followed_team_ids",
    "followed_leagues",
    "content_types",
  ] as const;

  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Inga giltiga fält" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("user_feed_config")
    .upsert(
      { clerk_user_id: userId, ...patch },
      { onConflict: "clerk_user_id" }
    );

  if (error) {
    console.error("[feed/config] DB-fel:", error);
    return NextResponse.json({ error: "DB-fel" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
