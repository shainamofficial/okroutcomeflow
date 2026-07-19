import { defineConfig, devices } from "@playwright/test";

const WEB = "http://localhost:8080";
const API = "http://localhost:8787";

// E2E specs live in ./e2e (outside src/), so Vitest (src/**) never picks them
// up. Playwright starts both dev servers, or reuses them if already running.
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: WEB,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "npm run dev -w apps/api",
      url: `${API}/health`,
      cwd: "../..",
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: "npm run dev -w apps/web",
      url: WEB,
      cwd: "../..",
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
