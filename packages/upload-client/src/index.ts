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
export type { WebMedia } from "./lib/db";
export { readFileAsBase64 } from "./lib/file-utils";
export {
	addMedia,
	getMediaCountForEntity,
	markMediaFailed,
	reconcileMedia,
	removeMedia,
	updateMediaUploaded,
} from "./lib/media-actions";
export { mediaEntity } from "./lib/media-entity";
export {
	createWebStorageHealthProvider,
	getStorageLevel,
} from "./lib/storage-health";
export { createUploadLifecycleCallbacks } from "./lib/upload-lifecycle-callbacks";
export type { FileDataRecord } from "./lib/upload-queue-stores";
export { uploadRawStores } from "./lib/upload-queue-stores";
