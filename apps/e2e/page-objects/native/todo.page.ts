import { BaseTodoPage } from "../base/todo.page.js";

export class NativeTodoPage extends BaseTodoPage {
	private todoInput() {
		return this.page.getByTestId("todo-input").filter({ visible: true });
	}

	private todoSubmit() {
		return this.page.getByTestId("todo-submit").filter({ visible: true });
	}

	async navigate() {
		await this.page.goto("/todos");
	}

	async addTodo(title: string) {
		await this.todoInput().fill(title);
		await this.todoSubmit().click();
	}

	private todoRow(title: string) {
		return this.page
			.locator('[data-testid="todo-row"]')
			.filter({ has: this.page.locator(`text=${title}`) });
	}

	async deleteTodo(title: string) {
		const deleteBtn = this.todoRow(title).getByRole("button", {
			name: "Delete",
		});
		await deleteBtn.waitFor({ state: "attached" });
		await deleteBtn.click();
	}

	async toggleTodo(title: string) {
		await this.todoRow(title)
			.getByTestId("todo-toggle")
			.filter({ visible: true })
			.click();
	}

	completedTodoLocator(title: string) {
		return this.todoRow(title).locator(`text=${title}`);
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
}
