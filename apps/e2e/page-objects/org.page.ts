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

	async navigateToInvitations() {
		await this.page.goto("/org/invitations");
	}

	async inviteMember(email: string, role: "member" | "admin" = "member") {
		await this.navigateToInvitations();
		await this.page.getByLabel("Email Address").fill(email);
		await this.page.locator("#invite-role").selectOption(role);
		await this.page.getByRole("button", { name: "Send Invitation" }).click();
	}
}
