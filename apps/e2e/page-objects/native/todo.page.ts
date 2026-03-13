import { BaseTodoPage } from "../base/todo.page.js";

export class NativeTodoPage extends BaseTodoPage {
	private todoInput() {
		return this.page.getByTestId("todo-input").locator("visible=true");
	}

	private todoSubmit() {
		return this.page.getByTestId("todo-submit").locator("visible=true");
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
		await this.todoRow(title).getByRole("button", { name: "Delete" }).click();
	}

	async toggleTodo(title: string) {
		await this.todoRow(title)
			.getByTestId("todo-toggle")
			.locator("visible=true")
			.click();
	}

	completedTodoLocator(title: string) {
		return this.todoRow(title).locator(`text=${title}`);
	}

	todoRowLocator(title: string) {
		return this.todoRow(title);
	}
}
