import { test, expect } from '@playwright/test'

// Routes som kräver inloggning
const PROTECTED = [
  '/konto',
  '/profil',
  '/onboarding',
]

test.describe('Skyddade routes redirectar anonyma användare', () => {
  for (const path of PROTECTED) {
    test(`${path} → sign-in eller Clerk-UI`, async ({ page }) => {
      await page.goto(path)

      // Vänta på antingen redirect eller Clerk-komponent
      await page.waitForFunction(
        () => {
          const url = window.location.pathname
          const hasClerk = !!document.querySelector('.cl-rootBox, [data-clerk-component], [data-localization-key]')
          return url.includes('sign-in') || url.includes('sign-up') || hasClerk
        },
        { timeout: 12000 }
      )

      const url = page.url()
      const hasClerkUi = await page.locator('.cl-rootBox, [data-localization-key]').count()
      expect(url.includes('sign-in') || url.includes('sign-up') || hasClerkUi > 0).toBe(true)
    })
  }

  test('/mitt-lag renderar utan 500', async ({ page }) => {
    const res = await page.goto('/mitt-lag')
    expect(res?.status()).not.toBe(500)
  })

  test('/dashboard renderar utan 500', async ({ page }) => {
    const res = await page.goto('/dashboard')
    expect(res?.status()).not.toBe(500)
  })
})

test.describe('Publika auth-sidor', () => {
  test('/sign-in renderar Clerk-widget', async ({ page }) => {
    await page.goto('/sign-in')
    await expect(
      page.locator('.cl-rootBox, [data-clerk-component], [data-localization-key]').first()
    ).toBeVisible({ timeout: 12000 })
  })

  test('/sign-up renderar Clerk-widget', async ({ page }) => {
    await page.goto('/sign-up')
    await expect(
      page.locator('.cl-rootBox, [data-clerk-component], [data-localization-key]').first()
    ).toBeVisible({ timeout: 12000 })
  })
})

/**
 * Vakt mot att skyddade routes svarar 404 i stället för att skicka besökaren
 * till inloggningen.
 *
 * `auth.protect()` utan `unauthenticatedUrl` härleder sign-in-adressen ur
 * miljövariabler. I produktion saknades NEXT_PUBLIC_CLERK_SIGN_IN_URL och
 * Clerk föll tillbaka på 404 — en utloggad som klickade "Konto" från /mer fick
 * en 404-sida. Lokalt syntes det aldrig eftersom .env.local har variabeln.
 *
 * Testet går på HTTP-nivå (utan att följa redirecten) så det fångar skillnaden
 * oavsett vad som råkar finnas i miljön. Kör mot prod med
 * `TEST_URL=https://… npx playwright test auth-guards`.
 */
test.describe('Skyddade routes svarar aldrig 404', () => {
  for (const path of ['/konto', '/onboarding', '/dashboard']) {
    test(`${path} omdirigerar anonym besökare`, async ({ request }) => {
      const res = await request.get(path, { maxRedirects: 0 })
      expect(
        res.status(),
        `${path} ska omdirigera till inloggning, inte svara ${res.status()}`,
      ).toBeGreaterThanOrEqual(300)
      expect(res.status()).toBeLessThan(400)
      expect(res.headers()['location'] ?? '').toContain('sign-in')
    })
  }
})
