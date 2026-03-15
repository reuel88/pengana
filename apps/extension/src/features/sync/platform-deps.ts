import type {
	RealtimeTransport,
	SyncEnginePlatformDeps,
} from "@pengana/sync-engine";
import {
	createUploadLifecycleCallbacks,
	createWebUploadAdapter,
} from "@pengana/upload-client";
import { removeFileFromIndexedDB } from "@pengana/upload-client/adapters/dexie-file-store";
import { createWebStorageHealthProvider } from "@pengana/upload-client/lib/storage-health";
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
		uploadLifecycleCallbacks: createUploadLifecycleCallbacks(appDb),
	};
}
