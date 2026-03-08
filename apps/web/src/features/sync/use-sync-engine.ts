import type { SyncEvent, SyncInput, SyncOutput } from "@pengana/sync-engine";
import { SyncEngine } from "@pengana/sync-engine";
import { createDexieSyncAdapter } from "@pengana/todo-client";
import { useCallback, useEffect, useRef, useState } from "react";
import { client } from "@/utils/orpc";

import { useNetworkStatus } from "./use-network-status";
import { usePeriodicSync } from "./use-periodic-sync";
import { useSyncOnFocus } from "./use-sync-on-focus";
import { useUploadQueue } from "./use-upload-queue";
import { useWebSocketSync } from "./use-websocket-sync";

export function useSyncEngine(userId: string | undefined) {
	const engineRef = useRef<SyncEngine | null>(null);
	const [events, setEvents] = useState<SyncEvent[]>([]);
	const [isSyncing, setIsSyncing] = useState(false);

	const { isOnline, simulateOffline, setSimulateOffline } = useNetworkStatus();

	useEffect(() => {
		if (!userId) return;

		const adapter = createDexieSyncAdapter(userId);

		const transport = {
			async sync(input: SyncInput): Promise<SyncOutput> {
				return (await client.todo.sync(input)).data;
			},
		};

		const engine = new SyncEngine(adapter, transport);
		engineRef.current = engine;

		const unsubscribe = engine.onEvent((event) => {
			setEvents((prev) => [...prev.slice(-99), event]);
			if (event.type === "sync:start") setIsSyncing(true);
			if (event.type === "sync:complete" || event.type === "sync:error")
				setIsSyncing(false);
		});

		return () => {
			unsubscribe();
			engineRef.current = null;
		};
	}, [userId]);

	useEffect(() => {
		if (isOnline) {
			engineRef.current?.sync();
		}
	}, [isOnline]);

	usePeriodicSync(isOnline, engineRef);
	useWebSocketSync(userId, isOnline, engineRef);
	useSyncOnFocus(engineRef, isOnline);

	const { isUploading, uploadEvents, enqueueUpload } = useUploadQueue(
		userId,
		isOnline,
		engineRef,
	);

	const triggerSync = useCallback(() => {
		if (isOnline) {
			engineRef.current?.sync();
		}
	}, [isOnline]);

	return {
		core: {
			isOnline,
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
