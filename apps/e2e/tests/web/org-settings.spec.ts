import { expect, test } from "../../fixtures/index.js";
import { OrgPage } from "../../page-objects/org.page.js";

test.describe("Organisation Settings", () => {
	test("admin can update org name", async ({
		authenticatedWithOrgPage: { page },
	}) => {
		const orgPage = new OrgPage(page);
		await orgPage.navigateToSettings();

		const newName = `Updated Org ${crypto.randomUUID().slice(0, 8)}`;
		await orgPage.updateOrgDetails({ name: newName });
		await expect(page.getByText("Organization updated")).toBeVisible();

		await page.reload();
		await expect(page.locator("#org-name")).toHaveValue(newName);
	});

	test("admin can update org slug", async ({
		authenticatedWithOrgPage: { page },
	}) => {
		const orgPage = new OrgPage(page);
		await orgPage.navigateToSettings();

		const newSlug = `slug-${crypto.randomUUID().slice(0, 8)}`;
		await orgPage.updateOrgDetails({ slug: newSlug });
		await expect(page.getByText("Organization updated")).toBeVisible();
	});

	test("owner can delete organization", async ({
		authenticatedWithOrgPage: { page },
	}) => {
		const orgPage = new OrgPage(page);
		await orgPage.navigateToSettings();

		await orgPage.deleteOrganization();
		// After deletion, the org no longer exists — verify via page state.
		// The toast may not appear if query invalidation errors interrupt.
		await expect(
			page
				.getByText("Organization deleted")
				.or(page.getByText("No active organization")),
		).toBeVisible({ timeout: 15_000 });
	});
});
