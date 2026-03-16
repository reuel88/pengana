import { BaseTodoPage } from "./base/todo.page.js";

export class TodoPage extends BaseTodoPage {
	async navigate() {
		await this.page.goto("/todos");
	}

	async addTodo(title: string) {
		await this.page
			.getByPlaceholder("Add a new todo...")
			.filter({ visible: true })
			.fill(title);
		await this.page
			.getByTestId("todo-submit")
			.filter({ visible: true })
			.click();
	}

	private todoRow(title: string) {
		return this.page
			.locator('[data-testid="todo-row"]')
			.filter({ has: this.page.locator("span", { hasText: title }) });
	}

	async deleteTodo(title: string) {
		const deleteBtn = this.todoRow(title).getByRole("button", {
			name: "Delete",
		});
		await deleteBtn.waitFor({ state: "attached" });
		await deleteBtn.click();
	}

	async toggleTodo(title: string) {
		await this.todoRow(title).getByRole("checkbox").click();
	}

	completedTodoLocator(title: string) {
		return this.page
			.locator('[data-testid="todo-row"][data-completed="true"]')
			.filter({ has: this.page.locator("span", { hasText: title }) });
	}

	todoRowLocator(title: string) {
		return this.todoRow(title);
	}

	async attachFileToTodo(
		title: string,
		filePayload: { name: string; mimeType: string; buffer: Buffer },
	) {
		const row = this.todoRow(title);
		const fileInput = row.locator('input[type="file"]');
		await fileInput.setInputFiles({
			name: filePayload.name,
			mimeType: filePayload.mimeType,
			buffer: filePayload.buffer,
		});
	}

	attachmentLocator(todoTitle: string) {
		const row = this.todoRow(todoTitle);
		return row.locator('[data-testid="attachment-badge"]');
	}

	uploadedAttachmentLocator(todoTitle: string) {
		const row = this.todoRow(todoTitle);
		return row.locator(
			'[data-testid="attachment-badge"][data-upload-status="uploaded"]',
		);
	}

	async attachmentCountForTodo(todoTitle: string) {
		return this.attachmentLocator(todoTitle).count();
	}
}
