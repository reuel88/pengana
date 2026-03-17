import { describe, expect, it } from "vitest";
import { sessionResponseSchema } from "./session-schema";

describe("sessionResponseSchema", () => {
	it("accepts valid data with both session and user", () => {
		const result = sessionResponseSchema.safeParse({
			session: { userId: "user-1" },
			user: { id: "user-1" },
		});
		expect(result.success).toBe(true);
	});

	it("accepts valid data with only session", () => {
		const result = sessionResponseSchema.safeParse({
			session: { userId: "user-1" },
		});
		expect(result.success).toBe(true);
	});

	it("accepts valid data with only user", () => {
		const result = sessionResponseSchema.safeParse({
			user: { id: "user-1" },
		});
		expect(result.success).toBe(true);
	});

	it("fails when neither session nor user is present", () => {
		const result = sessionResponseSchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it("fails on invalid userId type", () => {
		const result = sessionResponseSchema.safeParse({
			session: { userId: 123 },
		});
		expect(result.success).toBe(false);
	});
});
