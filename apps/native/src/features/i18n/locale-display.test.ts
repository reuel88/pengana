import { LOCALE_OPTIONS } from "@pengana/i18n";
import { describe, expect, it } from "vitest";

describe("shared locale display metadata", () => {
	it("includes every supported locale once and preserves ordering", () => {
		expect(LOCALE_OPTIONS.map((option) => option.value)).toEqual([
			"en-US",
			"en-AU",
			"es",
			"zh",
			"tl",
			"vi",
			"ar",
			"fr",
			"ko",
			"ru",
			"pt-BR",
		]);
	});

	it("uses the canonical display labels", () => {
		expect(LOCALE_OPTIONS.find((option) => option.value === "es")?.label).toBe(
			"Español",
		);
		expect(
			LOCALE_OPTIONS.find((option) => option.value === "pt-BR")?.label,
		).toBe("Português (BR)");
	});
});
