import { parseWsMessage } from "@pengana/api/ws-types";
import { env } from "@pengana/env/web";
import { orgQueryKeys } from "@pengana/org-client";
import {
	createWebSocketRealtimeTransport,
	type SyncEnginePlatformDeps,
} from "@pengana/sync-engine";
import { createUploadLifecycleCallbacks } from "@pengana/todo-client";
import { removeFileFromIndexedDB } from "@pengana/todo-client/adapters/dexie-file-store";
import { createWebStorageHealthProvider } from "@pengana/todo-client/lib/storage-health";
import { notificationQueryKeys } from "@/features/notifications/entities/notification/query-keys";
import {
	createIndexedDbUploadTransport,
	createWebUploadAdapter,
} from "@/features/sync/entities/upload-queue";
import { queryClient } from "@/shared/api/orpc";
import { appDb } from "@/shared/db";

function getWsUrl() {
	return `${env.VITE_SERVER_URL.replace(/^http/, "ws")}/ws`;
}

function createRealtimeTransport(
	_userId: string,
	callbacks: { onNotify: () => void; onOpen?: () => void },
) {
	return createWebSocketRealtimeTransport({
		getUrl: getWsUrl,
		decodeMessage: (data) => {
			const message = parseWsMessage(data);
			if (!message) return null;
			return message.type === "sync-notify" ? "notify" : "heartbeat";
		},
		onNotify: callbacks.onNotify,
		onOpen: callbacks.onOpen,
	});
}

type AdapterFactory = SyncEnginePlatformDeps["createSyncAdapter"];
type TransportFactory = SyncEnginePlatformDeps["createSyncTransport"];

export function createWebPlatformDeps(
	createSyncAdapter: AdapterFactory,
	createSyncTransport: TransportFactory,
): SyncEnginePlatformDeps {
	return {
		createNotifyTransport: createRealtimeTransport,
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
