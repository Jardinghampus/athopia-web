import Link from "next/link";
import type { Article } from "@/lib/types";
import { formatDateRelative } from "@/lib/utils";

/**
 * Metaraden på ett nyhetskort: lag · händelsetyp · tid · källa.
 *
 * Varför den finns: 96,7 % av artiklarna har lagkoppling och 5 klassificerade
 * händelsetyper, men korten visade bara källa + tid. Utåt såg Athopia därför ut
 * som en rubrikaggregator trots att klassificeringen redan gjort jobbet.
 *
 * Allt här är metadata vi själva härlett — ingen tredjepartstext återges, så
 * upphovsrättsregeln är oberörd. `provenance.ts` styr fortfarande vart kortet
 * länkar; den här komponenten beskriver bara innehållet.
 */

/** De fem taggar Echo faktiskt sätter (mätt över 30 dygn 2026-08-06). */
const TAG_LABELS: Record<string, string> = {
  transfer: "Transfer",
  match: "Match",
  analysis: "Analys",
  injury: "Skada",
  // 'news' utelämnas medvetet: "Nyheter" på en nyhetssajt säger ingenting.
};

export function eventLabel(tag: string | null | undefined): string | null {
  if (!tag) return null;
  return TAG_LABELS[tag] ?? null;
}

/** Lagen artikeln handlar om — spelare och andra entiteter filtreras bort. */
export function articleTeams(article: Article, max = 2) {
  return (article.entities ?? []).filter((e) => e.type === "team").slice(0, max);
}

export function ArticleMeta({
  article,
  /** Lagets namn som gjorde att artikeln visas — ger "Visas eftersom du följer X". */
  becauseTeam,
  /**
   * Gör lagnamnen klickbara. Default false: metaraden sitter oftast INUTI ett
   * kort som redan är en <Link>, och nästlade länkar är ogiltig HTML som
   * dessutom fångar tangentbordsfokus fel. Sätt bara true utanför länkkontext.
   */
  linkTeams = false,
  className = "",
}: {
  article: Article;
  becauseTeam?: string | null;
  linkTeams?: boolean;
  className?: string;
}) {
  const teams = articleTeams(article);
  const label = eventLabel(article.newsTag ?? article.eventType);
  const when = formatDateRelative(article.publishedAt);

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        {teams.map((t) =>
          linkTeams ? (
            <Link
              key={t.id}
              href={`/lag/${t.slug}`}
              className="font-semibold text-foreground hover:text-pitch-ink transition-colors"
            >
              {t.name}
            </Link>
          ) : (
            <span key={t.id} className="font-semibold text-foreground">
              {t.name}
            </span>
          ),
        )}

        {label && (
          <>
            {teams.length > 0 && <Dot />}
            <span className="font-medium text-pitch-ink">{label}</span>
          </>
        )}

        {when && (
          <>
            {(teams.length > 0 || label) && <Dot />}
            <time dateTime={article.publishedAt ?? undefined}>{when}</time>
          </>
        )}

        {article.sourceName && (
          <>
            <Dot />
            <span>{article.sourceName}</span>
          </>
        )}
      </div>

      {becauseTeam && (
        <p className="mt-1 text-xs text-muted-foreground">
          Visas eftersom du följer {becauseTeam}
        </p>
      )}
    </div>
  );
}

function Dot() {
  return (
    <span aria-hidden className="opacity-50">
      ·
    </span>
  );
}
