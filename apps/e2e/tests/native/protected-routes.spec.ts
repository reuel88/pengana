import { expect, test } from "../../fixtures/native.js";

test.describe("Protected Routes", () => {
	test("unauthenticated user visiting / redirects to sign-in", async ({
		page,
	}) => {
		await page.goto("/");
		await expect(page).toHaveURL(/login/);
	});

	test("unauthenticated user visiting /todos redirects to sign-in", async ({
		page,
	}) => {
		await page.goto("/todos");
		await expect(page).toHaveURL(/login/);
	});

	test("authenticated user without org is sent to /onboarding", async ({
		authenticatedPage: { page },
	}) => {
		// User is signed in but has no org; navigate to / to trigger the guard
		await page.goto("/");
		await expect(page).toHaveURL(/onboarding/);
	});
});
