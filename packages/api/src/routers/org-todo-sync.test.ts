import type { OrgTodoRow } from "@pengana/db/org-todo-queries";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@pengana/db/org-todo-queries", () => ({
	findOrgTodoById: vi.fn(),
	getOrgTodosUpdatedSince: vi.fn().mockResolvedValue([]),
	insertOrgTodo: vi.fn().mockResolvedValue(undefined),
	updateOrgTodo: vi.fn().mockResolvedValue(undefined),
}));

import {
	findOrgTodoById,
	getOrgTodosUpdatedSince,
	insertOrgTodo,
	updateOrgTodo,
} from "@pengana/db/org-todo-queries";
import { handleOrgSync } from "./org-todo-sync";

function makeChange(overrides: Record<string, unknown> = {}) {
	return {
		id: "org-todo-1",
		title: "Org Test",
		completed: false,
		deleted: false,
		attachmentUrl: null,
		updatedAt: "2025-06-01T00:00:10.000Z",
		organizationId: "org-1",
		createdBy: "user-1",
		syncStatus: "pending" as const,
		...overrides,
	};
}

function makeServerRow(overrides: Partial<OrgTodoRow> = {}): OrgTodoRow {
	return {
		id: "org-todo-1",
		title: "Server Org Todo",
		completed: false,
		deleted: false,
		attachmentUrl: null,
		updatedAt: new Date("2025-06-01T00:00:05.000Z"),
		organizationId: "org-1",
		createdBy: "user-1",
		...overrides,
	};
}

describe("handleOrgSync", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getOrgTodosUpdatedSince).mockResolvedValue([]);
	});

	it("inserts new org todo when not on server", async () => {
		vi.mocked(findOrgTodoById).mockResolvedValue(undefined);

		await handleOrgSync(
			{ changes: [makeChange()], lastSyncedAt: null },
			"org-1",
			"user-1",
		);

		expect(insertOrgTodo).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "org-todo-1",
				title: "Org Test",
				organizationId: "org-1",
				createdBy: "user-1",
			}),
		);
	});

	it("skips changes for another organization", async () => {
		await handleOrgSync(
			{
				changes: [makeChange({ organizationId: "other-org" })],
				lastSyncedAt: null,
			},
			"org-1",
			"user-1",
		);

		expect(findOrgTodoById).not.toHaveBeenCalled();
		expect(insertOrgTodo).not.toHaveBeenCalled();
		expect(updateOrgTodo).not.toHaveBeenCalled();
	});

	it("calls notifyOrgMembers with the org id when changes exist", async () => {
		const notifyOrgMembers = vi.fn();

		await handleOrgSync(
			{ changes: [makeChange()], lastSyncedAt: null },
			"org-1",
			"user-1",
			notifyOrgMembers,
		);

		expect(notifyOrgMembers).toHaveBeenCalledWith("org-1");
	});

	it("does not call notifyOrgMembers when changes empty", async () => {
		const notifyOrgMembers = vi.fn();

		await handleOrgSync(
			{ changes: [], lastSyncedAt: null },
			"org-1",
			"user-1",
			notifyOrgMembers,
		);

		expect(notifyOrgMembers).not.toHaveBeenCalled();
	});

	it("maps server rows to org output shape with syncStatus synced", async () => {
		const serverRow = makeServerRow({
			id: "server-org-1",
			title: "From Server",
			attachmentUrl: "https://cdn.example.com/f.jpg",
			updatedAt: new Date("2025-06-01T12:00:00.000Z"),
		});
		vi.mocked(getOrgTodosUpdatedSince).mockResolvedValue([serverRow]);

		const result = await handleOrgSync(
			{ changes: [], lastSyncedAt: null },
			"org-1",
			"user-1",
		);

		expect(result.serverChanges[0]).toEqual({
			id: "server-org-1",
			title: "From Server",
			completed: false,
			deleted: false,
			attachmentUrl: "https://cdn.example.com/f.jpg",
			updatedAt: "2025-06-01T12:00:00.000Z",
			organizationId: "org-1",
			createdBy: "user-1",
			syncStatus: "synced",
		});
	});
});
