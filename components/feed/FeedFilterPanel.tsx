"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/TactileSheet";
import type { FeedFilterOptions } from "@/lib/feed/get-allsvenskan-teams";

type FilterKey = "lag" | "typ" | "kalla";

const KEYS: FilterKey[] = ["lag", "typ", "kalla"];

function useFilterState() {
  const searchParams = useSearchParams();
  const read = (key: FilterKey) => searchParams.get(key)?.split(",").filter(Boolean) ?? [];
  return { lag: read("lag"), typ: read("typ"), kalla: read("kalla") };
}

function useApplyFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return function toggle(key: FilterKey, value: string) {
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
  scroll,
}: {
  header: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  /** Källistan är lång — låt den scrolla i stället för att skjuta ned resten. */
  scroll?: boolean;
}) {
  if (options.length === 0) return null;
  return (
    <fieldset>
      <legend className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {header}
      </legend>
      <div
        className={`divide-y divide-border overflow-hidden rounded-2xl bg-card ${
          scroll ? "max-h-72 overflow-y-auto" : ""
        }`}
      >
        {options.map((opt) => {
          const id = `${header}-${opt.value}`;
          const checked = selected.includes(opt.value);
          return (
            <label
              key={opt.value}
              htmlFor={id}
              className="flex min-h-11 cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-foreground"
            >
              <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(opt.value)}
                className="h-[18px] w-[18px] shrink-0 rounded border-border accent-pitch"
              />
              <span className="truncate">{opt.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function FilterPanelBody({ teams, sources, types }: FeedFilterOptions) {
  const selected = useFilterState();
  const toggle = useApplyFilter();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCount = KEYS.reduce((n, k) => n + selected[k].length, 0);

  function clearFilters() {
    const next = new URLSearchParams(searchParams.toString());
    for (const k of KEYS) next.delete(k);
    next.delete("page");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="space-y-6">
      <FilterCheckboxGroup
        header="Nyhetstyp"
        options={types}
        selected={selected.typ}
        onToggle={(v) => toggle("typ", v)}
      />
      <FilterCheckboxGroup
        header="Klubbar"
        options={teams.map((t) => ({ value: t.name, label: t.name }))}
        selected={selected.lag}
        onToggle={(v) => toggle("lag", v)}
        scroll
      />
      <FilterCheckboxGroup
        header="Källor"
        options={sources.map((s) => ({ value: s, label: s }))}
        selected={selected.kalla}
        onToggle={(v) => toggle("kalla", v)}
        scroll
      />
      {activeCount > 0 && (
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
 * Klubb-, typ- och källfilter för /nyheter — desktop sticky vänsterfält.
 * Dold under lg (använd `FeedFilterButton` för mobilvyn).
 */
export function FeedFilterPanel(props: FeedFilterOptions) {
  return (
    <aside className="hidden lg:block lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
      <FilterPanelBody {...props} />
    </aside>
  );
}

/**
 * Mobil "Filter"-knapp (med räknare) som öppnar samma panel i TactileSheet.
 * Placeras bredvid FeedSortBar. Dold på lg+ (desktop använder FeedFilterPanel).
 */
export function FeedFilterButton(props: FeedFilterOptions) {
  const selected = useFilterState();
  const activeCount = KEYS.reduce((n, k) => n + selected[k].length, 0);
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
