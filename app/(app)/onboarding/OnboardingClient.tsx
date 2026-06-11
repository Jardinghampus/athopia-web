"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useFavoriteTeam } from "@/hooks/useFavoriteTeam";
import { createClient } from "@supabase/supabase-js";
import { OnboardingLeaguePicker } from "@/components/gamification/OnboardingLeaguePicker";

interface Team {
  id: string;
  name: string;
  slug: string | null;
  metadata: Record<string, unknown> | null;
}

function getColor(metadata: Record<string, unknown> | null): string {
  return (metadata?.["primary_color"] as string | undefined) ?? "#1D9E75";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter((w) => w.length > 1)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 3);
}

export function OnboardingClient() {
  const router = useRouter();
  const { setFavoriteTeam, markOnboardingDone } = useFavoriteTeam();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showLeaguePicker, setShowLeaguePicker] = useState(false);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    if (!url || !key) return;
    const db = createClient(url, key);
    // Filtrerar till lag som deltar i Allsvenskan 2026 via sportsmonks_id
    const ALLSVENSKAN_2026_IDS = new Set(
      [354, 411, 432, 443, 532, 720, 1226, 1777, 1870, 2353, 2535, 2678, 2753, 2825, 3285, 8671].map(String)
    );
    void db
      .from("entities")
      .select("id, name, slug, metadata")
      .eq("type", "team")
      .order("name")
      .then(({ data }) => {
        if (data) {
          const filtered = (data as Team[]).filter((t) => {
            const smId = String((t.metadata?.["sportsmonks_id"] as number | undefined) ?? "");
            return ALLSVENSKAN_2026_IDS.has(smId);
          });
          setTeams(filtered.length > 0 ? filtered : (data as Team[]));
        }
      });
  }, []);

  const handleContinue = async () => {
    setSaving(true);
    if (selected) {
      await setFavoriteTeam(selected);
      // Hitta team-id för user_feed_config
      const team = teams.find((t) => (t.slug ?? t.id) === selected);
      if (team) {
        await fetch("/api/feed/config", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followed_team_ids: [team.id] }),
        }).catch(() => {});
      }
    } else {
      markOnboardingDone();
    }
    setSaving(false);
    setShowLeaguePicker(true);
  };

  if (showLeaguePicker) {
    return (
      <OnboardingLeaguePicker onComplete={() => router.push("/feed")} />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-5xl text-foreground mb-2">VÄLJ DITT LAG</h1>
          <p className="text-muted-foreground text-sm">
            Få personaliserade nyheter, push-notiser och statistik för ditt lag.
          </p>
        </div>

        {teams.length === 0 ? (
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-card animate-pulse border border-border" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {teams.map((team) => {
              const color = getColor(team.metadata);
              const slug = team.slug ?? team.id;
              const isSelected = selected === slug;

              return (
                <button
                  key={team.id}
                  onClick={() => setSelected(isSelected ? null : slug)}
                  className="relative flex flex-col items-center justify-center h-20 rounded-xl border-2 transition-all text-xs font-medium text-center px-1 hover:scale-105"
                  style={{
                    borderColor: isSelected ? color : "var(--border)",
                    backgroundColor: isSelected ? color + "18" : "var(--card)",
                  }}
                >
                  <span
                    className="text-xl font-bold leading-none mb-1"
                    style={{ color: isSelected ? color : "var(--muted-foreground)" }}
                  >
                    {getInitials(team.name)}
                  </span>
                  <span className="text-[10px] leading-tight line-clamp-2 text-muted-foreground">
                    {team.name}
                  </span>
                  {isSelected && (
                    <span
                      className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: color }}
                    >
                      <Check className="w-2.5 h-2.5 text-white" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={handleContinue}
            disabled={saving}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              backgroundColor: selected ? "#1D9E75" : "var(--muted)",
              color: selected ? "white" : "var(--muted-foreground)",
            }}
          >
            {saving ? "Sparar..." : selected ? "Fortsätt" : "Välj ett lag ovan"}
          </button>
          <button
            onClick={() => { markOnboardingDone(); router.push("/app"); }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
          >
            Hoppa över
          </button>
        </div>
      </div>
    </div>
  );
}
