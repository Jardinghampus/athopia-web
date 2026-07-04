/**
 * app/mitt-lag/page.tsx — tunn server-redirect till kanonisk lag-hub
 * ─────────────────────────────────────────────────────────────────────────────
 * "Mitt lag" är inte längre en egen dashboard. Har användaren ett favoritlag
 * (Clerk favoriteTeam via getPrimaryTeam) skickas de till /lag/{slug} och
 * behåller aktiv ?tab=. Saknas favorit visas en enkel picker.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { getPrimaryTeam } from "@/lib/team/getPrimaryTeam";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mitt lag",
  description: "Din personliga lag-dashboard — statistik, trupp, matcher, nyheter och forum samlat.",
};

export default async function MittLagPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const [primaryTeam, sp] = await Promise.all([getPrimaryTeam(), searchParams]);

  if (primaryTeam?.slug) {
    const tab = typeof sp.tab === "string" ? sp.tab : undefined;
    const qs = tab ? `?tab=${encodeURIComponent(tab)}` : "";
    redirect(`/lag/${primaryTeam.slug}${qs}`);
  }

  return <EmptyPicker />;
}

function EmptyPicker() {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center space-y-5">
      <div className="w-14 h-14 rounded-2xl bg-pitch/10 border border-pitch/30 flex items-center justify-center mx-auto">
        <Star className="h-7 w-7 text-pitch" />
      </div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Mitt lag</h1>
        <p className="text-muted-foreground text-sm mt-2">Du har inte valt något lag ännu. Besök en lagsida så landar du där automatiskt.</p>
      </div>
      <div className="flex flex-col gap-2">
        <Link href="/allsvenskan" className="rounded-lg bg-pitch text-white text-sm font-medium px-4 py-2.5 hover:bg-pitch/90 transition-colors">Bläddra bland lag</Link>
        <Link href="/onboarding" className="rounded-lg border border-border text-sm text-muted-foreground px-4 py-2.5 hover:text-foreground transition-colors">Välj favoritlag</Link>
      </div>
    </div>
  );
}
