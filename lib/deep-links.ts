/**
 * Enda källan för delbara web-URL:er som ska öppna en native iOS-yta.
 *
 * AASA-routen (`app/.well-known/apple-app-site-association`) och det genererade
 * `navigation.json` läser båda härifrån. iOS `ContentView.handleUniversalLink`
 * måste hantera varje prefix — `lib/deep-links.test.ts` blockerar drift.
 */
export interface DeepLinkRoute {
  /** Första path-segmentet, utan slash. Matchar `case "<prefix>"` i ContentView. */
  prefix: string;
  /** True när djupvägen har ett eget id/slug-segment (`/lag/aik`). */
  hasDetail: boolean;
  /** True när prefixet också är en giltig destination utan detalj (`/forum`). */
  standalone: boolean;
}

export const DEEP_LINK_ROUTES: DeepLinkRoute[] = [
  { prefix: "artikel",     hasDetail: true,  standalone: false },
  { prefix: "nyhet",       hasDetail: true,  standalone: false },
  { prefix: "lag",         hasDetail: true,  standalone: false },
  { prefix: "spelare",     hasDetail: true,  standalone: false },
  { prefix: "match",       hasDetail: true,  standalone: true },
  { prefix: "forum",       hasDetail: true,  standalone: true },
  { prefix: "allsvenskan", hasDetail: true,  standalone: true },
  { prefix: "analys",      hasDetail: true,  standalone: true },
  { prefix: "podcast",     hasDetail: true,  standalone: true },
  { prefix: "statistik",   hasDetail: true,  standalone: true },
  { prefix: "daily",       hasDetail: false, standalone: true },
  { prefix: "nyheter",     hasDetail: false, standalone: true },
  { prefix: "mitt-lag",    hasDetail: false, standalone: true },
  { prefix: "profil",      hasDetail: false, standalone: true },
  { prefix: "konto",       hasDetail: false, standalone: true },
  { prefix: "ai",          hasDetail: false, standalone: true },
];

/** AASA `components`-paths, t.ex. `/lag/*` och `/forum`. */
export function universalLinkPaths(): string[] {
  return DEEP_LINK_ROUTES.flatMap(({ prefix, hasDetail, standalone }) => [
    ...(standalone ? [`/${prefix}`] : []),
    ...(hasDetail ? [`/${prefix}/*`] : []),
  ]);
}
