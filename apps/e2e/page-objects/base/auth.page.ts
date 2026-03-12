import type { Page } from "@playwright/test";

export abstract class BaseAuthPage {
	constructor(protected readonly page: Page) {}

	abstract navigateToSignIn(): Promise<void>;
	abstract navigateToSignUp(): Promise<void>;
	abstract signIn(email: string, password: string): Promise<void>;
	abstract signUp(name: string, email: string, password: string): Promise<void>;
}
