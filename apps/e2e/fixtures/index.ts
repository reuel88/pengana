import { test as base, type Page } from "@playwright/test";
import { TEST_PASSWORD, TEST_USER_NAME } from "../constants.js";
import { AuthPage } from "../page-objects/auth.page.js";
import { OrgPage } from "../page-objects/org.page.js";
import { TodoPage } from "../page-objects/todo.page.js";

export type TestFixtures = {
	authPage: AuthPage;
	todoPage: TodoPage;
	authenticatedPage: { page: Page; email: string; password: string };
	authenticatedWithOrgPage: { page: Page; email: string; password: string };
};

export const test = base.extend<TestFixtures>({
	authPage: async ({ page }, use) => {
		await use(new AuthPage(page));
	},

	todoPage: async ({ page }, use) => {
		await use(new TodoPage(page));
	},

	authenticatedPage: async ({ page }, use) => {
		const ts = crypto.randomUUID();
		const email = `test-${ts}@e2e.test`;
		const password = TEST_PASSWORD;
		const authPage = new AuthPage(page);
		await authPage.signUp(TEST_USER_NAME, email, password);
		await page.waitForURL(/onboarding/);
		await use({ page, email, password });
	},

	authenticatedWithOrgPage: async ({ authenticatedPage }, use) => {
		const { page, email, password } = authenticatedPage;
		const orgPage = new OrgPage(page);
		await orgPage.createOrg(`E2E Org ${email}`);
		await page.waitForURL(/onboarding/);
		await orgPage.skipInvites();
		await use({ page, email, password });
	},
});

export { expect } from "@playwright/test";
