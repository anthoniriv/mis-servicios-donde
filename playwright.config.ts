import { defineConfig } from '@playwright/test';

const previewUrl = 'http://127.0.0.1:4331';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: previewUrl },
  webServer: {
    command: 'npm run build --workspace @mis-servicios/web && npm run preview --workspace @mis-servicios/web',
    // Never reuse a running server: `astro dev` serves source, so reusing it
    // would silently test something other than the production build.
    reuseExistingServer: false,
    url: previewUrl,
  },
});
