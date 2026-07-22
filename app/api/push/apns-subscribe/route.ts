import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/ratelimit";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { parseBody, z } from "@/lib/validation";
import { jsonContract } from "@/lib/api-contract";
import { APNSSubscriptionResponseSchema } from "@/lib/api-schemas";

const SPORT = "football";

const SubscribeSchema = z.object({
  deviceToken: z.string().regex(/^[a-fA-F0-9]{64}$/),
  teamIds: z.array(z.string().min(1).max(100)).max(50).default([]),
  environment: z.enum(["sandbox", "production"]).default("production"),
});

const UnsubscribeSchema = z.object({
  deviceToken: z.string().regex(/^[a-fA-F0-9]{64}$/),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "DB ej konfigurerad" }, { status: 503 });
  }

  const blocked = await enforceRateLimit("write", req, userId);
  if (blocked) return blocked;

  const parsed = await parseBody(req, SubscribeSchema);
  if (!parsed.ok) return parsed.response;

  const { error } = await createServerClient()
    .from("apns_subscriptions")
    .upsert(
      {
        clerk_user_id: userId,
        device_token: parsed.data.deviceToken.toLowerCase(),
        team_ids: parsed.data.teamIds,
        sport: SPORT,
        environment: parsed.data.environment,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "device_token" },
    );

  if (error) {
    console.error("[push/apns-subscribe POST]", error);
    return NextResponse.json({ error: "Kunde inte registrera enheten" }, { status: 500 });
  }

  return jsonContract(APNSSubscriptionResponseSchema, { ok: true });
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "DB ej konfigurerad" }, { status: 503 });
  }

  const parsed = await parseBody(req, UnsubscribeSchema);
  if (!parsed.ok) return parsed.response;

  const { error } = await createServerClient()
    .from("apns_subscriptions")
    .delete()
    .eq("clerk_user_id", userId)
    .eq("device_token", parsed.data.deviceToken.toLowerCase())
    .eq("sport", SPORT);

  if (error) {
    console.error("[push/apns-subscribe DELETE]", error);
    return NextResponse.json({ error: "Kunde inte avregistrera enheten" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
