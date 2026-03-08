import type { SyncEvent, UploadEvent } from "./types";

export type { AllowedMimeType } from "./allowed-mime-types";
export {
	ALLOWED_MIME_TYPES,
	INDEXEDDB_URI_PREFIX,
	isAllowedMimeType,
	MAX_FILE_SIZE_BYTES,
	MIME_TO_EXT,
} from "./allowed-mime-types";
export { SyncEngine } from "./engine";
export type { EventEmitter } from "./event-emitter";
export { createEventEmitter } from "./event-emitter";
export {
	syncInputSchema,
	syncOutputSchema,
	syncStatusSchema,
	todoSchema,
	uploadItemSchema,
	uploadStatusSchema,
} from "./schemas";
export type {
	SyncAdapter,
	SyncEvent,
	SyncEventType,
	SyncInput,
	SyncOutput,
	SyncStatus,
	SyncTransport,
	Todo,
	UploadAdapter,
	UploadEvent,
	UploadEventType,
	UploadItem,
	UploadStatus,
	UploadTransport,
} from "./types";
export type { UploadQueueConfig } from "./upload-queue";

/** Core sync context shape shared by all apps (web, native, extension). */
export interface SyncContextValue {
	isOnline: boolean;
	isSyncing: boolean;
	isUploading: boolean;
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
export { UploadQueue } from "./upload-queue";
