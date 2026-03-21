import type { StorageLevel } from "@pengana/storage-health";
import type { SyncEvent } from "@pengana/sync-engine";
import type { SyncDescriptor } from "@pengana/sync-runtime";
import type { EnqueueUploadParams, UploadEvent } from "@pengana/upload-queue";
import { useCallback, useSyncExternalStore } from "react";
import { syncRuntime } from "./sync-runtime-instance";

// ---------------------------------------------------------------------------
// Core hook
// ---------------------------------------------------------------------------

export interface SyncContextValue {
	isOnline: boolean;
	isSyncing: boolean;
	isUploading: boolean;
	storageLevel: StorageLevel;
	triggerSync: () => void;
	enqueueUpload: (params: EnqueueUploadParams) => void;
}

const EMPTY_SNAPSHOT = {
	isOnline: false,
	isSyncing: false,
	isUploading: false,
	storageLevel: "ok" as StorageLevel,
};

export function useSyncEntry(descriptor: SyncDescriptor): SyncContextValue {
	const snapshot = useSyncExternalStore(
		useCallback(
			(cb: () => void) => syncRuntime.subscribe(descriptor, cb),
			[descriptor],
		),
		useCallback(
			() => syncRuntime.getSnapshot(descriptor) ?? EMPTY_SNAPSHOT,
			[descriptor],
		),
	);

	const triggerSync = useCallback(() => {
		syncRuntime.triggerSync(descriptor);
	}, [descriptor]);

	const enqueueUpload = useCallback(
		(params: EnqueueUploadParams) => {
			syncRuntime.enqueueUpload(descriptor, params);
		},
		[descriptor],
	);

	return {
		...snapshot,
		triggerSync,
		enqueueUpload,
	};
}

// ---------------------------------------------------------------------------
// Devtools hook
// ---------------------------------------------------------------------------

export interface SyncDevtoolsValue {
	events: SyncEvent[];
	uploadEvents: UploadEvent[];
}

const EMPTY_DEVTOOLS = {
	events: [] as SyncEvent[],
	uploadEvents: [] as UploadEvent[],
};

export function useSyncDevtoolsEntry(
	descriptor: SyncDescriptor,
): SyncDevtoolsValue {
	return useSyncExternalStore(
		useCallback(
			(cb: () => void) => syncRuntime.subscribe(descriptor, cb),
			[descriptor],
		),
		useCallback(
			() => syncRuntime.getDevtoolsSnapshot(descriptor) ?? EMPTY_DEVTOOLS,
			[descriptor],
		),
	);
}
