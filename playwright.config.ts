import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5174",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "uv --directory backend run uvicorn app.main:app --port 8010",
      url: "http://127.0.0.1:8010/docs",
      reuseExistingServer: false,
      env: {
        DATABASE_URL: "sqlite://",
        CORS_ORIGINS: "http://127.0.0.1:5174",
      },
    },
    {
      command: "npm --prefix frontend run dev -- --host 127.0.0.1 --port 5174",
      url: "http://127.0.0.1:5174",
      reuseExistingServer: false,
      env: {
        VITE_API_URL: "http://127.0.0.1:8010",
      },
    },
  ],
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
