import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MAX_EVENT_LOG_SIZE } from "../constants/sync";
import { SyncEngine } from "../core/engine";
import type { CreateRealtimeTransport } from "../realtime/types";
import type {
	SyncAdapter,
	SyncEvent,
	SyncTransport,
	UploadAdapter,
	UploadTransport,
} from "../types";
import type { StorageHealthProvider } from "../types/storage-health";
import { usePeriodicSync } from "./use-periodic-sync";
import { useRealtimeTransport } from "./use-realtime-transport";
import { useStorageHealth } from "./use-storage-health";
import { useUploadQueue } from "./use-upload-queue";

// --- Types ---
export interface SyncEnginePlatformDeps {
	generateUUID: () => string;
	onSyncNotify?: () => void;
	createNotifyTransport: CreateRealtimeTransport;

	// Adapter/transport factories
	createSyncAdapter: (userId: string) => SyncAdapter;
	createSyncTransport: () => SyncTransport;
	createUploadAdapter: () => UploadAdapter;
	createUploadTransport: () => UploadTransport;

	// Optional focus subscription
	onFocusSubscribe?: (triggerSync: () => void) => () => void;

	// Optional storage health monitoring
	storageHealth?: StorageHealthProvider;
	removeFile?: (todoId: string) => Promise<void>;
	onStorageCritical?: () => void;
}

export function useSyncEngineCore(
	scopeId: string | undefined,
	isOnline: boolean,
	deps: SyncEnginePlatformDeps,
	isForeground = true,
	notifyKey = scopeId,
) {
	// --- State ---
	const engineRef = useRef<SyncEngine | null>(null);
	const [events, setEvents] = useState<SyncEvent[]>([]);
	const [isSyncing, setIsSyncing] = useState(false);

	// --- Network Status ---
	const [simulateOffline, setSimulateOffline] = useState(false);
	const effectiveOnline = isOnline && !simulateOffline;

	// --- Engine Init Effect ---
	useEffect(() => {
		if (!scopeId) return;

		const adapter = deps.createSyncAdapter(scopeId);
		const transport = deps.createSyncTransport();

		const engine = new SyncEngine(adapter, transport);
		engineRef.current = engine;

		const unsubscribeSyncEvents = engine.onEvent((event) => {
			setEvents((prev) => [...prev.slice(-(MAX_EVENT_LOG_SIZE - 1)), event]);
			if (event.type === "sync:start") setIsSyncing(true);
			if (event.type === "sync:complete" || event.type === "sync:error")
				setIsSyncing(false);
		});

		return () => {
			unsubscribeSyncEvents();
			engineRef.current = null;
		};
	}, [scopeId, deps]);

	// --- Upload Queue ---
	const { isUploading, uploadEvents, enqueueUpload } = useUploadQueue(
		scopeId,
		effectiveOnline,
		engineRef,
		deps.generateUUID,
		deps.createUploadAdapter,
		deps.createUploadTransport,
	);

	// --- Storage Health ---
	const uploadAdapterRef = useRef<UploadAdapter | null>(null);
	useEffect(() => {
		if (!scopeId) return;
		uploadAdapterRef.current = deps.createUploadAdapter();
		return () => {
			uploadAdapterRef.current = null;
		};
	}, [scopeId, deps]);

	const cleanupDeps = useMemo(
		() =>
			uploadAdapterRef.current
				? {
						uploadAdapter: uploadAdapterRef.current,
						removeFile: deps.removeFile,
					}
				: undefined,
		[deps.removeFile],
	);

	const { storageLevel } = useStorageHealth({
		provider: deps.storageHealth,
		cleanupDeps,
		onStorageCritical: deps.onStorageCritical,
	});

	// --- Online Reactivity ---
	useEffect(() => {
		if (effectiveOnline) {
			engineRef.current?.sync();
		}
	}, [effectiveOnline]);

	// --- Sync Triggers ---
	usePeriodicSync(effectiveOnline, engineRef);
	useRealtimeTransport(
		notifyKey,
		effectiveOnline && isForeground,
		engineRef,
		deps.createNotifyTransport,
		deps.onSyncNotify,
	);

	// --- Public API ---
	const triggerSync = useCallback(() => {
		if (effectiveOnline) {
			engineRef.current?.sync();
		}
	}, [effectiveOnline]);

	// --- Focus Subscription ---
	useEffect(() => {
		if (!deps.onFocusSubscribe || !effectiveOnline) return;
		return deps.onFocusSubscribe(() => engineRef.current?.sync());
	}, [effectiveOnline, deps]);

	// --- Return ---
	return {
		core: {
			isOnline: effectiveOnline,
			isSyncing,
			isUploading,
			storageLevel,
			triggerSync,
			enqueueUpload,
		},
		devtools: {
			events,
			uploadEvents,
			simulateOffline,
			setSimulateOffline,
		},
	};
}
