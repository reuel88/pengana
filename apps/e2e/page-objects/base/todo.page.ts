import type { Locator, Page } from "@playwright/test";

export abstract class BaseTodoPage {
	constructor(protected readonly page: Page) {}

	abstract navigate(): Promise<void>;
	abstract addTodo(title: string): Promise<void>;
	abstract deleteTodo(title: string): Promise<void>;
	abstract toggleTodo(title: string): Promise<void>;
	abstract completedTodoLocator(title: string): Locator;
	abstract todoRowLocator(title: string): Locator;
	abstract attachFileToTodo(
		title: string,
		filePayload: {
			name: string;
			mimeType: string;
			buffer: Buffer;
		},
	): Promise<void>;
}
