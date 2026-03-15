import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "../context";

vi.mock("@pengana/db/todo-queries", () => ({
	findTodoById: vi.fn(),
	updateTodo: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@pengana/db/org-todo-queries", () => ({
	findOrgTodoById: vi.fn(),
	updateOrgTodo: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@pengana/db/seat-queries", () => ({
	isMemberSeatedByUserId: vi.fn(),
	autoSeatOwner: vi.fn(),
}));

vi.mock("@pengana/db/media-queries", () => ({
	countMediaByEntityId: vi.fn().mockResolvedValue(0),
	insertMedia: vi.fn().mockResolvedValue(undefined),
	updateMediaUrl: vi.fn().mockResolvedValue(undefined),
	deleteMedia: vi.fn().mockResolvedValue(undefined),
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

import { findOrgTodoById } from "@pengana/db/org-todo-queries";
import {
	autoSeatOwner,
	isMemberSeatedByUserId,
} from "@pengana/db/seat-queries";
import { findTodoById } from "@pengana/db/todo-queries";
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
		entityType: "todo" as const,
		entityId: "todo-1",
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
		vi.mocked(findTodoById).mockResolvedValue(undefined);
		vi.mocked(findOrgTodoById).mockResolvedValue(undefined);
		vi.mocked(isMemberSeatedByUserId).mockResolvedValue(false);
		vi.mocked(autoSeatOwner).mockResolvedValue(false);
	});

	it("allows uploading attachments for personal todos without an active organization", async () => {
		vi.mocked(findTodoById).mockResolvedValue({
			id: "todo-1",
			title: "Personal",
			completed: false,
			deleted: false,
			updatedAt: new Date("2026-03-13T00:00:00.000Z"),
			userId: "user-1",
		});

		const ctx = makeContext();
		const result = await call(uploadRouter.upload, makeInput(), {
			context: ctx,
		});

		expect(result.data.url).toContain("/uploads/");
		expect(fsMocks.writeFile).toHaveBeenCalledOnce();
		expect(isMemberSeatedByUserId).not.toHaveBeenCalled();
		expect(ctx.notifyUser).toHaveBeenCalledWith("user-1");
	});

	it("requires a seat when uploading attachments for org todos", async () => {
		vi.mocked(findOrgTodoById).mockResolvedValue({
			id: "todo-1",
			title: "Org",
			completed: false,
			deleted: false,
			updatedAt: new Date("2026-03-13T00:00:00.000Z"),
			organizationId: "org-1",
			createdBy: "user-1",
		});

		await expect(
			call(uploadRouter.upload, makeInput({ entityType: "orgTodo" as const }), {
				context: makeContext({
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
				}),
			}),
		).rejects.toThrow("seatRequiredForWrite");

		expect(isMemberSeatedByUserId).toHaveBeenCalledWith("org-1", "user-1");
		expect(fsMocks.mkdir).not.toHaveBeenCalled();
		expect(fsMocks.writeFile).not.toHaveBeenCalled();
	});

	it("notifies org members after a successful org todo upload", async () => {
		vi.mocked(findOrgTodoById).mockResolvedValue({
			id: "todo-1",
			title: "Org",
			completed: false,
			deleted: false,
			updatedAt: new Date("2026-03-13T00:00:00.000Z"),
			organizationId: "org-1",
			createdBy: "user-1",
		});
		vi.mocked(isMemberSeatedByUserId).mockResolvedValue(true);

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
			},
		});

		const result = await call(
			uploadRouter.upload,
			makeInput({ entityType: "orgTodo" as const }),
			{ context: ctx },
		);

		expect(result.data.url).toContain("/uploads/");
		expect(ctx.notifyOrgMembers).toHaveBeenCalledWith("org-1");
		expect(ctx.notifyUser).not.toHaveBeenCalled();
	});
});
