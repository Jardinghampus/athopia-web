import Link from "next/link";
import { getEntities } from "@/lib/supabase";

export async function AllsvenskanNav() {
  const teams = await getEntities("team");
  if (teams.length === 0) return null;

  return (
    <div className="border-b border-border/40 bg-background/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none py-2">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/lag/${team.slug}`}
              className="shrink-0 text-xs px-3 py-1 rounded-full border border-border/60 text-muted-foreground
                hover:border-pitch hover:text-pitch hover:bg-pitch/5
                transition-[border-color,color,background-color] duration-150"
            >
              {team.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
