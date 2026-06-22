"use client";

import { useRouter } from "next/navigation";

export function AllsvenskanMobileSelect({
  teams,
}: {
  teams: Array<{ slug: string | null; name: string }>;
}) {
  const router = useRouter();

  return (
    <label className="block py-2 min-[640px]:hidden">
      <span className="sr-only">Välj lag</span>
      <select
        defaultValue=""
        onChange={(event) => {
          const slug = event.target.value;
          if (slug) router.push(`/lag/${slug}`);
        }}
        className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">Välj lag...</option>
        {teams.map((team) => (
          <option key={team.slug ?? team.name} value={team.slug ?? ""}>
            {team.name}
          </option>
        ))}
      </select>
    </label>
  );
}
