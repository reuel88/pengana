import { expect, test } from "../../fixtures/index.js";

test.describe("Extension popup", () => {
	test.skip(
		({ browserName }) => browserName !== "chromium",
		"Extension tests only run in Chromium",
	);

	test("placeholder: extension popup test", async () => {
		// TODO: Load extension via launchOptions and test popup
		// Reference: https://playwright.dev/docs/chrome-extensions
		expect(true).toBe(true);
	});
});
