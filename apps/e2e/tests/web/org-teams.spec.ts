import { expect, test } from "../../fixtures/index.js";
import { OrgPage } from "../../page-objects/org.page.js";
import { inviteAndAcceptMember } from "../../support/org-setup.js";

test.describe("Organisation Teams", () => {
	test("shows empty state", async ({ authenticatedWithOrgPage: { page } }) => {
		const orgPage = new OrgPage(page);
		await orgPage.navigateToTeams();

		await expect(page.getByText("No teams yet")).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Create Team" }),
		).toBeVisible();
	});

	test("admin can create a team", async ({
		authenticatedWithOrgPage: { page },
	}) => {
		const orgPage = new OrgPage(page);
		await orgPage.navigateToTeams();
		await orgPage.createTeam("Engineering");

		await expect(page.getByText("Team created")).toBeVisible();
		await expect(page.getByRole("link", { name: "Engineering" })).toBeVisible();
	});

	test("admin can add member to team", async ({
		authenticatedWithOrgPage: { page, orgName },
		browser,
	}) => {
		const { inviteeEmail, inviteeContext } = await inviteAndAcceptMember(
			page,
			orgName,
			browser,
		);

		const orgPage = new OrgPage(page);
		await orgPage.navigateToTeams();
		await orgPage.createTeam("Backend");
		await expect(page.getByText("Team created")).toBeVisible();

		await orgPage.navigateToTeam("Backend");
		await orgPage.addTeamMember(inviteeEmail);
		await expect(page.getByText("Member added to team")).toBeVisible();
		await expect(page.locator("tr", { hasText: inviteeEmail })).toBeVisible();

		await inviteeContext.close();
	});

	test("admin can remove member from team", async ({
		authenticatedWithOrgPage: { page, orgName },
		browser,
	}) => {
		const { inviteeEmail, inviteeContext } = await inviteAndAcceptMember(
			page,
			orgName,
			browser,
		);

		const orgPage = new OrgPage(page);
		await orgPage.navigateToTeams();
		await orgPage.createTeam("Frontend");
		await expect(page.getByText("Team created")).toBeVisible();

		await orgPage.navigateToTeam("Frontend");
		await orgPage.addTeamMember(inviteeEmail);
		await expect(page.getByText("Member added to team")).toBeVisible();

		await orgPage.removeTeamMember(inviteeEmail);
		await expect(page.getByText("Member removed from team")).toBeVisible();
		await expect(
			page.locator("tr", { hasText: inviteeEmail }),
		).not.toBeVisible();

		await inviteeContext.close();
	});

	test("admin can delete a team", async ({
		authenticatedWithOrgPage: { page },
	}) => {
		const orgPage = new OrgPage(page);
		await orgPage.navigateToTeams();

		// Create a second team so "Temp Team" isn't the last team (better-auth
		// prevents deleting the last team in an organization).
		await orgPage.createTeam("Keep Team");
		await expect(page.getByText("Team created")).toBeVisible();

		await orgPage.createTeam("Temp Team");
		await expect(page.getByText("Team created")).toBeVisible();

		await orgPage.navigateToTeam("Temp Team");
		await orgPage.deleteTeam();

		// Verify navigation back to teams list and team removal
		await expect(page).toHaveURL(/\/org\/teams$/, { timeout: 15_000 });
		await expect(
			page.getByRole("link", { name: "Temp Team" }),
		).not.toBeVisible();
		await expect(page.getByRole("link", { name: "Keep Team" })).toBeVisible();
	});
});
