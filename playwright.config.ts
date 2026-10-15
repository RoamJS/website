import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "@playwright/test";

loadEnvConfig(process.cwd());

export default defineConfig({
  testDir: "./tests/browser",
  use: { baseURL: "http://localhost:3215", ...devices["Desktop Chrome"] },
  workers: 1,
  reporter: "list",
});
