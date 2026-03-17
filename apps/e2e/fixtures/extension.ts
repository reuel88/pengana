import path from "node:path";
import { type BrowserContext, test as base, chromium } from "@playwright/test";
import { TEST_PASSWORD, TEST_USER_NAME } from "../constants.js";
import { AuthPage } from "../page-objects/auth.page.js";
import { OrgPage } from "../page-objects/org.page.js";

const EXTENSION_PATH = path.resolve(
	import.meta.dirname,
	"../../extension/.output/chrome-mv3",
);

async function launchExtensionContext() {
	const context = await chromium.launchPersistentContext("", {
		headless: false,
		args: [
			`--disable-extensions-except=${EXTENSION_PATH}`,
			`--load-extension=${EXTENSION_PATH}`,
		],
	});

	let serviceWorker = context.serviceWorkers()[0];
	if (!serviceWorker) {
		serviceWorker = await context.waitForEvent("serviceworker");
	}
	const extensionId = serviceWorker.url().split("/")[2] ?? "";

	return { context, extensionId };
}

export type ExtensionFixtures = {
	extensionContext: BrowserContext;
	extensionId: string;
	authenticatedExtensionContext: {
		context: BrowserContext;
		extensionId: string;
		email: string;
		password: string;
	};
	authenticatedWithOrgExtensionContext: {
		context: BrowserContext;
		extensionId: string;
		email: string;
		password: string;
		orgName: string;
	};
};

export const test = base.extend<ExtensionFixtures>({
	// biome-ignore lint/correctness/noEmptyPattern: Playwright fixtures require object destructuring
	extensionContext: async ({}, use) => {
		const { context } = await launchExtensionContext();
		await use(context);
		await context.close();
	},

	extensionId: async ({ extensionContext }, use) => {
		let serviceWorker = extensionContext.serviceWorkers()[0];
		if (!serviceWorker) {
			serviceWorker = await extensionContext.waitForEvent("serviceworker");
		}
		const extensionId = serviceWorker.url().split("/")[2] ?? "";
		await use(extensionId);
	},

	// biome-ignore lint/correctness/noEmptyPattern: Playwright fixtures require object destructuring
	authenticatedExtensionContext: async ({}, use) => {
		const { context, extensionId } = await launchExtensionContext();

		const page = await context.newPage();
		const ts = crypto.randomUUID();
		const email = `test-${ts}@e2e.test`;
		const password = TEST_PASSWORD;
		await page.goto("http://localhost:3001/sign-up");
		await page.getByTestId("auth-name-input").fill(TEST_USER_NAME);
		await page.getByTestId("auth-email-input").fill(email);
		await page.getByTestId("auth-password-input").fill(password);
		await page.getByRole("button", { name: "Sign Up" }).click();
		await page.waitForURL(/verify-email/);
		const authPage = new AuthPage(page);
		await authPage.verifyEmailFromDevInbox(email);
		await page.waitForURL(/onboarding/);
		await page.close();

		await use({ context, extensionId, email, password });
		await context.close();
	},

	// biome-ignore lint/correctness/noEmptyPattern: Playwright fixtures require object destructuring
	authenticatedWithOrgExtensionContext: async ({}, use) => {
		const { context, extensionId } = await launchExtensionContext();

		const page = await context.newPage();
		const ts = crypto.randomUUID();
		const email = `test-${ts}@e2e.test`;
		const password = TEST_PASSWORD;
		await page.goto("http://localhost:3001/sign-up");
		await page.getByTestId("auth-name-input").fill(TEST_USER_NAME);
		await page.getByTestId("auth-email-input").fill(email);
		await page.getByTestId("auth-password-input").fill(password);
		await page.getByRole("button", { name: "Sign Up" }).click();
		await page.waitForURL(/verify-email/);
		const authPage = new AuthPage(page);
		await authPage.verifyEmailFromDevInbox(email);
		await page.waitForURL(/onboarding/);

		const orgPage = new OrgPage(page);
		const orgName = `E2E Org ${email}`;
		await orgPage.createOrg(orgName);
		await page.waitForURL(/onboarding/);
		await orgPage.skipInvites();
		await page.close();

		await use({ context, extensionId, email, password, orgName });
		await context.close();
	},
});

export { expect } from "@playwright/test";
