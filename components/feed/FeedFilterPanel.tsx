"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/TactileSheet";
import type { FeedTeamOption } from "@/lib/feed/get-allsvenskan-teams";

interface FeedFilterPanelProps {
  teams: FeedTeamOption[];
  /** Källnamn härledda från aktuell sidas artiklar — inte en global distinct-lista. */
  sources: string[];
}

function useFilterState() {
  const searchParams = useSearchParams();
  const selectedTeams = searchParams.get("lag")?.split(",").filter(Boolean) ?? [];
  const selectedSources = searchParams.get("kalla")?.split(",").filter(Boolean) ?? [];
  return { selectedTeams, selectedSources };
}

function useApplyFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return function toggle(key: "lag" | "kalla", value: string) {
    const next = new URLSearchParams(searchParams.toString());
    const current = next.get(key)?.split(",").filter(Boolean) ?? [];
    const nextValues = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    if (nextValues.length) next.set(key, nextValues.join(","));
    else next.delete(key);
    next.delete("page");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };
}

function FilterCheckboxGroup({
  header,
  options,
  selected,
  onToggle,
}: {
  header: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <fieldset>
      <legend className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {header}
      </legend>
      <div className="divide-y divide-border overflow-hidden rounded-2xl bg-card">
        {options.map((opt) => {
          const id = `${header}-${opt}`;
          const checked = selected.includes(opt);
          return (
            <label
              key={opt}
              htmlFor={id}
              className="flex min-h-11 cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-foreground"
            >
              <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(opt)}
                className="h-[18px] w-[18px] shrink-0 rounded border-border accent-pitch"
              />
              <span className="truncate">{opt}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function FilterPanelBody({ teams, sources }: FeedFilterPanelProps) {
  const { selectedTeams, selectedSources } = useFilterState();
  const toggle = useApplyFilter();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasActive = selectedTeams.length > 0 || selectedSources.length > 0;

  function clearFilters() {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("lag");
    next.delete("kalla");
    next.delete("page");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="space-y-6">
      <FilterCheckboxGroup
        header="Klubbar"
        options={teams.map((t) => t.name)}
        selected={selectedTeams}
        onToggle={(v) => toggle("lag", v)}
      />
      <FilterCheckboxGroup
        header="Källor"
        options={sources}
        selected={selectedSources}
        onToggle={(v) => toggle("kalla", v)}
      />
      {hasActive && (
        <button
          type="button"
          onClick={clearFilters}
          className="px-1 text-xs text-pitch-ink hover:underline"
        >
          Rensa filter
        </button>
      )}
    </div>
  );
}

/**
 * Klubb- och källfilter för /nyheter — desktop sticky vänsterfält.
 * Dold under lg (använd `FeedFilterButton` för mobilvyn).
 */
export function FeedFilterPanel(props: FeedFilterPanelProps) {
  return (
    <aside className="hidden lg:block lg:sticky lg:top-6 lg:self-start">
      <FilterPanelBody {...props} />
    </aside>
  );
}

/**
 * Mobil "Filter"-knapp (med räknare) som öppnar samma panel i TactileSheet.
 * Placeras bredvid FeedSortBar. Dold på lg+ (desktop använder FeedFilterPanel).
 */
export function FeedFilterButton(props: FeedFilterPanelProps) {
  const { selectedTeams, selectedSources } = useFilterState();
  const activeCount = selectedTeams.length + selectedSources.length;
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground touch-manipulation"
          >
            Filter
            {activeCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-pitch px-1 text-[10px] font-semibold text-white">
                {activeCount}
              </span>
            )}
          </button>
        </SheetTrigger>
        <SheetContent>
          <SheetTitle className="px-1 pb-2">Filter</SheetTitle>
          <div className="pb-6">
            <FilterPanelBody {...props} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
