import type { Page } from "@playwright/test";
import { TEST_PASSWORD, TEST_USER_NAME } from "../../constants.js";
import { expect, test } from "../../fixtures/native.js";
import { NativeAuthPage } from "../../page-objects/native/auth.page.js";

async function setNativeWebLocale(page: Page, locale: string) {
	await page.goto("/login");
	await page.evaluate((nextLocale) => {
		(
			globalThis as {
				localStorage: { setItem: (key: string, value: string) => void };
			}
		).localStorage.setItem("appLocale", nextLocale);
	}, locale);
	await page.reload();
}

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

	test("forgot password shows auth config failure and keeps submit disabled", async ({
		page,
	}) => {
		await page.route("**/rpc/authConfig*", async (route) => {
			await route.abort();
		});

		await page.goto("/forgot-password");

		await expect(page.getByTestId("auth-error")).toBeVisible();
		await expect(page.getByTestId("auth-submit")).toBeDisabled();
	});

	test("sign-in validation is translated after switching to Arabic", async ({
		page,
	}) => {
		await page.goto("/login");
		await page.getByRole("button", { name: "Change language" }).first().click();
		await page.getByRole("menuitem", { name: "العربية" }).click();
		await page.waitForURL(/login/);
		await page.getByTestId("auth-submit").click();
		await expect(page.getByText("البريد الإلكتروني مطلوب")).toBeVisible();
		await expect(page.getByText("كلمة المرور مطلوبة")).toBeVisible();
	});

	test("onboarding invite validation is translated in Arabic", async ({
		page,
	}) => {
		const ts = crypto.randomUUID();
		await setNativeWebLocale(page, "ar");
		await page.goto("/sign-up");
		await page.getByTestId("auth-name-input").fill(TEST_USER_NAME);
		await page.getByTestId("auth-email-input").fill(`invite-${ts}@e2e.test`);
		await page.getByTestId("auth-password-input").fill(TEST_PASSWORD);
		await page.getByTestId("auth-submit").click();
		await page.waitForURL(/onboarding/);
		await page.getByTestId("org-name-input").fill(`فريق ${ts.slice(0, 6)}`);
		await page.getByTestId("org-slug-input").fill(`org-${ts.slice(0, 8)}`);
		await page.getByTestId("org-submit").click();
		await page.getByTestId("invite-email-input-0").fill("not-an-email");
		await page.getByTestId("invite-submit").click();
		await expect(page.getByText("أدخل بريداً إلكترونياً صالحاً")).toBeVisible();
	});

	test("sign out", async ({ authenticatedPage: { page } }) => {
		// User is signed in and on /onboarding after sign-up
		await page.getByText("Sign Out").click();
		await expect(page).toHaveURL(/login/);
	});
});
