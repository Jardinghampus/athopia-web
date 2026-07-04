"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useFavoriteTeam } from "@/hooks/useFavoriteTeam";

// Sidor där lagval faktiskt används — visa inte modalen på t.ex. /priser eller /forum
const TEAM_REQUIRED_PREFIXES = ["/feed", "/statistik", "/spelare", "/match", "/profil"];

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

function getTeamInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 3)
    .toUpperCase();
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
      .order("name")
      .then(({ data }) => {
        if (data) setTeams(data as Team[]);
      });
  }, [visible]);

  if (!visible) return null;

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

  const handleSkip = () => {
    markOnboardingDone();
    setVisible(false);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-bebas)" }}>
            VÄLJ DITT LAG
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Få personaliserade nyheter, push-notiser och statistik för ditt lag.
          </p>
        </div>

        {/* Team grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {teams.length === 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {teams.map((team) => {
                const color = getTeamColor(team.metadata);
                const isSelected = selected === team.slug;
                return (
                  <button
                    key={team.id}
                    onClick={() => setSelected(isSelected ? null : (team.slug ?? team.id))}
                    className={cn(
                      "relative flex flex-col items-center justify-center h-16 rounded-lg border-2 transition-all text-xs font-medium text-center px-1",
                      isSelected
                        ? "border-[var(--team-color)] bg-[var(--team-color)]/10 text-foreground scale-105"
                        : "border-border bg-muted/30 hover:border-[var(--team-color)] hover:bg-[var(--team-color)]/5 text-muted-foreground",
                    )}
                    style={{ "--team-color": color } as React.CSSProperties}
                    title={team.name}
                  >
                    <span
                      className="text-lg font-bold leading-none"
                      style={{ color: isSelected ? color : undefined }}
                    >
                      {getTeamInitials(team.name)}
                    </span>
                    <span className="text-[10px] mt-0.5 leading-tight line-clamp-2">
                      {team.name}
                    </span>
                    {isSelected && (
                      <span
                        className="absolute top-1 right-1 text-[10px]"
                        style={{ color }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex gap-3 justify-end">
          <button
            onClick={handleSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
          >
            Hoppa över
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-medium transition-all",
              selected
                ? "bg-pitch text-white hover:bg-pitch/90"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            {saving ? "Sparar..." : selected ? "Välj detta lag" : "Välj ett lag ovan"}
          </button>
        </div>
      </div>
    </div>
  );
}
