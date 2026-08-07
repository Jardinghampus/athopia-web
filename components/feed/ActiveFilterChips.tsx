import { X } from "lucide-react";
import { TrackedLink } from "@/components/analytics/TrackedLink";

/**
 * Synliga, borttagbara filter för nyhetsflödet.
 *
 * Tidigare visades personaliseringen som grå brödtext ("· fokuserat för AIK").
 * Den gick inte att klicka bort, och en användare som kom via "Alla nyheter"
 * såg ett lagfiltrerat flöde utan att förstå varför. Kraven i produktbriefen:
 * användaren ska SE att flödet är filtrerat och kunna ta bort det med ETT klick.
 *
 * Server component — chipsen är länkar, ingen klientlogik behövs.
 */

export interface FilterChip {
  /** Texten i chipet, t.ex. "AIK" eller "Hela Allsvenskan". */
  label: string;
  /** Vad chipet beskriver — läses av skärmläsare före etiketten. */
  kind: string;
  /** URL som tar bort filtret. Utelämnas för chips som inte går att ta bort. */
  removeHref?: string;
  /** Markerar scope-chipet visuellt (accent i stället för neutral yta). */
  emphasis?: boolean;
}

export function ActiveFilterChips({ chips }: { chips: FilterChip[] }) {
  if (chips.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <h2 className="sr-only text-balance">Aktiva filter</h2>
      {chips.map((chip) => {
        const body = (
          <>
            <span className="sr-only">{chip.kind}: </span>
            {chip.label}
            {chip.removeHref && (
              <X className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
            )}
          </>
        );

        // min-h-8 + px-3 håller träffytan runt 44px hög tillsammans med gap:en.
        const base =
          "inline-flex items-center gap-1.5 rounded-full border px-3 min-h-8 text-xs font-medium transition-colors";
        const tone = chip.emphasis
          ? "border-pitch/40 bg-pitch/10 text-pitch-ink"
          : "border-border bg-card text-foreground";

        return chip.removeHref ? (
          <TrackedLink
            key={`${chip.kind}-${chip.label}`}
            href={chip.removeHref}
            event="news_filter_removed"
            props={{ filter_kind: chip.kind, filter_value: chip.label }}
            className={`${base} ${tone} hover:border-pitch/60`}
            aria-label={`Ta bort filter ${chip.kind}: ${chip.label}`}
          >
            {body}
          </TrackedLink>
        ) : (
          <span key={`${chip.kind}-${chip.label}`} className={`${base} ${tone}`}>
            {body}
          </span>
        );
      })}
    </div>
  );
}
