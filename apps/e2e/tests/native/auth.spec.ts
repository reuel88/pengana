import { TEST_PASSWORD, TEST_USER_NAME } from "../../constants.js";
import { expect, test } from "../../fixtures/native.js";
import { NativeAuthPage } from "../../page-objects/native/auth.page.js";

test.describe("Authentication", () => {
	test("sign-in page loads", async ({ page }) => {
		const authPage = new NativeAuthPage(page);
		await authPage.navigateToSignIn();
		await expect(page.getByPlaceholder("Email")).toBeVisible();
	});

	test("sign-up page loads", async ({ page }) => {
		const authPage = new NativeAuthPage(page);
		await authPage.navigateToSignUp();
		await expect(page.getByPlaceholder("Name")).toBeVisible();
	});

	test("sign up succeeds", async ({ page }) => {
		const ts = crypto.randomUUID();
		const authPage = new NativeAuthPage(page);
		await authPage.signUp(
			TEST_USER_NAME,
			`signup-${ts}@e2e.test`,
			TEST_PASSWORD,
		);
		await expect(page).toHaveURL(/onboarding/);
	});

	test("sign in succeeds", async ({ page }) => {
		const ts = crypto.randomUUID();
		const email = `signin-${ts}@e2e.test`;
		const password = TEST_PASSWORD;
		const authPage = new NativeAuthPage(page);

		// Create account via sign-up
		await authPage.signUp(TEST_USER_NAME, email, password);
		await page.waitForURL(/onboarding/);

		// Sign out from onboarding page
		await page.getByText("Sign Out").click();
		await page.waitForURL(/login/);

		// Sign in with the created account
		await authPage.signIn(email, password);
		await expect(page).not.toHaveURL(/login/);
		await expect(page).not.toHaveURL(/sign-up/);
	});

	test("sign in fails with wrong password", async ({ page }) => {
		const authPage = new NativeAuthPage(page);
		await authPage.navigateToSignIn();
		await page.getByPlaceholder("Email").fill("nonexistent@e2e.test");
		await page.getByPlaceholder("Password").fill("wrongpassword");
		await page.getByRole("button", { name: "Sign In" }).click();
		// User should remain on the sign-in page
		await expect(page).toHaveURL(/login/);
		await expect(page.getByTestId("auth-error")).toBeVisible();
	});

	test("sign out", async ({ authenticatedPage: { page } }) => {
		// User is signed in and on /onboarding after sign-up
		await page.getByText("Sign Out").click();
		await expect(page).toHaveURL(/login/);
	});
});
