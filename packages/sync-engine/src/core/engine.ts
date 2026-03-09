import type { SyncAdapter, SyncEvent, SyncTransport } from "../types";
import { createEventEmitter } from "./event-emitter";

export class SyncEngine {
	private adapter: SyncAdapter;
	private transport: SyncTransport;
	private events = createEventEmitter<SyncEvent>();
	private syncing = false;
	private syncRequested = false;

	onEvent = this.events.onEvent;

	constructor(adapter: SyncAdapter, transport: SyncTransport) {
		this.adapter = adapter;
		this.transport = transport;
	}

	get isSyncing() {
		return this.syncing;
	}

	async sync(): Promise<void> {
		if (this.syncing) {
			this.syncRequested = true;
			return;
		}
		this.syncing = true;

		const now = () => new Date().toISOString();

		this.events.emit({
			type: "sync:start",
			timestamp: now(),
			detail: "Sync started",
		});

		try {
			const pendingChanges = await this.adapter.getPendingChanges();
			const lastSyncedAt = await this.adapter.getLastSyncedAt();

			this.events.emit({
				type: "sync:push",
				timestamp: now(),
				detail: `Pushing ${pendingChanges.length} changes`,
			});

			const result = await this.transport.sync({
				changes: pendingChanges,
				lastSyncedAt,
			});

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
			}

			if (result.conflicts.length > 0) {
				this.events.emit({
					type: "sync:conflict",
					timestamp: now(),
					detail: `${result.conflicts.length} conflicts detected`,
				});
				await this.adapter.markAsConflict(result.conflicts);
			}

			const pushedItemsMarkSynced = pendingChanges.filter(
				(t) => !result.conflicts.includes(t.id),
			);

			if (pushedItemsMarkSynced.length > 0) {
				await this.adapter.markAsSynced(pushedItemsMarkSynced);
			}

			await this.adapter.setLastSyncedAt(result.syncedAt);

			this.events.emit({
				type: "sync:complete",
				timestamp: now(),
				detail: `Sync complete. Pushed: ${pendingChanges.length}, Pulled: ${result.serverChanges.length}, Conflicts: ${result.conflicts.length}`,
			});
		} catch (error) {
			this.events.emit({
				type: "sync:error",
				timestamp: now(),
				detail: error instanceof Error ? error.message : "Unknown sync error",
			});
		} finally {
			this.syncing = false;
			if (this.syncRequested) {
				this.syncRequested = false;
				this.sync().catch((error) => {
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
