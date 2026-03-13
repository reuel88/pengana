import { describe, expect, it } from "vitest";
import { normalizeSeatCount, resolveWebBaseUrl } from "./web-url";

describe("resolveWebBaseUrl", () => {
	it("prefers WEB_URL over APP_URL and CORS_ORIGIN", () => {
		expect(
			resolveWebBaseUrl({
				WEB_URL: "https://app.example.com/",
				APP_URL: "https://fallback.example.com",
				CORS_ORIGIN: "https://cors.example.com",
			}),
		).toBe("https://app.example.com");
	});

	it("uses APP_URL when WEB_URL is unset", () => {
		expect(
			resolveWebBaseUrl({
				APP_URL: "https://app.example.com/",
				CORS_ORIGIN: "https://cors.example.com",
			}),
		).toBe("https://app.example.com");
	});

	it("falls back to the first http origin from CORS_ORIGIN", () => {
		expect(
			resolveWebBaseUrl({
				CORS_ORIGIN:
					"pengana://, https://app.example.com/ , http://localhost:3001",
			}),
		).toBe("https://app.example.com");
	});

	it("rejects non-http WEB_URL values", () => {
		expect(() =>
			resolveWebBaseUrl({
				WEB_URL: "pengana://app",
				CORS_ORIGIN: "https://app.example.com",
			}),
		).toThrow("WEB_URL must use http or https");
	});
});

describe("normalizeSeatCount", () => {
	it("preserves zero seats", () => {
		expect(normalizeSeatCount(0)).toBe("0");
	});

	it("returns null for missing seats", () => {
		expect(normalizeSeatCount(null)).toBeNull();
		expect(normalizeSeatCount(undefined)).toBeNull();
	});
});
