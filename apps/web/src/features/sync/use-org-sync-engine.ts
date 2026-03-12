import { env } from "@pengana/env/web";
import { orgQueryKeys } from "@pengana/org-client";
import {
	type SyncEnginePlatformDeps,
	useNetworkStatus,
	useSyncEngineCore,
} from "@pengana/sync-engine";
import {
	createDexieOrgSyncAdapter,
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

const orgPlatformDeps: SyncEnginePlatformDeps = {
	getWsUrl,
	generateUUID: () => crypto.randomUUID(),
	onSyncNotify: () => {
		queryClient.invalidateQueries({ queryKey: notificationQueryKeys.list });
		queryClient.invalidateQueries({ queryKey: orgQueryKeys.userInvitations });
	},
	createSyncAdapter: (organizationId) =>
		createDexieOrgSyncAdapter(organizationId),
	createSyncTransport: () => ({
		sync: async (input) => {
			// Map from sync engine's Todo shape (userId) to OrgTodo shape (organizationId/createdBy)
			const orgInput = {
				changes: input.changes.map((c) => ({
					...c,
					organizationId: c.userId,
					createdBy: null as string | null,
				})),
				lastSyncedAt: input.lastSyncedAt,
			};
			const result = (await client.orgTodo.sync(orgInput)).data;
			// Map back from OrgTodo shape to sync engine's Todo shape
			return {
				...result,
				serverChanges: result.serverChanges.map((s) => ({
					...s,
					userId: s.organizationId,
				})),
			};
		},
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

export function useOrgSyncEngine(organizationId: string | undefined) {
	const { isOnline } = useNetworkStatus();

	return useSyncEngineCore(organizationId, isOnline, orgPlatformDeps);
}
