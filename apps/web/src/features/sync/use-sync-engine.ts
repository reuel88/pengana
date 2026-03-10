import type { SyncEvent, SyncInput, SyncOutput } from "@pengana/sync-engine";
import {
	MAX_EVENT_LOG_SIZE,
	SyncEngine,
	useNetworkStatus,
	usePeriodicSync,
} from "@pengana/sync-engine";
import { createDexieSyncAdapter } from "@pengana/todo-client";
import { useCallback, useEffect, useRef, useState } from "react";
import { notificationQueryKeys } from "@/features/notifications/use-notification-queries";
import { orgQueryKeys } from "@/hooks/use-org-queries";
import { client, queryClient } from "@/utils/orpc";

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

		const unsubscribeSyncEvents = engine.onEvent((event) => {
			setEvents((prev) => [...prev.slice(-MAX_EVENT_LOG_SIZE), event]);
			if (event.type === "sync:start") setIsSyncing(true);
			if (event.type === "sync:complete" || event.type === "sync:error")
				setIsSyncing(false);
		});

		return () => {
			unsubscribeSyncEvents();
			engineRef.current = null;
		};
	}, [userId]);

	useEffect(() => {
		if (isOnline) {
			engineRef.current?.sync();
		}
	}, [isOnline]);

	usePeriodicSync(isOnline, engineRef);
	useWebSocketSync(userId, isOnline, engineRef, () => {
		queryClient.invalidateQueries({ queryKey: notificationQueryKeys.list });
		queryClient.invalidateQueries({ queryKey: orgQueryKeys.userInvitations });
	});
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
