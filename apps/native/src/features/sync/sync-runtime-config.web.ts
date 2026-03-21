import { createPeriodicSync, createSyncTransport } from "@pengana/sync/core";
import { StorageHealthMonitor } from "@pengana/sync/health";
import type { PlatformDeps, RuntimeEntryConfig } from "@pengana/sync/runtime";
import { subscribeToSharedNotifyChannel } from "@pengana/sync/transport";
import { UploadQueueManager } from "@pengana/sync/upload";
import {
	createTodoSyncAdapter,
	orgTodoConfig,
	personalTodoConfig,
} from "@pengana/todo-client";
import { reconcileMedia } from "@pengana/upload-client";
import { client } from "@/shared/api/orpc";
import { appDb } from "@/shared/db";
import {
	createRealtimeTransport,
	getStorageHealthProvider,
	getUploadAdapter,
	getUploadLifecycleCallbacks,
	getUploadTransport,
} from "./platform-deps";

// ---------------------------------------------------------------------------
// PlatformDeps for Expo web (browser APIs)
// ---------------------------------------------------------------------------

export const nativePlatformDeps: PlatformDeps = {
	isOnline: () => navigator.onLine,
	subscribeOnline: (cb) => {
		const onOnline = () => cb(true);
		const onOffline = () => cb(false);
		window.addEventListener("online", onOnline);
		window.addEventListener("offline", onOffline);
		return () => {
			window.removeEventListener("online", onOnline);
			window.removeEventListener("offline", onOffline);
		};
	},
	isForeground: () => document.visibilityState === "visible",
	subscribeForeground: (cb) => {
		const handler = () => cb(document.visibilityState === "visible");
		document.addEventListener("visibilitychange", handler);
		return () => document.removeEventListener("visibilitychange", handler);
	},
};

// ---------------------------------------------------------------------------
// Storage monitor factory
// ---------------------------------------------------------------------------

function createStorageMonitor() {
	return new StorageHealthMonitor({
		provider: getStorageHealthProvider(),
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
				createUploadAdapter: getUploadAdapter,
				createUploadTransport: getUploadTransport,
				lifecycleCallbacks: getUploadLifecycleCallbacks(),
			}),

		createPeriodicSync,

		createRealtimeSub: ({ onSync }) =>
			subscribeToSharedNotifyChannel({
				notifyKey: userId,
				createNotifyTransport: createRealtimeTransport,
				enabled: true,
				onNotify: (kind) => {
					if (kind === "sync") onSync();
				},
				onOpen: () => onSync(),
			}),

		createStorageMonitor,
	};
}

export function createOrgTodoEntryConfig(
	organizationId: string,
	userId: string,
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
				createUploadAdapter: getUploadAdapter,
				createUploadTransport: getUploadTransport,
				lifecycleCallbacks: getUploadLifecycleCallbacks(),
			}),

		createPeriodicSync,

		createRealtimeSub: ({ onSync }) =>
			subscribeToSharedNotifyChannel({
				notifyKey: userId,
				createNotifyTransport: createRealtimeTransport,
				enabled: true,
				onNotify: (kind) => {
					if (kind === "sync") onSync();
				},
				onOpen: () => onSync(),
			}),

		createStorageMonitor,
	};
}
