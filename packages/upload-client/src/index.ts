export {
	getFileFromDexie,
	removeFileFromDexie,
	storeFileInDexie,
} from "./adapters/dexie-file-store";
export { createWebUploadAdapter } from "./adapters/dexie-upload-queue-adapter";
export { createDexieUploadTransport } from "./adapters/dexie-upload-transport";
export { createDrizzleUploadAdapter } from "./adapters/drizzle-upload-queue-adapter";
export { drizzleUploadQueue } from "./adapters/drizzle-upload-queue-schema";
export {
	createUploadTransport,
	type UploadTransportInput,
} from "./adapters/upload-transport";
export type {
	MediaActions,
	ProcessMediaFileInput,
} from "./hooks/media-actions";
export type { FileSelectionDeps } from "./hooks/use-file-selection";
export { useFileSelection } from "./hooks/use-file-selection";
export type { MediaDeletionDeps } from "./hooks/use-media-deletion";
export { useMediaDeletion } from "./hooks/use-media-deletion";
export { useMedia } from "./hooks/use-media-dexie";
export type {
	MediaAttachmentTarget,
	MediaFileStorageStrategy,
	MediaHandlerDeps,
} from "./hooks/use-media-handlers";
export { useMediaHandlers } from "./hooks/use-media-handlers";
export type { UseMediaListWiringConfig } from "./hooks/use-media-list-wiring";
export { useMediaListWiring } from "./hooks/use-media-list-wiring";
export type { MediaRetryDeps } from "./hooks/use-media-retry";
export { useMediaRetry } from "./hooks/use-media-retry";
export type {
	AddMediaOptions,
	LocalMedia,
	LocalMediaAttachment,
} from "./lib/db";
export {
	addMedia,
	attachMediaToEntity,
	createDexieMediaActions,
	detachMediaFromEntity,
	getAttachmentForMedia,
	getMediaCountForEntity,
	markMediaFailed,
	type ProcessMediaFileParams,
	type ProcessMediaFileResult,
	processMediaFile,
	reconcileMedia,
	removeMedia,
	retryMedia,
	updateMediaLocalUri,
	updateMediaUploaded,
} from "./lib/dexie-media-actions";
export { createUploadLifecycleCallbacks } from "./lib/dexie-upload-lifecycle-callbacks";
export * as drizzleMedia from "./lib/drizzle-media-actions";
export { createDrizzleMediaActions } from "./lib/drizzle-media-actions";
export { createDrizzleUploadLifecycleCallbacks } from "./lib/drizzle-upload-lifecycle-callbacks";
export { readFileAsBase64 } from "./lib/file-utils";
export type { MediaConfig } from "./lib/media-config";
export { orgMediaConfig, personalMediaConfig } from "./lib/media-config";
export { mediaAttachmentEntity, mediaEntity } from "./lib/media-entity";
export {
	MediaSyncer,
	type MediaSyncerOptions,
	type MediaSyncTransport,
} from "./lib/media-syncer";
export type {
	MediaListItem,
	ServerMediaRecord,
} from "./lib/merge-media";
export {
	buildReconcilePlan,
	type ReconcilePlan,
	type ReconcilePlanInput,
} from "./lib/reconcile-plan";
export {
	createWebStorageHealthProvider,
	getStorageLevel,
} from "./lib/storage-health";
export type { FileDataRecord } from "./lib/upload-queue-stores";
export { uploadRawStores } from "./lib/upload-queue-stores";
