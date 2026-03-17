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

	private orgSwitcherTrigger() {
		return this.page.getByTestId("org-switcher-trigger");
	}

	async switchOrg(orgName: string) {
		await this.orgSwitcherTrigger().click();
		await this.page.getByRole("menuitem", { name: orgName }).click();
		await this.page.waitForURL(/\/org/);
	}

	async createOrgFromSwitcher(orgName: string) {
		await this.orgSwitcherTrigger().click();
		await this.page
			.getByRole("menuitem", { name: "Create Organization" })
			.click();
		await this.page.getByTestId("org-name-input").fill(orgName);
		await this.page.getByTestId("org-submit").click();
		await this.page.waitForURL(/\/org/);
	}

	// --- Navigation ---

	async navigateToMembers() {
		await this.page.goto("/org/members");
	}

	async navigateToTeams() {
		await this.page.goto("/org/teams");
	}

	async navigateToSettings() {
		await this.page.goto("/org/settings");
	}

	// --- Members ---

	async leaveOrganization() {
		this.page.once("dialog", (d) => d.accept());
		await this.page.getByRole("button", { name: "Leave Organization" }).click();
	}

	async removeMember(email: string) {
		const row = this.page.locator("tr", { hasText: email });
		this.page.once("dialog", (d) => d.accept());
		await row.getByRole("button", { name: "Remove" }).click();
	}

	async updateMemberRole(email: string, role: "member" | "admin") {
		const row = this.page.locator("tr", { hasText: email });
		await row.locator("select").selectOption(role);
	}

	// --- Teams ---

	async createTeam(name: string) {
		await this.page
			.locator("[data-slot='dialog-trigger']")
			.filter({ hasText: "Create Team" })
			.click();
		await this.page.locator("#team-name").fill(name);
		await this.page
			.locator("[role=dialog]")
			.getByRole("button", { name: "Create Team" })
			.click();
	}

	async navigateToTeam(name: string) {
		await this.page.getByRole("link", { name }).click();
	}

	async deleteTeam() {
		this.page.once("dialog", (d) => d.accept());
		await this.page
			.getByRole("button", { name: "Delete Team" })
			.dispatchEvent("click");
	}

	async addTeamMember(email: string) {
		await this.page.getByPlaceholder("user@example.com").fill(email);
		await this.page.getByRole("button", { name: "Add Member" }).click();
	}

	async removeTeamMember(name: string) {
		const row = this.page.locator("tr", { hasText: name });
		await row.getByRole("button", { name: "Remove Member" }).click();
	}

	// --- Settings ---

	async updateOrgDetails(fields: { name?: string; slug?: string }) {
		if (fields.name !== undefined) {
			await this.page.locator("#org-name").clear();
			await this.page.locator("#org-name").fill(fields.name);
		}
		if (fields.slug !== undefined) {
			await this.page.locator("#org-slug").clear();
			await this.page.locator("#org-slug").fill(fields.slug);
		}
		await this.page
			.getByRole("button", { name: "Update Organization" })
			.click();
	}

	async deleteOrganization() {
		this.page.once("dialog", (d) => d.accept());
		const btn = this.page.getByRole("button", {
			name: "Delete Organization",
		});
		await btn.scrollIntoViewIfNeeded();
		// Use evaluate to click directly, bypassing any devtools overlay
		await btn.evaluate((el) => el.click());
	}
}
