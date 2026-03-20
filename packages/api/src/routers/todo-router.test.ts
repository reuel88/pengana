import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "../context";

vi.mock("@pengana/db/todo-queries", () => ({
	updateTodoForScope: vi.fn(),
}));

vi.mock("@pengana/db/seat-queries", () => ({
	isMemberSeatedByUserId: vi.fn().mockResolvedValue(true),
	autoSeatOwner: vi.fn().mockResolvedValue(false),
}));

vi.mock("./todo-sync", () => ({
	handleTodoSync: vi.fn(),
}));

import { call } from "@orpc/server";

let handleTodoSync: typeof import("./todo-sync").handleTodoSync;
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
				activeOrganizationId: "org-1",
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
		({ handleTodoSync } = await import("./todo-sync"));
		({ todoRouter } = await import("./todo"));
		vi.clearAllMocks();
		vi.mocked(handleTodoSync).mockResolvedValue({
			serverChanges: [],
			media: [],
			mediaAttachments: [],
			conflicts: [],
			syncedAt: "2026-03-13T00:00:00.000Z",
		});
	});

	it("passes active organization to personal todo sync", async () => {
		const input = { changes: [], lastSyncedAt: null };

		const result = await call(todoRouter.sync, input, {
			context: makeContext(),
		});

		expect(handleTodoSync).toHaveBeenCalledWith(
			input,
			"personal",
			"user-1",
			"user-1",
			"org-1",
			expect.any(Function),
		);
		expect(result.data).toEqual({
			serverChanges: [],
			media: [],
			mediaAttachments: [],
			conflicts: [],
			syncedAt: "2026-03-13T00:00:00.000Z",
		});
	});
});
