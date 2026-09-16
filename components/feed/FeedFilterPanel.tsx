"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import type { FeedFilterOptions } from "@/lib/feed/get-allsvenskan-teams";
import { cn } from "@/lib/utils";

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

function FilterMenu({
  label,
  selected,
  options,
  onToggle,
}: {
  label: string;
  selected: string[];
  options: { value: string; label: string }[];
  onToggle: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (options.length === 0) return null;

  const summary =
    selected.length === 0
      ? label
      : selected.length === 1
        ? (options.find((o) => o.value === selected[0])?.label ?? label)
        : `${label} · ${selected.length}`;

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium touch-manipulation outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          selected.length > 0
            ? "border-pitch/40 bg-pitch/10 text-pitch-ink"
            : "border-border bg-card text-foreground hover:bg-muted",
        )}
      >
        <span className="truncate">{summary}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 opacity-60 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute left-0 z-40 mt-2 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg"
        >
          <ul className="max-h-[min(20rem,70vh)] overflow-y-auto py-1">
            {options.map((opt) => {
              const checked = selected.includes(opt.value);
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={checked}
                    onClick={() => onToggle(opt.value)}
                    className="flex min-h-11 w-full items-center gap-2.5 px-3 text-left text-sm text-foreground hover:bg-muted touch-manipulation"
                  >
                    <Check
                      className={cn(
                        "size-4 shrink-0 text-pitch-ink",
                        checked ? "opacity-100" : "opacity-0",
                      )}
                      aria-hidden
                    />
                    <span className="truncate">{opt.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Filterrad ovanför flödet — samma dropdowns på mobil, tablet och desktop.
 * Sidofältets checkbox-listor såg ut som ett adminverktyg; knapparna här är
 * samma språk som sort-baren och chipen.
 */
export function FeedFilterPanel({ teams, sources, types }: FeedFilterOptions) {
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
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <FilterMenu
        label="Typ"
        selected={selected.typ}
        options={types}
        onToggle={(v) => toggle("typ", v)}
      />
      <FilterMenu
        label="Klubb"
        selected={selected.lag}
        options={teams.map((t) => ({ value: t.name, label: t.name }))}
        onToggle={(v) => toggle("lag", v)}
      />
      <FilterMenu
        label="Källa"
        selected={selected.kalla}
        options={sources.map((s) => ({ value: s, label: s }))}
        onToggle={(v) => toggle("kalla", v)}
      />
      {activeCount > 0 ? (
        <button
          type="button"
          onClick={clearFilters}
          className="inline-flex min-h-11 items-center px-2 text-sm text-pitch-ink hover:underline touch-manipulation"
        >
          Rensa
        </button>
      ) : null}
    </div>
  );
}
