import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "../context";

vi.mock("@pengana/db/todo-queries", () => ({
	updateTodoForUser: vi.fn(),
}));

vi.mock("./todo-sync", () => ({
	handleSync: vi.fn(),
}));

import { call } from "@orpc/server";

let handleSync: typeof import("./todo-sync").handleSync;
let todoRouter: typeof import("./todo").todoRouter;

process.env.DATABASE_URL ??= "postgres://test:test@localhost:5432/test";
process.env.BETTER_AUTH_SECRET ??= "12345678901234567890123456789012";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.POLAR_ACCESS_TOKEN ??= "polar-token";
process.env.POLAR_PRO_PRODUCT_ID ??= "prod_123";
process.env.POLAR_SUCCESS_URL ??= "http://localhost:3001/success";
process.env.POLAR_WEBHOOK_SECRET ??= "webhook-secret";
process.env.CORS_ORIGIN ??= "http://localhost:3001";

function makeContext(overrides: Partial<Context> = {}): Context {
	return {
		session: {
			user: {
				id: "user-1",
				email: "user@example.com",
				name: "Test User",
			},
			session: {
				activeOrganizationId: null,
			},
		},
		locale: "en-US",
		t: (key: string) => key,
		notifyUser: vi.fn(),
		notifyOrgMembers: vi.fn(),
		...overrides,
	} as Context;
}

describe("todo.sync", () => {
	beforeEach(async () => {
		({ handleSync } = await import("./todo-sync"));
		({ todoRouter } = await import("./todo"));
		vi.clearAllMocks();
		vi.mocked(handleSync).mockResolvedValue({
			serverChanges: [],
			media: [],
			conflicts: [],
			syncedAt: "2026-03-13T00:00:00.000Z",
		});
	});

	it("allows personal todo sync without an active organization", async () => {
		const input = { changes: [], lastSyncedAt: null };

		const result = await call(todoRouter.sync, input, {
			context: makeContext(),
		});

		expect(handleSync).toHaveBeenCalledWith(
			input,
			"user-1",
			expect.any(Function),
		);
		expect(result.data).toEqual({
			serverChanges: [],
			media: [],
			conflicts: [],
			syncedAt: "2026-03-13T00:00:00.000Z",
		});
	});
});
