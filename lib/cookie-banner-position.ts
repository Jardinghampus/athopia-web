/**
 * Var cookie-bannern förankras — utbrutet ur komponenten för att kunna testas.
 *
 * Bannern ligger i rot-layouten på z-[9999] och visas så fort samtycke saknas,
 * vilket per definition alltid gäller en ny användare. Bottenförankrad låg den
 * över onboardingens primärknapp ("Fortsätt", "Öppna Mitt lag"), eftersom varje
 * stegs knapp ligger sist i det scrollande innehållet och alltså mot
 * nederkanten. Frågan doldes då helt på onboarding — fel lösning på ett
 * layoutproblem.
 *
 * På onboarding förankras bannern därför upptill i stället, under stegraden.
 * Då kan den aldrig täcka en knapp, och samtycket efterfrågas ändå på första
 * skärmen.
 *
 * Geometrin kan inte mätas i e2e: `/onboarding` kräver inloggad session och nås
 * inte av en färsk testkontext. Beslutet — vilken kant bannern hänger i — kräver
 * ingen session, och det är vad `lib/cookie-banner-position.test.ts` vaktar.
 */

/** Stegraden är safe-area + 1.5rem padding + 44px knapphöjd + 1rem botten. */
export const TOPP = "top-[calc(env(safe-area-inset-top)+5.75rem)]";

/** `--dock-inset` publiceras av GlassNav och är 0 där docken inte finns. */
export const BOTTEN = "bottom-[calc(env(safe-area-inset-bottom)+1rem+var(--dock-inset,0rem))]";

export function arOnboarding(pathname: string | null | undefined): boolean {
  return (pathname ?? "").startsWith("/onboarding");
}

/** Positionsklassen för aktuell route. */
export function bannerPosition(pathname: string | null | undefined): string {
  return arOnboarding(pathname) ? TOPP : BOTTEN;
}

/** Riktningen bannern glider in från — uppifrån när den hänger i överkanten. */
export function bannerSlideY(pathname: string | null | undefined): string {
  return arOnboarding(pathname) ? "-110%" : "110%";
}
