import { defineConfig, devices, type PlaywrightTestConfig } from "@playwright/test";

const PORT = Number(process.env["PORT"] ?? 3000);
const CI = process.env["CI"] === "true" || process.env["CI"] === "1";
const EXTERNAL_BASE_URL = process.env["PLAYWRIGHT_BASE_URL"];
const BASE_URL = EXTERNAL_BASE_URL ?? `http://localhost:${PORT.toString()}`;

/**
 * Playwright config for `apps/web` end-to-end tests.
 *
 * Runs the web app via `pnpm start` (already built) in CI, or reuses a
 * running `pnpm dev` locally.
 */
const config: PlaywrightTestConfig = {
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  reporter: CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
};

if (CI) config.workers = 1;

if (!EXTERNAL_BASE_URL) {
  config.webServer = {
    command: `pnpm start --port ${PORT.toString()}`,
    url: BASE_URL,
    reuseExistingServer: !CI,
    timeout: 120_000,
  };
}

export default defineConfig(config);
