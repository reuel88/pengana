import { createPeriodicSync, createSyncTransport } from "@pengana/sync/core";
import { StorageHealthMonitor } from "@pengana/sync/health";
import type { PlatformDeps, RuntimeEntryConfig } from "@pengana/sync/runtime";
import { subscribeToSharedNotifyChannel } from "@pengana/sync/transport";
import { cleanupUploaded, UploadQueueManager } from "@pengana/sync/upload";
import { File } from "expo-file-system";
import * as Network from "expo-network";
import { AppState } from "react-native";
import {
	createDrizzleOrgSyncAdapter as createOrgSyncAdapter,
	createDrizzleSyncAdapter as createSyncAdapter,
} from "@/features/todo/entities/todo/adapter";
import { client } from "@/shared/api/orpc";
import {
	createRealtimeTransport,
	getStorageHealthProvider,
	getUploadAdapter,
	getUploadLifecycleCallbacks,
	getUploadTransport,
} from "./platform-deps";
import { reconcileNativeMedia } from "./reconcile-media";

// ---------------------------------------------------------------------------
// PlatformDeps for React Native
// ---------------------------------------------------------------------------

export const nativePlatformDeps: PlatformDeps = {
	isOnline: () => true, // Assume online initially; listener updates
	subscribeOnline: (cb) => {
		// Check initial state
		Network.getNetworkStateAsync().then((state) => {
			cb(state.isInternetReachable ?? state.isConnected ?? false);
		});

		const subscription = Network.addNetworkStateListener((state) => {
			cb(state.isInternetReachable ?? state.isConnected ?? false);
		});
		return () => subscription.remove();
	},
	isForeground: () => AppState.currentState === "active",
	subscribeForeground: (cb) => {
		const subscription = AppState.addEventListener("change", (state) => {
			cb(state === "active");
		});
		return () => subscription.remove();
	},
};

// ---------------------------------------------------------------------------
// Storage monitor factory
// ---------------------------------------------------------------------------

function createStorageMonitor() {
	const uploadAdapter = getUploadAdapter();
	return new StorageHealthMonitor({
		provider: getStorageHealthProvider(),
		onStorageWarning: async () => {
			await cleanupUploaded({
				uploadAdapter,
				removeFile: async (item) => {
					const file = new File(item.fileUri);
					file.delete();
				},
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
			createSyncAdapter(userId, { syncKeySuffix: organizationId }),

		createTransport: () =>
			createSyncTransport(
				async (input) =>
					(await client.todo.sync(input, { signal: input.signal })).data,
				reconcileNativeMedia,
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
		createAdapter: () => createOrgSyncAdapter(organizationId),

		createTransport: () =>
			createSyncTransport(
				async (input) =>
					(
						await client.orgTodo.sync(input, {
							signal: input.signal,
						})
					).data,
				reconcileNativeMedia,
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
