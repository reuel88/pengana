import { expect, test } from "../../fixtures/extension.js";
import { PopupPage } from "../../page-objects/extension/popup.page.js";

test.describe("Extension popup — unauthenticated", () => {
	test("shows login prompt when not signed in", async ({
		extensionContext,
		extensionId,
	}) => {
		const page = await extensionContext.newPage();
		const popup = new PopupPage(page);
		await popup.navigateToPopup(extensionId);
		await expect(popup.getLoginPrompt()).toBeVisible();
	});

	test("login button opens web app login in new tab", async ({
		extensionContext,
		extensionId,
	}) => {
		const page = await extensionContext.newPage();
		const popup = new PopupPage(page);
		await popup.navigateToPopup(extensionId);

		const [newPage] = await Promise.all([
			extensionContext.waitForEvent("page"),
			popup.getLoginButton().click(),
		]);

		await newPage.waitForLoadState();
		expect(newPage.url()).toContain("/login");
	});
});

test.describe("Extension popup — authenticated without org", () => {
	test("shows onboarding prompt after sign in", async ({
		authenticatedExtensionContext: { context, extensionId },
	}) => {
		const page = await context.newPage();
		const popup = new PopupPage(page);
		await popup.navigateToPopup(extensionId);
		await expect(popup.getOnboardingPrompt()).toBeVisible();
	});
});

test.describe("Extension popup — authenticated with org", () => {
	test("shows todo page after org creation", async ({
		authenticatedWithOrgExtensionContext: { context, extensionId },
	}) => {
		const page = await context.newPage();
		const popup = new PopupPage(page);
		await popup.navigateToPopup(extensionId);
		await expect(popup.getTodoPage()).toBeVisible({ timeout: 10000 });
	});
});
