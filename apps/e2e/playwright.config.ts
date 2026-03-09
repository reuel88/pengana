import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./tests",
	globalTeardown: "./global-teardown.ts",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "html",
	projects: [
		{
			name: "web",
			testDir: "./tests/web",
			use: {
				...devices["Desktop Chrome"],
				baseURL: "http://localhost:3001",
				trace: "on",
				screenshot: "only-on-failure",
			},
		},
		{
			name: "extension",
			testDir: "./tests/extension",
			use: {
				browserName: "chromium",
				baseURL: "http://localhost:3001",
			},
		},
	],
	webServer: [
		{
			command: "pnpm --filter server dev",
			url: "http://localhost:3000",
			reuseExistingServer: !process.env.CI,
		},
		{
			command: "pnpm --filter web dev",
			url: "http://localhost:3001",
			reuseExistingServer: !process.env.CI,
		},
	],
});
