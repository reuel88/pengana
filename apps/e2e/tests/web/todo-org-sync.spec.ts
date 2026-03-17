import { expect, test } from "../../fixtures/index.js";
import { TodoPage } from "../../page-objects/todo.page.js";
import { inviteAndAcceptMember } from "../../support/org-setup.js";

test.describe("Org todo cross-member sync", () => {
	test.use({ storageState: undefined });

	test("org todo deleted by another member syncs to the creator", async ({
		authenticatedWithOrgPage,
		browser,
	}) => {
		const { page: ownerPage, orgName } = authenticatedWithOrgPage;
		const ownerTodos = new TodoPage(ownerPage);
		const todoTitle = `Shared Todo ${crypto.randomUUID().slice(0, 8)}`;

		// Invite and accept a second member
		const { inviteePage } = await inviteAndAcceptMember(
			ownerPage,
			orgName,
			browser,
		);
		const inviteeTodos = new TodoPage(inviteePage);

		// User A creates an org todo
		await ownerTodos.navigate();
		await ownerPage.getByRole("tab", { name: "Organization" }).click();
		await ownerTodos.addTodo(todoTitle);
		await expect(ownerTodos.todoRowLocator(todoTitle)).toBeVisible();

		// User B navigates to org todos and sees the todo
		await inviteeTodos.navigate();
		await inviteePage.getByRole("tab", { name: "Organization" }).click();
		await expect(inviteeTodos.todoRowLocator(todoTitle)).toBeVisible();

		// User B deletes the todo
		await inviteeTodos.deleteTodo(todoTitle);
		await expect(inviteeTodos.todoRowLocator(todoTitle)).not.toBeVisible();

		// User A reloads and confirms the todo is gone
		await ownerPage.reload();
		await ownerPage.getByRole("tab", { name: "Organization" }).click();
		await expect(ownerTodos.todoRowLocator(todoTitle)).not.toBeVisible();
	});
});
