import { test, expect } from '@playwright/test'

/**
 * Vakt: tabellraderna på /statistik måste bära kanonisk `entities.slug`.
 *
 * Raden slugifierades tidigare ur lagnamnet, vilket gav "djurgårdens-if" med å
 * — en sträng som aldrig kunde matcha den riktiga slugen "djurgarden". Följden
 * var att markeringen av användarens lag föll tillbaka på en suddig
 * delsträngsjämförelse: valde du Elfsborg ("if-elfsborg") matchade ordet "if"
 * även Djurgårdens IF och IFK Göteborg, så tre rader markerades och sidan
 * scrollade till fel lag.
 *
 * Testet är därför inte kosmetiskt: håller slugen inte, går markeringen sönder
 * igen, och det syns bara för den som råkar ha ett lag med "if" i namnet.
 */

test('varje tabellrad bär en kanonisk lagslug', async ({ page }) => {
  await page.goto('/statistik', { waitUntil: 'networkidle' })

  const slugs = await page
    .locator('tbody tr[data-team-slug]')
    .evaluateAll((rows) => rows.map((r) => (r as HTMLElement).dataset.teamSlug ?? ''))

  expect(slugs.length, 'tabellen ska ha rader att markera').toBeGreaterThan(0)

  const tomma = slugs.filter((s) => s === '')
  expect(tomma, `${tomma.length} rader saknar slug — de kan aldrig markeras`).toEqual([])

  // Slugifierade namn läcker igenom som å/ä/ö, versaler eller mellanslag.
  const ogiltiga = slugs.filter((s) => !/^[a-z0-9-]+$/.test(s))
  expect(ogiltiga, `slugar som inte är kanoniska: ${ogiltiga.join(', ')}`).toEqual([])

  // Två lag med samma slug skulle markera fel rad.
  const dubbletter = slugs.filter((s, i) => slugs.indexOf(s) !== i)
  expect(dubbletter, `dubblerade slugar: ${dubbletter.join(', ')}`).toEqual([])
})
