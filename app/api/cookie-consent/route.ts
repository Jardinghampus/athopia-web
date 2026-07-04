import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import { createHash } from "crypto";
import { enforceRateLimit } from "@/lib/ratelimit";
import { parseBody, z } from "@/lib/validation";

const ConsentSchema = z.object({
  analytics: z.boolean(),
  marketing: z.boolean(),
  version: z.string().max(20).optional().nullable(),
  savedAt: z.string().datetime().optional().nullable(),
});

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const blocked = await enforceRateLimit("write", req);
  if (blocked) return blocked;

  const parsed = await parseBody(req, ConsentSchema);
  if (!parsed.ok) return parsed.response;
  const { analytics, marketing, version, savedAt } = parsed.data;

  const { userId } = await auth();

  // Anonymisera IP om inte inloggad
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 16);
  const userAgent = req.headers.get("user-agent") ?? "";

  const { error } = await supabase()
    .from("cookie_consents")
    .insert({
      clerk_user_id: userId ?? null,
      anon_id: userId ? null : `anon::${ipHash}`,
      analytics,
      marketing,
      necessary: true,
      version,
      consented_at: savedAt,
      user_agent: userAgent,
    });

  if (error) {
    console.error("[cookie-consent]", error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
