import {
	createNetworkStatusMonitor,
	subscribeToSharedNotifyChannel,
} from "@pengana/realtime-transport";
import { StorageHealthMonitor } from "@pengana/storage-health";
import { createPeriodicSync, createSyncTransport } from "@pengana/sync-engine";
import type { PlatformDeps, RuntimeEntryConfig } from "@pengana/sync-runtime";
import {
	createTodoSyncAdapter,
	orgTodoConfig,
	personalTodoConfig,
} from "@pengana/todo-client";
import {
	createUploadLifecycleCallbacks,
	createWebUploadAdapter,
	MediaSyncer,
	reconcileMedia,
} from "@pengana/upload-client";
import { removeFileFromDexie } from "@pengana/upload-client/adapters/dexie-file-store";
import { createWebStorageHealthProvider } from "@pengana/upload-client/lib/storage-health";
import { cleanupUploaded, UploadQueueManager } from "@pengana/upload-queue";
import { createDexieUploadTransport } from "@/features/upload-queue";
import { client } from "@/shared/api/orpc";
import { appDb } from "@/shared/db";
import { createRealtimeTransport, onRefreshNotify } from "./platform-deps";

// ---------------------------------------------------------------------------
// Shared deps (module-level singletons matching current sync-context.tsx)
// ---------------------------------------------------------------------------

const storageHealthProvider = createWebStorageHealthProvider();
const uploadLifecycleCallbacks = createUploadLifecycleCallbacks(appDb);

// ---------------------------------------------------------------------------
// PlatformDeps for web
// ---------------------------------------------------------------------------

const networkMonitor = createNetworkStatusMonitor();

export const webPlatformDeps: PlatformDeps = {
	isOnline: () => networkMonitor.isOnline,
	subscribeOnline: (cb) => networkMonitor.subscribe(cb),
	isForeground: () => document.visibilityState === "visible",
	subscribeForeground: (cb) => {
		const handler = () => cb(document.visibilityState === "visible");
		document.addEventListener("visibilitychange", handler);
		return () => document.removeEventListener("visibilitychange", handler);
	},
};

// ---------------------------------------------------------------------------
// Storage monitor factory (shared across entries)
// ---------------------------------------------------------------------------

function createStorageMonitor() {
	const uploadAdapter = createWebUploadAdapter(appDb);
	return new StorageHealthMonitor({
		provider: storageHealthProvider,
		onStorageWarning: async () => {
			await cleanupUploaded({
				uploadAdapter,
				removeFile: (item) => removeFileFromDexie(appDb, item.id),
			});
		},
	});
}

// ---------------------------------------------------------------------------
// Entry config factories
// ---------------------------------------------------------------------------

export function createPersonalTodoEntryConfig(
	userId: string,
	organizationId: string,
): RuntimeEntryConfig {
	return {
		createAdapter: () =>
			createTodoSyncAdapter({
				db: appDb,
				scopeId: userId,
				config: personalTodoConfig,
				filter: (todo) => todo.organizationId === organizationId,
				syncKeySuffix: organizationId,
			}),

		createTransport: () =>
			createSyncTransport(
				async (input) =>
					(await client.todo.sync(input, { signal: input.signal })).data,
				(media, attachments, entityIds) =>
					reconcileMedia({
						db: appDb,
						serverMedia: media,
						serverAttachments: attachments,
						entityIds,
					}),
			),

		createUploadManager: () =>
			new UploadQueueManager({
				createUploadAdapter: () => createWebUploadAdapter(appDb),
				createUploadTransport: createDexieUploadTransport,
				lifecycleCallbacks: uploadLifecycleCallbacks,
			}),

		createMediaSyncer: () =>
			new MediaSyncer({
				db: appDb,
				scopeId: userId,
				scopeType: "personal",
				transport: {
					async sync(input) {
						const res = await client.media.sync(input);
						return res.data;
					},
				},
			}),

		createPeriodicSync,

		createRealtimeSub: ({ onSync, onRefresh }) =>
			subscribeToSharedNotifyChannel({
				notifyKey: userId,
				createNotifyTransport: createRealtimeTransport,
				enabled: true,
				onNotify: (kind) => {
					if (kind === "sync") {
						onSync();
						return;
					}
					onRefreshNotify();
					onRefresh();
				},
				onOpen: () => onSync(),
			}),

		createStorageMonitor,
	};
}

export function createOrgTodoEntryConfig(
	organizationId: string,
): RuntimeEntryConfig {
	return {
		createAdapter: () =>
			createTodoSyncAdapter({
				db: appDb,
				scopeId: organizationId,
				config: orgTodoConfig,
			}),

		createTransport: () =>
			createSyncTransport(
				async (input) =>
					(
						await client.orgTodo.sync(input, {
							signal: input.signal,
						})
					).data,
				(media, attachments, entityIds) =>
					reconcileMedia({
						db: appDb,
						serverMedia: media,
						serverAttachments: attachments,
						entityIds,
					}),
			),

		createUploadManager: () =>
			new UploadQueueManager({
				createUploadAdapter: () => createWebUploadAdapter(appDb),
				createUploadTransport: createDexieUploadTransport,
				lifecycleCallbacks: uploadLifecycleCallbacks,
			}),

		createMediaSyncer: () =>
			new MediaSyncer({
				db: appDb,
				scopeId: organizationId,
				scopeType: "org",
				transport: {
					async sync(input) {
						const res = await client.media.orgSync(input);
						return res.data;
					},
				},
			}),

		createPeriodicSync,

		createRealtimeSub: ({ onSync, onRefresh }) =>
			subscribeToSharedNotifyChannel({
				notifyKey: organizationId,
				createNotifyTransport: createRealtimeTransport,
				enabled: true,
				onNotify: (kind) => {
					if (kind === "sync") {
						onSync();
						return;
					}
					onRefreshNotify();
					onRefresh();
				},
				onOpen: () => onSync(),
			}),

		createStorageMonitor,
	};
}
