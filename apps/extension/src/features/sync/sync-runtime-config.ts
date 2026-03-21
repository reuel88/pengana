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
	reconcileMedia,
} from "@pengana/upload-client";
import { removeFileFromDexie } from "@pengana/upload-client/adapters/dexie-file-store";
import { createWebStorageHealthProvider } from "@pengana/upload-client/lib/storage-health";
import { cleanupUploaded, UploadQueueManager } from "@pengana/upload-queue";
import { createDexieUploadTransport } from "@/features/upload-queue";
import { client } from "@/shared/api/orpc";
import { appDb } from "@/shared/db";

// ---------------------------------------------------------------------------
// Shared deps
// ---------------------------------------------------------------------------

const storageHealthProvider = createWebStorageHealthProvider();
const uploadLifecycleCallbacks = createUploadLifecycleCallbacks(appDb);

// ---------------------------------------------------------------------------
// PlatformDeps for extension background service worker
// ---------------------------------------------------------------------------

export const extensionPlatformDeps: PlatformDeps = {
	isOnline: () => navigator.onLine,
	subscribeOnline: (cb) => {
		const onOnline = () => cb(true);
		const onOffline = () => cb(false);
		self.addEventListener("online", onOnline);
		self.addEventListener("offline", onOffline);
		return () => {
			self.removeEventListener("online", onOnline);
			self.removeEventListener("offline", onOffline);
		};
	},
	// Extension background is always "foreground" for sync purposes
	isForeground: () => true,
	subscribeForeground: () => () => {},
};

// ---------------------------------------------------------------------------
// Storage monitor factory
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
): RuntimeEntryConfig {
	return {
		createAdapter: () =>
			createTodoSyncAdapter({
				db: appDb,
				scopeId: userId,
				config: personalTodoConfig,
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

		// Extension uses browser.alarms for periodic sync, not setInterval
		createPeriodicSync,

		// No realtime for extension — uses background alarms
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

		createPeriodicSync,
		createStorageMonitor,
	};
}
