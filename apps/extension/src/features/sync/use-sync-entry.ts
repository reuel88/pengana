import { createNetworkStatusMonitor } from "@pengana/realtime-transport";
import type { StorageLevel } from "@pengana/storage-health";
import type { SyncDescriptor } from "@pengana/sync-runtime";
import type { EnqueueUploadParams } from "@pengana/upload-queue";
import { useCallback, useSyncExternalStore } from "react";

// ---------------------------------------------------------------------------
// Extension popup sync hook
//
// The popup does NOT own sync engines — the background service worker does.
// This hook provides a thin interface:
// - isOnline from the popup's own network status
// - isSyncing / isUploading are not directly observable (background owns them)
// - triggerSync sends a message to the background
// - enqueueUpload enqueues directly in Dexie (background picks it up)
// ---------------------------------------------------------------------------

const networkMonitor = createNetworkStatusMonitor();

export interface SyncContextValue {
	isOnline: boolean;
	isSyncing: boolean;
	isUploading: boolean;
	storageLevel: StorageLevel;
	triggerSync: () => void;
	enqueueUpload: (params: EnqueueUploadParams) => void;
}

export function useSyncEntry(descriptor: SyncDescriptor): SyncContextValue {
	const isOnline = useSyncExternalStore(
		(cb) => networkMonitor.subscribe(cb),
		() => networkMonitor.isOnline,
	);

	const triggerSync = useCallback(() => {
		// Send a message to the background to trigger sync for all entries
		browser.runtime.sendMessage({ type: "trigger-sync" }).catch(() => {});
	}, []);

	const enqueueUpload = useCallback(
		(params: EnqueueUploadParams) => {
			browser.runtime
				.sendMessage({
					type: "enqueue-upload",
					descriptor,
					params,
				})
				.catch(() => {});
		},
		[descriptor],
	);

	return {
		isOnline,
		isSyncing: false, // Background owns sync state
		isUploading: false, // Background owns upload state
		storageLevel: "ok",
		triggerSync,
		enqueueUpload,
	};
}
