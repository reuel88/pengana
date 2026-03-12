import { TEST_PASSWORD, TEST_USER_NAME } from "../../constants.js";
import { expect, test } from "../../fixtures/index.js";
import { signUpAndVerify } from "../../support/web-auth.js";

test.describe("Authentication", () => {
	test("sign-in page loads", async ({ authPage, page }) => {
		await authPage.navigateToSignIn();
		await expect(page).toHaveTitle(/pengana/);
	});

	test("sign-up page loads", async ({ authPage, page }) => {
		await authPage.navigateToSignUp();
		await expect(page).toHaveTitle(/pengana/);
	});

	test("sign up succeeds", async ({ authPage, page }) => {
		const ts = crypto.randomUUID();
		const email = `signup-${ts}@e2e.test`;
		await authPage.signUp(TEST_USER_NAME, email, TEST_PASSWORD);
		await expect(page).toHaveURL(/verify-email/);
		await authPage.verifyEmailFromDevInbox(email);
		await expect(page).toHaveURL(/onboarding/);
	});

	test("sign in succeeds", async ({ authPage, page }) => {
		const ts = crypto.randomUUID();
		const email = `signin-${ts}@e2e.test`;
		const password = TEST_PASSWORD;

		// Create account via sign-up + verification
		await signUpAndVerify(page, email, password, TEST_USER_NAME);

		// Sign out from onboarding page
		await page.getByRole("button", { name: "Sign Out" }).click();
		await page.waitForURL(/login/);

		// Sign in with the created account
		await authPage.signIn(email, password);
		await expect(page).not.toHaveURL(/login/);
		await expect(page).not.toHaveURL(/sign-up/);
	});

	test("sign in fails with wrong password", async ({ authPage, page }) => {
		await authPage.navigateToSignIn();
		await page.getByTestId("auth-email-input").fill("nonexistent@e2e.test");
		await page.getByTestId("auth-password-input").fill("wrongpassword");
		await page.getByRole("button", { name: "Sign in" }).click();
		// User should remain on the sign-in page
		await expect(page).toHaveURL(/login/);
		await expect(page.getByTestId("auth-error")).toBeVisible();
		await expect(page.getByTestId("auth-error")).toContainText(
			"Invalid email or password",
		);
	});

	test("sign out", async ({ authenticatedPage: { page } }) => {
		// User is signed in and on /onboarding after sign-up
		await page.getByRole("button", { name: "Sign Out" }).click();
		await expect(page).toHaveURL(/login/);
	});
});
