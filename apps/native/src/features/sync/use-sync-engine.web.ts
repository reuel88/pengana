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
import { MAX_EVENT_LOG_SIZE, WS_MAX_BACKOFF_MS } from "@/lib/design-tokens";
import { getServerUrl } from "@/lib/server-url";
import { client } from "@/utils/orpc";

const SYNC_INTERVAL_MS = 5 * 60_000;

function getWsUrl() {
	return `${getServerUrl().replace(/^http/, "ws")}/ws`;
}

export function useSyncEngine(userId: string | undefined) {
	const engineRef = useRef<SyncEngine | null>(null);
	const uploadQueueRef = useRef<UploadQueue | null>(null);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const [isOnline, setIsOnline] = useState(navigator.onLine);
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
				return client.todo.sync(input);
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
			if (event.type === "upload:complete") {
				engine.sync();
			}
		});

		queue.resume();

		return () => {
			unsubscribeSyncEvents();
			unsubscribeUploadEvents();
			engineRef.current = null;
			uploadQueueRef.current = null;
		};
	}, [userId]);

	// Network connectivity listener using browser APIs
	useEffect(() => {
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	// Auto-sync on reconnect + resume upload queue
	useEffect(() => {
		if (effectiveOnline) {
			engineRef.current?.sync();
			uploadQueueRef.current?.resume();
		} else {
			uploadQueueRef.current?.pause();
		}
	}, [effectiveOnline]);

	// Periodic sync (fallback)
	useEffect(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}

		if (effectiveOnline && engineRef.current) {
			intervalRef.current = setInterval(() => {
				engineRef.current?.sync();
			}, SYNC_INTERVAL_MS);
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [effectiveOnline]);

	// WebSocket for instant sync notifications
	useEffect(() => {
		if (!userId || !effectiveOnline) return;

		let ws: WebSocket | null = null;
		let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
		let backoff = 1000;
		let unmounted = false;

		function connect() {
			if (unmounted) return;

			ws = new WebSocket(getWsUrl());

			ws.onopen = () => {
				backoff = 1000;
			};

			ws.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data as string);
					if (data.type === "sync-notify") {
						engineRef.current?.sync();
					}
				} catch {
					// ignore malformed messages
				}
			};

			ws.onclose = () => {
				if (unmounted) return;
				reconnectTimeout = setTimeout(() => {
					backoff = Math.min(backoff * 2, WS_MAX_BACKOFF_MS);
					connect();
				}, backoff);
			};

			ws.onerror = () => {
				ws?.close();
			};
		}

		connect();

		return () => {
			unmounted = true;
			if (reconnectTimeout) clearTimeout(reconnectTimeout);
			ws?.close();
		};
	}, [userId, effectiveOnline]);

	/** Manually trigger a sync cycle (e.g. devtools or pull-to-refresh) */
	const triggerSync = useCallback(() => {
		if (effectiveOnline) {
			engineRef.current?.sync();
		}
	}, [effectiveOnline]);

	/** Trigger sync after a local write (create/update/delete) */
	const syncAfterWrite = triggerSync;

	const enqueueUpload = useCallback(
		(todoId: string, fileUri: string, mimeType: string) => {
			uploadQueueRef.current?.enqueue({
				id: crypto.randomUUID(),
				todoId,
				fileUri,
				mimeType,
			});
		},
		[],
	);

	return {
		isOnline: effectiveOnline,
		isSyncing,
		isUploading,
		events,
		uploadEvents,
		triggerSync,
		syncAfterWrite,
		enqueueUpload,
		simulateOffline,
		setSimulateOffline,
	};
}
