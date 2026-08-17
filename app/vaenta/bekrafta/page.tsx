/**
 * /vaenta/bekrafta — dubbel opt-in-bekräftelse.
 *
 * GET tittar bara. POST (server action) claimar kohorten. Outlook Safe Links
 * ska inte kunna ta en Founder-plats genom att prefetcha länken.
 */

import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { FOUNDER_OFFER, PRICING, formatWeeklyKr } from "@/lib/pricing";
import { parseConfirmOutcome, peekWaitlistToken, type ConfirmOutcome } from "@/lib/waitlist/confirm";
import { ConfirmForm } from "@/components/waitlist/ConfirmForm";

export const metadata: Metadata = {
  title: "Bekräfta din plats | Athopia",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function OutcomeCopy({ kind }: { kind: ConfirmOutcome }) {
  if (kind === "founder") {
    return (
      <>
        <h1 className="text-3xl font-semibold tracking-tight">Du är med.</h1>
        <p className="mt-4 text-muted-foreground">
          Founder-PRO {FOUNDER_OFFER.pricing.monthly / 100} kr/mån ({formatWeeklyKr(FOUNDER_OFFER.pricing.monthly)}) för alltid, och Founder-märket i produkten, när vi öppnar. Vi hör av oss.
        </p>
      </>
    );
  }

  if (kind === "regular") {
    return (
      <>
        <h1 className="text-3xl font-semibold tracking-tight">Du är med.</h1>
        <p className="mt-4 text-muted-foreground">
          Du är med på vanliga listan. PRO {PRICING.pro.monthly / 100} kr/mån ({formatWeeklyKr(PRICING.pro.monthly)}) när vi öppnar. Founder-potten är full.
        </p>
      </>
    );
  }

  if (kind === "already") {
    return (
      <>
        <h1 className="text-3xl font-semibold tracking-tight">Redan bekräftad.</h1>
        <p className="mt-4 text-muted-foreground">Din plats står kvar. Vi hör av oss.</p>
      </>
    );
  }

  if (kind === "expired") {
    return (
      <>
        <h1 className="text-3xl font-semibold tracking-tight">Länken har gått ut.</h1>
        <p className="mt-4 text-muted-foreground">
          Bekräftelselänken gäller i 48 timmar. Skriv upp dig igen med samma adress så skickar
          vi en ny.
        </p>
        <Link
          href="/vaenta"
          className="mt-6 inline-block rounded-md bg-pitch px-4 py-2.5 font-medium text-white"
        >
          Skicka igen
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Länken fungerar inte.</h1>
      <p className="mt-4 text-muted-foreground">
        Den kan redan vara använd. Har du ett konto kan du logga in — annars skriv upp dig
        igen.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/vaenta" className="rounded-md bg-pitch px-4 py-2.5 font-medium text-white">
          Till kön
        </Link>
        <Link href="/sign-in" className="rounded-md border border-border px-4 py-2.5 font-medium">
          Logga in
        </Link>
      </div>
    </>
  );
}

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const done = parseConfirmOutcome(params["done"]);
  const token = typeof params["token"] === "string" ? params["token"] : "";

  let body: ReactNode;
  if (done) {
    body = <OutcomeCopy kind={done} />;
  } else if (token) {
    const peek = await peekWaitlistToken(token);
    body = peek === "pending" ? (
      <>
        <h1 className="text-3xl font-semibold tracking-tight">En sista bekräftelse.</h1>
        <p className="mt-4 text-muted-foreground">
          Klicka så håller vi din plats. Länken gäller i 48 timmar.
        </p>
        <ConfirmForm token={token} />
      </>
    ) : (
      <OutcomeCopy kind={peek} />
    );
  } else {
    body = <OutcomeCopy kind="invalid" />;
  }

  return <main className="mx-auto w-full max-w-lg px-5 py-16 sm:py-24">{body}</main>;
}
