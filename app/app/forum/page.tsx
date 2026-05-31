import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, Users } from "lucide-react";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Forum — Allsvenskan",
  description: "Diskutera Allsvenskan med supportrar från alla 16 lag.",
};

export const revalidate = 60;

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/app/forum/${team.slug}`}
              className="group flex items-center gap-4 bg-card hover:bg-card/80 border border-border rounded-xl p-4 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-pitch/10 border border-pitch/20 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-pitch">
                  {team.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground group-hover:text-pitch transition-colors truncate">
                  {team.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MessageSquare className="w-3 h-3" />
                  <span>{team.threadCount} trådar</span>
                  {team.lastActivity && (
                    <>
                      <span>·</span>
                      <span>Senast {timeAgo(team.lastActivity)}</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
