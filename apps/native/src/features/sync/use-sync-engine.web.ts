import { parseWsMessage } from "@pengana/api/ws-types";
import {
	createWebSocketRealtimeTransport,
	type SyncEnginePlatformDeps,
	useNetworkStatus,
	useSyncEngineCore,
} from "@pengana/sync-engine";
import { useEffect, useState } from "react";
import {
	createUploadAdapter,
	createUploadTransport,
} from "@/features/sync/entities/upload-queue";
import { createSyncAdapter } from "@/features/todo/entities/todo";
import { client } from "@/shared/api/orpc";
import { getServerUrl } from "@/shared/lib/server-url";

function getWsUrl() {
	return `${getServerUrl().replace(/^http/, "ws")}/ws`;
}

function createRealtimeTransport(
	_userId: string,
	callbacks: { onNotify: () => void; onOpen?: () => void },
) {
	return createWebSocketRealtimeTransport({
		getUrl: getWsUrl,
		decodeMessage: (data) => {
			const message = parseWsMessage(data);
			if (!message) return null;
			return message.type === "sync-notify" ? "notify" : "heartbeat";
		},
		onNotify: callbacks.onNotify,
		onOpen: callbacks.onOpen,
	});
}

function useDocumentVisible() {
	const [isVisible, setIsVisible] = useState(
		document.visibilityState === "visible",
	);

	useEffect(() => {
		const handleVisibilityChange = () => {
			setIsVisible(document.visibilityState === "visible");
		};
		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () =>
			document.removeEventListener("visibilitychange", handleVisibilityChange);
	}, []);

	return isVisible;
}

const platformDeps: SyncEnginePlatformDeps = {
	generateUUID: () => crypto.randomUUID(),
	createRealtimeTransport,
	createSyncAdapter: (userId) => createSyncAdapter(userId),
	createSyncTransport: () => ({
		sync: async (input) => (await client.todo.sync(input)).data,
	}),
	createUploadAdapter,
	createUploadTransport,
	onFocusSubscribe: (triggerSync) => {
		const handler = () => {
			if (document.visibilityState === "visible") triggerSync();
		};
		document.addEventListener("visibilitychange", handler);
		return () => document.removeEventListener("visibilitychange", handler);
	},
};

export function useSyncEngine(userId: string | undefined) {
	const { isOnline } = useNetworkStatus();
	const isVisible = useDocumentVisible();

	return useSyncEngineCore(userId, isOnline, platformDeps, isVisible);
}
