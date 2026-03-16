import type { TodoRow } from "@pengana/db/todo-queries";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@pengana/db/todo-queries", () => ({
	findTodosByIds: vi.fn().mockResolvedValue(new Map()),
	getTodosUpdatedSince: vi.fn().mockResolvedValue([]),
	insertTodo: vi.fn().mockResolvedValue(undefined),
	updateTodo: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@pengana/db/media-queries", () => ({
	findMediaByEntityIds: vi.fn().mockResolvedValue([]),
}));

import {
	findTodosByIds,
	getTodosUpdatedSince,
	insertTodo,
	updateTodo,
} from "@pengana/db/todo-queries";
import { handleTodoSync } from "./todo-sync";

function makeChange(overrides: Record<string, unknown> = {}) {
	return {
		id: "todo-1",
		title: "Test",
		completed: false,
		deleted: false,
		updatedAt: "2025-06-01T00:00:10.000Z",
		userId: "test-user",
		organizationId: null,
		createdBy: null as string | null,
		syncStatus: "pending" as const,
		...overrides,
	};
}

function makeServerRow(overrides: Partial<TodoRow> = {}): TodoRow {
	return {
		id: "todo-1",
		title: "Server Todo",
		completed: false,
		deleted: false,
		updatedAt: new Date("2025-06-01T00:00:05.000Z"),
		scopeType: "personal",
		scopeId: "test-user",
		userId: "test-user",
		organizationId: null,
		createdBy: null,
		...overrides,
	};
}

describe("handleTodoSync", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getTodosUpdatedSince).mockResolvedValue([]);
	});

	it("inserts new todo when not on server", async () => {
		vi.mocked(findTodosByIds).mockResolvedValue(new Map());

		await handleTodoSync(
			{ changes: [makeChange()], lastSyncedAt: null },
			"personal",
			"test-user",
			"test-user",
		);

		expect(insertTodo).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "todo-1",
				title: "Test",
				userId: "test-user",
				scopeType: "personal",
				scopeId: "test-user",
			}),
		);
	});

	it("updates when client timestamp >= server (LWW wins)", async () => {
		const row = makeServerRow({
			updatedAt: new Date("2025-06-01T00:00:05.000Z"),
		});
		vi.mocked(findTodosByIds).mockResolvedValue(new Map([["todo-1", row]]));

		await handleTodoSync(
			{
				changes: [makeChange({ updatedAt: "2025-06-01T00:00:10.000Z" })],
				lastSyncedAt: null,
			},
			"personal",
			"test-user",
			"test-user",
		);

		expect(updateTodo).toHaveBeenCalledWith(
			"todo-1",
			expect.objectContaining({ title: "Test" }),
		);
	});

	it("reports conflict when client timestamp < server (LWW loses)", async () => {
		const row = makeServerRow({
			updatedAt: new Date("2025-06-01T00:00:20.000Z"),
		});
		vi.mocked(findTodosByIds).mockResolvedValue(new Map([["todo-1", row]]));

		const result = await handleTodoSync(
			{
				changes: [makeChange({ updatedAt: "2025-06-01T00:00:10.000Z" })],
				lastSyncedAt: null,
			},
			"personal",
			"test-user",
			"test-user",
		);

		expect(updateTodo).not.toHaveBeenCalled();
		expect(result.conflicts).toContain("todo-1");
	});

	it("skips changes with mismatched userId", async () => {
		await handleTodoSync(
			{
				changes: [makeChange({ userId: "other-user" })],
				lastSyncedAt: null,
			},
			"personal",
			"test-user",
			"test-user",
		);

		expect(insertTodo).not.toHaveBeenCalled();
		expect(updateTodo).not.toHaveBeenCalled();
	});

	it("returns server changes since lastSyncedAt minus 5s overlap", async () => {
		await handleTodoSync(
			{ changes: [], lastSyncedAt: "2025-06-01T00:00:10.000Z" },
			"personal",
			"test-user",
			"test-user",
		);

		const calledDate = vi.mocked(getTodosUpdatedSince).mock.calls[0]?.[2];
		expect(calledDate?.getTime()).toBe(
			new Date("2025-06-01T00:00:10.000Z").getTime() - 5000,
		);
	});

	it("returns all changes when lastSyncedAt is null", async () => {
		await handleTodoSync(
			{ changes: [], lastSyncedAt: null },
			"personal",
			"test-user",
			"test-user",
		);

		const calledDate = vi.mocked(getTodosUpdatedSince).mock.calls[0]?.[2];
		expect(calledDate?.getTime()).toBe(0);
	});

	it("maps server rows to output shape with syncStatus synced", async () => {
		const serverRow = makeServerRow({
			id: "s1",
			title: "From Server",
			updatedAt: new Date("2025-06-01T12:00:00.000Z"),
		});
		vi.mocked(getTodosUpdatedSince).mockResolvedValue([serverRow]);

		const result = await handleTodoSync(
			{ changes: [], lastSyncedAt: null },
			"personal",
			"test-user",
			"test-user",
		);

		expect(result.serverChanges[0]).toEqual({
			id: "s1",
			title: "From Server",
			completed: false,
			deleted: false,
			updatedAt: "2025-06-01T12:00:00.000Z",
			userId: "test-user",
			organizationId: null,
			createdBy: null,
			syncStatus: "synced",
		});
	});

	it("handles mixed insert/update/conflict in single sync", async () => {
		const row2 = makeServerRow({
			id: "todo-2",
			updatedAt: new Date("2025-01-01T00:00:00.000Z"),
		});
		const row3 = makeServerRow({
			id: "todo-3",
			updatedAt: new Date("2025-12-01T00:00:00.000Z"),
		});
		vi.mocked(findTodosByIds).mockResolvedValue(
			new Map([
				["todo-2", row2],
				["todo-3", row3],
			]),
		);

		const result = await handleTodoSync(
			{
				changes: [
					makeChange({ id: "todo-1" }),
					makeChange({ id: "todo-2" }),
					makeChange({ id: "todo-3" }),
				],
				lastSyncedAt: null,
			},
			"personal",
			"test-user",
			"test-user",
		);

		expect(insertTodo).toHaveBeenCalledTimes(1);
		expect(updateTodo).toHaveBeenCalledTimes(1);
		expect(result.conflicts).toEqual(["todo-3"]);
	});

	it("calls notify when changes exist", async () => {
		const notifyUser = vi.fn();
		vi.mocked(findTodosByIds).mockResolvedValue(new Map());

		await handleTodoSync(
			{ changes: [makeChange()], lastSyncedAt: null },
			"personal",
			"test-user",
			"test-user",
			notifyUser,
		);

		expect(notifyUser).toHaveBeenCalledWith("test-user");
	});

	it("does not call notify when changes empty", async () => {
		const notifyUser = vi.fn();

		await handleTodoSync(
			{ changes: [], lastSyncedAt: null },
			"personal",
			"test-user",
			"test-user",
			notifyUser,
		);

		expect(notifyUser).not.toHaveBeenCalled();
	});

	// Org sync tests
	it("inserts new org todo when not on server", async () => {
		vi.mocked(findTodosByIds).mockResolvedValue(new Map());

		await handleTodoSync(
			{
				changes: [
					makeChange({
						organizationId: "org-1",
						createdBy: "user-1",
						userId: "org-1",
					}),
				],
				lastSyncedAt: null,
			},
			"org",
			"org-1",
			"user-1",
		);

		expect(insertTodo).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "todo-1",
				title: "Test",
				scopeType: "org",
				scopeId: "org-1",
				organizationId: "org-1",
				createdBy: "user-1",
			}),
		);
	});

	it("skips org changes for another organization", async () => {
		await handleTodoSync(
			{
				changes: [
					makeChange({
						organizationId: "other-org",
						createdBy: "user-1",
					}),
				],
				lastSyncedAt: null,
			},
			"org",
			"org-1",
			"user-1",
		);

		expect(insertTodo).not.toHaveBeenCalled();
	});

	it("skips org changes from a different user", async () => {
		await handleTodoSync(
			{
				changes: [
					makeChange({
						organizationId: "org-1",
						createdBy: "other-user",
					}),
				],
				lastSyncedAt: null,
			},
			"org",
			"org-1",
			"user-1",
		);

		expect(insertTodo).not.toHaveBeenCalled();
	});

	it("calls notify with the org id when org changes exist", async () => {
		const notifyOrgMembers = vi.fn();

		await handleTodoSync(
			{
				changes: [
					makeChange({
						organizationId: "org-1",
						createdBy: "user-1",
					}),
				],
				lastSyncedAt: null,
			},
			"org",
			"org-1",
			"user-1",
			notifyOrgMembers,
		);

		expect(notifyOrgMembers).toHaveBeenCalledWith("org-1");
	});

	it("maps org server rows to output shape with syncStatus synced", async () => {
		const serverRow = makeServerRow({
			id: "server-org-1",
			title: "From Server",
			updatedAt: new Date("2025-06-01T12:00:00.000Z"),
			scopeType: "org",
			scopeId: "org-1",
			organizationId: "org-1",
			createdBy: "user-1",
		});
		vi.mocked(getTodosUpdatedSince).mockResolvedValue([serverRow]);

		const result = await handleTodoSync(
			{ changes: [], lastSyncedAt: null },
			"org",
			"org-1",
			"user-1",
		);

		expect(result.serverChanges[0]).toEqual({
			id: "server-org-1",
			title: "From Server",
			completed: false,
			deleted: false,
			updatedAt: "2025-06-01T12:00:00.000Z",
			userId: "test-user",
			organizationId: "org-1",
			createdBy: "user-1",
			syncStatus: "synced",
		});
	});
});
