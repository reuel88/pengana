import type { TodoRow } from "@pengana/db/todo-queries";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@pengana/db/todo-queries", () => ({
	findTodoById: vi.fn(),
	getTodosUpdatedSince: vi.fn().mockResolvedValue([]),
	insertTodo: vi.fn().mockResolvedValue(undefined),
	updateTodo: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@pengana/db/media-queries", () => ({
	findMediaByEntityIds: vi.fn().mockResolvedValue([]),
}));

import {
	findTodoById,
	getTodosUpdatedSince,
	insertTodo,
	updateTodo,
} from "@pengana/db/todo-queries";
import { handleSync } from "./todo-sync";

function makeChange(overrides: Record<string, unknown> = {}) {
	return {
		id: "todo-1",
		title: "Test",
		completed: false,
		deleted: false,
		updatedAt: "2025-06-01T00:00:10.000Z",
		userId: "test-user",
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
		userId: "test-user",
		...overrides,
	};
}

describe("handleSync", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getTodosUpdatedSince).mockResolvedValue([]);
	});

	it("inserts new todo when not on server", async () => {
		vi.mocked(findTodoById).mockResolvedValue(undefined);

		await handleSync(
			{ changes: [makeChange()], lastSyncedAt: null },
			"test-user",
		);

		expect(insertTodo).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "todo-1",
				title: "Test",
				userId: "test-user",
			}),
		);
	});

	it("updates when client timestamp >= server (LWW wins)", async () => {
		vi.mocked(findTodoById).mockResolvedValue(
			makeServerRow({ updatedAt: new Date("2025-06-01T00:00:05.000Z") }),
		);

		await handleSync(
			{
				changes: [makeChange({ updatedAt: "2025-06-01T00:00:10.000Z" })],
				lastSyncedAt: null,
			},
			"test-user",
		);

		expect(updateTodo).toHaveBeenCalledWith(
			"todo-1",
			expect.objectContaining({ title: "Test" }),
		);
	});

	it("reports conflict when client timestamp < server (LWW loses)", async () => {
		vi.mocked(findTodoById).mockResolvedValue(
			makeServerRow({ updatedAt: new Date("2025-06-01T00:00:20.000Z") }),
		);

		const result = await handleSync(
			{
				changes: [makeChange({ updatedAt: "2025-06-01T00:00:10.000Z" })],
				lastSyncedAt: null,
			},
			"test-user",
		);

		expect(updateTodo).not.toHaveBeenCalled();
		expect(result.conflicts).toContain("todo-1");
	});

	it("skips changes with mismatched userId", async () => {
		await handleSync(
			{
				changes: [makeChange({ userId: "other-user" })],
				lastSyncedAt: null,
			},
			"test-user",
		);

		expect(findTodoById).not.toHaveBeenCalled();
		expect(insertTodo).not.toHaveBeenCalled();
		expect(updateTodo).not.toHaveBeenCalled();
	});

	it("returns server changes since lastSyncedAt minus 5s overlap", async () => {
		await handleSync(
			{ changes: [], lastSyncedAt: "2025-06-01T00:00:10.000Z" },
			"test-user",
		);

		const calledDate = vi.mocked(getTodosUpdatedSince).mock.calls[0]?.[1];
		expect(calledDate.getTime()).toBe(
			new Date("2025-06-01T00:00:10.000Z").getTime() - 5000,
		);
	});

	it("returns all changes when lastSyncedAt is null", async () => {
		await handleSync({ changes: [], lastSyncedAt: null }, "test-user");

		const calledDate = vi.mocked(getTodosUpdatedSince).mock.calls[0]?.[1];
		expect(calledDate.getTime()).toBe(0);
	});

	it("maps server rows to output shape with syncStatus synced", async () => {
		const serverRow = makeServerRow({
			id: "s1",
			title: "From Server",
			updatedAt: new Date("2025-06-01T12:00:00.000Z"),
		});
		vi.mocked(getTodosUpdatedSince).mockResolvedValue([serverRow]);

		const result = await handleSync(
			{ changes: [], lastSyncedAt: null },
			"test-user",
		);

		expect(result.serverChanges[0]).toEqual({
			id: "s1",
			title: "From Server",
			completed: false,
			deleted: false,
			updatedAt: "2025-06-01T12:00:00.000Z",
			userId: "test-user",
			syncStatus: "synced",
		});
	});

	it("handles mixed insert/update/conflict in single sync", async () => {
		// insert - not found
		vi.mocked(findTodoById)
			.mockResolvedValueOnce(undefined)
			// update - client wins
			.mockResolvedValueOnce(
				makeServerRow({
					id: "todo-2",
					updatedAt: new Date("2025-01-01T00:00:00.000Z"),
				}),
			)
			// conflict - server wins
			.mockResolvedValueOnce(
				makeServerRow({
					id: "todo-3",
					updatedAt: new Date("2025-12-01T00:00:00.000Z"),
				}),
			);

		const result = await handleSync(
			{
				changes: [
					makeChange({ id: "todo-1" }),
					makeChange({ id: "todo-2" }),
					makeChange({ id: "todo-3" }),
				],
				lastSyncedAt: null,
			},
			"test-user",
		);

		expect(insertTodo).toHaveBeenCalledTimes(1);
		expect(updateTodo).toHaveBeenCalledTimes(1);
		expect(result.conflicts).toEqual(["todo-3"]);
	});

	it("calls notifyUser when changes exist", async () => {
		const notifyUser = vi.fn();

		await handleSync(
			{ changes: [makeChange()], lastSyncedAt: null },
			"test-user",
			notifyUser,
		);

		expect(notifyUser).toHaveBeenCalledWith("test-user");
	});

	it("does not call notifyUser when changes empty", async () => {
		const notifyUser = vi.fn();

		await handleSync(
			{ changes: [], lastSyncedAt: null },
			"test-user",
			notifyUser,
		);

		expect(notifyUser).not.toHaveBeenCalled();
	});
});
