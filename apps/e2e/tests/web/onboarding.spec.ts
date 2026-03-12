import { TEST_PASSWORD } from "../../constants.js";
import { expect, test } from "../../fixtures/index.js";
import { OrgPage } from "../../page-objects/org.page.js";
import { signUpAndVerify } from "../../support/web-auth.js";

test.describe("Onboarding", () => {
	test("unauthenticated users are redirected to sign-in", async ({ page }) => {
		await page.goto("/onboarding");
		await expect(page).toHaveURL(/login/);
	});

	test("full flow: sign up → create org → skip invites → reach dashboard", async ({
		page,
	}) => {
		const ts = crypto.randomUUID();
		const orgPage = new OrgPage(page);

		// Sign up + verify email
		await signUpAndVerify(
			page,
			`onboarding-${ts}@e2e.test`,
			TEST_PASSWORD,
			"Onboarding User",
		);

		// Create org
		await orgPage.createOrg(`E2E Org ${ts}`);
		await page.waitForURL(/onboarding/);

		// Skip invites
		await orgPage.skipInvites();

		// Should land on dashboard (not onboarding)
		await expect(page).toHaveURL("/");
	});
});
