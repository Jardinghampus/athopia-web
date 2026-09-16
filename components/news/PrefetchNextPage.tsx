"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Hämtar nästa sida i bakgrunden innan användaren nått slutet (mobil UX-regel 17).
 *
 * `/nyheter` är medvetet paginerad och inte ett klientladdat oändligt flöde:
 * sidorna ska vara crawlbara och delbara, och en URL per sida är det enda som
 * ger det. Regeln handlar dock om väntan, inte om tekniken — så vi förladdar
 * RSC-payloaden ~1,5 skärmar i förväg. Trycket på "Nästa" blir då omedelbart
 * i stället för en tom skärm med spinner.
 */
export function PrefetchNextPage({ href }: { href: string | null }) {
  const router = useRouter();
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinel.current;
    if (!href || !node) return;

    let done = false;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || done) return;
        done = true;
        router.prefetch(href);
        obs.disconnect();
      },
      { rootMargin: "0px 0px 150% 0px", threshold: 0 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [href, router]);

  return <div ref={sentinel} aria-hidden className="h-px" />;
}
