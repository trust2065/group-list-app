import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5174',
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'npx firebase emulators:start --only firestore',
      port: 8080,
      reuseExistingServer: true,
      timeout: 15_000,
    },
    {
      command: 'VITE_USE_EMULATOR=true npx vite --port 5174',
      port: 5174,
      reuseExistingServer: false,
      timeout: 10_000,
    },
  ],
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
