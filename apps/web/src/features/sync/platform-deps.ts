import { env } from "@pengana/env/web";
import { orgQueryKeys } from "@pengana/org-client";
import type { SyncEnginePlatformDeps } from "@pengana/sync-engine";
import { removeFileFromIndexedDB } from "@pengana/todo-client";
import { createWebStorageHealthProvider } from "@pengana/todo-client/lib/storage-health";
import { notificationQueryKeys } from "@/features/notifications/entities/notification/query-keys";
import {
	createWebUploadAdapter,
	createWebUploadTransport,
} from "@/features/sync/entities/upload-queue";
import { queryClient } from "@/shared/api/orpc";

function getWsUrl() {
	return `${env.VITE_SERVER_URL.replace(/^http/, "ws")}/ws`;
}

type AdapterFactory = SyncEnginePlatformDeps["createSyncAdapter"];
type TransportFactory = SyncEnginePlatformDeps["createSyncTransport"];

export function createWebPlatformDeps(
	createSyncAdapter: AdapterFactory,
	createSyncTransport: TransportFactory,
): SyncEnginePlatformDeps {
	return {
		getWsUrl,
		generateUUID: () => crypto.randomUUID(),
		onSyncNotify: () => {
			queryClient.invalidateQueries({
				queryKey: notificationQueryKeys.list,
			});
			queryClient.invalidateQueries({
				queryKey: orgQueryKeys.userInvitations,
			});
		},
		createSyncAdapter,
		createSyncTransport,
		createUploadAdapter: createWebUploadAdapter,
		createUploadTransport: createWebUploadTransport,
		onFocusSubscribe: (triggerSync) => {
			const handler = () => {
				if (document.visibilityState === "visible") triggerSync();
			};
			document.addEventListener("visibilitychange", handler);
			return () => document.removeEventListener("visibilitychange", handler);
		},
		storageHealth: createWebStorageHealthProvider(),
		removeFile: removeFileFromIndexedDB,
	};
}
