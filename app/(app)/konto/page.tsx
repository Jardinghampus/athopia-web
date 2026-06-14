/**
 * app/konto/page.tsx — Kontosida (PRO-gate i middleware)
 * ─────────────────────────────────────────────────────────────────────────────
 * - Visar plan-status (PRO / Free)
 * - Stripe Customer Portal-länk för att hantera/avbryta prenumeration
 * - Clerk UserProfile-länk
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { AlertTriangle, Check, CreditCard, User } from "lucide-react";
import { ListGroup } from "@/components/ui/ListGroup";
import { ListRow } from "@/components/ui/ListRow";
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
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/konto`,
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
      {/* Välkommen-banner efter checkout */}
      {checkout === "success" && (
        <div className="mb-8 p-4 rounded-xl border border-pitch/40 bg-pitch/10 text-pitch text-sm flex items-center gap-2">
          <Check className="w-4 h-4" />
          Välkommen! Din prenumeration är nu aktiv.
        </div>
      )}

      <h1 className="font-heading text-4xl text-foreground mb-8">MITT KONTO</h1>

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
              : "Uppgradera för AI-sammanfattningar, avancerade filter och push-notiser."
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
              subtitle={isPaid ? undefined : "89 kr/mån · 25 % rabatt vid årsbetalning"}
              trailing={<Check className="w-4 h-4 text-pitch" />}
            />
          )}
        </ListGroup>
      </div>
    </div>
  );
}
