import { expect, test } from "../../fixtures/index.js";
import { TodoPage } from "../../page-objects/todo.page.js";

test.describe("Todos", () => {
	test.use({ storageState: undefined }); // each test gets a fresh session via fixture

	test("todos page loads for authenticated user with org", async ({
		authenticatedWithOrgPage: { page },
	}) => {
		const todoPage = new TodoPage(page);
		await todoPage.navigate();
		await expect(page.getByRole("heading", { name: "Todos" })).toBeVisible();
		await expect(page.getByPlaceholder("Add a new todo...")).toBeVisible();
	});

	test("add a todo", async ({ authenticatedWithOrgPage: { page } }) => {
		const todoPage = new TodoPage(page);
		await todoPage.navigate();
		await todoPage.addTodo("Buy milk");
		await expect(todoPage.todoLocator("Buy milk")).toBeVisible();
	});

	test("complete a todo", async ({ authenticatedWithOrgPage: { page } }) => {
		const todoPage = new TodoPage(page);
		await todoPage.navigate();
		await todoPage.addTodo("Exercise");
		await todoPage.toggleTodo("Exercise");
		await expect(todoPage.completedTodoLocator("Exercise")).toHaveClass(
			/line-through/,
		);
	});

	test("delete a todo", async ({ authenticatedWithOrgPage: { page } }) => {
		const todoPage = new TodoPage(page);
		await todoPage.navigate();
		await todoPage.addTodo("Temporary task");
		await todoPage.deleteTodo("Temporary task");
		await expect(todoPage.todoLocator("Temporary task")).not.toBeVisible();
	});

	test("todos persist after page reload", async ({
		authenticatedWithOrgPage: { page },
	}) => {
		const todoPage = new TodoPage(page);
		await todoPage.navigate();
		const title = `Persist-${crypto.randomUUID()}`;
		await todoPage.addTodo(title);
		await expect(todoPage.todoLocator(title)).toBeVisible();
		await page.reload();
		await expect(todoPage.todoLocator(title)).toBeVisible();
	});

	test("unauthenticated user visiting /todos is redirected to sign-in", async ({
		page,
	}) => {
		await page.goto("/todos");
		await expect(page).toHaveURL(/login/);
	});
});
