"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { teamAbbr } from "@/lib/team-abbr";
import { useFavoriteTeam } from "@/hooks/useFavoriteTeam";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/TactileSheet";

/**
 * Sidor som inte kan visa något meningsfullt utan ett valt lag.
 *
 * `/statistik`, `/spelare` och `/match` låg tidigare med i listan, men de är
 * ligaövergripande ytor som fungerar utmärkt utan lagval — modalen la sig över
 * dem och avbröt en pågående bläddring. På mobil gick det inte att se en enda
 * matchrad, och inte heller att nå bottennavigationen, förrän man valt lag
 * eller hoppat över.
 *
 * `/mitt-lag` är medvetet inte med heller: den har redan en inbyggd gästvy med
 * eget lagval, så modalen ovanpå den var både redundant och blockerande.
 * Kvar är ytorna som inte kan visa någonting alls utan ett lag.
 */
const TEAM_REQUIRED_PREFIXES = ["/feed", "/profil"];

function useRequiresTeam() {
  const pathname = usePathname();
  return TEAM_REQUIRED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
import { createClient } from "@supabase/supabase-js";

interface Team {
  id: string;
  name: string;
  slug: string | null;
  metadata: Record<string, unknown> | null;
}

function getTeamColor(metadata: Record<string, unknown> | null): string {
  return (metadata?.["primary_color"] as string | undefined) ?? "var(--color-pitch)";
}

function getTeamLogo(metadata: Record<string, unknown> | null): string | null {
  const url = metadata?.["logo_url"];
  return typeof url === "string" && url.startsWith("http") ? url : null;
}

interface TeamSelectionModalProps {
  forceVisible?: boolean;
}

export function TeamSelectionModal({ forceVisible = false }: TeamSelectionModalProps) {
  const { needsOnboarding, setFavoriteTeam, markOnboardingDone } = useFavoriteTeam();
  const requiresTeam = useRequiresTeam();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [visible, setVisible] = useState(forceVisible);

  // Fördröj visning 800ms för att inte störa initial render (ignoreras om forceVisible)
  // Visa bara på sidor där lagval faktiskt används
  useEffect(() => {
    if (forceVisible || !needsOnboarding || !requiresTeam) return;
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, [needsOnboarding, forceVisible, requiresTeam]);

  // Öppnas från GlassNav via custom event
  useEffect(() => {
    const handler = () => setVisible(true);
    window.addEventListener("athopia:open-team-select", handler);
    return () => window.removeEventListener("athopia:open-team-select", handler);
  }, []);

  // Hämta lag från Supabase
  useEffect(() => {
    if (!visible) return;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    if (!url || !key) return;

    const db = createClient(url, key);
    void db
      .from("entities")
      .select("id, name, slug, metadata")
      .eq("type", "team")
      .eq("metadata->>league", "Allsvenskan")
      .order("name")
      .then(({ data }) => {
        if (data) setTeams(data as Team[]);
      });
  }, [visible]);

  const handleSkip = () => {
    markOnboardingDone();
    setVisible(false);
  };

  const handleSave = async () => {
    if (!selected) {
      markOnboardingDone();
      setVisible(false);
      return;
    }
    setSaving(true);
    const team = teams.find((t) => t.slug === selected || t.id === selected);
    await setFavoriteTeam(selected, team?.id);
    setSaving(false);
    setVisible(false);
  };

  return (
    <Sheet
      open={visible}
      onOpenChange={(open) => {
        if (!open) handleSkip();
        else setVisible(true);
      }}
    >
      <SheetContent
        className="z-[10001]"
        overlayClassName="z-[10000]"
        aria-labelledby="team-selection-title"
      >
        <div className="pr-12 pb-4">
          <SheetTitle
            id="team-selection-title"
            className="text-2xl font-bold text-foreground text-balance"
            style={{ fontFamily: "var(--font-display)" }}
          >
            VÄLJ DITT LAG
          </SheetTitle>
          <SheetDescription className="text-muted-foreground text-sm mt-1">
            Få personaliserade nyheter, push-notiser och statistik för ditt lag.
          </SheetDescription>
        </div>

        {teams.length === 0 ? (
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="h-[72px] rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {teams.map((team) => {
              const color = getTeamColor(team.metadata);
              const logo = getTeamLogo(team.metadata);
              const isSelected = selected === team.slug;
              return (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => setSelected(isSelected ? null : (team.slug ?? team.id))}
                  className={cn(
                    "relative flex min-h-[72px] min-w-11 flex-col items-center justify-center gap-1 rounded-lg border-2 transition-all text-xs font-medium text-center px-1",
                    isSelected
                      ? "border-[var(--team-color)] bg-[var(--team-color)]/10 text-foreground scale-105"
                      : "border-border bg-muted/30 hover:border-[var(--team-color)] hover:bg-[var(--team-color)]/5 text-muted-foreground",
                  )}
                  style={{ "--team-color": color } as React.CSSProperties}
                  title={team.name}
                >
                  {logo ? (
                    <span className="relative h-7 w-7 shrink-0">
                      <Image
                        src={logo}
                        alt=""
                        fill
                        sizes="28px"
                        className="object-contain"
                      />
                    </span>
                  ) : (
                    <span
                      className="text-base font-bold leading-none"
                      style={{ color: isSelected ? color : undefined }}
                    >
                      {teamAbbr(team.slug, team.name)}
                    </span>
                  )}
                  <span className="text-xs mt-0.5 leading-tight line-clamp-2">
                    {team.name}
                  </span>
                  {isSelected && (
                    <span className="absolute top-1 right-1 text-xs" style={{ color }}>
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex gap-3 justify-end border-t border-border pt-4">
          <button
            type="button"
            onClick={handleSkip}
            className="inline-flex min-h-11 min-w-11 items-center px-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Hoppa över
          </button>
          {selected ? (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              data-cta="primary"
              className="inline-flex min-h-11 items-center px-5 rounded-lg text-sm font-medium bg-pitch text-white hover:bg-pitch/90 transition-all"
            >
              {saving ? "Sparar..." : "Välj detta lag"}
            </button>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
