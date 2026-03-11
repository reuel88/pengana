import type { Page } from "@playwright/test";

export class NativeOrgPage {
	constructor(private readonly page: Page) {}

	async navigateToOnboarding() {
		await this.page.goto("/onboarding");
	}

	async createOrg(name: string, slug: string) {
		await this.page.getByPlaceholder("My Organization").fill(name);
		await this.page.getByPlaceholder("my-org").fill(slug);
		await this.page.getByRole("button", { name: "Create" }).click();
	}

	async skipInvites() {
		await this.page.getByRole("button", { name: "Skip for now" }).click();
	}
}
