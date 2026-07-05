"use client";

/**
 * OutboundLink — extern länk som beaconar ett klick till source_clicks innan
 * navigering (för trafik-per-källa-rapporten). sendBeacon blockerar inte
 * navigeringen och fungerar även när sidan lämnas/ny flik öppnas.
 */
interface Props {
  href: string;
  source: string;
  url?: string | null;
  kind?: "article" | "podcast";
  className?: string;
  children: React.ReactNode;
}

export function OutboundLink({ href, source, url, kind = "article", className, children }: Props) {
  function track() {
    try {
      const payload = JSON.stringify({ source, url: url ?? href, kind });
      navigator.sendBeacon?.("/api/track/outbound", new Blob([payload], { type: "application/json" }));
    } catch {
      // spårning är best-effort — får aldrig störa navigeringen
    }
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={track}>
      {children}
    </a>
  );
}
