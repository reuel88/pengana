import { describe, expect, it } from "vitest";
import { isSyncScope, mergeScopes, scopeKey } from "./sync-scope-helpers";

describe("scopeKey", () => {
	it("returns correct key for personal scope", () => {
		expect(scopeKey({ scopeType: "personal", scopeId: "user-123" })).toBe(
			"personal:user-123",
		);
	});

	it("returns correct key for organization scope", () => {
		expect(scopeKey({ scopeType: "organization", scopeId: "org-456" })).toBe(
			"organization:org-456",
		);
	});
});

describe("isSyncScope", () => {
	it("returns true for valid personal scope", () => {
		expect(isSyncScope({ scopeType: "personal", scopeId: "user-123" })).toBe(
			true,
		);
	});

	it("returns true for valid organization scope", () => {
		expect(isSyncScope({ scopeType: "organization", scopeId: "org-456" })).toBe(
			true,
		);
	});

	it("returns false for null", () => {
		expect(isSyncScope(null)).toBe(false);
	});

	it("returns false for undefined", () => {
		expect(isSyncScope(undefined)).toBe(false);
	});

	it("returns false for missing scopeType", () => {
		expect(isSyncScope({ scopeId: "user-123" })).toBe(false);
	});

	it("returns false for invalid scopeType", () => {
		expect(isSyncScope({ scopeType: "invalid", scopeId: "user-123" })).toBe(
			false,
		);
	});

	it("returns false for missing scopeId", () => {
		expect(isSyncScope({ scopeType: "personal" })).toBe(false);
	});

	it("returns false for non-string scopeId", () => {
		expect(isSyncScope({ scopeType: "personal", scopeId: 123 })).toBe(false);
	});

	it("returns false for empty scopeId", () => {
		expect(isSyncScope({ scopeType: "personal", scopeId: "" })).toBe(false);
	});
});

describe("mergeScopes", () => {
	it("returns empty array for no input", () => {
		expect(mergeScopes()).toEqual([]);
	});

	it("passes through a single group", () => {
		const scopes = [{ scopeType: "personal" as const, scopeId: "user-1" }];
		expect(mergeScopes(scopes)).toEqual(scopes);
	});

	it("deduplicates scopes across groups", () => {
		const scope = { scopeType: "personal" as const, scopeId: "user-1" };
		const result = mergeScopes([scope], [scope]);
		expect(result).toEqual([scope]);
	});

	it("does not deduplicate different types with same scopeId", () => {
		const personal = { scopeType: "personal" as const, scopeId: "id-1" };
		const org = { scopeType: "organization" as const, scopeId: "id-1" };
		const result = mergeScopes([personal], [org]);
		expect(result).toHaveLength(2);
		expect(result).toContainEqual(personal);
		expect(result).toContainEqual(org);
	});

	it("last duplicate wins", () => {
		const scope1 = { scopeType: "personal" as const, scopeId: "user-1" };
		const scope2 = { scopeType: "personal" as const, scopeId: "user-1" };
		const result = mergeScopes([scope1], [scope2]);
		expect(result).toHaveLength(1);
	});
});
