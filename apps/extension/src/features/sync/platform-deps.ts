import type {
	RealtimeTransport,
	SyncEnginePlatformDeps,
} from "@pengana/sync-engine";
import {
	createTodoUploadLifecycleCallbacks,
	createWebUploadAdapter,
} from "@pengana/todo-client";
import { removeFileFromIndexedDB } from "@pengana/todo-client/adapters/dexie-file-store";
import { createWebStorageHealthProvider } from "@pengana/todo-client/lib/storage-health";
import { createIndexedDbUploadTransport } from "@/features/sync/entities/upload-queue";
import { appDb } from "@/shared/db";

function createNoopRealtimeTransport(): RealtimeTransport {
	return {
		start() {},
		stop() {},
		getStatus() {
			return "idle";
		},
		subscribe() {
			return () => {};
		},
	};
}

type AdapterFactory = SyncEnginePlatformDeps["createSyncAdapter"];
type TransportFactory = SyncEnginePlatformDeps["createSyncTransport"];

export function createExtensionPlatformDeps(
	createSyncAdapter: AdapterFactory,
	createSyncTransport: TransportFactory,
): SyncEnginePlatformDeps {
	return {
		createNotifyTransport: () => createNoopRealtimeTransport(),
		generateUUID: () => crypto.randomUUID(),
		createSyncAdapter,
		createSyncTransport,
		createUploadAdapter: () => createWebUploadAdapter(appDb),
		createUploadTransport: createIndexedDbUploadTransport,
		onFocusSubscribe: (triggerSync) => {
			const handler = () => {
				if (document.visibilityState === "visible") triggerSync();
			};
			document.addEventListener("visibilitychange", handler);
			return () => document.removeEventListener("visibilitychange", handler);
		},
		storageHealth: createWebStorageHealthProvider(),
		removeFile: (entityId: string) => removeFileFromIndexedDB(appDb, entityId),
		uploadLifecycleCallbacks: createTodoUploadLifecycleCallbacks(appDb),
	};
}
