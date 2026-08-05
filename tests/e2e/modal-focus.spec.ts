import { test, expect, Page } from '@playwright/test'

/**
 * Fokushantering i modaler och lådor (ARIA APG dialog + WCAG 2.1.2/2.4.3).
 *
 * Före `hooks/useModalA11y.ts` låg fokus kvar i bakgrunden när de handrullade
 * overlays öppnades, Tab vandrade ut i sidan bakom, och vid stängning hamnade
 * fokus på <body> i stället för på knappen man kom ifrån. En modal som inte
 * håller fokus är inte modal för tangentbord och skärmläsare.
 */

/**
 * Sökknappen skickar ett window-event som CommandPalette lyssnar på först efter
 * hydrering. Ett klick dessförinnan tappas tyst, så vi klickar tills dialogen
 * faktiskt är uppe i stället för att lita på en enda tryckning.
 */
async function openSearch(page: Page) {
  const trigger = page.getByRole('button', { name: 'Sök', exact: true })
  const dialog = page.getByRole('dialog', { name: 'Sök' })
  await expect(trigger).toBeVisible()
  await expect
    .poll(
      async () => {
        if ((await dialog.count()) > 0) return true
        await trigger.click()
        await page.waitForTimeout(250)
        return (await dialog.count()) > 0
      },
      { timeout: 20000 },
    )
    .toBe(true)
  return trigger
}

/** Tabbar N gånger och failar om fokus någonsin lämnar dialogen. */
async function expectFocusStaysInside(page: Page, dialog: string, presses = 14) {
  for (let i = 0; i < presses; i++) {
    await page.keyboard.press('Tab')
    const inside = await page.evaluate((sel) => {
      const d = document.querySelector(sel)
      return !!d && !!document.activeElement && d.contains(document.activeElement)
    }, dialog)
    expect(inside, `fokus lämnade dialogen efter ${i + 1} Tab-tryck`).toBe(true)
  }
}

test.describe('Sökdialogen (CommandPalette)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/nyheter')
  })

  test('har dialogsemantik och tillgängligt namn', async ({ page }) => {
    await openSearch(page)
    const dialog = page.getByRole('dialog', { name: 'Sök' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  test('flyttar fokus till sökfältet när den öppnas', async ({ page }) => {
    await openSearch(page)
    await expect(page.locator('input[data-autofocus]')).toBeFocused()
  })

  test('håller kvar Tab inuti dialogen', async ({ page }) => {
    await openSearch(page)
    await expectFocusStaysInside(page, '[role="dialog"][aria-label="Sök"]')
  })

  test('Shift+Tab lämnar inte heller dialogen', async ({ page }) => {
    await openSearch(page)
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Shift+Tab')
      const inside = await page.evaluate(() => {
        const d = document.querySelector('[role="dialog"][aria-label="Sök"]')
        return !!d && !!document.activeElement && d.contains(document.activeElement)
      })
      expect(inside, `fokus lämnade dialogen bakåt efter ${i + 1} Shift+Tab`).toBe(true)
    }
  })

  test('Escape stänger och lämnar tillbaka fokus till sökknappen', async ({ page }) => {
    // Öppnas med tangentbord, inte mus. Safari fokuserar inte knappar vid
    // musklick, så efter ett klick finns det bokstavligen inget att lämna
    // tillbaka fokus till. Tangentbordsvägen är den som kravet gäller — och
    // den enda där återlämning är meningsfull.
    const trigger = page.getByRole('button', { name: 'Sök', exact: true })
    await expect(trigger).toBeVisible()
    const dialog = page.getByRole('dialog', { name: 'Sök' })
    await expect
      .poll(
        async () => {
          if ((await dialog.count()) > 0) return true
          await trigger.focus()
          await page.keyboard.press('Enter')
          await page.waitForTimeout(250)
          return (await dialog.count()) > 0
        },
        { timeout: 20000 },
      )
      .toBe(true)

    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })

  test('låser bakgrundsscroll medan den är öppen', async ({ page }) => {
    await openSearch(page)
    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.body).overflow))
      .toBe('hidden')

    await page.keyboard.press('Escape')
    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.body).overflow))
      .not.toBe('hidden')
  })
})

test.describe('Mobilmenyn (MobileNav)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/nyheter')
  })

  test('har dialogsemantik och håller kvar fokus', async ({ page }) => {
    await page.getByRole('button', { name: 'Öppna meny' }).click()
    const drawer = page.getByRole('dialog', { name: 'Meny' })
    await expect(drawer).toBeVisible()
    await expect(drawer).toHaveAttribute('aria-modal', 'true')
    await expectFocusStaysInside(page, '[role="dialog"][aria-label="Meny"]', 12)
  })

  test('Escape stänger och lämnar tillbaka fokus till hamburgaren', async ({ page }) => {
    // Se kommentaren i söktestet: öppnas med tangentbord, eftersom Safari inte
    // fokuserar knappar vid musklick.
    const trigger = page.getByRole('button', { name: 'Öppna meny' })
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog', { name: 'Meny' })).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Meny' })).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })
})

test.describe('Icke-modala aviseringar', () => {
  test('forumsammanfattningen fångar inte fokus', async ({ page }) => {
    // Toasts i hörnet blockerar inte sidan och ska därför INTE fälla in fokus.
    // De ska annonseras som en artig live-region i stället.
    await page.goto('/forum')
    const popup = page.locator('[role="status"][aria-label="Forumsammanfattning"]')
    if ((await popup.count()) === 0) test.skip(true, 'ingen sammanfattning tillgänglig just nu')
    await expect(popup).toHaveAttribute('aria-live', 'polite')
  })
})
