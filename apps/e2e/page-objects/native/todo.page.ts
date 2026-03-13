import { BaseTodoPage } from "../base/todo.page.js";

export class NativeTodoPage extends BaseTodoPage {
	async navigate() {
		await this.page.goto("/todos");
	}

	async addTodo(title: string) {
		await this.page.getByPlaceholder("Add a new todo...").fill(title);
		await this.page.getByRole("button", { name: "Add" }).click();
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
		await this.todoRow(title).getByTestId("todo-toggle").click();
	}

	completedTodoLocator(title: string) {
		return this.todoRow(title).locator(`text=${title}`);
	}

	todoLocator(title: string) {
		return this.todoRow(title);
	}
}
