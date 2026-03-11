import { env } from "@pengana/env/web";
import { orgQueryKeys } from "@pengana/org-client";
import {
	type SyncEnginePlatformDeps,
	useNetworkStatus,
	useSyncEngineCore,
} from "@pengana/sync-engine";
import {
	createDexieSyncAdapter,
	removeFileFromIndexedDB,
} from "@pengana/todo-client";
import { createWebStorageHealthProvider } from "@pengana/todo-client/lib/storage-health";
import { notificationQueryKeys } from "@/entities/notification/query-keys";
import {
	createWebUploadAdapter,
	createWebUploadTransport,
} from "@/entities/upload-queue";
import { client, queryClient } from "@/shared/api/orpc";

function getWsUrl() {
	return `${env.VITE_SERVER_URL.replace(/^http/, "ws")}/ws`;
}

const platformDeps: SyncEnginePlatformDeps = {
	getWsUrl,
	generateUUID: () => crypto.randomUUID(),
	onSyncNotify: () => {
		queryClient.invalidateQueries({ queryKey: notificationQueryKeys.list });
		queryClient.invalidateQueries({ queryKey: orgQueryKeys.userInvitations });
	},
	createSyncAdapter: (userId) => createDexieSyncAdapter(userId),
	createSyncTransport: () => ({
		sync: async (input) => (await client.todo.sync(input)).data,
	}),
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

export function useSyncEngine(userId: string | undefined) {
	const { isOnline } = useNetworkStatus();

	return useSyncEngineCore(userId, isOnline, platformDeps);
}
