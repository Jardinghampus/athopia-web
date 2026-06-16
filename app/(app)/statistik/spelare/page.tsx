import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { getScoutPool } from "@/lib/team-hub/scout";
import { PlayerCompareClient } from "./PlayerCompareClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Spelarjämförelse | Athopia",
  description: "Jämför spelare sida vid sida med radarprofil normaliserad mot ligan.",
};

export default async function PlayerComparePage() {
  const pool = await getScoutPool();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-bold text-5xl text-foreground flex items-center gap-3">
            <Users className="h-9 w-9 text-pitch" /> SPELARJÄMFÖRELSE
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Radarprofil normaliserad mot ligan · Allsvenskan 2026</p>
        </div>
        <Link href="/statistik" className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-pitch/50 transition-colors">
          ← Statistik
        </Link>
      </div>

      {pool.length === 0 ? (
        <p className="text-sm text-muted-foreground py-16 text-center">Spelardata synkas in från Sportmonks — kom tillbaka snart.</p>
      ) : (
        <PlayerCompareClient pool={pool} />
      )}
    </div>
  );
}
