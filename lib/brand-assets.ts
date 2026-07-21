/**
 * Brand badge assets under /public/brand/
 * URLs: /brand/star.svg · /brand/verified.png · /brand/writer.png
 *
 * writer = journalist / krönikör (profiles.role columnist|admin)
 * verified = profiles.verified
 * star = Athopia-staff (profiles.role admin)
 */
export const BRAND_ASSETS = {
  star: "/brand/star.svg",
  verified: "/brand/verified.png",
  /** Journalist / krönikör */
  writer: "/brand/writer.png",
} as const;

export type BrandBadgeKind = keyof typeof BRAND_ASSETS;

export const BRAND_BADGE_LABELS: Record<BrandBadgeKind, string> = {
  star: "Athopia",
  verified: "Verifierad",
  writer: "Journalist",
};
