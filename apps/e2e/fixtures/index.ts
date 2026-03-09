import { test as base, type Page } from "@playwright/test";
import { AuthPage } from "../page-objects/auth.page.js";
import { OrgPage } from "../page-objects/org.page.js";

export type TestFixtures = {
	authPage: AuthPage;
	authenticatedPage: { page: Page; email: string; password: string };
	authenticatedWithOrgPage: { page: Page; email: string; password: string };
};

export const test = base.extend<TestFixtures>({
	authPage: async ({ page }, use) => {
		await use(new AuthPage(page));
	},

	authenticatedPage: async ({ page }, use) => {
		const ts = Date.now();
		const email = `test-${ts}@e2e.test`;
		const password = "Password123!";
		const authPage = new AuthPage(page);
		await authPage.signUp("Test User", email, password);
		await page.waitForURL(/onboarding/);
		await use({ page, email, password });
	},

	authenticatedWithOrgPage: async ({ page }, use) => {
		const ts = Date.now();
		const email = `test-${ts}@e2e.test`;
		const password = "Password123!";
		const authPage = new AuthPage(page);
		const orgPage = new OrgPage(page);
		await authPage.signUp("Test User", email, password);
		await page.waitForURL(/onboarding/);
		await orgPage.createOrg(`E2E Org ${ts}`);
		await page.waitForURL(/onboarding/);
		await orgPage.skipInvites();
		await use({ page, email, password });
	},
});

export { expect } from "@playwright/test";
