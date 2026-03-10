import { TEST_PASSWORD } from "../../constants.js";
import { expect, test } from "../../fixtures/index.js";
import { AuthPage } from "../../page-objects/auth.page.js";
import { OrgPage } from "../../page-objects/org.page.js";

test.describe("Onboarding", () => {
	test("unauthenticated users are redirected to sign-in", async ({ page }) => {
		await page.goto("/onboarding");
		await expect(page).toHaveURL(/login/);
	});

	test("onboarding page is accessible", async ({ page }) => {
		const orgPage = new OrgPage(page);
		await orgPage.navigateToOnboarding();
		// Unauthenticated users should be redirected
		await expect(page).not.toHaveURL("/onboarding");
	});

	test("full flow: sign up → create org → skip invites → reach dashboard", async ({
		page,
	}) => {
		const ts = crypto.randomUUID();
		const authPage = new AuthPage(page);
		const orgPage = new OrgPage(page);

		// Sign up
		await authPage.signUp(
			"Onboarding User",
			`onboarding-${ts}@e2e.test`,
			TEST_PASSWORD,
		);
		await page.waitForURL(/onboarding/);

		// Create org
		await orgPage.createOrg(`E2E Org ${ts}`);
		await page.waitForURL(/onboarding/);

		// Skip invites
		await orgPage.skipInvites();

		// Should land on dashboard (not onboarding)
		await expect(page).toHaveURL("/");
	});
});
