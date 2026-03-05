import { beforeEach, describe, expect, it, vi } from "vitest";
import { SyncEngine } from "./engine";
import type { SyncAdapter, SyncEvent, SyncTransport, Todo } from "./types";

function makeTodo(overrides: Partial<Todo> = {}): Todo {
	return {
		id: "todo-1",
		title: "Test todo",
		completed: false,
		updatedAt: new Date().toISOString(),
		userId: "user-1",
		syncStatus: "pending",
		deleted: false,
		attachmentUrl: null,
		...overrides,
	};
}

function createMockAdapter(): SyncAdapter {
	return {
		getPendingChanges: vi.fn().mockResolvedValue([]),
		applyServerChanges: vi.fn().mockResolvedValue(undefined),
		markAsSynced: vi.fn().mockResolvedValue(undefined),
		markAsConflict: vi.fn().mockResolvedValue(undefined),
		getLastSyncedAt: vi.fn().mockResolvedValue(null),
		setLastSyncedAt: vi.fn().mockResolvedValue(undefined),
	};
}

function createMockTransport(): SyncTransport {
	return {
		sync: vi.fn().mockResolvedValue({
			serverChanges: [],
			conflicts: [],
			syncedAt: new Date().toISOString(),
		}),
	};
}

describe("SyncEngine", () => {
	let adapter: SyncAdapter;
	let transport: SyncTransport;
	let engine: SyncEngine;

	beforeEach(() => {
		adapter = createMockAdapter();
		transport = createMockTransport();
		engine = new SyncEngine(adapter, transport);
	});

	it("emits sync:start, sync:push, sync:complete on successful sync with no changes", async () => {
		const events: SyncEvent[] = [];
		engine.onEvent((e) => events.push(e));

		await engine.sync();

		const types = events.map((e) => e.type);
		expect(types).toEqual(["sync:start", "sync:push", "sync:complete"]);
		expect(adapter.setLastSyncedAt).toHaveBeenCalled();
	});

	it("pushes pending changes to transport", async () => {
		const pending = [makeTodo({ id: "a" }), makeTodo({ id: "b" })];
		vi.mocked(adapter.getPendingChanges).mockResolvedValue(pending);
		vi.mocked(adapter.getLastSyncedAt).mockResolvedValue(
			"2025-01-01T00:00:00Z",
		);

		await engine.sync();

		expect(transport.sync).toHaveBeenCalledWith({
			changes: pending,
			lastSyncedAt: "2025-01-01T00:00:00Z",
		});
	});

	it("applies server changes from transport", async () => {
		const serverTodos = [makeTodo({ id: "s1", syncStatus: "synced" })];
		vi.mocked(transport.sync).mockResolvedValue({
			serverChanges: serverTodos,
			conflicts: [],
			syncedAt: new Date().toISOString(),
		});

		const events: SyncEvent[] = [];
		engine.onEvent((e) => events.push(e));

		await engine.sync();

		expect(adapter.applyServerChanges).toHaveBeenCalledWith(serverTodos, []);
		expect(events.some((e) => e.type === "sync:pull")).toBe(true);
	});

	it("does not call applyServerChanges when serverChanges is empty", async () => {
		await engine.sync();
		expect(adapter.applyServerChanges).not.toHaveBeenCalled();
	});

	it("marks non-conflicting pushed items as synced", async () => {
		const pending = [
			makeTodo({ id: "a" }),
			makeTodo({ id: "b" }),
			makeTodo({ id: "c" }),
		];
		vi.mocked(adapter.getPendingChanges).mockResolvedValue(pending);
		vi.mocked(transport.sync).mockResolvedValue({
			serverChanges: [],
			conflicts: ["b"],
			syncedAt: new Date().toISOString(),
		});

		await engine.sync();

		const syncedItems = vi.mocked(adapter.markAsSynced).mock.calls[0]![0];
		expect(syncedItems).toHaveLength(2);
		expect(syncedItems.map((t: Todo) => t.id)).toEqual(["a", "c"]);
	});

	it("marks conflicting IDs and emits sync:conflict", async () => {
		const pending = [makeTodo({ id: "id-1" })];
		vi.mocked(adapter.getPendingChanges).mockResolvedValue(pending);
		vi.mocked(transport.sync).mockResolvedValue({
			serverChanges: [],
			conflicts: ["id-1"],
			syncedAt: new Date().toISOString(),
		});

		const events: SyncEvent[] = [];
		engine.onEvent((e) => events.push(e));

		await engine.sync();

		expect(adapter.markAsConflict).toHaveBeenCalledWith(["id-1"]);
		expect(events.some((e) => e.type === "sync:conflict")).toBe(true);
	});

	it("emits sync:error when transport throws", async () => {
		vi.mocked(transport.sync).mockRejectedValue(new Error("network down"));

		const events: SyncEvent[] = [];
		engine.onEvent((e) => events.push(e));

		await engine.sync();

		expect(events.some((e) => e.type === "sync:error")).toBe(true);
		expect(engine.isSyncing).toBe(false);
	});

	it("emits sync:error when adapter throws", async () => {
		vi.mocked(adapter.getPendingChanges).mockRejectedValue(
			new Error("db error"),
		);

		const events: SyncEvent[] = [];
		engine.onEvent((e) => events.push(e));

		await engine.sync();

		expect(events.some((e) => e.type === "sync:error")).toBe(true);
	});

	it("queues re-sync when called during active sync", async () => {
		let resolveSync!: (value: {
			serverChanges: Todo[];
			conflicts: string[];
			syncedAt: string;
		}) => void;
		vi.mocked(transport.sync).mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveSync = resolve;
				}),
		);

		const firstSync = engine.sync();
		// Wait for transport.sync to be called so resolveSync is assigned
		await vi.waitFor(() => {
			expect(transport.sync).toHaveBeenCalledTimes(1);
		});

		// Second call while first is in progress
		engine.sync();

		// Now reset mock to resolve immediately for the queued sync
		vi.mocked(transport.sync).mockResolvedValue({
			serverChanges: [],
			conflicts: [],
			syncedAt: new Date().toISOString(),
		});

		// Resolve the first sync
		resolveSync({
			serverChanges: [],
			conflicts: [],
			syncedAt: new Date().toISOString(),
		});

		await firstSync;
		// Wait for the queued re-sync to complete
		await vi.waitFor(() => {
			expect(transport.sync).toHaveBeenCalledTimes(2);
		});
	});

	it("isSyncing reflects current state", async () => {
		expect(engine.isSyncing).toBe(false);

		let resolveSync!: (value: {
			serverChanges: Todo[];
			conflicts: string[];
			syncedAt: string;
		}) => void;
		vi.mocked(transport.sync).mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveSync = resolve;
				}),
		);

		const syncPromise = engine.sync();
		// Wait for transport.sync to be called so we know we're mid-sync
		await vi.waitFor(() => {
			expect(transport.sync).toHaveBeenCalledTimes(1);
		});
		expect(engine.isSyncing).toBe(true);

		resolveSync({
			serverChanges: [],
			conflicts: [],
			syncedAt: new Date().toISOString(),
		});

		await syncPromise;
		expect(engine.isSyncing).toBe(false);
	});
});
