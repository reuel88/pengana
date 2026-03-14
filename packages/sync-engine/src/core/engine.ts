import type { SyncAdapter, SyncEvent, SyncTransport, Todo } from "../types";
import { createEventEmitter } from "./event-emitter";

export class SyncEngine<T extends { id: string } = Todo> {
	private adapter: SyncAdapter<T>;
	private transport: SyncTransport<T>;
	private events = createEventEmitter<SyncEvent>();
	private syncing = false;
	private syncRequested = false;
	private shuttingDown = false;
	private activeSyncPromise: Promise<void> | null = null;
	private activeController: AbortController | null = null;

	onEvent = this.events.onEvent;

	constructor(adapter: SyncAdapter<T>, transport: SyncTransport<T>) {
		this.adapter = adapter;
		this.transport = transport;
	}

	get isSyncing() {
		return this.syncing;
	}

	get isShuttingDown() {
		return this.shuttingDown;
	}

	async sync(): Promise<void> {
		if (this.shuttingDown) {
			return;
		}
		if (this.syncing) {
			this.syncRequested = true;
			return;
		}

		this.activeSyncPromise = this.runSync();
		return this.activeSyncPromise;
	}

	async shutdown(): Promise<void> {
		this.shuttingDown = true;
		this.syncRequested = false;
		this.activeController?.abort();
		await this.activeSyncPromise;
	}

	private async runSync(): Promise<void> {
		this.syncing = true;
		const controller = new AbortController();
		this.activeController = controller;

		const now = () => new Date().toISOString();
		const throwIfAborted = () => {
			if (this.shuttingDown || controller.signal.aborted) {
				throw createAbortError();
			}
		};

		this.events.emit({
			type: "sync:start",
			timestamp: now(),
			detail: "Sync started",
		});

		try {
			const pendingChanges = await this.adapter.getPendingChanges();
			throwIfAborted();
			const lastSyncedAt = await this.adapter.getLastSyncedAt();
			throwIfAborted();

			this.events.emit({
				type: "sync:push",
				timestamp: now(),
				detail: `Pushing ${pendingChanges.length} changes`,
			});

			const result = await this.transport.sync({
				changes: pendingChanges,
				lastSyncedAt,
				signal: controller.signal,
			});
			throwIfAborted();

			if (result.serverChanges.length > 0) {
				this.events.emit({
					type: "sync:pull",
					timestamp: now(),
					detail: `Pulling ${result.serverChanges.length} changes from server`,
				});
				await this.adapter.applyServerChanges(
					result.serverChanges,
					result.conflicts,
				);
				throwIfAborted();
			}

			if (result.conflicts.length > 0) {
				this.events.emit({
					type: "sync:conflict",
					timestamp: now(),
					detail: `${result.conflicts.length} conflicts detected`,
				});
				await this.adapter.markAsConflict(result.conflicts);
				throwIfAborted();
			}

			const pushedItemsMarkSynced = pendingChanges.filter(
				(t) => !result.conflicts.includes(t.id),
			);

			if (pushedItemsMarkSynced.length > 0) {
				await this.adapter.markAsSynced(pushedItemsMarkSynced);
				throwIfAborted();
			}

			await this.adapter.setLastSyncedAt(result.syncedAt);
			throwIfAborted();

			this.events.emit({
				type: "sync:complete",
				timestamp: now(),
				detail: `Sync complete. Pushed: ${pendingChanges.length}, Pulled: ${result.serverChanges.length}, Conflicts: ${result.conflicts.length}`,
			});
		} catch (error) {
			if (!isAbortError(error)) {
				this.events.emit({
					type: "sync:error",
					timestamp: now(),
					detail: error instanceof Error ? error.message : "Unknown sync error",
				});
			}
		} finally {
			this.syncing = false;
			this.activeController = null;
			this.activeSyncPromise = null;
			if (this.syncRequested && !this.shuttingDown) {
				this.syncRequested = false;
				this.sync().catch((error) => {
					if (isAbortError(error)) {
						return;
					}
					this.events.emit({
						type: "sync:error",
						timestamp: new Date().toISOString(),
						detail:
							error instanceof Error ? error.message : "Unknown sync error",
					});
				});
			}
		}
	}
}

function isAbortError(error: unknown): boolean {
	return error instanceof DOMException
		? error.name === "AbortError"
		: error instanceof Error && error.name === "AbortError";
}

function createAbortError(): Error {
	if (typeof DOMException !== "undefined") {
		return new DOMException("Sync aborted", "AbortError");
	}

	const error = new Error("Sync aborted");
	error.name = "AbortError";
	return error;
}
