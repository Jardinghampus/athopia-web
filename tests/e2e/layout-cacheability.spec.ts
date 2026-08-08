import { test, expect } from '@playwright/test'
import { existsSync, readFileSync } from 'fs'

/**
 * Vakt mot att app-layouten blir dynamisk igen.
 *
 * `ForumSummaryPopupGate` låg i `(app)/layout.tsx` och anropade `getUserPlan()`,
 * som läser Clerk-cookies. En dynamisk läsning var som helst i layouttädet gör
 * HELA route-gruppen dynamisk — varje sida renderades om vid varje besök och
 * fick `Cache-Control: private, no-cache, no-store`.
 *
 * Mätt mot prod: `/allsvenskan/tabell` gick från 1872 ms till 186 ms när raden
 * flyttades, `/integritetspolicy` från 1546 ms till 332 ms. En enda rad i
 * layouten kostade resten av sajten tiofaldig svarstid. Se PERF-2026-08-08.md.
 *
 * Testet läser byggets prerender-manifest i stället för att leta efter
 * `getUserPlan` i layoutfilens text. Den textvarianten var värdelös: den
 * dynamiska läsningen ligger inuti komponenten, inte i layouten som importerar
 * den — vakten passerade med regressionen återinförd. Manifestet är transitiv
 * sanning: står routen där är hela dess trädet statiskt genererbart.
 */

/** Sidor utan personligt innehåll. Blir någon av dem dynamisk är layouten trasig. */
const MASTE_PRERENDRERAS = [
  '/integritetspolicy',
  '/om-oss',
  '/ai-transparens',
  '/allsvenskan/tabell',
]

test('sidor utan personligt innehåll prerendreras', () => {
  const manifestPath = '.next/prerender-manifest.json'
  test.skip(
    !existsSync(manifestPath),
    'kräver ett bygge — kör `pnpm build` före testet',
  )

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
    routes?: Record<string, unknown>
  }
  const prerendrade = new Set(Object.keys(manifest.routes ?? {}))

  const saknas = MASTE_PRERENDRERAS.filter((r) => !prerendrade.has(r))

  expect(
    saknas,
    `Följande sidor prerendreras inte längre: ${saknas.join(', ')}.\n` +
      `Nästan alltid orsak: något i app/(app)/layout.tsx — eller en komponent\n` +
      `den renderar — läser auth, cookies eller headers. Det gör hela\n` +
      `route-gruppen dynamisk. Flytta läsningen till de sidor som redan är\n` +
      `force-dynamic. Se PERF-2026-08-08.md.`,
  ).toEqual([])
})

test('prerendrade sidor svarar utan no-store', async ({ request }) => {
  for (const path of MASTE_PRERENDRERAS) {
    const res = await request.get(path)
    expect(res.status(), `${path} ska svara 200`).toBe(200)
    const cc = res.headers()['cache-control'] ?? ''
    expect(
      cc.includes('no-store'),
      `${path} svarade "${cc}" — no-store betyder att sidan renderas om vid ` +
        `varje besök i stället för att serveras från cache.`,
    ).toBe(false)
  }
})
