"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { clsx } from "clsx";

const TABS = [
  { id: "tabell", label: "Tabell" },
  { id: "skytteliga", label: "Skytteliga" },
  { id: "assistligan", label: "Assistligan" },
  { id: "xg", label: "xG-tabell" },
  { id: "form", label: "Form" },
  { id: "press", label: "Press" },
  { id: "h2h", label: "H2H" },
];

const SEASONS = ["2025", "2024", "2023"];

export function StatistikTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = searchParams.get("tab") ?? "tabell";
  const sasong = searchParams.get("sasong") ?? "2025";
  const omgang = searchParams.get("omgang") ?? "alla";

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(overrides)) {
      p.set(k, v);
    }
    return `${pathname}?${p.toString()}`;
  }

  function handleSasong(val: string) {
    router.replace(buildUrl({ sasong: val }), { scroll: false });
  }

  function handleOmgang(val: string) {
    router.replace(buildUrl({ omgang: val }), { scroll: false });
  }

  return (
    <div className="sticky top-[57px] z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Filter-rad */}
        <div className="flex items-center gap-3 py-2 border-b border-border/40">
          <span className="text-xs text-muted-foreground hidden sm:inline">Säsong</span>
          <select
            value={sasong}
            onChange={(e) => handleSasong(e.target.value)}
            className="text-sm bg-card border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-pitch/40 cursor-pointer"
          >
            {SEASONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground hidden sm:inline">Omgång</span>
          <select
            value={omgang}
            onChange={(e) => handleOmgang(e.target.value)}
            className="text-sm bg-card border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-pitch/40 cursor-pointer"
          >
            <option value="alla">Alla omgångar</option>
            {Array.from({ length: 33 }, (_, i) => String(i + 1)).map((r) => (
              <option key={r} value={r}>Omgång {r}</option>
            ))}
          </select>
        </div>

        {/* Tab-nav */}
        <div className="flex gap-1 overflow-x-auto scrollbar-none -mb-px">
          {TABS.map((tab) => {
            const href = buildUrl({ tab: tab.id });
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={href}
                className={clsx(
                  "whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                  isActive
                    ? "border-pitch text-pitch"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
