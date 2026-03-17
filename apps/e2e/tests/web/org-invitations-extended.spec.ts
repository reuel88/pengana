import { TEST_PASSWORD, TEST_USER_NAME } from "../../constants.js";
import { expect, test } from "../../fixtures/index.js";
import { OrgPage } from "../../page-objects/org.page.js";
import { extractInvitationUrl, pollDevInbox } from "../../support/dev-inbox.js";
import { signUpAndVerify } from "../../support/web-auth.js";

test.describe("Organisation Invitations — Extended", () => {
	test("admin can cancel pending invitation", async ({
		authenticatedWithOrgPage: { page },
	}) => {
		const orgPage = new OrgPage(page);
		const targetEmail = `cancel-target-${crypto.randomUUID()}@e2e.test`;

		await orgPage.inviteMember(targetEmail);
		await expect(page.getByText("Invitation sent")).toBeVisible();

		await expect(page.locator("tr", { hasText: targetEmail })).toBeVisible();

		const row = page.locator("tr", { hasText: targetEmail });
		await row.getByRole("button", { name: "Cancel Invitation" }).click();
		await expect(page.getByText("Invitation cancelled")).toBeVisible({
			timeout: 15_000,
		});
		await expect(page.locator("tr", { hasText: targetEmail })).not.toBeVisible({
			timeout: 15_000,
		});
	});

	test("user can reject an invitation", async ({
		authenticatedWithOrgPage: { page, orgName },
		browser,
	}) => {
		const inviteeContext = await browser.newContext();
		const inviteePage = await inviteeContext.newPage();
		const inviteeEmail = `reject-${crypto.randomUUID()}@e2e.test`;
		const ownerOrgPage = new OrgPage(page);

		await signUpAndVerify(
			inviteePage,
			inviteeEmail,
			TEST_PASSWORD,
			`${TEST_USER_NAME} Reject`,
		);

		await ownerOrgPage.inviteMember(inviteeEmail);

		const invitationEmail = await pollDevInbox(
			page,
			inviteeEmail,
			`${TEST_USER_NAME} invited you to join ${orgName}`,
		);
		const invitationUrl = extractInvitationUrl(
			inviteeEmail,
			invitationEmail.html,
		);

		await inviteePage.goto(invitationUrl);
		await inviteePage
			.getByRole("button", { name: "Reject", exact: true })
			.click();
		await expect(inviteePage.getByText("Invitation rejected")).toBeVisible({
			timeout: 15_000,
		});
		await expect(inviteePage).not.toHaveURL(/\/org\/members$/);

		await inviteeContext.close();
	});
});
