import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "../context";

vi.mock("@pengana/db/todo-queries", () => ({
	findTodoById: vi.fn(),
	updateTodo: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@pengana/db/seat-queries", () => ({
	isMemberSeatedByUserId: vi.fn(),
	autoSeatOwner: vi.fn(),
}));

vi.mock("@pengana/db/media-queries", () => ({
	countMediaByEntityId: vi.fn().mockResolvedValue(0),
	insertMedia: vi.fn().mockResolvedValue(undefined),
	findMediaById: vi.fn().mockResolvedValue(undefined),
	deleteMedia: vi.fn().mockResolvedValue(undefined),
	attachMedia: vi.fn().mockResolvedValue({
		id: "att-1",
		mediaId: "m-1",
		entityType: "todo",
		entityId: "todo-1",
		position: 0,
		createdAt: new Date(),
	}),
	detachMedia: vi.fn().mockResolvedValue(undefined),
	findAttachmentsByMedia: vi.fn().mockResolvedValue([]),
}));

const fsMocks = vi.hoisted(() => ({
	writeFile: vi.fn().mockResolvedValue(undefined),
	mkdir: vi.fn().mockResolvedValue(undefined),
	access: vi
		.fn()
		.mockRejectedValue(Object.assign(new Error("missing"), { code: "ENOENT" })),
}));

vi.mock("node:fs/promises", () => ({
	access: fsMocks.access,
	mkdir: fsMocks.mkdir,
	writeFile: fsMocks.writeFile,
}));

process.env.DATABASE_URL ??= "postgres://test:test@localhost:5432/test";
process.env.BETTER_AUTH_SECRET ??= "12345678901234567890123456789012";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
process.env.POLAR_ACCESS_TOKEN ??= "polar-token";
process.env.POLAR_PRO_PRODUCT_ID ??= "prod_123";
process.env.POLAR_SUCCESS_URL ??= "http://localhost:3001/success";
process.env.POLAR_WEBHOOK_SECRET ??= "webhook-secret";
process.env.CORS_ORIGIN ??= "http://localhost:3001";

import { insertMedia } from "@pengana/db/media-queries";
import { uploadRouter } from "./upload";

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

function makeInput(overrides: Record<string, unknown> = {}) {
	return {
		fileName: "photo.jpg",
		mimeType: "image/jpeg" as const,
		data: Buffer.from("test").toString("base64"),
		idempotencyKey: "550e8400-e29b-41d4-a716-446655440000",
		attachmentId: "660e8400-e29b-41d4-a716-446655440000",
		...overrides,
	};
}

describe("upload.upload", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(fsMocks.access).mockRejectedValue(
			Object.assign(new Error("missing"), { code: "ENOENT" }),
		);
	});

	it("uploads a file without entity association", async () => {
		const ctx = makeContext();
		const result = await call(uploadRouter.upload, makeInput(), {
			context: ctx,
		});

		expect(result.data.url).toContain("/uploads/");
		expect(fsMocks.writeFile).toHaveBeenCalledOnce();
		expect(ctx.notifyUser).toHaveBeenCalledWith("user-1");

		expect(insertMedia).toHaveBeenCalledWith(
			expect.objectContaining({
				scopeType: "personal",
				scopeId: "user-1",
				organizationId: null,
				createdBy: "user-1",
			}),
		);
	});

	it("derives org scope when activeOrganizationId is set", async () => {
		const ctx = makeContext({
			session: {
				user: {
					id: "user-1",
					email: "user@example.com",
					name: "Test User",
				},
				session: {
					activeOrganizationId: "org-1",
				},
			} as Context["session"],
		});

		const result = await call(uploadRouter.upload, makeInput(), {
			context: ctx,
		});

		expect(result.data.url).toContain("/uploads/");
		expect(ctx.notifyOrgMembers).toHaveBeenCalledWith("org-1");
		expect(ctx.notifyUser).not.toHaveBeenCalled();

		expect(insertMedia).toHaveBeenCalledWith(
			expect.objectContaining({
				scopeType: "org",
				scopeId: "org-1",
				organizationId: "org-1",
				createdBy: "user-1",
			}),
		);
	});
});
