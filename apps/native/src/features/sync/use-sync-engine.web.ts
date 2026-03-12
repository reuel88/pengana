import {
	type SyncEnginePlatformDeps,
	useNetworkStatus,
	useSyncEngineCore,
} from "@pengana/sync-engine";
import {
	createUploadAdapter,
	createUploadTransport,
} from "@/features/sync/entities/upload-queue";
import { createSyncAdapter } from "@/features/todo/entities/todo";
import { client } from "@/shared/api/orpc";
import { getServerUrl } from "@/shared/lib/server-url";

function getWsUrl() {
	return `${getServerUrl().replace(/^http/, "ws")}/ws`;
}

const platformDeps: SyncEnginePlatformDeps = {
	getWsUrl,
	generateUUID: () => crypto.randomUUID(),
	createSyncAdapter: (userId) => createSyncAdapter(userId),
	createSyncTransport: () => ({
		sync: async (input) => (await client.todo.sync(input)).data,
	}),
	createUploadAdapter,
	createUploadTransport,
	onFocusSubscribe: (triggerSync) => {
		const handler = () => {
			if (document.visibilityState === "visible") triggerSync();
		};
		document.addEventListener("visibilitychange", handler);
		return () => document.removeEventListener("visibilitychange", handler);
	},
};

export function useSyncEngine(userId: string | undefined) {
	const { isOnline } = useNetworkStatus();

	return useSyncEngineCore(userId, isOnline, platformDeps);
}
