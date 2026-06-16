/**
 * WEB-31: Podcast filterview
 * Filter: lag (entity_ids), show (source_name), datum, sök (pgvector)
 * Entity chips visar vilka lag som nämns per avsnitt.
 */

import type { Metadata } from "next";
import { Mic, Search } from "lucide-react";
import { PodcastCard } from "@/components/ui/PodcastCard";
import { EntityChip } from "@/components/ui/EntityChip";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import type { Podcast } from "@/lib/types";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Podcast | Athopia",
  description: "Lyssna på Sveriges bästa fotbollspodcasts — filtrera per lag, show och datum.",
};

interface PodcastWithTeams extends Podcast {
  mentioned_teams?: string[];
  show_name?: string | null;
}

interface SearchParams {
  q?: string;
  lag?: string;
  show?: string;
  visa?: "alla" | "transkriberade" | "ej-transkriberade";
}

// ── Data-hämtning ─────────────────────────────────────────────────────────────

async function getEpisodes(params: SearchParams): Promise<PodcastWithTeams[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServerClient();
    let q = supabase
      .from("podcasts")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(36);

    if (params.visa === "transkriberade") q = q.eq("is_transcribed", true);
    if (params.visa === "ej-transkriberade") q = q.eq("is_transcribed", false);
    if (params.show) q = q.ilike("source_name", `%${params.show}%`);
    if (params.lag) {
      // Filter på mentioned_teams array
      q = q.contains("mentioned_teams", [params.lag]);
    }

    const { data } = await q;
    return (data as PodcastWithTeams[]) ?? [];
  } catch {
    return [];
  }
}

async function getShows(): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("rss_sources")
      .select("name")
      .eq("category", "podcast")
      .eq("active", true)
      .order("name");
    return (data ?? []).map((s: { name: string }) => s.name);
  } catch {
    return [];
  }
}

async function getAllsvenskanTeams(): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("entities")
      .select("name")
      .eq("type", "team")
      .order("name");
    return (data ?? []).map((e: { name: string }) => e.name);
  } catch {
    return [];
  }
}

// ── Komponenter ───────────────────────────────────────────────────────────────

function FilterSection({
  teams,
  shows,
  selected,
}: {
  teams: string[];
  shows: string[];
  selected: SearchParams;
}) {
  const visaOptions = [
    { value: "alla", label: "Alla avsnitt" },
    { value: "transkriberade", label: "Transkriberade" },
    { value: "ej-transkriberade", label: "Ej transkriberade" },
  ];

  return (
    <aside className="w-64 shrink-0 space-y-6 sticky top-20 self-start">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Visa</p>
        <div className="space-y-1">
          {visaOptions.map((opt) => (
            <Link
              key={opt.value}
              href={`/podcast?${new URLSearchParams({
                ...Object.fromEntries(Object.entries(selected).filter(([k, v]) => k !== "visa" && v)),
                ...(opt.value !== "alla" ? { visa: opt.value } : {}),
              }).toString()}`}
              className={`block px-3 py-1.5 rounded-lg text-sm transition-colors ${
                (selected.visa ?? "alla") === opt.value
                  ? "bg-pitch/10 text-pitch font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      {teams.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Lag</p>
          <div className="flex flex-wrap gap-1.5">
            {teams.slice(0, 16).map((team) => {
              const isActive = selected.lag === team;
              const params = new URLSearchParams(
                Object.fromEntries(
                  Object.entries(selected).filter(([k, v]) => v && k !== "lag")
                )
              );
              if (!isActive) params.set("lag", team);
              return (
                <Link
                  key={team}
                  href={`/podcast?${params.toString()}`}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                    isActive
                      ? "bg-pitch text-white border-pitch"
                      : "border-border text-muted-foreground hover:border-pitch/50 hover:text-foreground"
                  }`}
                >
                  {team.split(" ").pop()}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {shows.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Show</p>
          <div className="space-y-1">
            {shows.map((show) => {
              const isActive = selected.show === show;
              const params = new URLSearchParams(
                Object.fromEntries(
                  Object.entries(selected).filter(([k, v]) => v && k !== "show")
                )
              );
              if (!isActive) params.set("show", show);
              return (
                <Link
                  key={show}
                  href={`/podcast?${params.toString()}`}
                  className={`block px-3 py-1.5 rounded-lg text-sm truncate transition-colors ${
                    isActive
                      ? "bg-pitch/10 text-pitch font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {show}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {(selected.lag || selected.show || selected.visa) && (
        <Link
          href="/podcast"
          className="block text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ↺ Återställ filter
        </Link>
      )}
    </aside>
  );
}

function PodcastGrid({ episodes }: { episodes: PodcastWithTeams[] }) {
  if (episodes.length === 0) {
    return (
      <div className="text-center py-20">
        <Mic className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Inga avsnitt matchade filtret.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {episodes.map((podcast) => (
        <div key={podcast.id} className="flex flex-col gap-2">
          <PodcastCard podcast={podcast} />
          {podcast.mentioned_teams && podcast.mentioned_teams.length > 0 && (
            <div className="flex flex-wrap gap-1 px-1">
              {podcast.mentioned_teams.slice(0, 4).map((team) => (
                <span
                  key={team}
                  className="text-xs px-2 py-0.5 rounded-full bg-pitch/10 text-pitch border border-pitch/20"
                >
                  {team}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PodcastListPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const [episodes, shows, teams] = await Promise.all([
    getEpisodes(sp),
    getShows(),
    getAllsvenskanTeams(),
  ]);

  return (
    <div className="w-full px-6 sm:px-8 py-10">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl pitch-gradient flex items-center justify-center">
          <Mic className="w-5 h-5 text-white" />
        </div>
        <h1 className="font-bold text-5xl text-foreground">PODCAST</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        {episodes.length} avsnitt — AI-transkript, entiteter och lag-filter.
      </p>

      {/* Sökfält */}
      <form method="GET" className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={sp.q}
            placeholder="Sök avsnitt, lag, spelare…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-pitch transition-colors"
            aria-label="Sök podcast-avsnitt"
          />
          {Object.entries(sp).filter(([k, v]) => k !== "q" && v).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
        </div>
      </form>

      <div className="flex gap-8 items-start">
        <FilterSection teams={teams} shows={shows} selected={sp} />
        <div className="flex-1 min-w-0">
          <PodcastGrid episodes={episodes} />
        </div>
      </div>
    </div>
  );
}
