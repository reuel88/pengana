import type { Page } from "@playwright/test";

export class OrgPage {
	constructor(private readonly page: Page) {}

	async navigateToOnboarding() {
		await this.page.goto("/onboarding");
	}

	async createOrg(name: string) {
		await this.page.getByLabel("Organization name").fill(name);
		await this.page.getByRole("button", { name: "Create" }).click();
	}

	async skipInvites() {
		await this.page.getByRole("button", { name: "Skip for now" }).click();
	}
}
