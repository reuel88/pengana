import { TEST_PASSWORD } from "../../constants.js";
import { expect, test } from "../../fixtures/index.js";
import { OrgPage } from "../../page-objects/org.page.js";

test.describe("Onboarding", () => {
	test("unauthenticated users are redirected to sign-in", async ({ page }) => {
		await page.goto("/onboarding");
		await expect(page).toHaveURL(/login/);
	});

	test("full flow: sign up → create org → skip invites → reach dashboard", async ({
		authPage,
		page,
	}) => {
		const ts = crypto.randomUUID();
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
