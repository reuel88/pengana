import type { Browser, Page } from "@playwright/test";
import { TEST_PASSWORD, TEST_USER_NAME } from "../constants.js";
import { OrgPage } from "../page-objects/org.page.js";
import { extractInvitationUrl, pollDevInbox } from "./dev-inbox.js";
import { signUpAndVerify } from "./web-auth.js";

/**
 * Signs up an invitee, has the owner invite them, polls the dev inbox for
 * the invitation email, and accepts it. Returns the invitee's page and context.
 */
export async function inviteAndAcceptMember(
	ownerPage: Page,
	orgName: string,
	browser: Browser,
	options?: { inviteeRole?: "member" | "admin" },
) {
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

	await ownerOrgPage.inviteMember(inviteeEmail, options?.inviteeRole);

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
	await inviteePage.waitForURL(/\/org\/members$/);

	return { inviteePage, inviteeContext, inviteeEmail };
}
