import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://127.0.0.1:4321',
  },
  webServer: {
    command: 'npm run build --workspace @mis-servicios/web && npm run preview --workspace @mis-servicios/web',
    reuseExistingServer: true,
    url: 'http://127.0.0.1:4321',
  },
});
