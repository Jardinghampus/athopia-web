"use client";

import { useTransition } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { TeamSwitcher, type SwitcherTeam } from "@/components/team-hub/TeamSwitcher";
import { FollowButton } from "@/components/dashboard/follow-button";
import { LargeTitleHeader } from "@/components/ui/LargeTitleHeader";
import { StatNumber } from "@/components/ui/StatNumber";
import { Card as TactileCard } from "@/components/ui/TactileCard";
import type { TeamSeasonRow } from "@/lib/team-hub/queries";

// Global Header är sticky h-14 (56px) — compact-raden fastnar under den.
// Global header (56px) + TeamNav (44px) — kompaktraden fastnar under bada.
const HEADER_OFFSET = 100;

/**
 * TeamHubHeader — klientlagret ovanpå den serverrenderade lag-hubben.
 * Serverdata in via props (ingen client-fetch). Ansvarar för lagväxling
 * (navigerar till /lag/{slug}, behåller aktiv sektion), följ-knapp, large-title
 * och nyckeltal. Data hämtas i page.tsx (getTeamHub) och skickas hit.
 */
export function TeamHubHeader({
  teams,
  followedSlugs,
  currentSlug,
  team,
  position,
  form,
  stats,
  entityId,
  initialFollowing,
}: {
  teams: SwitcherTeam[];
  followedSlugs: string[];
  currentSlug: string;
  team: { name: string; logo_url: string | null };
  position: number | null;
  form: ("W" | "D" | "L")[];
  stats: TeamSeasonRow | null;
  entityId: string;
  initialFollowing: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const goToTeam = (slug: string) => {
    if (slug === currentSlug) return;
    // Behåll sektionen vid lagbyte: står du på AIK:s statistik ska Djurgårdens
    // statistik vara nästa vy. Tidigare bars detta av `?tab=`, men sektionerna
    // är riktiga routes nu — så vi flyttar över path-suffixet i stället.
    const suffix = pathname.startsWith(`/lag/${currentSlug}`)
      ? pathname.slice(`/lag/${currentSlug}`.length)
      : "";
    router.push(`/lag/${slug}${suffix}`);
  };

  const refresh = () => startTransition(() => router.refresh());

  return (
    <>
      <LargeTitleHeader
        title={team.name}
        stickyOffset={HEADER_OFFSET}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              aria-label="Uppdatera lagdata"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors touch-manipulation active:bg-muted"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Uppdatera</span>
            </button>
            <FollowButton entityId={entityId} initialFollowing={initialFollowing} />
          </div>
        }
        titleContent={
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-card border border-border shrink-0">
              {team.logo_url && (
                <Image src={team.logo_url} alt="" fill className="object-contain p-1.5" sizes="56px" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <TeamSwitcher
                  teams={teams}
                  followedSlugs={followedSlugs}
                  currentSlug={currentSlug}
                  onSelect={goToTeam}
                />
              </div>
              <div className="flex items-center gap-3 mt-1">
                {position && <span className="team-ink text-xs font-bold">#{position} i Allsvenskan</span>}
                <FormDots form={form} />
              </div>
            </div>
          </div>
        }
      />

      {stats && (
        <div className="px-4 sm:px-6 pt-1 space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <KeyStat label="Poäng" value={stats.points} accent />
            <KeyStat label="Spelade" value={stats.played} />
            <KeyStat label="Gjorda" value={stats.goals_for} />
            <KeyStat label="Insläppta" value={stats.goals_against} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <KeyStat label="Mål­skillnad" value={stats.goal_diff} signed />
            <KeyStat label="Vinster" value={stats.wins} />
          </div>
        </div>
      )}
    </>
  );
}

function FormDots({ form }: { form: ("W" | "D" | "L")[] }) {
  const map = { W: "bg-success text-success-foreground", D: "bg-muted text-foreground", L: "bg-red-500/20 text-destructive-ink" };
  if (form.length === 0) return null;
  return <div className="flex gap-1">{form.map((r, i) => <span key={i} className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${map[r]}`}>{r}</span>)}</div>;
}

function KeyStat({ label, value, accent, signed }: { label: string; value: number | null; accent?: boolean; signed?: boolean }) {
  return (
    <TactileCard className="rounded-xl p-2.5 text-center">
      {value == null ? (
        <p className={`text-xl font-bold ${accent ? "text-pitch-ink" : "text-foreground"}`}>–</p>
      ) : (
        <StatNumber
          value={value}
          format={signed ? { signDisplay: "exceptZero" as const } : undefined}
          className={`text-xl ${accent ? "text-pitch-ink" : "text-foreground"}`}
        />
      )}
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </TactileCard>
  );
}
