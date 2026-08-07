"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Spelarporträtt med fallback.
 *
 * Sportmonks slutar servera enskilda porträtt utan förvarning (verifierat:
 * `players/21/37325013.png` svarar 404 direkt från deras CDN). `next/image`
 * proxade vidare 404:an och webbläsaren ritade en trasig-bild-ikon mitt i
 * cirkeln på skytteligan, truppen och lagstatistiken.
 *
 * Vid fel döljs bilden och den tomma tonade cirkeln blir kvar — samma tillstånd
 * som när en spelare saknar porträtt. Ingen placeholder-data, inga påhittade
 * initialer.
 */
export function PlayerAvatar({
  src,
  alt,
  sizes,
  className,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={cn("object-cover", className)}
      onError={() => setFailed(true)}
    />
  );
}
