import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 300000,
  retries: 0,
  reporter: [
    ['html', { outputFolder: 'tests/e2e/report' }],
    ['list']
  ],
  use: {
    baseURL: process.env.TEST_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60000,
  }
})
