/**
 * app/konto/page.tsx — Kontosida (PRO-gate i middleware)
 * ─────────────────────────────────────────────────────────────────────────────
 * - Visar plan-status (PRO / Free)
 * - Stripe Customer Portal-länk för att hantera/avbryta prenumeration
 * - Clerk UserProfile-länk
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { AlertTriangle, Check, CreditCard, User } from "lucide-react";
import { ListGroup } from "@/components/ui/ListGroup";
import { ListRow } from "@/components/ui/ListRow";
import { FOUNDER_OFFER, TRIAL_DAYS, proPriceLabel, listMonthlyKr } from "@/lib/pricing";
import Stripe from "stripe";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Mitt konto",
  description: "Hantera din Athopia-prenumeration och dina kontoinställningar.",
};

// ─── Stripe Portal URL ─────────────────────────────────────────────────────────
async function getBillingPortalUrl(customerId: string): Promise<string | null> {
  // Lazy-init för att undvika build-time env-krav
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-04-22.dahlia",
  });
  const base = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://athopia.se").replace(/\/$/, "");
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${base}/konto`,
      locale: "sv",
    });
    return session.url;
  } catch {
    return null;
  }
}

export default async function KontoPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { userId } = await auth();
  const user = await currentUser();
  // Källa: publicMetadata.plan (sätts av Stripe-webhooken). INTE subscriptionTier.
  const meta = (user?.publicMetadata ?? {}) as {
    plan?: string;
    stripeCustomerId?: string;
  };
  const subMeta = (user?.privateMetadata as Record<string, unknown> | undefined)
    ?.subscription as {
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
  } | null | undefined;

  const plan = meta.plan ?? "free";
  const isPaid = plan === "pro" || plan === "elite";
  const planLabel = plan === "elite" ? "ELITE" : plan === "pro" ? "PRO" : "GRATIS";
  const { checkout } = await searchParams;

  const periodEndFormatted = subMeta?.currentPeriodEnd
    ? new Date(subMeta.currentPeriodEnd).toLocaleDateString("sv-SE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const portalUrl = meta.stripeCustomerId
    ? await getBillingPortalUrl(meta.stripeCustomerId)
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      {/* Välkommen-banner efter checkout. Webhook-lagg: Stripe kan landa
          användaren här innan checkout.session.completed hunnit sätta plan. */}
      {checkout === "success" && isPaid && (
        <div className="mb-8 p-5 rounded-xl border border-pitch/40 bg-pitch/10">
          <p className="flex items-center gap-2 text-pitch text-sm font-medium">
            <Check className="w-4 h-4" />
            Välkommen! Din {planLabel}-prenumeration är aktiv.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Upplåst: obegränsat flöde, AI-sammanfattningar, smart ranking,
            avancerade filter och push-notiser{plan === "elite" ? " — plus clustering och daglig AI-brief" : ""}.
          </p>
          <Link
            href="/feed"
            className="mt-3 inline-block rounded-lg pitch-gradient px-4 py-2 text-sm font-medium text-white"
          >
            Gå till din feed
          </Link>
        </div>
      )}
      {checkout === "success" && !isPaid && (
        <div className="mb-8 p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-sm flex items-center gap-2 text-amber-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Betalningen är genomförd — kontot uppgraderas inom någon minut. Ladda om sidan om det dröjer.
        </div>
      )}

      {/* Profilhuvud — centrerad avatar + namn + planbadge, Grok/iOS-settings-mönster */}
      <Link
        href="/profil"
        className="mb-8 flex flex-col items-center gap-3 rounded-2xl px-4 py-8 text-center transition-colors hover:bg-card/40 active:bg-card/60"
      >
        <span className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-card text-2xl font-semibold text-muted-foreground ring-1 ring-border">
          {user?.imageUrl ? (
            <Image src={user.imageUrl} alt="" fill className="object-cover" sizes="80px" />
          ) : (
            (user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0] ?? "?").toUpperCase()
          )}
        </span>
        <span>
          <span className="block text-xl font-bold text-foreground">
            {user?.fullName ?? user?.firstName ?? "Din profil"}
          </span>
          <span className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            {isPaid ? (
              <span className="rounded-full pitch-gradient px-2 py-0.5 text-xs font-semibold text-white">
                {planLabel}
              </span>
            ) : (
              "Gratis"
            )}
          </span>
        </span>
      </Link>

      <div className="space-y-6">
        {/* Användarinfo */}
        <ListGroup header="Profil">
          <ListRow
            href="/profil"
            leading={<User />}
            title="Min profil"
            subtitle="Redigera nickname, bio, profilbild och lag"
          />
          <ListRow
            leading={<User />}
            title="E-post"
            trailing={<span className="text-foreground">{user?.emailAddresses?.[0]?.emailAddress ?? "–"}</span>}
          />
          <ListRow
            title="Användar-ID"
            trailing={<span className="font-mono text-xs text-foreground">{userId}</span>}
          />
        </ListGroup>

        {/* Plan-status */}
        <ListGroup
          header="Prenumeration"
          footer={
            isPaid
              ? "Ingår: fullständiga AI-transkript, djupanalys & sentiment, prioriterad support."
              : "Uppgradera för daglig AI-brief, poddintelligens och transfer-signaler."
          }
        >
          <ListRow
            leading={<CreditCard />}
            title="Nuvarande plan"
            trailing={
              isPaid ? (
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-pitch">{planLabel}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full pitch-gradient text-white">Aktiv</span>
                </span>
              ) : (
                <span className="font-semibold text-foreground">GRATIS</span>
              )
            }
          />
          {subMeta?.cancelAtPeriodEnd && periodEndFormatted && (
            <ListRow
              leading={<AlertTriangle className="text-amber-400" />}
              title="Prenumerationen avslutas"
              subtitle={`Du har tillgång till ${periodEndFormatted}. Förnya via "Hantera prenumeration".`}
            />
          )}
          {isPaid && !subMeta?.cancelAtPeriodEnd && periodEndFormatted && (
            <ListRow
              title="Förnyas"
              trailing={<span className="text-foreground text-sm">{periodEndFormatted}</span>}
            />
          )}
          {isPaid && portalUrl ? (
            <ListRow
              href={portalUrl}
              title="Hantera prenumeration"
              subtitle="Byt plan, uppdatera kort eller avsluta — via Stripe"
            />
          ) : (
            <ListRow
              href="/prenumerera"
              title={isPaid ? "Byt plan" : "Uppgradera till PRO"}
              subtitle={
                isPaid
                  ? undefined
                  : FOUNDER_OFFER.active
                    ? `Founder ${proPriceLabel()} för alltid (ordinarie ${listMonthlyKr("pro")} kr) · ${TRIAL_DAYS} dagar gratis`
                    : `${proPriceLabel()} · ${TRIAL_DAYS} dagar gratis · 25 % rabatt årsvis`
              }
              trailing={<Check className="w-4 h-4 text-pitch" />}
            />
          )}
        </ListGroup>
      </div>
    </div>
  );
}
