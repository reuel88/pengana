import { describe, expect, it } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
	it("lowercases ASCII names", () => {
		expect(slugify("Hello World")).toBe("hello-world");
	});

	it("strips diacritics from unicode characters", () => {
		expect(slugify("café résumé")).toBe("cafe-resume");
		expect(slugify("naïve señor über")).toBe("naive-senor-uber");
	});

	it("replaces spaces with hyphens", () => {
		expect(slugify("my org name")).toBe("my-org-name");
	});

	it("collapses multiple consecutive hyphens into one", () => {
		expect(slugify("hello---world")).toBe("hello-world");
		expect(slugify("a  b")).toBe("a-b");
	});

	it("trims leading and trailing hyphens", () => {
		expect(slugify("-hello-")).toBe("hello");
		expect(slugify("  leading and trailing  ")).toBe("leading-and-trailing");
	});

	it("preserves numbers", () => {
		expect(slugify("Team 42")).toBe("team-42");
		expect(slugify("123abc")).toBe("123abc");
	});

	it("returns empty string for empty input", () => {
		expect(slugify("")).toBe("");
	});

	it("handles strings that are only special characters", () => {
		expect(slugify("!!!")).toBe("");
	});
});
