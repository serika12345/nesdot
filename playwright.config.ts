import { defineConfig, devices } from "@playwright/test";

const DEV_SERVER_PORT = 4173;
const DEV_SERVER_URL = `http://127.0.0.1:${DEV_SERVER_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: DEV_SERVER_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: {
    command: `pnpm dev --host 127.0.0.1 --port ${DEV_SERVER_PORT}`,
    url: DEV_SERVER_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
