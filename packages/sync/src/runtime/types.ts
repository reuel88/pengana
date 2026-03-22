import type {
	SecondaryAdapters,
	SyncAdapter,
	SyncEngine,
	SyncEvent,
	SyncTransport,
} from "../core";
import type { StorageLevel } from "../health/types";
import type { UploadEvent, UploadQueueManager } from "../upload";

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

export interface StorageMonitorHandle {
	start(): void;
	stop(): void;
	getLevel(): StorageLevel;
	subscribe(listener: () => void): () => void;
}

export interface RuntimeEntryConfig {
	createAdapter: () => SyncAdapter;
	createTransport: () => SyncTransport;
	createSecondaryAdapters?: () => SecondaryAdapters;
	createUploadManager?: () => UploadQueueManager;
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
