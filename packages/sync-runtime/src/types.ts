import type { StorageLevel } from "@pengana/storage-health";
import type {
	SyncAdapter,
	SyncEngine,
	SyncEvent,
	SyncTransport,
} from "@pengana/sync-engine";
import type { UploadEvent, UploadQueueManager } from "@pengana/upload-queue";

// ---------------------------------------------------------------------------
// Descriptor — identifies a unique runtime entry
// ---------------------------------------------------------------------------

export type SyncDescriptor = {
	scopeType: "personal" | "organization";
	scopeId: string;
	entityKey: string;
};

// ---------------------------------------------------------------------------
// Snapshots — observable state consumed by UI
// ---------------------------------------------------------------------------

export type EntrySnapshot = {
	isOnline: boolean;
	isSyncing: boolean;
	isUploading: boolean;
	storageLevel: StorageLevel;
};

export type EntryDevtoolsSnapshot = {
	events: SyncEvent[];
	uploadEvents: UploadEvent[];
};

// ---------------------------------------------------------------------------
// Entry config — platform-specific factories injected per entity
// ---------------------------------------------------------------------------

export interface PeriodicSyncHandle {
	start(): void;
	stop(): void;
}

export interface RealtimeSubHandle {
	setEnabled(enabled: boolean): void;
	unsubscribe(): void;
}

/**
 * Object with a `sync()` method. Used for MediaSyncer and similar
 * secondary sync coordinators that piggyback on the main entry.
 */
export interface Syncable {
	sync(): Promise<void> | void;
}

export interface StorageMonitorHandle {
	start(): void;
	stop(): void;
	getLevel(): StorageLevel;
	subscribe(listener: () => void): () => void;
}

export interface RuntimeEntryConfig {
	createAdapter: () => SyncAdapter;
	createTransport: () => SyncTransport;
	createUploadManager?: () => UploadQueueManager;
	createMediaSyncer?: () => Syncable;
	createPeriodicSync: (
		getEngine: () => SyncEngine | null,
	) => PeriodicSyncHandle;
	createRealtimeSub?: (opts: {
		onSync: () => void;
		onRefresh: () => void;
	}) => RealtimeSubHandle;
	createStorageMonitor: () => StorageMonitorHandle;
}

// ---------------------------------------------------------------------------
// Platform deps — injected once at runtime creation
// ---------------------------------------------------------------------------

export interface PlatformDeps {
	isOnline(): boolean;
	subscribeOnline(cb: (online: boolean) => void): () => void;
	isForeground(): boolean;
	subscribeForeground(cb: (fg: boolean) => void): () => void;
}
