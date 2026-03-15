import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SyncAdapter, SyncEvent, SyncTransport, Todo } from "../types";
import { SyncEngine } from "./engine";

function makeTodo(overrides: Partial<Todo> = {}): Todo {
	return {
		id: "todo-1",
		title: "Test todo",
		completed: false,
		updatedAt: new Date().toISOString(),
		userId: "user-1",
		syncStatus: "pending",
		deleted: false,
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

function makeSyncResult(
	overrides: Partial<{
		serverChanges: Todo[];
		conflicts: string[];
		syncedAt: string;
	}> = {},
) {
	return {
		serverChanges: [] as Todo[],
		conflicts: [] as string[],
		syncedAt: new Date().toISOString(),
		...overrides,
	};
}

function createMockTransport(): SyncTransport {
	return {
		sync: vi.fn().mockResolvedValue(makeSyncResult()),
	};
}

function collectEvents(engine: SyncEngine): SyncEvent[] {
	const events: SyncEvent[] = [];
	engine.onEvent((e) => events.push(e));
	return events;
}

function mockTransportSyncDeferred(transport: SyncTransport) {
	let resolveSync!: (value: ReturnType<typeof makeSyncResult>) => void;
	let rejectSync!: (reason?: unknown) => void;
	let lastSignal: AbortSignal | undefined;
	vi.mocked(transport.sync).mockImplementation((input) => {
		lastSignal = input.signal;
		return new Promise((resolve, reject) => {
			resolveSync = resolve;
			rejectSync = reject;
			input.signal?.addEventListener(
				"abort",
				() => reject(createAbortError()),
				{ once: true },
			);
		});
	});
	return {
		resolve: (overrides?: Parameters<typeof makeSyncResult>[0]) =>
			resolveSync(makeSyncResult(overrides)),
		reject: (reason?: unknown) => rejectSync(reason),
		getSignal: () => lastSignal,
	};
}

function deferredPromise<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

function createAbortError() {
	if (typeof DOMException !== "undefined") {
		return new DOMException("Sync aborted", "AbortError");
	}

	const error = new Error("Sync aborted");
	error.name = "AbortError";
	return error;
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
		const events = collectEvents(engine);

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
			signal: expect.any(AbortSignal),
		});
	});

	it("applies server changes from transport", async () => {
		const serverTodos = [makeTodo({ id: "s1", syncStatus: "synced" })];
		vi.mocked(transport.sync).mockResolvedValue(
			makeSyncResult({ serverChanges: serverTodos }),
		);

		const events = collectEvents(engine);

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
		vi.mocked(transport.sync).mockResolvedValue(
			makeSyncResult({ conflicts: ["b"] }),
		);

		await engine.sync();

		const syncedItems = vi.mocked(adapter.markAsSynced).mock.calls[0]?.[0];
		expect(syncedItems).toHaveLength(2);
		expect((syncedItems || []).map((t: Todo) => t.id)).toEqual(["a", "c"]);
	});

	it("marks conflicting IDs and emits sync:conflict", async () => {
		const pending = [makeTodo({ id: "id-1" })];
		vi.mocked(adapter.getPendingChanges).mockResolvedValue(pending);
		vi.mocked(transport.sync).mockResolvedValue(
			makeSyncResult({ conflicts: ["id-1"] }),
		);

		const events = collectEvents(engine);

		await engine.sync();

		expect(adapter.markAsConflict).toHaveBeenCalledWith(["id-1"]);
		expect(events.some((e) => e.type === "sync:conflict")).toBe(true);
	});

	it("emits sync:error when transport throws", async () => {
		vi.mocked(transport.sync).mockRejectedValue(new Error("network down"));

		const events = collectEvents(engine);

		await engine.sync();

		expect(events.some((e) => e.type === "sync:error")).toBe(true);
		expect(engine.isSyncing).toBe(false);
	});

	it("emits sync:error when adapter throws", async () => {
		vi.mocked(adapter.getPendingChanges).mockRejectedValue(
			new Error("db error"),
		);

		const events = collectEvents(engine);

		await engine.sync();

		expect(events.some((e) => e.type === "sync:error")).toBe(true);
	});

	it("queues re-sync when called during active sync", async () => {
		const deferred = mockTransportSyncDeferred(transport);

		const firstSync = engine.sync();
		// Wait for transport.sync to be called so resolveSync is assigned
		await vi.waitFor(() => {
			expect(transport.sync).toHaveBeenCalledTimes(1);
		});

		// Second call while first is in progress
		engine.sync();

		// Now reset mock to resolve immediately for the queued sync
		vi.mocked(transport.sync).mockResolvedValue(makeSyncResult());

		// Resolve the first sync
		deferred.resolve();

		await firstSync;
		// Wait for the queued re-sync to complete
		await vi.waitFor(() => {
			expect(transport.sync).toHaveBeenCalledTimes(2);
		});
	});

	it("isSyncing reflects current state", async () => {
		expect(engine.isSyncing).toBe(false);

		const deferred = mockTransportSyncDeferred(transport);

		const syncPromise = engine.sync();
		// Wait for transport.sync to be called so we know we're mid-sync
		await vi.waitFor(() => {
			expect(transport.sync).toHaveBeenCalledTimes(1);
		});
		expect(engine.isSyncing).toBe(true);

		deferred.resolve();

		await syncPromise;
		expect(engine.isSyncing).toBe(false);
	});

	it("shutdown aborts an in-flight transport and skips applying results", async () => {
		const serverTodos = [makeTodo({ id: "server-1", syncStatus: "synced" })];
		const deferred = mockTransportSyncDeferred(transport);
		const events = collectEvents(engine);

		const syncPromise = engine.sync();
		await vi.waitFor(() => {
			expect(transport.sync).toHaveBeenCalledTimes(1);
		});

		const shutdownPromise = engine.shutdown();

		await vi.waitFor(() => {
			expect(deferred.getSignal()?.aborted).toBe(true);
		});

		deferred.resolve({ serverChanges: serverTodos });

		await shutdownPromise;
		await syncPromise;

		expect(adapter.applyServerChanges).not.toHaveBeenCalled();
		expect(events.some((event) => event.type === "sync:error")).toBe(false);
		expect(engine.isSyncing).toBe(false);
	});

	it("shutdown waits for non-abortable work already in progress", async () => {
		const pendingChanges = deferredPromise<Todo[]>();
		vi.mocked(adapter.getPendingChanges).mockReturnValueOnce(
			pendingChanges.promise,
		);

		const syncPromise = engine.sync();
		await vi.waitFor(() => {
			expect(adapter.getPendingChanges).toHaveBeenCalledTimes(1);
		});

		let shutdownResolved = false;
		const shutdownPromise = engine.shutdown().then(() => {
			shutdownResolved = true;
		});

		await Promise.resolve();
		expect(shutdownResolved).toBe(false);

		pendingChanges.resolve([]);

		await shutdownPromise;
		await syncPromise;
		expect(shutdownResolved).toBe(true);
		expect(transport.sync).not.toHaveBeenCalled();
	});

	it("shutdown suppresses queued follow-up syncs", async () => {
		mockTransportSyncDeferred(transport);
		const syncPromise = engine.sync();

		await vi.waitFor(() => {
			expect(transport.sync).toHaveBeenCalledTimes(1);
		});

		void engine.sync();
		await engine.shutdown();
		await syncPromise;

		expect(transport.sync).toHaveBeenCalledTimes(1);
	});
});
