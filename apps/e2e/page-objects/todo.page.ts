import { BaseTodoPage } from "./base/todo.page.js";

export class TodoPage extends BaseTodoPage {
	async navigate() {
		await this.page.goto("/todos");
	}

	async addTodo(title: string) {
		await this.page
			.getByPlaceholder("Add a new todo...")
			.locator("visible=true")
			.fill(title);
		await this.page.getByTestId("todo-submit").locator("visible=true").click();
	}

	private todoRow(title: string) {
		return this.page
			.locator('[data-testid="todo-row"]')
			.filter({ has: this.page.locator("span", { hasText: title }) });
	}

	async deleteTodo(title: string) {
		await this.todoRow(title).getByRole("button", { name: "Delete" }).click();
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
}
