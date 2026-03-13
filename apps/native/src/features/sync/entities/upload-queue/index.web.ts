export {
	createWebUploadAdapter,
	createWebUploadAdapter as createUploadAdapter,
} from "./adapter.web";
export {
	getFileFromIndexedDB,
	removeFileFromIndexedDB,
	storeFileInIndexedDB,
} from "./file-store.web";
export {
	createIndexedDbUploadTransport,
	createIndexedDbUploadTransport as createUploadTransport,
} from "./transport.web";
