/**
 * /vaenta — en generell waitlist. Ett lag är ett fält, inte en landningssida.
 *
 * Två renderingslägen, styrda av potten (inte av en flagga i kod):
 *   remaining > 0 → Founder 69 kr/mån för alltid + platsräknare
 *   remaining = 0 → samma formulär, PRO 89. Ingen Founder någonstans.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";
import { listWaitlistTeams } from "@/lib/waitlist/teams";
import { getFounderPot, formatSeatsLabel } from "@/lib/founder-offer";
import { FOUNDER_OFFER, PRICING, formatWeeklyKr } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Håll platsen | Athopia",
  description: "Din klubb. Varje dag. Skriv upp dig så hör vi av oss när Athopia öppnar.",
};

/** Räknaren ska vara färsk; potten cachas 30 s i lib/founder-offer. */
export const dynamic = "force-dynamic";

export default async function WaitlistPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Inloggade har redan gjort det här valet.
  const { userId } = await auth();
  if (userId) redirect("/mitt-lag");

  const [teams, pot, params] = await Promise.all([
    listWaitlistTeams(),
    getFounderPot(),
    searchParams,
  ]);

  const founderOpen = pot.remaining > 0;
  const rawRef = params["ref"];
  const referral = typeof rawRef === "string" ? rawRef : undefined;

  return (
    <main className="mx-auto w-full max-w-lg px-5 py-16 sm:py-24">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Din klubb. Varje dag.</h1>

      {founderOpen ? (
        <>
          <p className="mt-4 text-base text-muted-foreground">
            Athopia öppnar snart. De första {FOUNDER_OFFER.cap} som bekräftar sin plats får
            Founder-PRO — och behåller priset så länge de är kvar.
          </p>
          <p className="mt-6 text-sm">
            <span className="font-medium">
              {FOUNDER_OFFER.pricing.monthly / 100} kr/mån
            </span>
            <span className="text-muted-foreground">
              {" · "}
              {formatWeeklyKr(FOUNDER_OFFER.pricing.monthly)}
              {" · för alltid · "}
              {formatSeatsLabel(pot)}
            </span>
          </p>
        </>
      ) : (
        <>
          <p className="mt-4 text-base text-muted-foreground">
            Founder är full. Du kommer med på vanliga listan — PRO{" "}
            {PRICING.pro.monthly / 100} kr/mån ({formatWeeklyKr(PRICING.pro.monthly)}) när vi
            öppnar.
          </p>
        </>
      )}

      <div className="mt-8">
        <WaitlistForm teams={teams} referral={referral} />
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Har du redan ett konto?{" "}
        <Link href="/sign-in" className="underline underline-offset-2">
          Logga in
        </Link>
        .
      </p>
    </main>
  );
}
