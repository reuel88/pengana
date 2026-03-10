export { createDexieSyncAdapter } from "./adapters/adapter";
export {
	getFileFromIndexedDB,
	removeFileFromIndexedDB,
	storeFileInIndexedDB,
} from "./adapters/dexie-file-store";
// File store & transport utilities
export {
	getFileFromMemory,
	removeFileFromMemory,
	storeFileInMemory,
} from "./adapters/memory-file-store";
export { createMemoryUploadTransport } from "./adapters/memory-upload-transport";
export { createWebUploadAdapter } from "./adapters/upload-queue-adapter";
export { createUploadTransport } from "./adapters/upload-transport";
export type {
	FileStorageStrategy,
	TodoHandlerDeps,
} from "./hooks/use-todo-handlers";
export { useTodoHandlers } from "./hooks/use-todo-handlers";
export type { UseTodoListWiringConfig } from "./hooks/use-todo-list-wiring";
export { useTodoListWiring } from "./hooks/use-todo-list-wiring";
export { useTodos } from "./hooks/use-todos";
export type { WebTodo } from "./lib/db";
export { TodoDatabase, todoDb } from "./lib/db";
export { readFileAsBase64 } from "./lib/file-utils";
export {
	addTodo,
	attachFile,
	deleteTodo,
	resolveConflict,
	toggleTodo,
} from "./lib/todo-actions";
export type { FileDataRecord } from "./lib/upload-queue-db";
export { UploadQueueDatabase, uploadQueueDb } from "./lib/upload-queue-db";
