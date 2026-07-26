import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { jsonContract } from "@/lib/api-contract";
import { FeedConfigResponseSchema } from "@/lib/api-schemas";
import { FeedConfigPatchSchema } from "@/lib/feed/feed-config-schema";
import { enforceRateLimit } from "@/lib/ratelimit";

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const db = getDb();
    const { data, error } = await db
      .from("user_feed_config")
      .select("*")
      .eq("clerk_user_id", userId)
      .eq("sport", "football")
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json(null);
    }
    return jsonContract(FeedConfigResponseSchema, {
      content_types: Array.isArray(data.content_types)
        ? (data.content_types as string[])
        : null,
      personalization_enabled: data.personalization_enabled === true,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const blocked = await enforceRateLimit("write", req, userId);
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = FeedConfigPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid feed preferences" }, { status: 400 });
  }

  // Sport is server-controlled so a client can never write a cross-sport config.
  const update = { ...parsed.data, clerk_user_id: userId, sport: "football" };

  try {
    const db = getDb();
    const { error } = await db
      .from("user_feed_config")
      .upsert(update, { onConflict: "clerk_user_id" });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
