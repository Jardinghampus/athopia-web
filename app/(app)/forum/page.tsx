import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { ListGroup } from "@/components/ui/ListGroup";
import { ListRow } from "@/components/ui/ListRow";

export const metadata: Metadata = {
  title: "Forum — Allsvenskan",
  description: "Diskutera Allsvenskan med supportrar från alla 16 lag.",
};

export const dynamic = 'force-dynamic';

interface TeamActivity {
  id: string;
  name: string;
  slug: string;
  threadCount: number;
  lastActivity: string | null;
}

async function getTeamActivity(): Promise<TeamActivity[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createServerClient();
    const { data: teams } = await supabase
      .from("entities")
      .select("id, name, slug")
      .eq("type", "team")
      .order("name", { ascending: true });

    if (!teams || teams.length === 0) return [];

    const { data: threads } = await supabase
      .from("forum_threads")
      .select("team_id, created_at")
      .order("created_at", { ascending: false });

    const teamMap = new Map<string, { count: number; last: string | null }>();
    for (const t of (threads ?? []) as any[]) {
      const existing = teamMap.get(t.team_id) ?? { count: 0, last: null };
      teamMap.set(t.team_id, {
        count: existing.count + 1,
        last: existing.last ?? t.created_at,
      });
    }

    return (teams as any[]).map((team) => {
      const activity = teamMap.get(team.id);
      return {
        id: team.id,
        name: team.name,
        slug: team.slug ?? team.id,
        threadCount: activity?.count ?? 0,
        lastActivity: activity?.last ?? null,
      };
    });
  } catch {
    return [];
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just nu";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default async function ForumIndexPage() {
  const teams = await getTeamActivity();

  return (
    <div className="w-full px-6 sm:px-8 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-4xl text-foreground">FORUM</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Välj ett lag för att se och delta i diskussioner
        </p>
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Inga lag hittades.</p>
        </div>
      ) : (
        <ListGroup className="max-w-2xl" footer="Trådantal och senaste aktivitet uppdateras löpande.">
          {teams.map((team) => (
            <ListRow
              key={team.id}
              href={`/forum/${team.slug}`}
              leading={
                <span className="flex w-9 h-9 items-center justify-center rounded-full bg-pitch/10 border border-pitch/20 text-xs font-bold text-pitch">
                  {team.name.slice(0, 2).toUpperCase()}
                </span>
              }
              title={team.name}
              subtitle={`${team.threadCount} trådar${team.lastActivity ? ` · Senast ${timeAgo(team.lastActivity)}` : ""}`}
            />
          ))}
        </ListGroup>
      )}
    </div>
  );
}
