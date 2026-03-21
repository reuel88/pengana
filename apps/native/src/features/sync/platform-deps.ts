import { parseWsMessage } from "@pengana/api/ws-types";
import { env } from "@pengana/env/native";
import { i18next } from "@pengana/i18n";
import { createWebSocketRealtimeTransport } from "@pengana/sync/transport";
import { Platform } from "react-native";
import {
	createNativeUploadLifecycleCallbacks,
	createUploadAdapter,
	createUploadTransport,
} from "@/features/upload-queue";
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

	const body = (await response.json()) as { data: { ticket: string } };
	const ticket = body.data.ticket;
	if (!ticket) {
		throw new Error("Missing WebSocket ticket");
	}

	return `${base}?ticket=${encodeURIComponent(ticket)}`;
}

function getWsUrl() {
	if (Platform.OS === "web") {
		return `${getServerUrl().replace(/^http/, "ws")}/ws`;
	}

	return getNativeWsUrl();
}

export function createRealtimeTransport(
	_id: string,
	callbacks: {
		onNotify: (kind: "sync" | "refresh") => void;
		onOpen?: () => void;
	},
) {
	return createWebSocketRealtimeTransport({
		getUrl: getWsUrl,
		decodeMessage: (data) => {
			const message = parseWsMessage(data);
			if (!message) return null;
			if (message.type === "sync-notify") return "sync";
			if (message.type === "refresh-notify") return "refresh";
			return "heartbeat";
		},
		onNotify: callbacks.onNotify,
		onOpen: callbacks.onOpen,
	});
}

export {
	createNativeStorageHealthProvider as getStorageHealthProvider,
	createNativeUploadLifecycleCallbacks as getUploadLifecycleCallbacks,
	createUploadAdapter as getUploadAdapter,
	createUploadTransport as getUploadTransport,
};
