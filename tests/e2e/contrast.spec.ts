import { test, expect, type Page } from '@playwright/test'

/**
 * WCAG 1.4.3 (kontrast, AA) mätt mot verklig DOM i båda teman.
 *
 * Mäter beräknad textfärg mot den effektiva bakgrunden och kräver 4.5:1
 * (3:1 för stor text). Vid start: ~90 brott, främst för svag --muted-foreground
 * och accentfärgen använd som text på mörkt tema. Se UX-AUDIT-2026-08-03.md.
 *
 * Medvetet konservativ: element vars bakgrund inte går att bestämma säkert
 * (gradient, bild, oklab-färg i kedjan) hoppas över hellre än rapporteras som
 * brott — falska fynd är dyrare än missade.
 */
const ROUTES = [
  '/nyheter', '/allsvenskan/tabell', '/prenumerera', '/mer', '/statistik', '/forum',
  // Andra vändan: ytorna som första svepet aldrig rörde.
  '/', '/allsvenskan', '/match', '/mitt-lag', '/daily', '/podcast', '/analys',
  '/allsvenskan/spelschema', '/allsvenskan/skytteliga', '/statistik/spelare',
  '/om-oss', '/ai-transparens',
]

/**
 * Vakt mot att accentfärgen åter används som textfärg. `text-pitch`,
 * `text-pitch-light` och `text-pitch-dark` är fasta hex som inte växlar med
 * temat och ger 2.0–2.8:1. Använd `text-pitch-ink`. Ytor (`bg-pitch`,
 * `border-pitch`, `bg-pitch-dark`) är fortsatt rätt.
 */
test('accentfärgen används inte som statisk textfärg', async () => {
  const { readdirSync, readFileSync, statSync } = await import('fs')
  const { join } = await import('path')

  const offenders: string[] = []
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      if (statSync(p).isDirectory()) {
        if (name !== 'node_modules' && name !== '.next') walk(p)
        continue
      }
      if (!/\.tsx?$/.test(name)) continue
      readFileSync(p, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          // Även den godtyckliga formen: `text-[var(--color-pitch)]` smet förbi
          // den första vakten och gjorde sidomenyns aktiva post 2.34:1 i mörkt.
          if (
            /text-pitch(?![-\w/])|text-pitch-light\b|text-pitch-dark\b/.test(line) ||
            /text-\[var\(--color-pitch(-light)?\)\]/.test(line)
          ) {
            offenders.push(`${p}:${i + 1}`)
          }
          // text-red-400 är overridad per tema i globals.css och red-600 mäter
          // 4.83:1 på vitt. red-500 är varken overridad eller tillräcklig:
          // 3.81:1 på vit yta, vilket gjorde LIVE-märket på matchsidan svårläst
          // i ljust läge. Använd text-destructive-ink.
          if (/text-red-500(?![-\w/])/.test(line) && !/^\s*(\/\/|\*|\{\/\*)/.test(line)) {
            offenders.push(`${p}:${i + 1} (text-red-500 → text-destructive-ink)`)
          }
        })
    }
  }
  for (const root of ['app', 'components']) walk(root)

  expect(offenders, `använd text-pitch-ink i stället:\n${offenders.join('\n')}`).toEqual([])
})

type Theme = 'light' | 'dark'

async function openThemed(page: Page, route: string, theme: Theme) {
  // next-themes styr temat via .dark-klassen + localStorage, inte via
  // prefers-color-scheme — emulateMedia ensamt ger en inkonsekvent DOM.
  await page.emulateMedia({ colorScheme: theme })
  await page.addInitScript((t) => {
    localStorage.setItem('theme', t)
  }, theme)
  await page.goto(route, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1800)

  // Vänta på att temats VARIABLER faktiskt gäller, inte bara att .dark-
  // klassen satts. WebKit hinner rendera ett mellanläge med mörk bakgrund
  // och ljusa texttokens — det ser ut som ~90 kontrastbrott och är bara
  // en flash. Mätning i det läget är värdelös.
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const cs = getComputedStyle(document.documentElement)
          // Gate på den FAKTISKT målade bakgrunden, inte bara på klassen
          // eller --foreground. Under temaflashen hinner de gå isär: html
          // får .dark och mörk textfärg medan bakgrunden ännu är ljus, och
          // mätning i det läget ger ~90 falska brott.
          const bg = getComputedStyle(document.body).backgroundColor
          return `${document.documentElement.classList.contains('dark')}|${bg}|${cs
            .getPropertyValue('--background')
            .trim()
            .toLowerCase()}`
        }),
      { timeout: 15000 },
    )
    .toBe(
      theme === 'dark'
        ? 'true|rgb(0, 0, 0)|#000'
        : 'false|rgb(250, 250, 248)|#fafaf8',
    )
}

async function expectNoViolations(page: Page, label: string) {
  const rows = await page.evaluate(() => {
    const lum = (c: number[]) => {
      const [r, g, b] = c.map((v) => {
        const s = v / 255
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
      })
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    // Låt webbläsaren tolka färgen i stället för att parsa själv: måla en
    // pixel och läs tillbaka den. Täcker allt Chrome/WebKit förstår —
    // rgb(), rgba(), lab(), oklch(), color(srgb …) — som Tailwind v4 sprider
    // överallt. (fillStyle-strängen duger INTE: den bevarar color()/lab()
    // oöversatt.) Ogiltig sträng lämnar fillStyle orörd → sentineltestet.
    // Memoiserat: samma ~20 strängar per sida.
    const ctx = document.createElement('canvas').getContext('2d', {
      willReadFrequently: true,
    })!
    const cache = new Map<string, number[] | null>()
    const parse = (s: string): number[] | null => {
      if (cache.has(s)) return cache.get(s)!
      const set = (sentinel: string) => {
        ctx.fillStyle = sentinel
        ctx.fillStyle = s
        return ctx.fillStyle as string
      }
      let v: number[] | null = null
      if (set('#000') === set('#fff')) {
        ctx.clearRect(0, 0, 1, 1)
        ctx.fillRect(0, 0, 1, 1)
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
        v = [r, g, b, a / 255]
      }
      cache.set(s, v)
      return v
    }
    // src (rgba) lagt över dst (opak rgb).
    const over = (src: number[], dst: number[]) =>
      [0, 1, 2].map((i) => src[i] * src[3] + dst[i] * (1 - src[3]))

    // Effektiv bakgrund: samla halvgenomskinliga lager uppåt tills en opak
    // hittas, komposita sedan ned dem. null = obestämbar (gradient/bild
    // eller okänd färgsyntax) → mät inte, hellre missa ett fynd än brus.
    const bgOf = (el: Element): number[] | null => {
      const layers: number[][] = []
      let n: Element | null = el
      while (n) {
        const s = getComputedStyle(n)
        if (s.backgroundImage && s.backgroundImage !== 'none') return null
        const c = parse(s.backgroundColor)
        if (!c) return null
        if (c[3] >= 0.999) {
          return layers.reduceRight((dst, src) => over(src, dst), [c[0], c[1], c[2]])
        }
        if (c[3] > 0) layers.push(c)
        n = n.parentElement
      }
      // Ingen opak bakgrund hela vägen upp → canvas/vitt papper under.
      return layers.reduceRight((dst, src) => over(src, dst), [255, 255, 255])
    }
    const ratio = (a: number[], b: number[]) => {
      const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x)
      return (l1 + 0.05) / (l2 + 0.05)
    }

    const out: any[] = []
    const seen = new Set<string>()
    for (const el of Array.from(document.querySelectorAll('*'))) {
      const text = Array.from(el.childNodes)
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent || '')
        .join('')
        .trim()
      if (!text) continue
      const r = el.getBoundingClientRect()
      const s = getComputedStyle(el)
      if (!r.width || !r.height || s.visibility === 'hidden' || s.display === 'none') continue
      if (s.opacity === '0') continue

      const raw = parse(s.color)
      if (!raw || raw[3] === 0) continue
      const bg = bgOf(el)
      if (!bg) continue
      // Halvgenomskinlig text mäts som den faktiskt syns, inte som sin token.
      const fg = raw[3] >= 0.999 ? raw.slice(0, 3) : over(raw, bg)
      const cr = ratio(fg, bg)

      const px = parseFloat(s.fontSize)
      const bold = parseInt(s.fontWeight, 10) >= 700
      const large = px >= 24 || (px >= 18.66 && bold)
      const need = large ? 3 : 4.5
      if (cr >= need) continue

      const key = `${s.color}|${s.fontSize}|${text.slice(0, 20)}`
      if (seen.has(key)) continue
      seen.add(key)

      out.push({
        text: text.slice(0, 40),
        color: s.color,
        bg: `rgb(${bg.join(',')})`,
        px: Math.round(px),
        weight: s.fontWeight,
        ratio: Math.round(cr * 100) / 100,
        need,
        cls: (el.getAttribute('class') || '').slice(0, 70),
      })
    }
    return out
  })

  const report = rows
    .map((r) => `  ${r.ratio}:1 (kräver ${r.need}) ${r.px}px w${r.weight} ${r.color} på ${r.bg} — ${JSON.stringify(r.text)}`)
    .join('\n')
  expect(rows, `kontrastbrott ${label}:\n${report}`).toEqual([])
}

for (const theme of ['light', 'dark'] as const) {
  for (const route of ROUTES) {
    test(`contrast ${theme} ${route}`, async ({ page }) => {
      await openThemed(page, route, theme)
      await expectNoViolations(page, `${theme} på ${route}`)
    })
  }

  // Djupsidor har inga stabila URL:er — plocka en riktig länk från listsidan
  // i stället för att hårdkoda id:n som ruttnar vid nästa säsong.
  for (const [listing, pattern] of [
    ['/nyheter', '/artikel/'],
    ['/allsvenskan/tabell', '/lag/'],
    ['/allsvenskan/skytteliga', '/spelare/'],
    ['/match', '/match/'],
  ] as const) {
    test(`contrast ${theme} ${pattern}[djup]`, async ({ page }) => {
      await openThemed(page, listing, theme)
      // count() först: listsidan kan vara tom (inga matcher just nu), och då ska
      // testet hoppas över, inte timea ut i getAttribute.
      const link = page.locator(`a[href*="${pattern}"]`).first()
      test.skip((await link.count()) === 0, `ingen ${pattern}-länk på ${listing} — saknas data`)
      const href = await link.getAttribute('href')
      test.skip(!href, `tom href på ${listing}`)
      await openThemed(page, href!, theme)
      await expectNoViolations(page, `${theme} på ${href}`)
    })
  }

  // Lagets sektionsrutter kom till nar `?tab=` blev riktiga routes. De ar
  // egna sidor med egen markup — utan svepet har kunde analysytan regressera
  // utan att nagot test markte det.
  for (const section of ['/analys', '/matcher', '/trupp', '/poddar'] as const) {
    test(`contrast ${theme} /lag/[djup]${section}`, async ({ page }) => {
      await openThemed(page, '/allsvenskan/tabell', theme)
      const link = page.locator('a[href*="/lag/"]').first()
      test.skip((await link.count()) === 0, 'ingen lagsida i tabellen — saknas data')
      const href = await link.getAttribute('href')
      test.skip(!href, 'tom href i tabellen')
      await openThemed(page, `${href}${section}`, theme)
      await expectNoViolations(page, `${theme} på ${href}${section}`)
    })
  }
}
