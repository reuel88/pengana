import type { Page } from "@playwright/test";

export class TodoPage {
	constructor(private readonly page: Page) {}

	async navigate() {
		await this.page.goto("/todos");
	}

	async addTodo(title: string) {
		await this.page.getByPlaceholder("Add a new todo...").fill(title);
		await this.page.getByRole("button", { name: "Add" }).click();
	}

	private todoRow(title: string) {
		return this.page
			.locator("div")
			.filter({ has: this.page.locator("span", { hasText: title }) })
			.first();
	}

	async deleteTodo(title: string) {
		await this.todoRow(title).getByRole("button", { name: "Delete" }).click();
	}

	async toggleTodo(title: string) {
		await this.todoRow(title).getByRole("checkbox").click();
	}

	isTodoCompleted(title: string) {
		return this.todoRow(title).locator("span", { hasText: title });
	}

	todoVisible(title: string) {
		return this.page.getByText(title);
	}
}
