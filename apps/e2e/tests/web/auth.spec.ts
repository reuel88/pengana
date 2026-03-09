import { expect, test } from "../../fixtures/index.js";
import { AuthPage } from "../../page-objects/auth.page.js";

test.describe("Authentication", () => {
	test("sign-in page loads", async ({ page }) => {
		const authPage = new AuthPage(page);
		await authPage.navigateToSignIn();
		await expect(page).toHaveTitle(/pengana/);
	});

	test("sign-up page loads", async ({ page }) => {
		const authPage = new AuthPage(page);
		await authPage.navigateToSignUp();
		await expect(page).toHaveTitle(/pengana/);
	});

	test("sign up succeeds", async ({ page }) => {
		const ts = Date.now();
		const authPage = new AuthPage(page);
		await authPage.signUp("Test User", `signup-${ts}@e2e.test`, "Password123!");
		await expect(page).toHaveURL(/onboarding/);
	});

	test("sign in succeeds", async ({ page }) => {
		const ts = Date.now();
		const email = `signin-${ts}@e2e.test`;
		const password = "Password123!";
		const authPage = new AuthPage(page);

		// Create account via sign-up
		await authPage.signUp("Test User", email, password);
		await page.waitForURL(/onboarding/);

		// Sign out from onboarding page
		await page.getByRole("button", { name: "Sign Out" }).click();
		await page.waitForURL(/login/);

		// Sign in with the created account
		await authPage.signIn(email, password);
		await expect(page).not.toHaveURL(/login/);
		await expect(page).not.toHaveURL(/sign-up/);
	});

	test("sign in fails with wrong password", async ({ page }) => {
		const authPage = new AuthPage(page);
		await authPage.navigateToSignIn();
		await page.getByLabel("Email").fill("nonexistent@e2e.test");
		await page.getByLabel("Password").fill("wrongpassword");
		await page.getByRole("button", { name: "Sign in" }).click();
		// User should remain on the sign-in page
		await expect(page).toHaveURL(/login/);
	});

	test("sign out", async ({ authenticatedPage: { page } }) => {
		// User is signed in and on /onboarding after sign-up
		await page.getByRole("button", { name: "Sign Out" }).click();
		await expect(page).toHaveURL(/login/);
	});
});
