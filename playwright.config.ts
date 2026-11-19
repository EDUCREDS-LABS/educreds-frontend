import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT || 4173);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx vite --host 127.0.0.1 --port 4173',
    port,
    reuseExistingServer: !process.env.CI,
    cwd: '.',
    env: {
      NODE_ENV: 'test',
      VITE_API_BASE: 'https://api.educreds.test',
      VITE_CERT_API_BASE: 'https://api.educreds.test',
      VITE_MARKETPLACE_API_BASE: 'https://api.educreds.test',
      VITE_TRUST_AGENT_API_BASE: 'https://trust-agent.educreds.test',
      VITE_BYPASS_AUTH: 'false',
    },
  },
});
