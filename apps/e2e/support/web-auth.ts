import type { Page } from "@playwright/test";
import { TEST_USER_NAME } from "../constants.js";
import { AuthPage } from "../page-objects/auth.page.js";

export async function signUpAndVerify(
	page: Page,
	email: string,
	password: string,
	name = TEST_USER_NAME,
) {
	const authPage = new AuthPage(page);
	await authPage.signUp(name, email, password);
	await page.waitForURL(/verify-email/);
	await authPage.verifyEmailFromDevInbox(email);
	await page.waitForURL(/onboarding/);
	return authPage;
}
