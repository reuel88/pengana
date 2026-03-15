import {
	extractMagicLinkUrl,
	extractResetPasswordUrl,
	extractVerificationUrl,
	pollDevInbox,
} from "../support/dev-inbox.js";
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

	async navigateToForgotPassword() {
		await this.page.goto("/forgot-password");
	}

	async navigateToMagicLink() {
		await this.page.goto("/magic-link");
	}

	async signIn(email: string, password: string) {
		await this.navigateToSignIn();
		await this.emailInput().fill(email);
		await this.passwordInput().fill(password);
		await this.page.getByRole("button", { name: "Sign In" }).click();
	}

	async signUp(name: string, email: string, password: string) {
		await this.navigateToSignUp();
		await this.nameInput().fill(name);
		await this.emailInput().fill(email);
		await this.passwordInput().fill(password);
		await this.page.getByRole("button", { name: "Sign Up" }).click();
	}

	async signOut() {
		const directButton = this.page.locator("button", { hasText: "Sign Out" });
		if ((await directButton.count()) > 0) {
			await directButton.first().click();
			return;
		}

		await this.page.locator("header").getByRole("button").last().click();
		await this.page.getByTestId("sign-out-trigger").click();
	}

	async requestPasswordReset(email: string) {
		await this.navigateToForgotPassword();
		await this.emailInput().fill(email);
		await this.page.getByRole("button", { name: "Send Reset Link" }).click();
	}

	async resetPassword(password: string, confirmPassword = password) {
		await this.passwordInput().fill(password);
		await this.page
			.getByTestId("auth-confirm-password-input")
			.fill(confirmPassword);
		await this.page.getByRole("button", { name: "Reset Password" }).click();
	}

	async requestMagicLink(email: string) {
		await this.navigateToMagicLink();
		await this.emailInput().fill(email);
		await this.page.getByRole("button", { name: "Send Magic Link" }).click();
	}

	async verifyEmailFromDevInbox(email: string) {
		const verificationUrl = await this.waitForVerificationUrl(email);
		await this.page.goto(verificationUrl);
	}

	async resetPasswordFromDevInbox(email: string) {
		const resetPasswordUrl = await this.waitForResetPasswordUrl(email);
		await this.page.goto(resetPasswordUrl);
	}

	async openMagicLinkFromDevInbox(email: string) {
		const magicLinkUrl = await this.waitForMagicLinkUrl(email);
		await this.page.goto(magicLinkUrl);
	}

	private async waitForVerificationUrl(email: string) {
		const emailDetail = await pollDevInbox(
			this.page,
			email,
			"Verify your email",
		);
		return extractVerificationUrl(email, emailDetail.html);
	}

	private async waitForResetPasswordUrl(email: string) {
		const emailDetail = await pollDevInbox(
			this.page,
			email,
			"Reset your password",
		);
		return extractResetPasswordUrl(email, emailDetail.html);
	}

	private async waitForMagicLinkUrl(email: string) {
		const emailDetail = await pollDevInbox(
			this.page,
			email,
			"Sign in to pengana",
		);
		return extractMagicLinkUrl(email, emailDetail.html);
	}
}
