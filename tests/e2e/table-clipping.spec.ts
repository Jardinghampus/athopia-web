import { test, expect } from '@playwright/test'

/**
 * Vakt mot att en datatabell klipps bort på mobil.
 *
 * `rounded-2xl border overflow-hidden` används för att runda hörnen på kort.
 * Runt en tabell blir samma regel en sax: på 390px var ligatabellen 468px bred
 * och `hidden` gömde F, +/- och P. Poängkolumnen — det enda en tabell finns
 * till för — gick inte att nå, och eftersom dokumentet inte scrollade fanns
 * ingen väg dit. `/allsvenskan/xp-tabell` tappade P−xP på samma sätt.
 *
 * Rätt mönster är `overflow-x-auto`: hörnen rundas fortfarande, men innehållet
 * går att scrolla fram. Testet mäter renderat resultat i stället för klassnamn
 * — en tabell som råkar få plats ska inte failas, och en ny bred kolumn ska
 * fångas oavsett vilken klass som råkar orsaka den.
 */

const MOBIL = { width: 390, height: 844 }

const TABELLSIDOR = [
  '/allsvenskan/tabell',
  '/allsvenskan/xp-tabell',
  '/allsvenskan/talanger',
  '/allsvenskan/skytteliga',
  '/statistik',
]

for (const route of TABELLSIDOR) {
  test(`${route}: ingen kolumn klipps bort på 390px`, async ({ page }) => {
    await page.setViewportSize(MOBIL)
    await page.goto(route, { waitUntil: 'networkidle' })

    const klippta = await page.evaluate(() => {
      const trasiga: string[] = []
      for (const box of Array.from(document.querySelectorAll('div'))) {
        // Bara containrar som faktiskt håller tillbaka innehåll.
        if (getComputedStyle(box).overflowX !== 'hidden') continue
        if (box.scrollWidth - box.clientWidth <= 1) continue
        if (!box.querySelector('table, [role=table]')) continue
        trasiga.push(
          `${box.className} klipper ${box.scrollWidth - box.clientWidth}px av en tabell`
        )
      }
      return trasiga
    })

    expect(klippta, klippta.join('\n')).toEqual([])
  })
}
