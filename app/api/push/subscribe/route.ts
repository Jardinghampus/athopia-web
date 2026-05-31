import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { subscription, teamIds = [] } = (await req.json()) as {
      subscription: PushSubscriptionJSON;
      teamIds: string[];
    };

    if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json({ error: "Ogiltig subscription" }, { status: 400 });
    }

    const { userId } = await auth();

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    if (!url || !key) {
      return NextResponse.json({ error: "Supabase ej konfigurerat" }, { status: 503 });
    }

    const db = createClient(url, key);

    // Upsert subscription — endpoint är UNIQUE
    const { error } = await db.from("push_subscriptions").upsert(
      {
        user_id: userId ?? "anonymous",
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        team_ids: teamIds,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Okänt fel";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
