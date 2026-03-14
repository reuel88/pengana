import { TEST_PASSWORD, TEST_USER_NAME } from "../../constants.js";
import { expect, test } from "../../fixtures/index.js";
import { OrgPage } from "../../page-objects/org.page.js";
import { signUpAndVerify } from "../../support/web-auth.js";

test.describe("Todos", () => {
	test.use({ storageState: undefined }); // each test gets a fresh session via fixture

	test("todos page loads for authenticated user with org", async ({
		authenticatedWithOrgPage: { page },
		todoPage,
	}) => {
		await todoPage.navigate();
		await expect(page.getByRole("heading", { name: "Todos" })).toBeVisible();
		await expect(
			page.getByPlaceholder("Add a new todo...").first(),
		).toBeVisible();
	});

	test("add a todo", async ({ authenticatedWithOrgPage: _setup, todoPage }) => {
		await todoPage.navigate();
		await todoPage.addTodo("Buy milk");
		await expect(todoPage.todoRowLocator("Buy milk")).toBeVisible();
	});

	test("add, complete, and delete an organization todo", async ({
		authenticatedWithOrgPage: { page },
		todoPage,
	}) => {
		const title = `Org Todo ${crypto.randomUUID()}`;

		await todoPage.navigate();
		await page.getByRole("tab", { name: "Organization" }).click();
		await expect(
			page.getByRole("tab", { name: "Organization", selected: true }),
		).toBeVisible();
		await page
			.getByPlaceholder("Add a new todo...")
			.filter({ visible: true })
			.fill(title);
		await page.getByTestId("todo-submit").filter({ visible: true }).click();
		await expect(todoPage.todoRowLocator(title)).toBeVisible();

		await todoPage.toggleTodo(title);
		await expect(todoPage.completedTodoLocator(title)).toBeVisible();

		await todoPage.deleteTodo(title);
		await expect(todoPage.todoRowLocator(title)).not.toBeVisible();
	});

	test("complete a todo", async ({
		authenticatedWithOrgPage: _setup,
		todoPage,
	}) => {
		await todoPage.navigate();
		await todoPage.addTodo("Exercise");
		await todoPage.toggleTodo("Exercise");
		await expect(todoPage.completedTodoLocator("Exercise")).toBeVisible();
	});

	test("delete a todo", async ({
		authenticatedWithOrgPage: _setup,
		todoPage,
	}) => {
		await todoPage.navigate();
		await todoPage.addTodo("Temporary task");
		await todoPage.deleteTodo("Temporary task");
		await expect(todoPage.todoRowLocator("Temporary task")).not.toBeVisible();
	});

	test("todos persist after page reload", async ({
		authenticatedWithOrgPage: { page },
		todoPage,
	}) => {
		await todoPage.navigate();
		const title = `Persist-${crypto.randomUUID()}`;
		await todoPage.addTodo(title);
		await expect(todoPage.todoRowLocator(title)).toBeVisible();
		await page.reload();
		await expect(todoPage.todoRowLocator(title)).toBeVisible();
	});

	test("personal todos do not leak across sign-out and sign-in as another user", async ({
		page,
		authPage,
		todoPage,
	}) => {
		const orgPage = new OrgPage(page);
		const userAEmail = `user-a-${crypto.randomUUID()}@e2e.test`;
		const userBEmail = `user-b-${crypto.randomUUID()}@e2e.test`;
		const userATodoTitle = `User A Todo ${crypto.randomUUID()}`;
		const userBTodoTitle = `User B Todo ${crypto.randomUUID()}`;

		await signUpAndVerify(page, userAEmail, TEST_PASSWORD, TEST_USER_NAME);
		await orgPage.createOrg(`E2E Org ${userAEmail}`);
		await page.waitForURL(/onboarding/);
		await orgPage.skipInvites();

		await todoPage.navigate();
		await todoPage.addTodo(userATodoTitle);
		await expect(todoPage.todoRowLocator(userATodoTitle)).toBeVisible();

		await authPage.signOut();
		await expect(page).toHaveURL(/login/);

		await signUpAndVerify(page, userBEmail, TEST_PASSWORD, TEST_USER_NAME);
		await orgPage.createOrg(`E2E Org ${userBEmail}`);
		await page.waitForURL(/onboarding/);
		await orgPage.skipInvites();

		await todoPage.navigate();
		await expect(todoPage.todoRowLocator(userATodoTitle)).not.toBeVisible();

		await todoPage.addTodo(userBTodoTitle);
		await expect(todoPage.todoRowLocator(userBTodoTitle)).toBeVisible();
		await expect(todoPage.todoRowLocator(userATodoTitle)).not.toBeVisible();
	});

	test("unauthenticated user visiting /todos is redirected to sign-in", async ({
		page,
	}) => {
		await page.goto("/todos");
		await expect(page).toHaveURL(/login/);
	});
});
