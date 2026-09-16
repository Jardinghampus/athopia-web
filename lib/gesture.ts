/**
 * Gestfysik — delad av kantsvepet, bottom sheeten och pull-to-refresh.
 *
 * Alla tre hade egna kopior av samma två formler med olika konstanter, vilket
 * gjorde att samma svep kändes olika beroende på var i appen man var. En
 * definition, ett ställe att justera känslan på.
 */

/** Standardmotstånd vid kanter. Högre = följsammare, lägre = styvare. */
export const RUBBERBAND_CONSTANT = 0.55;

/**
 * Progressivt motstånd mot en gräns. Följer nästan 1:1 i början och styvnar
 * asymptotiskt mot `dimension` — når den aldrig.
 *
 * En hård klippning (`Math.min`) läser som "fruset"; växande motstånd läser som
 * "responsivt, men det finns inget mer här".
 *
 * `dimension` är den yta gesten rör sig över — viewporten för en sidgest, den
 * maximala spårsträckan för en liten indikator. Sätts den till tröskeln man vill
 * nå blir tröskeln i praktiken onåbar.
 */
export function rubberband(
  distance: number,
  dimension: number,
  constant = RUBBERBAND_CONSTANT,
): number {
  if (distance <= 0) return 0;
  return (distance * dimension * constant) / (dimension + constant * distance);
}

/**
 * Projicerad viloposition ur släpphastigheten (px/s) — Apples exponentiella
 * decay, inte fysikbokens v²/2a.
 *
 * `decelerationRate` 0.998 är scrollens: den projicerar ~v/2 px, rätt när
 * resan mäts i hundratals pixlar. För en gest med en tröskel på ~60 px är den
 * förkrossande — ett långsamt drivande finger (200 px/s) hade lagt på 100 px
 * och committat något användaren aldrig bad om. 0.99 ger ~v/10: en snärt
 * räknas, en drift gör det inte.
 */
export function project(velocity: number, decelerationRate = 0.99): number {
  return (velocity / 1000) * decelerationRate / (1 - decelerationRate);
}
