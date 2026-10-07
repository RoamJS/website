import path from "node:path";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: __dirname,
  testMatch: "*.spec.ts",
  workers: 1,
  use: { baseURL: "http://127.0.0.1:3216" },
  webServer: {
    command:
      "node node_modules/vite/bin/vite.js --config tests/inbox-fixture/vite.config.ts",
    cwd: path.resolve(__dirname, "../.."),
    url: "http://127.0.0.1:3216",
    reuseExistingServer: false,
  },
  reporter: "list",
});
