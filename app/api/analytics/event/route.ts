import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase";
import { enforceRateLimit } from "@/lib/ratelimit";
import { FUNNEL_EVENTS, PRODUCT_EVENTS } from "@/lib/funnel";
import { visitorIdFrom } from "@/lib/visitor";

const ALLOWED = new Set([
  "feed_open",
  "match_page_view",
  "nyheter_open",
  "daily_view",
  "daily_play_blocked_pro",
  "daily_checkout_click",
  ...FUNNEL_EVENTS,
  ...PRODUCT_EVENTS,
]);

const bodySchema = z.object({
  event: z.string().min(1).max(64),
  props: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

export async function POST(req: Request) {
  const blocked = await enforceRateLimit("read", req);
  if (blocked) return blocked;

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!ALLOWED.has(parsed.event)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { userId } = await auth();
  const payload = {
    ...(parsed.props ?? {}),
    clerk_user_id: userId ?? "anon",
    // Additivt: clerk_user_id behålls oförändrat så befintliga queries inte bryts.
    // visitor_id är det fält som faktiskt går att räkna unika besökare på.
    visitor_id: visitorIdFrom(req, userId),
  };

  try {
    const db = createServiceClient();
    await db.from("agent_logs").insert({
      agent_name: "web-analytics",
      action: parsed.event,
      level: "info",
      message: parsed.event,
      kind: "product_event",
      payload,
    });
  } catch {
    // Analytics får aldrig blockera UX
  }

  return NextResponse.json({ ok: true });
}
