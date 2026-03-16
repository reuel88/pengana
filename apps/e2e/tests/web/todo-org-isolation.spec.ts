import { TEST_PASSWORD, TEST_USER_NAME } from "../../constants.js";
import { expect, test } from "../../fixtures/index.js";
import { OrgPage } from "../../page-objects/org.page.js";
import { signUpAndVerify } from "../../support/web-auth.js";

test.describe("Todo org isolation", () => {
	test.use({ storageState: undefined });

	test("personal todos created in org A are not visible in org B", async ({
		page,
		todoPage,
	}) => {
		const orgPage = new OrgPage(page);
		const id = crypto.randomUUID().slice(0, 8);
		const orgAName = `Org A ${id}`;
		const orgBName = `Org B ${id}`;
		const email = `iso-${id}@e2e.test`;

		// Sign up and create Org A via onboarding
		await signUpAndVerify(page, email, TEST_PASSWORD, TEST_USER_NAME);
		await orgPage.createOrg(orgAName);
		await page.waitForURL(/onboarding/);
		await orgPage.skipInvites();

		// Add a personal 2do in Org A
		await todoPage.navigate();
		await todoPage.addTodo("Org A Task");
		await expect(todoPage.todoRowLocator("Org A Task")).toBeVisible();

		// Create Org B from the switcher
		await orgPage.createOrgFromSwitcher(orgBName);

		// Navigate to todos in Org B — Org A's 2do should not be visible
		await todoPage.navigate();
		await expect(todoPage.todoRowLocator("Org A Task")).not.toBeVisible();

		// Add a personal 2do in Org B
		await todoPage.addTodo("Org B Task");
		await expect(todoPage.todoRowLocator("Org B Task")).toBeVisible();
		await expect(todoPage.todoRowLocator("Org A Task")).not.toBeVisible();
	});

	test("personal todos reappear when switching back to the original org", async ({
		page,
		todoPage,
	}) => {
		const orgPage = new OrgPage(page);
		const id = crypto.randomUUID().slice(0, 8);
		const orgAName = `Org A ${id}`;
		const orgBName = `Org B ${id}`;
		const email = `iso-${id}@e2e.test`;

		// Setup: sign up, create Org A, add 2do, create Org B, add 2do
		await signUpAndVerify(page, email, TEST_PASSWORD, TEST_USER_NAME);
		await orgPage.createOrg(orgAName);
		await page.waitForURL(/onboarding/);
		await orgPage.skipInvites();

		await todoPage.navigate();
		await todoPage.addTodo("Org A Task");
		await expect(todoPage.todoRowLocator("Org A Task")).toBeVisible();

		await orgPage.createOrgFromSwitcher(orgBName);
		await todoPage.navigate();
		await todoPage.addTodo("Org B Task");
		await expect(todoPage.todoRowLocator("Org B Task")).toBeVisible();

		// Switch back to Org A
		await orgPage.switchOrg(orgAName);
		await todoPage.navigate();
		await expect(todoPage.todoRowLocator("Org A Task")).toBeVisible();
		await expect(todoPage.todoRowLocator("Org B Task")).not.toBeVisible();
	});

	test("org todos remain isolated across organizations", async ({
		page,
		todoPage,
	}) => {
		const orgPage = new OrgPage(page);
		const id = crypto.randomUUID().slice(0, 8);
		const orgAName = `Org A ${id}`;
		const orgBName = `Org B ${id}`;
		const email = `iso-${id}@e2e.test`;

		// Setup: sign up, create Org A
		await signUpAndVerify(page, email, TEST_PASSWORD, TEST_USER_NAME);
		await orgPage.createOrg(orgAName);
		await page.waitForURL(/onboarding/);
		await orgPage.skipInvites();

		// Add an org 2do in Org A
		await todoPage.navigate();
		await page.getByRole("tab", { name: "Organization" }).click();
		await page
			.getByPlaceholder("Add a new todo...")
			.filter({ visible: true })
			.fill("Org A Shared Todo");
		await page.getByTestId("todo-submit").filter({ visible: true }).click();
		await expect(todoPage.todoRowLocator("Org A Shared Todo")).toBeVisible();

		// Create Org B and check org todos tab
		await orgPage.createOrgFromSwitcher(orgBName);
		await todoPage.navigate();
		await page.getByRole("tab", { name: "Organization" }).click();
		await expect(
			todoPage.todoRowLocator("Org A Shared Todo"),
		).not.toBeVisible();
	});
});
