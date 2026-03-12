import type { Page } from "@playwright/test";

export class AuthPage {
	constructor(private readonly page: Page) {}

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

	async verifyEmailFromDevInbox(email: string) {
		const verificationUrl = await this.waitForVerificationUrl(email);
		await this.page.goto(verificationUrl);
	}

	private async waitForVerificationUrl(email: string) {
		const timeoutMs = 15_000;
		const pollIntervalMs = 500;
		const deadline = Date.now() + timeoutMs;

		while (Date.now() < deadline) {
			const emailsResponse = await this.page.request.get(
				"http://localhost:3000/dev/email/api/emails",
			);
			if (!emailsResponse.ok()) {
				throw new Error(
					`Failed to load dev inbox: ${emailsResponse.status()} ${emailsResponse.statusText()}`,
				);
			}

			const emails = (await emailsResponse.json()) as Array<{
				id: number;
				to: string;
				subject: string;
			}>;

			const verificationEmail = emails.find(
				(message) =>
					message.to === email && message.subject === "Verify your email",
			);

			if (verificationEmail) {
				const detailResponse = await this.page.request.get(
					`http://localhost:3000/dev/email/api/emails/${verificationEmail.id}`,
				);
				if (!detailResponse.ok()) {
					throw new Error(
						`Failed to load dev email ${verificationEmail.id}: ${detailResponse.status()} ${detailResponse.statusText()}`,
					);
				}

				const detail = (await detailResponse.json()) as { html: string };
				const match = detail.html.match(
					/href="([^"]*\/verify-email\/callback\?token=[^"]+)"/i,
				);
				if (!match) {
					throw new Error(
						`Verification email for ${email} did not contain a callback URL.`,
					);
				}
				const verificationUrl = match[1];
				if (!verificationUrl) {
					throw new Error(
						`Verification email for ${email} contained an empty callback URL.`,
					);
				}
				return verificationUrl;
			}

			await this.page.waitForTimeout(pollIntervalMs);
		}

		throw new Error(`Timed out waiting for verification email for ${email}.`);
	}
}
