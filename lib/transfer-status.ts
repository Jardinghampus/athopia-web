/**
 * Transfer-status utan confidence-score.
 * Bekräftad = minst två oberoende källor (source_count), ELLER tydlig
 * officiell bekräftelse (klubbkälla / titel). Annars Rykte.
 */

export type TransferStatus = "rykte" | "bekraftad";

export type TransferStatusInput = {
  sourceCount?: number | null;
  sourceName?: string | null;
  title?: string | null;
  /** Extra källnamn från cluster/duplicates om tillgängligt */
  duplicateSources?: string[] | null;
};

/** Officiella klubb-/ligakällor — inte spekulation. */
const OFFICIAL_SOURCE =
  /aik fotboll|djurgårdens?\s*if|hammarby(\s*if)?|malm[oö]\s*ff|ifk\s*g[oö]teborg|bk\s*h[aä]cken|if\s*elfsborg|kalmar\s*ff|mj[aä]llby|helsingborg|norrk[oö]ping|varnamo|gais|degerfors|halmstad|v[aä]ster[aå]s|allsvenskan|svensk\s*fotboll|svff/i;

const CONFIRMED_TITLE =
  /^(officiellt|klart|bekräftat|klart:|officiellt:)\b/i;

const MIN_SOURCES_FOR_CONFIRMED = 2;

export function resolveTransferStatus(input: TransferStatusInput): {
  status: TransferStatus;
  label: "Rykte" | "Bekräftad";
  sourceCount: number;
  reason: "multi_source" | "official_source" | "confirmed_title" | "single_source";
} {
  const sourceCount = Math.max(
    1,
    Number(input.sourceCount ?? 1) || 1,
    Array.isArray(input.duplicateSources) ? input.duplicateSources.length + 1 : 1,
  );
  const title = (input.title ?? "").trim();
  const sourceName = (input.sourceName ?? "").trim();

  if (sourceCount >= MIN_SOURCES_FOR_CONFIRMED) {
    return {
      status: "bekraftad",
      label: "Bekräftad",
      sourceCount,
      reason: "multi_source",
    };
  }

  if (CONFIRMED_TITLE.test(title)) {
    return {
      status: "bekraftad",
      label: "Bekräftad",
      sourceCount,
      reason: "confirmed_title",
    };
  }

  if (sourceName && OFFICIAL_SOURCE.test(sourceName)) {
    return {
      status: "bekraftad",
      label: "Bekräftad",
      sourceCount,
      reason: "official_source",
    };
  }

  return {
    status: "rykte",
    label: "Rykte",
    sourceCount,
    reason: "single_source",
  };
}

export function transferStatusBadgeClass(status: TransferStatus): string {
  return status === "bekraftad"
    ? "bg-pitch/15 text-pitch"
    : "bg-orange-400/10 text-orange-400";
}
