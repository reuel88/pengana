import type { Page } from "@playwright/test";

export class PopupPage {
	constructor(private readonly page: Page) {}

	async navigateToPopup(extensionId: string) {
		await this.page.goto(`chrome-extension://${extensionId}/popup.html`);
	}

	getLoginPrompt() {
		return this.page.getByTestId("login-prompt");
	}

	getOnboardingPrompt() {
		return this.page.getByTestId("onboarding-prompt");
	}

	getTodoPage() {
		return this.page.getByTestId("todo-page");
	}

	getLoginButton() {
		return this.getLoginPrompt().getByRole("button", { name: "Sign In" });
	}
}
