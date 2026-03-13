import { parseWsMessage } from "@pengana/api/ws-types";
import { env } from "@pengana/env/native";
import { i18next } from "@pengana/i18n";
import {
	createWebSocketRealtimeTransport,
	type SyncEnginePlatformDeps,
	useSyncEngineCore,
} from "@pengana/sync-engine";
import { randomUUID } from "expo-crypto";
import { useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import {
	createUploadAdapter,
	createUploadTransport,
} from "@/features/sync/entities/upload-queue";
import { createSyncAdapter } from "@/features/todo/entities/todo";
import { client } from "@/shared/api/orpc";
import { authClient } from "@/shared/lib/auth-client";
import { getServerUrl } from "@/shared/lib/server-url";
import { createNativeStorageHealthProvider } from "@/shared/lib/storage-health";
import { useNetworkStatus } from "./use-network-status";

async function getNativeWsUrl() {
	const base = `${env.EXPO_PUBLIC_SERVER_URL.replace(/^http/, "ws")}/ws`;
	const cookies = authClient.getCookie();

	if (!cookies) {
		throw new Error("Missing auth cookie for WebSocket ticket");
	}

	const response = await fetch(`${getServerUrl()}/api/ws-ticket`, {
		method: "POST",
		headers: {
			Cookie: cookies,
			"Accept-Language": i18next.language,
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to issue WebSocket ticket (${response.status})`);
	}

	const body = (await response.json()) as { ticket?: string };
	if (!body.ticket) {
		throw new Error("Missing WebSocket ticket");
	}

	return `${base}?ticket=${encodeURIComponent(body.ticket)}`;
}

function getWsUrl() {
	if (Platform.OS === "web") {
		return `${getServerUrl().replace(/^http/, "ws")}/ws`;
	}

	return getNativeWsUrl();
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

function useAppIsForeground() {
	const [isForeground, setIsForeground] = useState(
		AppState.currentState === "active",
	);

	useEffect(() => {
		const subscription = AppState.addEventListener("change", (nextAppState) => {
			setIsForeground(nextAppState === "active");
		});
		return () => subscription.remove();
	}, []);

	return isForeground;
}

const platformDeps: SyncEnginePlatformDeps = {
	generateUUID: randomUUID,
	createRealtimeTransport,
	createSyncAdapter: (userId) => createSyncAdapter(userId),
	createSyncTransport: () => ({
		sync: async (input) => (await client.todo.sync(input)).data,
	}),
	createUploadAdapter,
	createUploadTransport,
	onFocusSubscribe: (triggerSync) => {
		const subscription = AppState.addEventListener("change", (nextAppState) => {
			if (nextAppState === "active") triggerSync();
		});
		return () => subscription.remove();
	},
	storageHealth: createNativeStorageHealthProvider(),
};

export function useSyncEngine(userId: string | undefined) {
	const { isOnline } = useNetworkStatus();
	const isForeground = useAppIsForeground();

	return useSyncEngineCore(userId, isOnline, platformDeps, isForeground);
}
