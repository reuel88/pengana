export type {
	OrgSyncInput,
	OrgSyncOutput,
	OrgTodo,
	SyncInput,
	SyncOutput,
	SyncStatus,
	Todo,
	UploadItem,
	UploadStatus,
} from "../schemas";

export type {
	StorageEstimate,
	StorageHealthProvider,
	StorageLevel,
} from "./storage-health";

import type { Todo, UploadItem, UploadStatus } from "../schemas";

export interface UploadAdapter {
	addToQueue(item: UploadItem): Promise<void>;
	getNextQueued(): Promise<UploadItem | null>;
	updateStatus(id: string, status: UploadStatus): Promise<void>;
	updateRetry(id: string, retryCount: number): Promise<void>;
	markCompleted(id: string, attachmentUrl: string): Promise<void>;
	markFailed(id: string): Promise<void>;
	getQueueItems(): Promise<UploadItem[]>;
	removeItem(id: string): Promise<void>;
}

export interface UploadTransport {
	upload(input: {
		todoId: string;
		fileUri: string;
		mimeType: string;
		idempotencyKey: string;
	}): Promise<{ attachmentUrl: string }>;
	onFailed?(todoId: string, fileUri: string): void | Promise<void>;
}

export interface SyncAdapter<T extends { id: string } = Todo> {
	getPendingChanges(): Promise<T[]>;
	applyServerChanges(todos: T[], conflictIds?: string[]): Promise<void>;
	markAsSynced(pushedItems: T[]): Promise<void>;
	markAsConflict(ids: string[]): Promise<void>;
	getLastSyncedAt(): Promise<string | null>;
	setLastSyncedAt(timestamp: string): Promise<void>;
}

export interface SyncTransport<T extends { id: string } = Todo> {
	sync(input: { changes: T[]; lastSyncedAt: string | null }): Promise<{
		serverChanges: T[];
		conflicts: string[];
		syncedAt: string;
	}>;
}

export type SyncEventType =
	| "sync:start"
	| "sync:push"
	| "sync:pull"
	| "sync:conflict"
	| "sync:complete"
	| "sync:error";

export interface SyncEvent {
	type: SyncEventType;
	timestamp: string;
	detail: string;
}

export type UploadEventType =
	| "upload:start"
	| "upload:progress"
	| "upload:complete"
	| "upload:error";

export interface UploadEvent {
	type: UploadEventType;
	timestamp: string;
	detail: string;
	itemId: string;
	todoId: string;
}

import type { StorageLevel } from "./storage-health";

/** Core sync context shape shared by all apps (web, native, extension). */
export interface SyncContextValue {
	isOnline: boolean;
	isSyncing: boolean;
	isUploading: boolean;
	storageLevel: StorageLevel;
	triggerSync: () => void;
	enqueueUpload: (todoId: string, fileUri: string, mimeType: string) => void;
}

/** Devtools-only sync state (web/native only, not exposed via useSync). */
export interface SyncDevtoolsValue {
	events: SyncEvent[];
	uploadEvents: UploadEvent[];
	simulateOffline: boolean;
	setSimulateOffline: (value: boolean) => void;
}
