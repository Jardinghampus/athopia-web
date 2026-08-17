/**
 * app/api/waitlist/route.ts — waitlist-join med dubbel opt-in.
 *
 * Det här är e-postregistrering, inte inloggning: vem som helst får skriva upp
 * SIN e-post. Därför finns ingen session här. Priset för det är att svaret
 * aldrig får läcka vem som redan står i kön — en dubblett svarar exakt som en
 * lyckad registrering (200 `{ ok: true }`), annars blir endpointen en
 * e-postorakel som bekräftar vilka adresser som finns.
 *
 * Kohorten sätts INTE här. Den delas ut atomärt först vid bekräftelse
 * (`claim_waitlist_cohort`), annars kan någon reservera Founder-platser genom
 * att spamma adresser hen inte äger.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase";
import { parseBody, z } from "@/lib/validation";
import { enforceRateLimit } from "@/lib/ratelimit";
import { logFunnelEvent } from "@/lib/funnel";
import { isValidTeamSlug } from "@/lib/waitlist/teams";
import { createConfirmToken, confirmExpiryFrom } from "@/lib/waitlist/token";
import { sendWaitlistConfirmEmail } from "@/lib/waitlist/email";

/** Samma policytext som formuläret visar. Bumpas när samtyckestexten ändras. */
const POLICY_VERSION = "2026-08-17";

/** Ett nytt bekräftelsemejl till samma pending-rad tidigast var 15:e minut. */
const RESEND_COOLDOWN_MS = 15 * 60 * 1000;

const UTM_RE = /^[a-z0-9_-]{2,64}$/i;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const WaitlistSchema = z.object({
  email: z.string().trim().toLowerCase().email("Ogiltig e-post").max(254),
  favorite_team: z.string().trim().min(1).max(80),
  consent: z.literal(true),
  /** Botfälla: syns inte för människor, så ifylld = bot. */
  honeypot: z.string().max(200).optional().nullable(),
  ref: z.string().max(64).optional().nullable(),
  utm_source: z.string().max(64).optional().nullable(),
  utm_medium: z.string().max(64).optional().nullable(),
  utm_campaign: z.string().max(64).optional().nullable(),
});

function clean(value: string | null | undefined): string | null {
  if (!value) return null;
  return UTM_RE.test(value) ? value : null;
}

export async function POST(req: NextRequest) {
  const blocked = await enforceRateLimit("write", req);
  if (blocked) return blocked;

  const parsed = await parseBody(req, WaitlistSchema);
  if (!parsed.ok) return parsed.response;
  const { email, favorite_team, honeypot, ref } = parsed.data;

  // Bot: svara som om allt gick bra, skriv ingenting.
  if (honeypot && honeypot.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  if (!(await isValidTeamSlug(favorite_team))) {
    return NextResponse.json({ error: "Välj ett lag i listan." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Mejlet gick inte iväg. Försök igen." }, { status: 503 });
  }

  const db = createServiceClient();
  const { token, hash } = createConfirmToken();
  const now = new Date();

  const utmCampaign =
    clean(parsed.data.utm_campaign) ?? clean(req.cookies.get("athopia_utm")?.value ?? null);

  // Referral: bara ett id som faktiskt finns. En ogiltig ref tystas hellre än
  // att avvisa registreringen.
  let referredBy: string | null = null;
  if (ref && UUID_RE.test(ref)) {
    const { data: referrer } = await db.from("waitlist").select("id").eq("id", ref).maybeSingle();
    if (referrer) referredBy = ref;
  }

  const { error } = await db.from("waitlist").insert({
    name: "",
    email,
    favorite_team,
    status: "pending_confirm",
    consent_at: now.toISOString(),
    policy_version: POLICY_VERSION,
    confirm_token_hash: hash,
    confirm_expires_at: confirmExpiryFrom(now).toISOString(),
    utm_source: clean(parsed.data.utm_source),
    utm_medium: clean(parsed.data.utm_medium),
    utm_campaign: utmCampaign,
    referred_by: referredBy,
  });

  if (error) {
    // 23505 = dubblett. Aldrig läcka att adressen redan finns.
    if (error.code === "23505") {
      const resent = await resendIfPending(db, email, now);
      if (resent === "failed") {
        return NextResponse.json({ error: "Mejlet gick inte iväg. Försök igen." }, { status: 503 });
      }
      return NextResponse.json({ ok: true });
    }
    console.error("[waitlist] insert misslyckades:", error.message);
    return NextResponse.json({ error: "Kunde inte spara. Försök igen." }, { status: 500 });
  }

  const sent = await sendWaitlistConfirmEmail(email, token);
  if (!sent.sent) {
    console.warn(`[waitlist] bekräftelsemejl skickades inte (${sent.reason}) — raden väntar.`);
    return NextResponse.json({ error: "Mejlet gick inte iväg. Försök igen." }, { status: 503 });
  }

  await db
    .from("waitlist")
    .update({ confirm_sent_at: now.toISOString() })
    .eq("email", email)
    .eq("status", "pending_confirm");

  await logFunnelEvent("waitlist_submit", null, { team: favorite_team, referred: Boolean(referredBy) });

  return NextResponse.json({ ok: true });
}

/**
 * Dubblett som fortfarande väntar på bekräftelse får ett nytt mejl med en NY
 * token — men högst var 15:e minut, så endpointen inte blir en mejlbomb mot en
 * adress angriparen inte äger. Redan bekräftade rader får ingenting.
 */
async function resendIfPending(
  db: ReturnType<typeof createServiceClient>,
  email: string,
  now: Date,
): Promise<"noop" | "sent" | "failed"> {
  try {
    const { data } = await db
      .from("waitlist")
      .select("id, status, confirm_sent_at")
      .eq("email", email)
      .maybeSingle();

    const row = data as { id: string; status: string; confirm_sent_at: string | null } | null;
    if (!row || row.status !== "pending_confirm") return "noop";

    const last = row.confirm_sent_at ? Date.parse(row.confirm_sent_at) : 0;
    if (Number.isFinite(last) && last > 0 && now.getTime() - last < RESEND_COOLDOWN_MS) {
      return "noop";
    }

    const { token, hash } = createConfirmToken();
    const { error } = await db
      .from("waitlist")
      .update({
        confirm_token_hash: hash,
        confirm_expires_at: confirmExpiryFrom(now).toISOString(),
      })
      .eq("id", row.id)
      .eq("status", "pending_confirm");
    if (error) return "failed";

    const sent = await sendWaitlistConfirmEmail(email, token);
    if (!sent.sent) return "failed";

    await db.from("waitlist").update({ confirm_sent_at: now.toISOString() }).eq("id", row.id);
    return "sent";
  } catch {
    return "failed";
  }
}
