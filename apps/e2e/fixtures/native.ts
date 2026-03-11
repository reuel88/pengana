import { test as base, type Page } from "@playwright/test";
import { TEST_PASSWORD, TEST_USER_NAME } from "../constants.js";
import { NativeAuthPage } from "../page-objects/native/auth.page.js";
import { NativeOrgPage } from "../page-objects/native/org.page.js";

export type NativeTestFixtures = {
	nativeAuthPage: NativeAuthPage;
	authenticatedPage: { page: Page; email: string; password: string };
	authenticatedWithOrgPage: { page: Page; email: string; password: string };
};

export const test = base.extend<NativeTestFixtures>({
	nativeAuthPage: async ({ page }, use) => {
		await use(new NativeAuthPage(page));
	},

	authenticatedPage: async ({ page }, use) => {
		const ts = crypto.randomUUID();
		const email = `test-${ts}@e2e.test`;
		const password = TEST_PASSWORD;
		const authPage = new NativeAuthPage(page);
		await authPage.signUp(TEST_USER_NAME, email, password);
		await page.waitForURL(/onboarding/);
		await use({ page, email, password });
	},

	authenticatedWithOrgPage: async ({ authenticatedPage }, use) => {
		const { page, email, password } = authenticatedPage;
		const orgPage = new NativeOrgPage(page);
		const slug = `e2e-org-${crypto.randomUUID().slice(0, 8)}`;
		await orgPage.createOrg(`E2E Org ${email}`, slug);
		await orgPage.skipInvites();
		await page.waitForURL((url) => !url.pathname.includes("onboarding"));
		await use({ page, email, password });
	},
});

export { expect } from "@playwright/test";
