import { expect, test } from "@playwright/test";
import {
	extractMagicLinkUrl,
	extractResetPasswordUrl,
} from "../../support/dev-inbox.js";

test.describe("Dev inbox extractors", () => {
	test("extractResetPasswordUrl ignores unrelated links before the reset link", () => {
		const html = `
			<header><a href="https://pengana.com">Home</a></header>
			<main>
				<a href="https://app.pengana.com/reset-password?token=abc&amp;email=test%40example.com">
					Reset password
				</a>
			</main>
			<footer><a href="https://pengana.com/privacy">Privacy</a></footer>
		`;

		expect(extractResetPasswordUrl("test@example.com", html)).toBe(
			"https://app.pengana.com/reset-password?token=abc&email=test%40example.com",
		);
	});

	test("extractMagicLinkUrl ignores unrelated links before the magic link", () => {
		const html = `
			<header><a href="https://pengana.com">Home</a></header>
			<main>
				<a href="https://app.pengana.com/magic-link/verify?token=abc&#x3D;&#x3D;&email=test%40example.com">
					Sign in
				</a>
			</main>
			<footer><a href="https://pengana.com/privacy">Privacy</a></footer>
		`;

		expect(extractMagicLinkUrl("test@example.com", html)).toBe(
			"https://app.pengana.com/magic-link/verify?token=abc==&email=test%40example.com",
		);
	});

	test("extractResetPasswordUrl preserves the existing error when no reset link exists", () => {
		expect(() =>
			extractResetPasswordUrl(
				"test@example.com",
				'<a href="https://pengana.com">Home</a>',
			),
		).toThrow(
			"Reset password email for test@example.com did not contain a valid reset URL.",
		);
	});

	test("extractMagicLinkUrl preserves the existing error when no magic link exists", () => {
		expect(() =>
			extractMagicLinkUrl(
				"test@example.com",
				'<a href="https://pengana.com">Home</a>',
			),
		).toThrow(
			"Magic link email for test@example.com did not contain a valid sign-in URL.",
		);
	});
});
