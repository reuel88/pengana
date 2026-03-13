import { TEST_PASSWORD, TEST_USER_NAME } from "../../constants.js";
import { expect, test } from "../../fixtures/index.js";
import { AuthPage } from "../../page-objects/auth.page.js";
import { signUpAndVerify } from "../../support/web-auth.js";

test.describe("Authentication Flows", () => {
	test("verify email callback shows invalid token state", async ({ page }) => {
		await page.goto("/verify-email/callback?token=invalid-token");
		await expect(
			page.getByText("This verification link is invalid or has expired."),
		).toBeVisible();
		await expect(
			page.getByRole("link", { name: "Back to Sign In" }),
		).toBeVisible();
	});

	test("forgot password email sends and reset succeeds", async ({
		page,
		browser,
	}) => {
		const email = `reset-${crypto.randomUUID()}@e2e.test`;
		const newPassword = "Password456!";
		const resetContext = await browser.newContext();
		const resetPage = await resetContext.newPage();
		const authPage = new AuthPage(resetPage);

		await signUpAndVerify(page, email, TEST_PASSWORD, TEST_USER_NAME);

		await authPage.requestPasswordReset(email);
		await authPage.resetPasswordFromDevInbox(email);
		await authPage.resetPassword(newPassword);
		await expect(resetPage).toHaveURL(/login/);

		await authPage.signIn(email, TEST_PASSWORD);
		await expect(resetPage).toHaveURL(/login/);
		await expect(resetPage.getByTestId("auth-error")).toBeVisible();

		await authPage.signIn(email, newPassword);
		await expect(resetPage).not.toHaveURL(/login/);

		await resetContext.close();
	});

	test("reset password shows invalid token state", async ({ page }) => {
		await page.goto("/reset-password?token=invalid-token");
		await page.getByTestId("auth-password-input").fill(TEST_PASSWORD);
		await page.getByTestId("auth-confirm-password-input").fill(TEST_PASSWORD);
		await page.getByRole("button", { name: "Reset Password" }).click();
		await expect(page.getByTestId("auth-error")).toContainText("Invalid token");
	});

	test("magic link sign in succeeds", async ({ page, browser }) => {
		const email = `magic-${crypto.randomUUID()}@e2e.test`;
		const magicContext = await browser.newContext();
		const magicPage = await magicContext.newPage();
		const authPage = new AuthPage(magicPage);

		await signUpAndVerify(page, email, TEST_PASSWORD, TEST_USER_NAME);
		await authPage.requestMagicLink(email);
		await expect(magicPage).toHaveURL(/magic-link\/pending/);

		await authPage.openMagicLinkFromDevInbox(email);
		await expect(magicPage).toHaveURL(/onboarding/);

		await magicContext.close();
	});

	test("magic link invalid callback shows failure state", async ({ page }) => {
		await page.goto("/magic-link/verify");
		await expect(
			page.getByText("This verification link is invalid or has expired."),
		).toBeVisible();
		await expect(
			page.getByRole("link", { name: "Or sign in with password" }),
		).toBeVisible();
	});

	test("account password change updates credentials", async ({
		authenticatedPage: { page, email, password },
	}) => {
		const authPage = new AuthPage(page);
		const newPassword = "Password789!";

		await page.goto("/settings/account");
		await page.getByLabel("Current Password").fill(password);
		await page.getByLabel("New Password").fill(newPassword);
		await page.getByLabel("Confirm Password").fill(newPassword);
		await page.getByRole("button", { name: "Change Password" }).click();
		await expect(
			page.getByText("Password changed successfully."),
		).toBeVisible();

		await authPage.signOut();

		await authPage.signIn(email, password);
		await expect(page).toHaveURL(/login/);
		await expect(page.getByTestId("auth-error")).toBeVisible();

		await authPage.signIn(email, newPassword);
		await expect(page).not.toHaveURL(/login/);
	});
});
