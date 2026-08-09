import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 1,
  // En kall Turbopack-kompilering av en route tar lätt mer än 30 s på en
  // belastad maskin. Gränserna sitter här i stället för hårdkodade per anrop,
  // så att det finns en knapp att vrida på i stället för tolv.
  timeout: 120000,
  reporter: [
    ['html', { outputFolder: 'tests/e2e/report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.TEST_URL || 'http://localhost:3000',
    navigationTimeout: 90000,
    actionTimeout: 20000,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  // Pekar TEST_URL på en riktig miljö ska ingen dev-server startas. Utan detta
  // bootade varje prodkörning en lokal server som testerna sedan aldrig använde
  // — körningen hängde i stället för att köra. Prod är dessutom enda stället där
  // vissa fel syns alls: länkkontrollen gav 0 trasiga lokalt när prod hade 2.
  webServer: process.env.TEST_URL
    ? undefined
    : {
        command: 'pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 60000,
      },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile',   use: { ...devices['iPhone 15'] } },
  ],
})
