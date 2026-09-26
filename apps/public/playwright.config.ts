import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'public.spec.ts',
  timeout: 90000,
  expect: { timeout: 15000 },
  workers: 1,
  maxFailures: 1,
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  outputDir: '../../artifacts/playwright-public',
  globalSetup: './tests/e2e/setup.ts',
  globalTeardown: './tests/e2e/teardown.ts',
  use: {
    baseURL: 'http://localhost:3100',
    browserName: 'chromium',
    headless: true,
    actionTimeout: 15000,
    trace: 'off',
    screenshot: 'only-on-failure'
  },
  webServer: [
    {
      command: 'node ../node_modules/tsx/dist/cli.mjs tests/ui-server.ts',
      cwd: '../../backend',
      url: 'http://127.0.0.1:4200/api/v1/health',
      reuseExistingServer: false,
      timeout: 120000
    },
    {
      command: 'node ../../node_modules/next/dist/bin/next dev --port 3100',
      url: 'http://localhost:3100/',
      env: {
        API_BASE_URL: 'http://127.0.0.1:4200/api/v1',
        NEXT_PUBLIC_SITE_URL: 'http://localhost:3100'
      },
      reuseExistingServer: false,
      timeout: 120000
    }
  ]
});
