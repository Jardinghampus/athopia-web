/**
 * LAUNCH-01 — content provenance helpers.
 * Public surfaces never expose third-party body/teaser.
 */

export type ContentOrigin = "athopia_original" | "third_party_signal" | "licensed";
export type RightsStatus = "owned" | "link_only" | "licensed";

export type ProvenanceFields = {
  contentOrigin?: ContentOrigin | null;
  rightsStatus?: RightsStatus | null;
  isAthopiaGenerated?: boolean | null;
  slug?: string | null;
  sourceUrl?: string | null;
  url?: string | null;
  content?: string | null;
  summary?: string | null;
};

export function resolveRightsStatus(row: {
  rights_status?: string | null;
  rightsStatus?: string | null;
  content_origin?: string | null;
  contentOrigin?: string | null;
  is_athopia_generated?: boolean | null;
  isAthopiaGenerated?: boolean | null;
}): RightsStatus {
  const explicit = (row.rights_status ?? row.rightsStatus ?? "").trim();
  if (explicit === "owned" || explicit === "link_only" || explicit === "licensed") {
    return explicit;
  }
  // Conservative fallback before/without migration columns.
  if (row.is_athopia_generated === true || row.isAthopiaGenerated === true) {
    return "owned";
  }
  return "link_only";
}

export function resolveContentOrigin(row: {
  content_origin?: string | null;
  contentOrigin?: string | null;
  is_athopia_generated?: boolean | null;
  isAthopiaGenerated?: boolean | null;
}): ContentOrigin {
  const explicit = (row.content_origin ?? row.contentOrigin ?? "").trim();
  if (
    explicit === "athopia_original" ||
    explicit === "third_party_signal" ||
    explicit === "licensed"
  ) {
    return explicit;
  }
  if (row.is_athopia_generated === true || row.isAthopiaGenerated === true) {
    return "athopia_original";
  }
  return "third_party_signal";
}

/** Owned/licensed may render Athopia body; link_only is source-first only. */
export function canPublishBody(rights: RightsStatus): boolean {
  return rights === "owned" || rights === "licensed";
}

/** Public path for a published article row. */
export function articlePublicPath(input: {
  slug?: string | null;
  rightsStatus?: RightsStatus | null;
  rights_status?: string | null;
  isAthopiaGenerated?: boolean | null;
  is_athopia_generated?: boolean | null;
  sourceUrl?: string | null;
  url?: string | null;
}): string {
  const rights = resolveRightsStatus(input);
  const slug = input.slug ? String(input.slug) : "";
  if (slug) {
    return canPublishBody(rights) ? `/artikel/${slug}` : `/nyhet/${slug}`;
  }
  return input.sourceUrl ?? input.url ?? "#";
}

export function sourceDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Strip third-party body/teaser from any object destined for HTML/RSC/props.
 * Title + source metadata remain; content/summary cleared for link_only.
 */
export function sanitizeArticleForPublic<T extends ProvenanceFields>(article: T): T {
  const rights = resolveRightsStatus({
    rightsStatus: article.rightsStatus,
    isAthopiaGenerated: article.isAthopiaGenerated,
  });
  if (canPublishBody(rights)) {
    return {
      ...article,
      rightsStatus: rights,
      contentOrigin: article.contentOrigin ?? resolveContentOrigin({
        contentOrigin: article.contentOrigin,
        isAthopiaGenerated: article.isAthopiaGenerated,
      }),
    };
  }
  return {
    ...article,
    rightsStatus: rights,
    contentOrigin: "third_party_signal",
    content: null,
    summary: null,
  };
}

/** True if a public payload still leaks third-party prose (regression guard). */
export function publicPayloadLeaksThirdPartyBody(payload: {
  rightsStatus?: RightsStatus | null;
  content?: string | null;
  summary?: string | null;
}): boolean {
  const rights = payload.rightsStatus ?? "link_only";
  if (canPublishBody(rights)) return false;
  const content = (payload.content ?? "").trim();
  const summary = (payload.summary ?? "").trim();
  return content.length > 0 || summary.length > 0;
}
