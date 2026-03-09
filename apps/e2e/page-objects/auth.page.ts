import type { Page } from "@playwright/test";

export class AuthPage {
	constructor(private readonly page: Page) {}

	async navigateToSignIn() {
		await this.page.goto("/login");
	}

	async navigateToSignUp() {
		await this.page.goto("/sign-up");
	}

	async signIn(email: string, password: string) {
		await this.navigateToSignIn();
		await this.page.getByLabel("Email").fill(email);
		await this.page.getByLabel("Password").fill(password);
		await this.page.getByRole("button", { name: "Sign in" }).click();
	}

	async signUp(name: string, email: string, password: string) {
		await this.navigateToSignUp();
		await this.page.getByLabel("Name").fill(name);
		await this.page.getByLabel("Email").fill(email);
		await this.page.getByLabel("Password").fill(password);
		await this.page.getByRole("button", { name: "Sign up" }).click();
	}
}
