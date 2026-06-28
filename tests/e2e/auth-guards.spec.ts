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
      await page.goto(path, { timeout: 20000 })

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
