import type { Page } from "@playwright/test";

export class NativeAuthPage {
	constructor(private readonly page: Page) {}

	async navigateToSignIn() {
		await this.page.goto("/login");
	}

	async navigateToSignUp() {
		await this.page.goto("/sign-up");
	}

	async signIn(email: string, password: string) {
		await this.navigateToSignIn();
		await this.page.getByPlaceholder("Email").fill(email);
		await this.page.getByPlaceholder("Password").fill(password);
		await this.page.getByRole("button", { name: "Sign In" }).click();
	}

	async signUp(name: string, email: string, password: string) {
		await this.navigateToSignUp();
		await this.page.getByPlaceholder("Name").fill(name);
		await this.page.getByPlaceholder("Email").fill(email);
		await this.page.getByPlaceholder("Password").fill(password);
		await this.page.getByRole("button", { name: "Sign Up" }).click();
	}
}
