import type {
	SyncEvent,
	SyncInput,
	SyncOutput,
	UploadEvent,
} from "@pengana/sync-engine";
import { SyncEngine, UploadQueue } from "@pengana/sync-engine";
import { useCallback, useEffect, useRef, useState } from "react";

import { createSyncAdapter } from "@/entities/todo";
import {
	createUploadAdapter,
	createUploadTransport,
} from "@/entities/upload-queue";
import { MAX_EVENT_LOG_SIZE } from "@/lib/design-tokens";
import { client } from "@/utils/orpc";

import { usePeriodicSync } from "./use-periodic-sync";
import { useWebSocket } from "./use-websocket";

export interface SyncEnginePlatformDeps {
	getWsUrl: () => string;
	generateUUID: () => string;
	onSyncNotify?: () => void;
}

export function useSyncEngineCore(
	userId: string | undefined,
	isOnline: boolean,
	deps: SyncEnginePlatformDeps,
) {
	const engineRef = useRef<SyncEngine | null>(null);
	const uploadQueueRef = useRef<UploadQueue | null>(null);
	const [simulateOffline, setSimulateOffline] = useState(false);
	const [events, setEvents] = useState<SyncEvent[]>([]);
	const [isSyncing, setIsSyncing] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadEvents, setUploadEvents] = useState<UploadEvent[]>([]);

	const effectiveOnline = isOnline && !simulateOffline;

	useEffect(() => {
		if (!userId) return;

		const adapter = createSyncAdapter(userId);

		const transport = {
			async sync(input: SyncInput): Promise<SyncOutput> {
				return (await client.todo.sync(input)).data;
			},
		};

		const engine = new SyncEngine(adapter, transport);
		engineRef.current = engine;

		const unsubscribeSyncEvents = engine.onEvent((event) => {
			setEvents((prev) => [...prev.slice(-MAX_EVENT_LOG_SIZE), event]);
			if (event.type === "sync:start") setIsSyncing(true);
			if (event.type === "sync:complete" || event.type === "sync:error")
				setIsSyncing(false);
		});

		// Set up upload queue (Layer 2)
		const uploadAdapter = createUploadAdapter();
		const uploadTransport = createUploadTransport();
		const queue = new UploadQueue(uploadAdapter, uploadTransport);
		uploadQueueRef.current = queue;

		const unsubscribeUploadEvents = queue.onEvent((event) => {
			setUploadEvents((prev) => [...prev.slice(-MAX_EVENT_LOG_SIZE), event]);
			if (event.type === "upload:start") setIsUploading(true);
			if (event.type === "upload:complete" || event.type === "upload:error") {
				setIsUploading(false);
			}
			// After upload completes, trigger Layer 1 sync to push attachmentUrl
			if (event.type === "upload:complete") {
				engine.sync();
			}
		});

		// Resume queue to process items left from previous sessions
		queue.resume();

		return () => {
			unsubscribeSyncEvents();
			unsubscribeUploadEvents();
			engineRef.current = null;
			uploadQueueRef.current = null;
		};
	}, [userId]);

	// Auto-sync on reconnect + resume upload queue
	useEffect(() => {
		if (effectiveOnline) {
			engineRef.current?.sync();
			uploadQueueRef.current?.resume();
		} else {
			uploadQueueRef.current?.pause();
		}
	}, [effectiveOnline]);

	usePeriodicSync(effectiveOnline, engineRef);
	useWebSocket(
		userId,
		effectiveOnline,
		engineRef,
		deps.getWsUrl,
		deps.onSyncNotify,
	);

	/** Manually trigger a sync cycle (e.g. devtools or pull-to-refresh) */
	const triggerSync = useCallback(() => {
		if (effectiveOnline) {
			engineRef.current?.sync();
		}
	}, [effectiveOnline]);

	const enqueueUpload = useCallback(
		(todoId: string, fileUri: string, mimeType: string) => {
			uploadQueueRef.current?.enqueue({
				id: deps.generateUUID(),
				todoId,
				fileUri,
				mimeType,
			});
		},
		[deps],
	);

	return {
		core: {
			isOnline: effectiveOnline,
			isSyncing,
			isUploading,
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
