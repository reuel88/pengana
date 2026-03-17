import type { Page } from "@playwright/test";

export class NativeOrgPage {
	constructor(private readonly page: Page) {}

	async navigateToOnboarding() {
		await this.page.goto("/onboarding");
	}

	async createOrg(name: string, slug: string) {
		await this.page.getByTestId("org-name-input").fill(name);
		await this.page.getByTestId("org-slug-input").fill(slug);
		await this.page.getByRole("button", { name: "Create" }).click();
		// Wait for org creation API to complete and invite step to render
		await this.page
			.getByTestId("onboarding-invite-members")
			.waitFor({ state: "visible", timeout: 30_000 });
	}

	async skipInvites() {
		await this.page
			.getByRole("button", { name: "Skip for now" })
			.waitFor({ state: "visible", timeout: 15_000 });
		await this.page.getByRole("button", { name: "Skip for now" }).click();
	}
}
