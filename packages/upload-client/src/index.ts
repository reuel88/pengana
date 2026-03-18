export {
	getFileFromIndexedDB,
	removeFileFromIndexedDB,
	storeFileInIndexedDB,
} from "./adapters/dexie-file-store";
export { createIndexedDbUploadTransport } from "./adapters/indexeddb-upload-transport";
export { createWebUploadAdapter } from "./adapters/upload-queue-adapter";
export {
	createUploadTransport,
	type UploadTransportInput,
} from "./adapters/upload-transport";
export { useMedia } from "./hooks/use-media";
export type {
	MediaAttachmentTarget,
	MediaFileStorageStrategy,
	MediaHandlerDeps,
} from "./hooks/use-media-handlers";
export { useMediaHandlers } from "./hooks/use-media-handlers";
export type { UseMediaListWiringConfig } from "./hooks/use-media-list-wiring";
export { useMediaListWiring } from "./hooks/use-media-list-wiring";
export type {
	AddMediaOptions,
	LocalMedia,
	LocalMediaAttachment,
} from "./lib/db";
export * as drizzleMedia from "./lib/drizzle-media-actions";
export { readFileAsBase64 } from "./lib/file-utils";
export {
	addMedia,
	attachMediaToEntity,
	detachMediaFromEntity,
	getMediaCountForEntity,
	markMediaFailed,
	reconcileMedia,
	removeMedia,
	retryMedia,
	updateMediaLocalUri,
	updateMediaUploaded,
} from "./lib/media-actions";
export type { MediaConfig } from "./lib/media-config";
export { orgMediaConfig, personalMediaConfig } from "./lib/media-config";
export { mediaAttachmentEntity, mediaEntity } from "./lib/media-entity";
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
export { createUploadLifecycleCallbacks } from "./lib/upload-lifecycle-callbacks";
export type { FileDataRecord } from "./lib/upload-queue-stores";
export { uploadRawStores } from "./lib/upload-queue-stores";
