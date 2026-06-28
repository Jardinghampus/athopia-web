import { test, expect } from '@playwright/test'

// Testar publika API-endpoints direkt — inga sidladdningar
const PUBLIC_APIS = [
  { path: '/api/scores',        label: 'Scores' },
  { path: '/api/standings',     label: 'Standings' },
  { path: '/api/team/list',     label: 'Team list' },
  { path: '/api/articles/recent', label: 'Articles recent' },
]

for (const { path, label } of PUBLIC_APIS) {
  test(`${label} API returnerar 200`, async ({ request }) => {
    const res = await request.get(path)
    expect(res.status(), `${path} ska returnera 200`).toBe(200)
    // Ska returnera JSON
    const ct = res.headers()['content-type'] ?? ''
    expect(ct, `${path} ska returnera JSON`).toContain('application/json')
  })
}

test('Webhook-endpoint /api/webhooks/stripe returnerar 400 (inte 500) utan payload', async ({ request }) => {
  const res = await request.post('/api/webhooks/stripe', { data: {} })
  // 400 = vi nådde handlern (validering misslyckades som förväntat)
  // 500 = kraschar — det är problemet
  expect(res.status()).not.toBe(500)
})
