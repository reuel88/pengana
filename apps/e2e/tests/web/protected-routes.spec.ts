import { expect, test } from "../../fixtures/index.js";

test.describe("Protected Routes", () => {
	test("unauthenticated user visiting / redirects to sign-in", async ({
		page,
	}) => {
		await page.goto("/");
		await expect(page).toHaveURL(/login/);
	});

	test("unauthenticated user visiting /org/settings redirects to sign-in", async ({
		page,
	}) => {
		await page.goto("/org/settings");
		await expect(page).toHaveURL(/login/);
	});

	test("authenticated user without org is sent to /onboarding", async ({
		authenticatedPage: { page },
	}) => {
		// User is signed in but has no org; navigate to / to trigger the guard
		await page.goto("/");
		await expect(page).toHaveURL(/onboarding/);
	});

	test("authenticated user without org visiting /login is sent to /onboarding", async ({
		authenticatedPage: { page },
	}) => {
		await page.goto("/login");
		await expect(page).toHaveURL(/onboarding/);
	});

	test("authenticated user without org visiting /sign-up is sent to /onboarding", async ({
		authenticatedPage: { page },
	}) => {
		await page.goto("/sign-up");
		await expect(page).toHaveURL(/onboarding/);
	});

	test("authenticated user without org visiting /forgot-password is sent to /onboarding", async ({
		authenticatedPage: { page },
	}) => {
		await page.goto("/forgot-password");
		await expect(page).toHaveURL(/onboarding/);
	});

	test("authenticated user with org visiting /login is sent to /", async ({
		authenticatedWithOrgPage: { page },
	}) => {
		await page.goto("/login");
		await expect(page).toHaveURL(/\/$/);
	});

	test("authenticated user with org visiting /sign-up is sent to /", async ({
		authenticatedWithOrgPage: { page },
	}) => {
		await page.goto("/sign-up");
		await expect(page).toHaveURL(/\/$/);
	});

	test("authenticated user with org visiting /forgot-password is sent to /", async ({
		authenticatedWithOrgPage: { page },
	}) => {
		await page.goto("/forgot-password");
		await expect(page).toHaveURL(/\/$/);
	});
});
