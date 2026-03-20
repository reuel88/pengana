export type { AllowedMimeType } from "./constants/allowed-mime-types";
export {
	ALLOWED_MIME_TYPES,
	ENTITY_TYPE_TODO,
	INDEXEDDB_URI_PREFIX,
	isAllowedMimeType,
	MAX_ATTACHMENTS,
	MAX_FILE_SIZE_BYTES,
	MIME_TO_EXT,
} from "./constants/allowed-mime-types";
export type { EventEmitter } from "./core/event-emitter";
export { createEventEmitter } from "./core/event-emitter";
export type { CleanupDeps } from "./core/storage-cleanup";
export {
	cleanupFailedOlderThan,
	cleanupUploaded,
} from "./core/storage-cleanup";
export type { UploadQueueConfig } from "./core/upload-queue";
export { UploadQueue } from "./core/upload-queue";
export { isQuotaError, StorageFullError } from "./errors/storage-error";
export type {
	EnqueueUploadParams,
	UseUploadQueueOptions,
} from "./hooks/use-upload-queue";
export { useUploadQueue } from "./hooks/use-upload-queue";
export {
	uploadItemSchema,
	uploadStatusSchema,
} from "./schemas/upload";
export type {
	UploadAdapter,
	UploadEvent,
	UploadEventType,
	UploadItem,
	UploadLifecycleCallbacks,
	UploadStatus,
	UploadTransport,
} from "./types";
