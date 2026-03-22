import type { SyncEvent } from "../core";
import { MAX_EVENT_LOG_SIZE, SyncEngine } from "../core";
import type { EnqueueUploadParams, UploadQueueManager } from "../upload";
import type {
	EntryDevtoolsSnapshot,
	EntrySnapshot,
	PeriodicSyncHandle,
	RealtimeSubHandle,
	RuntimeEntryConfig,
	StorageMonitorHandle,
} from "./types";

// ---------------------------------------------------------------------------
// Listener type
// ---------------------------------------------------------------------------

type Listener = () => void;

// ---------------------------------------------------------------------------
// RuntimeEntry — owns all sync infrastructure for one scope/entity pair
// ---------------------------------------------------------------------------

export class RuntimeEntry {
	// --- Infrastructure ---
	private engine: SyncEngine;
	private uploadManager: UploadQueueManager | null = null;
	private periodicSync: PeriodicSyncHandle;
	private realtimeSub: RealtimeSubHandle | null = null;
	private storageMonitor: StorageMonitorHandle;

	// --- Subscriptions ---
	private unsubscribeEngine: (() => void) | null = null;
	private unsubscribeUpload: (() => void) | null = null;
	private unsubscribeStorage: (() => void) | null = null;

	// --- Observable state ---
	private snapshot: EntrySnapshot;
	private devtoolsSnapshot: EntryDevtoolsSnapshot;
	private listeners = new Set<Listener>();

	// --- Flags ---
	private online = false;
	private foreground = true;
	private started = false;

	constructor(private config: RuntimeEntryConfig) {
		const adapter = config.createAdapter();
		const transport = config.createTransport();
		const secondaryAdapters = config.createSecondaryAdapters?.() ?? {};
		this.engine = new SyncEngine(adapter, transport, secondaryAdapters);

		if (config.createUploadManager) {
			this.uploadManager = config.createUploadManager();
		}

		this.periodicSync = config.createPeriodicSync(() => this.engine);
		this.storageMonitor = config.createStorageMonitor();

		this.snapshot = {
			isOnline: false,
			isSyncing: false,
			isUploading: false,
			storageLevel: "ok",
		};

		this.devtoolsSnapshot = {
			events: [],
			uploadEvents: [],
		};
	}

	// ---------------------------------------------------------------------------
	// Lifecycle
	// ---------------------------------------------------------------------------

	start(online: boolean, foreground: boolean): void {
		if (this.started) return;
		this.started = true;
		this.online = online;
		this.foreground = foreground;

		// Engine events → snapshot
		this.unsubscribeEngine = this.engine.onEvent((event) => {
			this.pushEvent(event);
			if (event.type === "sync:start") {
				this.updateSnapshot({ isSyncing: true });
			}
			if (event.type === "sync:complete" || event.type === "sync:error") {
				this.updateSnapshot({ isSyncing: false });
			}
		});

		// Upload manager
		if (this.uploadManager) {
			this.uploadManager.init("runtime");
			this.uploadManager.setOnline(online);
			this.unsubscribeUpload = this.uploadManager.subscribe((state) => {
				const wasUploading = this.snapshot.isUploading;
				this.devtoolsSnapshot = {
					...this.devtoolsSnapshot,
					uploadEvents: state.uploadEvents,
				};
				this.updateSnapshot({ isUploading: state.isUploading });
				// Trigger sync when an upload finishes
				if (wasUploading && !state.isUploading) {
					this.triggerSync();
				}
			});
		}

		// Storage monitor
		this.storageMonitor.start();
		this.unsubscribeStorage = this.storageMonitor.subscribe(() => {
			this.updateSnapshot({
				storageLevel: this.storageMonitor.getLevel(),
			});
		});

		// Realtime
		if (this.config.createRealtimeSub) {
			this.realtimeSub = this.config.createRealtimeSub({
				onSync: () => this.triggerSync(),
				onRefresh: () => {}, // app-level concern; handled in config factory
			});
			this.realtimeSub.setEnabled(online && foreground);
		}

		// Periodic sync
		if (online) {
			this.periodicSync.start();
		}

		// Update online in snapshot
		this.updateSnapshot({ isOnline: online });

		// Initial sync (media is included via secondary adapters in the engine)
		this.engine.sync();
	}

	async stop(): Promise<void> {
		if (!this.started) return;
		this.started = false;

		this.periodicSync.stop();
		this.realtimeSub?.unsubscribe();
		this.realtimeSub = null;

		this.storageMonitor.stop();
		this.unsubscribeStorage?.();
		this.unsubscribeStorage = null;

		this.unsubscribeUpload?.();
		this.unsubscribeUpload = null;
		this.uploadManager?.dispose();

		this.unsubscribeEngine?.();
		this.unsubscribeEngine = null;

		await this.engine.shutdown();
	}

	// ---------------------------------------------------------------------------
	// Online / Foreground
	// ---------------------------------------------------------------------------

	setOnline(online: boolean): void {
		if (this.online === online) return;
		const wasOffline = !this.online;
		this.online = online;

		this.updateSnapshot({ isOnline: online });
		this.uploadManager?.setOnline(online);

		if (online) {
			this.periodicSync.start();
			if (wasOffline) {
				this.triggerSync();
			}
		} else {
			this.periodicSync.stop();
		}

		this.realtimeSub?.setEnabled(online && this.foreground);
	}

	setForeground(foreground: boolean): void {
		if (this.foreground === foreground) return;
		this.foreground = foreground;

		this.realtimeSub?.setEnabled(this.online && foreground);

		// Trigger sync when returning to foreground while online
		if (foreground && this.online) {
			this.triggerSync();
		}
	}

	// ---------------------------------------------------------------------------
	// Actions
	// ---------------------------------------------------------------------------

	triggerSync(): void {
		if (!this.online) return;
		this.engine.sync();
	}

	enqueueUpload(params: EnqueueUploadParams): void {
		this.uploadManager?.enqueue(params);
	}

	// ---------------------------------------------------------------------------
	// Snapshot / Subscription
	// ---------------------------------------------------------------------------

	getSnapshot(): EntrySnapshot {
		return this.snapshot;
	}

	getDevtoolsSnapshot(): EntryDevtoolsSnapshot {
		return this.devtoolsSnapshot;
	}

	subscribe(listener: Listener): () => void {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}

	// ---------------------------------------------------------------------------
	// Internals
	// ---------------------------------------------------------------------------

	private updateSnapshot(partial: Partial<EntrySnapshot>): void {
		this.snapshot = { ...this.snapshot, ...partial };
		this.notifyListeners();
	}

	private pushEvent(event: SyncEvent): void {
		this.devtoolsSnapshot = {
			...this.devtoolsSnapshot,
			events: [
				...this.devtoolsSnapshot.events.slice(-(MAX_EVENT_LOG_SIZE - 1)),
				event,
			],
		};
		this.notifyListeners();
	}

	private notifyListeners(): void {
		for (const listener of this.listeners) {
			listener();
		}
	}
}
