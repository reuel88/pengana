import { parseWsMessage } from "@pengana/api/ws-types";
import { env } from "@pengana/env/native";
import { i18next } from "@pengana/i18n";
import {
	createWebSocketRealtimeTransport,
	type SyncEnginePlatformDeps,
} from "@pengana/sync-engine";
import { randomUUID } from "expo-crypto";
import { AppState, Platform } from "react-native";
import {
	createUploadAdapter,
	createUploadTransport,
} from "@/features/sync/entities/upload-queue";
import { authClient } from "@/shared/lib/auth-client";
import { getServerUrl } from "@/shared/lib/server-url";
import { createNativeStorageHealthProvider } from "@/shared/lib/storage-health";

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
	_id: string,
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

type AdapterFactory = SyncEnginePlatformDeps["createSyncAdapter"];
type TransportFactory = SyncEnginePlatformDeps["createSyncTransport"];

export function createPlatformDeps(
	createSyncAdapter: AdapterFactory,
	createSyncTransport: TransportFactory,
): SyncEnginePlatformDeps {
	return {
		generateUUID: randomUUID,
		createNotifyTransport: createRealtimeTransport,
		createSyncAdapter,
		createSyncTransport,
		createUploadAdapter,
		createUploadTransport,
		onFocusSubscribe: (triggerSync) => {
			const subscription = AppState.addEventListener(
				"change",
				(nextAppState) => {
					if (nextAppState === "active") triggerSync();
				},
			);
			return () => subscription.remove();
		},
		storageHealth: createNativeStorageHealthProvider(),
	};
}
