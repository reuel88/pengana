import { TEST_PASSWORD, TEST_USER_NAME } from "../../constants.js";
import { expect, test } from "../../fixtures/index.js";
import { OrgPage } from "../../page-objects/org.page.js";
import { extractInvitationUrl, pollDevInbox } from "../../support/dev-inbox.js";
import { signUpAndVerify } from "../../support/web-auth.js";

test.describe("Organisation Invitations", () => {
	test("existing user can accept an organisation invitation", async ({
		authenticatedWithOrgPage: { page: ownerPage, orgName },
		browser,
	}) => {
		const inviteeContext = await browser.newContext();
		const inviteePage = await inviteeContext.newPage();
		const inviteeEmail = `invitee-${crypto.randomUUID()}@e2e.test`;
		const ownerOrgPage = new OrgPage(ownerPage);

		await signUpAndVerify(
			inviteePage,
			inviteeEmail,
			TEST_PASSWORD,
			`${TEST_USER_NAME} Invitee`,
		);

		await ownerOrgPage.inviteMember(inviteeEmail);

		const invitationEmail = await pollDevInbox(
			ownerPage,
			inviteeEmail,
			`${TEST_USER_NAME} invited you to join ${orgName}`,
		);
		const invitationUrl = extractInvitationUrl(
			inviteeEmail,
			invitationEmail.html,
		);

		await inviteePage.goto(invitationUrl);
		await inviteePage.getByRole("button", { name: "Accept" }).click();
		await expect(inviteePage).toHaveURL(/\/org\/members$/);

		await inviteeContext.close();
	});
});
