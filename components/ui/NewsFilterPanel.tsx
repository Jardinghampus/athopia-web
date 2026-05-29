"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { clsx } from "clsx";

// ── Statisk Allsvenskan-lag lista ─────────────────────────────────────────────
const ALLSVENSKAN_TEAMS = [
  { slug: "AIK", label: "AIK" },
  { slug: "BK Häcken", label: "BK Häcken" },
  { slug: "Djurgårdens IF", label: "Djurgårdens IF" },
  { slug: "GAIS", label: "GAIS" },
  { slug: "Göteborg", label: "IFK Göteborg" },
  { slug: "Hammarby", label: "Hammarby IF" },
  { slug: "Helsingborg", label: "Helsingborgs IF" },
  { slug: "IF Elfsborg", label: "IF Elfsborg" },
  { slug: "IFK Norrköping", label: "IFK Norrköping" },
  { slug: "Kalmar FF", label: "Kalmar FF" },
  { slug: "Malmö FF", label: "Malmö FF" },
  { slug: "Mjällby AIF", label: "Mjällby AIF" },
  { slug: "Sirius", label: "IK Sirius" },
  { slug: "Värnamo", label: "IFK Värnamo" },
  { slug: "Örebro SK", label: "Örebro SK" },
  { slug: "Östersunds FK", label: "Östersunds FK" },
];

const EVENT_TYPES = [
  { value: "transfer", label: "Transfer" },
  { value: "injury", label: "Skada" },
  { value: "match_result", label: "Match" },
  { value: "general", label: "Kontroversi" },
  { value: "analysis", label: "Analys" },
  { value: "press_conference", label: "Presskonferens" },
];

const LS_KEY = "athopia_nyheter_filter";

export interface FilterState {
  visa: "all" | "ai" | "source";
  teams: string[];
  sources: string[];
  events: string[];
}

const DEFAULT_FILTER: FilterState = {
  visa: "all",
  teams: [],
  sources: [],
  events: [],
};

function stateToParams(state: FilterState): URLSearchParams {
  const p = new URLSearchParams();
  if (state.visa !== "all") p.set("visa", state.visa);
  if (state.teams.length) p.set("lag", state.teams.join(","));
  if (state.sources.length) p.set("kalla", state.sources.join(","));
  if (state.events.length) p.set("event", state.events.join(","));
  return p;
}

function paramsToState(sp: URLSearchParams): FilterState {
  return {
    visa: (sp.get("visa") as FilterState["visa"]) ?? "all",
    teams: sp.get("lag") ? sp.get("lag")!.split(",").filter(Boolean) : [],
    sources: sp.get("kalla") ? sp.get("kalla")!.split(",").filter(Boolean) : [],
    events: sp.get("event") ? sp.get("event")!.split(",").filter(Boolean) : [],
  };
}

function isDefault(state: FilterState): boolean {
  return (
    state.visa === "all" &&
    state.teams.length === 0 &&
    state.sources.length === 0 &&
    state.events.length === 0
  );
}

function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

// ── Section-komponent ──────────────────────────────────────────────────────────
function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function CheckRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div
        className={clsx(
          "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
          checked
            ? "bg-pitch border-pitch"
            : "border-border group-hover:border-pitch/60"
        )}
        onClick={onChange}
      >
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span
        className={clsx(
          "text-sm transition-colors",
          checked ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
        )}
        onClick={onChange}
      >
        {label}
      </span>
    </label>
  );
}

// ── Huvud-komponent ────────────────────────────────────────────────────────────
interface Props {
  allSources: { name: string; id: string }[];
  initialParams: Record<string, string>;
  totalCount: number;
}

export function NewsFilterPanel({ allSources, initialParams, totalCount }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filter, setFilter] = useState<FilterState>(() =>
    paramsToState(new URLSearchParams(initialParams))
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Ladda från localStorage vid mount om URL-params är tomma
  useEffect(() => {
    const urlState = paramsToState(searchParams);
    if (isDefault(urlState)) {
      try {
        const saved = localStorage.getItem(LS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as FilterState;
          setFilter(parsed);
          const params = stateToParams(parsed);
          if (params.toString()) {
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
          }
        }
      } catch { /* ignore */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilter = useCallback(
    (next: FilterState) => {
      setFilter(next);
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(next));
      } catch { /* ignore */ }
      const params = stateToParams(next);
      router.replace(
        params.toString() ? `${pathname}?${params.toString()}` : pathname,
        { scroll: false }
      );
    },
    [router, pathname]
  );

  const reset = () => applyFilter(DEFAULT_FILTER);

  const activeCount =
    (filter.visa !== "all" ? 1 : 0) +
    filter.teams.length +
    filter.sources.length +
    filter.events.length;

  const filterContent = (
    <div className="flex flex-col gap-6">
      {/* Visa */}
      <FilterSection title="Visa">
        {(
          [
            { value: "all", label: "Alla nyheter" },
            { value: "ai", label: "Athopia AI-sammanfattningar" },
            { value: "source", label: "Bara källartiklar" },
          ] as const
        ).map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
            <div
              className={clsx(
                "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                filter.visa === opt.value
                  ? "border-pitch"
                  : "border-border group-hover:border-pitch/60"
              )}
              onClick={() => applyFilter({ ...filter, visa: opt.value })}
            >
              {filter.visa === opt.value && (
                <div className="w-2 h-2 rounded-full bg-pitch" />
              )}
            </div>
            <span
              className={clsx(
                "text-sm transition-colors",
                filter.visa === opt.value
                  ? "text-foreground"
                  : "text-muted-foreground group-hover:text-foreground"
              )}
              onClick={() => applyFilter({ ...filter, visa: opt.value })}
            >
              {opt.label}
            </span>
          </label>
        ))}
      </FilterSection>

      {/* Lag */}
      <FilterSection title="Lag">
        {ALLSVENSKAN_TEAMS.map((t) => (
          <CheckRow
            key={t.slug}
            checked={filter.teams.includes(t.slug)}
            onChange={() =>
              applyFilter({ ...filter, teams: toggle(filter.teams, t.slug) })
            }
            label={t.label}
          />
        ))}
      </FilterSection>

      {/* Källor */}
      {allSources.length > 0 && (
        <FilterSection title="Källor">
          {allSources.map((s) => (
            <CheckRow
              key={s.id}
              checked={filter.sources.includes(s.name)}
              onChange={() =>
                applyFilter({ ...filter, sources: toggle(filter.sources, s.name) })
              }
              label={s.name}
            />
          ))}
        </FilterSection>
      )}

      {/* Eventtyp */}
      <FilterSection title="Eventtyp">
        {EVENT_TYPES.map((e) => (
          <CheckRow
            key={e.value}
            checked={filter.events.includes(e.value)}
            onChange={() =>
              applyFilter({ ...filter, events: toggle(filter.events, e.value) })
            }
            label={e.label}
          />
        ))}
      </FilterSection>

      {/* Återställ */}
      {activeCount > 0 && (
        <button
          onClick={reset}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-2"
        >
          <X className="w-3.5 h-3.5" />
          Återställ filter
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-56 shrink-0">
        <div className="sticky top-20">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-foreground">Filter</p>
            {activeCount > 0 && (
              <span className="text-xs bg-pitch text-white px-1.5 py-0.5 rounded-full">
                {activeCount}
              </span>
            )}
          </div>
          {filterContent}
        </div>
      </aside>

      {/* Mobil: trigger-knapp */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground hover:border-pitch/40 transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filter
          {activeCount > 0 && (
            <span className="bg-pitch text-white text-xs px-1.5 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </button>
        <p className="mt-2 text-sm text-muted-foreground">
          {totalCount} artiklar
        </p>
      </div>

      {/* Mobil: drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative ml-auto w-72 max-w-full h-full bg-background border-l border-border overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-6">
              <p className="font-semibold text-foreground">Filter</p>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {filterContent}
          </div>
        </div>
      )}
    </>
  );
}
