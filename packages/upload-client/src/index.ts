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
export type { WebMedia, WebMediaAttachment } from "./lib/db";
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
	updateMediaLocalUri,
	updateMediaUploaded,
} from "./lib/media-actions";
export { mediaAttachmentEntity, mediaEntity } from "./lib/media-entity";
export {
	createWebStorageHealthProvider,
	getStorageLevel,
} from "./lib/storage-health";
export { createUploadLifecycleCallbacks } from "./lib/upload-lifecycle-callbacks";
export type { FileDataRecord } from "./lib/upload-queue-stores";
export { uploadRawStores } from "./lib/upload-queue-stores";
