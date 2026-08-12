import { createHash } from "crypto";

/**
 * Stabil pseudonym besökaridentitet för produktanalys.
 *
 * Bakgrund: `/api/analytics/event` stämplade varje utloggad händelse med
 * `clerk_user_id: "anon"`. Alla besökare hamnade därmed i EN hink, vilket gör
 * unika besökare, tratt och retention omöjliga att mäta. Mätt 2026-08-10:
 * 10 597 av 10 621 händelser låg på "anon".
 *
 * Val av metod: samma `anon::<sha256(ip)[0..16]>`-konvention som
 * `/api/cookie-consent` redan använder. Ingen ny cookie behövs, alltså ingen ny
 * ePrivacy-samtyckesyta, och identiteten går inte att vända tillbaka till en IP.
 *
 * Känt tak (ponytail: IP-hash, byt till förstaparts-cookie om precision krävs):
 * besökare bakom samma NAT slås ihop, och mobil som byter IP räknas som ny.
 * Det duger för riktning och trattform, inte för exakta unika besökare.
 */
export function visitorIdFrom(req: Request, userId: string | null): string {
  if (userId) return userId;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 16);
  return `anon::${ipHash}`;
}
