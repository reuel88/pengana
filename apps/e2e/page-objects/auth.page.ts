import { extractVerificationUrl, pollDevInbox } from "../support/dev-inbox.js";
import { BaseAuthPage } from "./base/auth.page.js";

export class AuthPage extends BaseAuthPage {
	private nameInput() {
		return this.page.getByTestId("auth-name-input");
	}

	private emailInput() {
		return this.page.getByTestId("auth-email-input");
	}

	private passwordInput() {
		return this.page.getByTestId("auth-password-input");
	}

	async navigateToSignIn() {
		await this.page.goto("/login");
	}

	async navigateToSignUp() {
		await this.page.goto("/sign-up");
	}

	async signIn(email: string, password: string) {
		await this.navigateToSignIn();
		await this.emailInput().fill(email);
		await this.passwordInput().fill(password);
		await this.page.getByRole("button", { name: "Sign in" }).click();
	}

	async signUp(name: string, email: string, password: string) {
		await this.navigateToSignUp();
		await this.nameInput().fill(name);
		await this.emailInput().fill(email);
		await this.passwordInput().fill(password);
		await this.page.getByRole("button", { name: "Sign up" }).click();
	}

	async signOut() {
		await this.page.locator("header").getByRole("button").last().click();
		await this.page.getByRole("menuitem", { name: "Sign Out" }).click();
	}

	async verifyEmailFromDevInbox(email: string) {
		const verificationUrl = await this.waitForVerificationUrl(email);
		await this.page.goto(verificationUrl);
	}

	private async waitForVerificationUrl(email: string) {
		const emailDetail = await pollDevInbox(
			this.page,
			email,
			"Verify your email",
		);
		return extractVerificationUrl(email, emailDetail.html);
	}
}
