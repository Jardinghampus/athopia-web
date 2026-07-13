"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

export type FeedSort = "for-you" | "latest" | "important";

const SORT_OPTIONS: { value: FeedSort; label: string }[] = [
  { value: "for-you", label: "För dig" },
  { value: "latest", label: "Senaste" },
  { value: "important", label: "Viktigt" },
];

const VISA_OPTIONS = [
  { value: "all", label: "Alla" },
  { value: "ai", label: "AI" },
  { value: "source", label: "Källor" },
] as const;

/**
 * Flödeskontroller — sort + visa-pills. Behåller övriga query-params (lag, källa, event).
 */
export function FeedSortBar({
  sort,
  visa,
}: {
  sort: FeedSort;
  visa: "all" | "ai" | "source";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string, defaultValue: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("page");
    if (value === defaultValue) next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="space-y-3 mb-6">
      <SegmentedControl
        aria-label="Sortering"
        options={SORT_OPTIONS}
        value={sort}
        onChange={(v) => setParam("sort", v, "for-you")}
      />
      <div className="flex items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {VISA_OPTIONS.map((opt) => {
          const active = visa === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setParam("visa", opt.value, "all")}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors touch-manipulation ${
                active
                  ? "bg-pitch text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
        <Link
          href="/nyheter"
          className="shrink-0 ml-auto text-xs text-pitch hover:underline"
        >
          Rensa
        </Link>
      </div>
    </div>
  );
}
