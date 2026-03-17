import { TEST_PASSWORD, TEST_USER_NAME } from "../../constants.js";
import { expect, test } from "../../fixtures/index.js";
import { OrgPage } from "../../page-objects/org.page.js";
import { TEST_JPEG_PAYLOAD } from "../../support/test-files.js";
import { signUpAndVerify } from "../../support/web-auth.js";

test.describe("Attachment org isolation", () => {
	test.use({ storageState: undefined });

	test("personal todo attachment in org A is not visible in org B", async ({
		page,
		todoPage,
	}) => {
		const orgPage = new OrgPage(page);
		const id = crypto.randomUUID().slice(0, 8);
		const email = `att-${id}@e2e.test`;

		// Sign up and create Org A
		await signUpAndVerify(page, email, TEST_PASSWORD, TEST_USER_NAME);
		await orgPage.createOrg(`Org A ${id}`);
		await page.waitForURL(/onboarding/);
		await orgPage.skipInvites();

		// Add personal 2do and attach a file
		await todoPage.navigate();
		await todoPage.addTodo("Todo With Attachment");
		await expect(todoPage.todoRowLocator("Todo With Attachment")).toBeVisible();
		await todoPage.attachFileToTodo("Todo With Attachment", TEST_JPEG_PAYLOAD);
		await expect(
			todoPage.attachmentLocator("Todo With Attachment"),
		).toBeVisible();

		// Create Org B — 2do and attachment should not be visible
		await orgPage.createOrgFromSwitcher(`Org B ${id}`);
		await todoPage.navigate();
		await expect(
			todoPage.todoRowLocator("Todo With Attachment"),
		).not.toBeVisible();

		// Switch back to Org A — 2do with attachment reappears
		await orgPage.switchOrg(`Org A ${id}`);
		await todoPage.navigate();
		await expect(todoPage.todoRowLocator("Todo With Attachment")).toBeVisible({
			timeout: 15_000,
		});
		await expect(
			todoPage.attachmentLocator("Todo With Attachment"),
		).toBeVisible({ timeout: 15_000 });
	});

	test("org todo attachment in org A is not visible in org B", async ({
		page,
		todoPage,
	}) => {
		const orgPage = new OrgPage(page);
		const id = crypto.randomUUID().slice(0, 8);
		const email = `att-org-${id}@e2e.test`;

		// Sign up and create Org A
		await signUpAndVerify(page, email, TEST_PASSWORD, TEST_USER_NAME);
		await orgPage.createOrg(`Org A ${id}`);
		await page.waitForURL(/onboarding/);
		await orgPage.skipInvites();

		// Add org 2do and attach a file
		await todoPage.navigate();
		await page.getByRole("tab", { name: "Organization" }).click();
		await page
			.getByPlaceholder("Add a new todo...")
			.filter({ visible: true })
			.fill("Org Todo With Attachment");
		await page.getByTestId("todo-submit").filter({ visible: true }).click();
		await expect(
			todoPage.todoRowLocator("Org Todo With Attachment"),
		).toBeVisible();
		await todoPage.attachFileToTodo(
			"Org Todo With Attachment",
			TEST_JPEG_PAYLOAD,
		);
		await expect(
			todoPage.attachmentLocator("Org Todo With Attachment"),
		).toBeVisible();

		// Create Org B and check org tab
		await orgPage.createOrgFromSwitcher(`Org B ${id}`);
		await todoPage.navigate();
		await page.getByRole("tab", { name: "Organization" }).click();
		await expect(
			todoPage.todoRowLocator("Org Todo With Attachment"),
		).not.toBeVisible();

		// Switch back to Org A — org 2do with attachment reappears
		await orgPage.switchOrg(`Org A ${id}`);
		await todoPage.navigate();
		await page.getByRole("tab", { name: "Organization" }).click();
		await expect(
			todoPage.todoRowLocator("Org Todo With Attachment"),
		).toBeVisible({ timeout: 15_000 });
		await expect(
			todoPage.attachmentLocator("Org Todo With Attachment"),
		).toBeVisible({ timeout: 15_000 });
	});

	test("attachment persists after page reload", async ({ page, todoPage }) => {
		const orgPage = new OrgPage(page);
		const id = crypto.randomUUID().slice(0, 8);
		const email = `att-reload-${id}@e2e.test`;

		// Sign up and create org
		await signUpAndVerify(page, email, TEST_PASSWORD, TEST_USER_NAME);
		await orgPage.createOrg(`Org ${id}`);
		await page.waitForURL(/onboarding/);
		await orgPage.skipInvites();

		// Add personal 2do with attachment
		await todoPage.navigate();
		await todoPage.addTodo("Persistent Attachment");
		await expect(
			todoPage.todoRowLocator("Persistent Attachment"),
		).toBeVisible();
		await todoPage.attachFileToTodo("Persistent Attachment", TEST_JPEG_PAYLOAD);
		await expect(
			todoPage.attachmentLocator("Persistent Attachment"),
		).toBeVisible();

		// Wait for upload to complete before reloading
		await expect(
			todoPage.uploadedAttachmentLocator("Persistent Attachment"),
		).toBeVisible();

		// Reload and verify attachment persists
		await page.reload();
		await expect(
			todoPage.todoRowLocator("Persistent Attachment"),
		).toBeVisible();
		await expect(
			todoPage.attachmentLocator("Persistent Attachment"),
		).toBeVisible();
	});
});
