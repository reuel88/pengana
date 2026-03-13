import { TEST_PASSWORD, TEST_USER_NAME } from "../../constants.js";
import { expect, test } from "../../fixtures/native.js";
import { NativeAuthPage } from "../../page-objects/native/auth.page.js";
import { NativeOrgPage } from "../../page-objects/native/org.page.js";
import { NativeTodoPage } from "../../page-objects/native/todo.page.js";

test.describe("Todos", () => {
	test.use({ storageState: undefined }); // each test gets a fresh session via fixture

	test("todos page loads for authenticated user with org", async ({
		authenticatedWithOrgPage: { page },
	}) => {
		const todoPage = new NativeTodoPage(page);
		await todoPage.navigate();
		await expect(page.getByRole("heading", { name: "Todos" })).toBeVisible();
		await expect(page.getByPlaceholder("Add a new todo...")).toBeVisible();
	});

	test("add a todo", async ({ authenticatedWithOrgPage: { page } }) => {
		const todoPage = new NativeTodoPage(page);
		await todoPage.navigate();
		await todoPage.addTodo("Buy milk");
		await expect(todoPage.todoRowLocator("Buy milk")).toBeVisible();
	});

	test("complete a todo", async ({ authenticatedWithOrgPage: { page } }) => {
		const todoPage = new NativeTodoPage(page);
		await todoPage.navigate();
		await todoPage.addTodo("Exercise");
		await todoPage.toggleTodo("Exercise");
		await expect(todoPage.completedTodoLocator("Exercise")).toHaveCSS(
			"text-decoration-line",
			"line-through",
		);
	});

	test("delete a todo", async ({ authenticatedWithOrgPage: { page } }) => {
		const todoPage = new NativeTodoPage(page);
		await todoPage.navigate();
		await todoPage.addTodo("Temporary task");
		await todoPage.deleteTodo("Temporary task");
		await expect(todoPage.todoRowLocator("Temporary task")).not.toBeVisible();
	});

	test("todos persist after page reload", async ({
		authenticatedWithOrgPage: { page },
	}) => {
		const todoPage = new NativeTodoPage(page);
		await todoPage.navigate();
		const title = `Persist-${crypto.randomUUID()}`;
		await todoPage.addTodo(title);
		await expect(todoPage.todoRowLocator(title)).toBeVisible();
		await page.reload();
		await expect(todoPage.todoRowLocator(title)).toBeVisible();
	});

	test("personal todos do not leak across sign-out and sign-in as another user", async ({
		page,
	}) => {
		const authPage = new NativeAuthPage(page);
		const orgPage = new NativeOrgPage(page);
		const todoPage = new NativeTodoPage(page);
		const userAEmail = `user-a-${crypto.randomUUID()}@e2e.test`;
		const userBEmail = `user-b-${crypto.randomUUID()}@e2e.test`;
		const userATodoTitle = `User A Todo ${crypto.randomUUID()}`;
		const userBTodoTitle = `User B Todo ${crypto.randomUUID()}`;
		const userAOrgSlug = `org-a-${crypto.randomUUID().slice(0, 8)}`;
		const userBOrgSlug = `org-b-${crypto.randomUUID().slice(0, 8)}`;

		await authPage.signUp(TEST_USER_NAME, userAEmail, TEST_PASSWORD);
		await page.waitForURL(/onboarding/);
		await orgPage.createOrg(`E2E Org ${userAEmail}`, userAOrgSlug);
		await orgPage.skipInvites();

		await todoPage.navigate();
		await todoPage.addTodo(userATodoTitle);
		await expect(todoPage.todoRowLocator(userATodoTitle)).toBeVisible();

		await authPage.signOut();
		await expect(page).toHaveURL(/login/);

		await authPage.signUp(TEST_USER_NAME, userBEmail, TEST_PASSWORD);
		await page.waitForURL(/onboarding/);
		await orgPage.createOrg(`E2E Org ${userBEmail}`, userBOrgSlug);
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
