"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";

/**
 * Bevarar fönstrets scrollposition per route (mobil UX-regel 16).
 *
 * Bor i app-shellen så varje lista/flöde får restore utan att varje page
 * behöver komma ihåg det. Klientladdade flöden (t.ex. FeedClient) kör
 * dessutom `useScrollRestoration` med `ready` — de återställer först när
 * innehållet faktiskt finns, annars klampar webbläsaren positionen.
 */
export function ScrollRestore() {
  const pathname = usePathname();
  const search = useSearchParams();
  const query = search.toString();
  useScrollRestoration(query ? `${pathname}?${query}` : pathname, true);
  return null;
}
