"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Star, Search, Loader2 } from "lucide-react";
import { getStoredTeam, type StoredTeam } from "@/lib/team-hub/teamContext";

/**
 * "Mitt lag" — personlig ingång (mobil-flik).
 * Läser senast besökta lag från team-context och skickar vidare till lagets hub.
 * Saknas lag → uppmana att välja ett.
 */
export default function MittLagPage() {
  const router = useRouter();
  const [team, setTeam] = useState<StoredTeam | null | undefined>(undefined);

  useEffect(() => {
    const stored = getStoredTeam();
    setTeam(stored);
    if (stored?.slug) {
      // Defaulta direkt till lagets hub.
      router.replace(`/lag/${stored.slug}`);
    }
  }, [router]);

  if (team === undefined) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (team?.slug) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 text-muted-foreground">
        {team.logo_url && (
          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-card border border-border">
            <Image src={team.logo_url} alt="" fill className="object-contain p-1.5" sizes="56px" />
          </div>
        )}
        <p className="text-sm">Öppnar {team.name}…</p>
      </div>
    );
  }

  // Inget lag valt ännu.
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center space-y-5">
      <div className="w-14 h-14 rounded-2xl bg-pitch/10 border border-pitch/30 flex items-center justify-center mx-auto">
        <Star className="h-7 w-7 text-pitch" />
      </div>
      <div>
        <h1 className="font-heading text-3xl text-foreground">MITT LAG</h1>
        <p className="text-muted-foreground text-sm mt-2">
          Du har inte valt något lag ännu. Besök en lagsida så landar du här automatiskt nästa gång.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Link href="/allsvenskan" className="flex items-center justify-center gap-2 rounded-lg bg-pitch text-white text-sm font-medium px-4 py-2.5 hover:bg-pitch/90 transition-colors">
          <Search className="h-4 w-4" /> Bläddra bland lag
        </Link>
        <Link href="/onboarding" className="rounded-lg border border-border text-sm text-muted-foreground px-4 py-2.5 hover:text-foreground transition-colors">
          Välj favoritlag
        </Link>
      </div>
    </div>
  );
}
