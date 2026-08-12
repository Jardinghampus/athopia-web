/**
 * Klientsidans trattlogg. En väg, så alla ytor beter sig likadant.
 *
 * Fanns i tre kopior (DailyPodcastPlayer, CheckoutButton och nästan i onboarding)
 * med olika beteende: bara en av dem hade `keepalive`, så event som skickades
 * precis före en navigering kunde tyst försvinna. Det gäller just de mest
 * värdefulla stegen — checkout och avslutad onboarding navigerar båda direkt
 * efter att eventet skickats.
 *
 * Eventnamnet måste finnas i allowlistan i `app/api/analytics/event/route.ts`
 * (FUNNEL_EVENTS eller PRODUCT_EVENTS i `lib/funnel.ts`), annars svarar
 * endpointen 400 och eventet försvinner utan spår i klienten.
 */
export function trackEvent(
  event: string,
  props?: Record<string, string | number | boolean | null>,
): void {
  try {
    void fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, props }),
      // Överlever sidbytet. Utan detta tappas eventet vid navigering.
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Telemetri får aldrig blockera ett användarflöde.
  }
}
