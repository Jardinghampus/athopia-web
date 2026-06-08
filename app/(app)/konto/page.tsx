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
import { redirect } from "next/navigation";
import { Check, CreditCard, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
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
  const { userId, sessionClaims } = await auth();

  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const meta = sessionClaims?.publicMetadata as {
    subscriptionTier?: string;
    stripeCustomerId?: string;
  };

  const isPro = meta?.subscriptionTier === "pro";
  const { checkout } = await searchParams;

  const portalUrl = meta?.stripeCustomerId
    ? await getBillingPortalUrl(meta.stripeCustomerId)
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      {/* Välkommen-banner efter checkout */}
      {checkout === "success" && (
        <div className="mb-8 p-4 rounded-xl border border-pitch/40 bg-pitch/10 text-pitch text-sm flex items-center gap-2">
          <Check className="w-4 h-4" />
          Välkommen till PRO! Din prenumeration är nu aktiv.
        </div>
      )}

      <h1 className="font-heading text-4xl text-foreground mb-8">MITT KONTO</h1>

      {/* Användarinfo */}
      <section className="rounded-xl border border-border bg-card p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-5 h-5 text-pitch" />
          <h2 className="font-medium text-foreground">Profil</h2>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>E-post</span>
            <span className="text-foreground">
              {user?.emailAddresses?.[0]?.emailAddress ?? "–"}
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>ID</span>
            <span className="text-foreground font-mono text-xs">{userId}</span>
          </div>
        </div>
      </section>

      {/* Plan-status */}
      <section className="rounded-xl border border-border bg-card p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-5 h-5 text-pitch" />
          <h2 className="font-medium text-foreground">Prenumeration</h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Nuvarande plan</p>
            <div className="flex items-center gap-2">
              {isPro ? (
                <>
                  <span className="font-heading text-xl text-pitch">PRO</span>
                  <span className="text-xs px-2 py-0.5 rounded-full pitch-gradient text-white">
                    Aktiv
                  </span>
                </>
              ) : (
                <span className="font-heading text-xl text-foreground">GRATIS</span>
              )}
            </div>
          </div>

          {isPro && portalUrl ? (
            <a
              href={portalUrl}
              className="text-sm px-4 py-2 rounded-xl border border-border hover:border-pitch/40 text-muted-foreground hover:text-foreground transition-colors"
            >
              Hantera prenumeration
            </a>
          ) : (
            <a
              href="/prenumerera"
              className="text-sm px-4 py-2 rounded-xl pitch-gradient text-white font-medium hover:opacity-90 transition-opacity"
            >
              Uppgradera till PRO
            </a>
          )}
        </div>

        {isPro && (
          <>
            <Separator className="my-4" />
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                "Fullständiga AI-transkript",
                "Djupanalys & sentiment",
                "Prioriterad support",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-pitch" />
                  {f}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
