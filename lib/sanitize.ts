/**
 * lib/sanitize.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sanering av användargenererad text innan lagring (XSS-skydd i djupet).
 *
 * VARFÖR: Forum-content, nickname m.m. är user input som senare renderas. React
 * escapar visserligen text-noder automatiskt, men:
 *   - vi vill ALDRIG lagra rå HTML/script i DB (skyddar även mot framtida
 *     rendering via dangerouslySetInnerHTML, e-post, RSS-export etc.)
 *   - vi vill normalisera whitespace och blockera kontrolltecken.
 *
 * Detta är ren text-sanering (vi tillåter INGEN HTML i forumtext). Behöver vi
 * rik text någon gång → använd ett riktigt HTML-saneringsbibliotek (DOMPurify),
 * inte detta.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Tar bort HTML-taggar, kontrolltecken och trimmar. För forum/kommentarer. */
export function sanitizeText(input: string): string {
  return input
    // Ta bort hela <script>/<style>-block med innehåll
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "")
    // Ta bort kvarvarande HTML-taggar
    .replace(/<\/?[^>]+(>|$)/g, "")
    // Ta bort osynliga kontrolltecken (behåller \n=0A och \t=09)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Kollapsa 3+ radbrytningar till 2
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Strikt sanering för korta enradiga fält (nickname, namn).
 * Ingen HTML, inga radbrytningar, kollapsad whitespace.
 */
export function sanitizeInline(input: string): string {
  return sanitizeText(input).replace(/\s+/g, " ").trim();
}
