import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

// Minimal VAPID-avsändning utan web-push-paket (undviker Node.js-kompatibilitetsproblem på Vercel)
async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
): Promise<boolean> {
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY ?? "";

  if (!vapidPublic || !vapidPrivate) return false;

  try {
    // Använd web-push via dynamic import för edge-kompatibilitet
    const webpush = await import("web-push");
    webpush.setVapidDetails(
      "mailto:jardinghampus@gmail.com",
      vapidPublic,
      vapidPrivate,
    );
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      payload,
    );
    return true;
  } catch {
    return false;
  }
}

// Intern route — anropas av athopia-os via service-token
export async function POST(req: NextRequest) {
  const serviceToken = req.headers.get("x-service-token");
  if (serviceToken !== process.env.INTERNAL_SERVICE_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase ej konfigurerat" }, { status: 503 });
  }

  const { title, body, url, teamIds, userIds } = (await req.json()) as {
    title: string;
    body: string;
    url?: string;
    teamIds?: string[];
    userIds?: string[];
  };

  if (!title || !body) {
    return NextResponse.json({ error: "title och body krävs" }, { status: 400 });
  }

  const db = createServerClient();

  let q = db
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("is_active", true);

  if (userIds && userIds.length > 0) {
    q = q.in("user_id", userIds);
  } else if (teamIds && teamIds.length > 0) {
    q = q.overlaps("team_ids", teamIds);
  }

  const { data: subs } = await q.limit(500);
  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const payload = JSON.stringify({ title, body, url: url ?? "/" });
  const results = await Promise.allSettled(
    subs.map((s) => sendPushNotification(s as { endpoint: string; p256dh: string; auth: string }, payload)),
  );

  const sent = results.filter((r) => r.status === "fulfilled" && r.value).length;
  const failed = results.length - sent;

  return NextResponse.json({ sent, failed });
}
