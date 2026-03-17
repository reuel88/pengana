import { expect, test } from "../../fixtures/index.js";
import { OrgPage } from "../../page-objects/org.page.js";
import { inviteAndAcceptMember } from "../../support/org-setup.js";

test.describe("Organisation Members", () => {
	test("shows owner in members table", async ({
		authenticatedWithOrgPage: { page, email },
	}) => {
		const orgPage = new OrgPage(page);
		await orgPage.navigateToMembers();

		await expect(page.locator("tr", { hasText: email })).toBeVisible();
		await expect(
			page.locator("tr", { hasText: email }).getByText("Owner"),
		).toBeVisible();
	});

	test("admin can update member role", async ({
		authenticatedWithOrgPage: { page, orgName },
		browser,
	}) => {
		const { inviteeEmail, inviteeContext } = await inviteAndAcceptMember(
			page,
			orgName,
			browser,
		);

		const orgPage = new OrgPage(page);
		await orgPage.navigateToMembers();

		await orgPage.updateMemberRole(inviteeEmail, "admin");
		await expect(page.getByText("Role updated")).toBeVisible();

		await page.reload();
		const row = page.locator("tr", { hasText: inviteeEmail });
		await expect(row.locator("select")).toHaveValue("admin");

		await inviteeContext.close();
	});

	test("admin can remove a member", async ({
		authenticatedWithOrgPage: { page, orgName },
		browser,
	}) => {
		const { inviteeEmail, inviteeContext } = await inviteAndAcceptMember(
			page,
			orgName,
			browser,
		);

		const orgPage = new OrgPage(page);
		await orgPage.navigateToMembers();

		await expect(page.locator("tr", { hasText: inviteeEmail })).toBeVisible();
		await orgPage.removeMember(inviteeEmail);
		await expect(page.getByText("Member removed")).toBeVisible();
		await expect(
			page.locator("tr", { hasText: inviteeEmail }),
		).not.toBeVisible();

		await inviteeContext.close();
	});

	test("member can leave organization", async ({
		authenticatedWithOrgPage: { page, orgName },
		browser,
	}) => {
		const { inviteePage, inviteeContext } = await inviteAndAcceptMember(
			page,
			orgName,
			browser,
		);

		const inviteeOrgPage = new OrgPage(inviteePage);
		await inviteeOrgPage.navigateToMembers();
		await inviteeOrgPage.leaveOrganization();

		await expect(inviteePage.getByText("Left organization")).toBeVisible({
			timeout: 15_000,
		});
		// After leaving, user may land on root or onboarding (no active org)
		await expect(inviteePage).toHaveURL(/:\d+\/(onboarding)?$/);

		await inviteeContext.close();
	});
});
