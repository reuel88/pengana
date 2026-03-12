import type { Locator, Page } from "@playwright/test";

export abstract class BaseTodoPage {
	constructor(protected readonly page: Page) {}

	abstract navigate(): Promise<void>;
	abstract addTodo(title: string): Promise<void>;
	abstract deleteTodo(title: string): Promise<void>;
	abstract toggleTodo(title: string): Promise<void>;
	abstract completedTodoLocator(title: string): Locator;
	abstract todoLocator(title: string): Locator;
}
