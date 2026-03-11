import { TEST_PASSWORD } from "../../constants.js";
import { expect, test } from "../../fixtures/native.js";
import { NativeAuthPage } from "../../page-objects/native/auth.page.js";
import { NativeOrgPage } from "../../page-objects/native/org.page.js";

test.describe("Onboarding", () => {
	test("unauthenticated users are redirected to sign-in", async ({ page }) => {
		await page.goto("/onboarding");
		await expect(page).toHaveURL(/login/);
	});

	test("onboarding page is accessible", async ({ page }) => {
		const orgPage = new NativeOrgPage(page);
		await orgPage.navigateToOnboarding();
		// Unauthenticated users should be redirected
		await expect(page).not.toHaveURL("/onboarding");
	});

	test("full flow: sign up → create org → skip invites → reach dashboard", async ({
		page,
	}) => {
		const ts = crypto.randomUUID();
		const authPage = new NativeAuthPage(page);
		const orgPage = new NativeOrgPage(page);

		// Sign up
		await authPage.signUp(
			"Onboarding User",
			`onboarding-${ts}@e2e.test`,
			TEST_PASSWORD,
		);
		await page.waitForURL(/onboarding/);

		// Create org (native requires both name and slug)
		const slug = `e2e-org-${ts.slice(0, 8)}`;
		await orgPage.createOrg(`E2E Org ${ts}`, slug);
		await page.waitForURL(/onboarding/);

		// Skip invites
		await orgPage.skipInvites();

		// Should land on dashboard (not onboarding)
		await expect(page).toHaveURL("/");
	});
});
