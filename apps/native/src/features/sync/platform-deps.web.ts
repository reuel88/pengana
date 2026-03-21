import { parseWsMessage } from "@pengana/api/ws-types";
import { createWebSocketRealtimeTransport } from "@pengana/sync/transport";
import {
	createNativeUploadLifecycleCallbacks,
	createUploadAdapter,
	createUploadTransport,
} from "@/features/upload-queue";
import { getServerUrl } from "@/shared/lib/server-url";

function getWsUrl() {
	return `${getServerUrl().replace(/^http/, "ws")}/ws`;
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
	createNativeUploadLifecycleCallbacks as getUploadLifecycleCallbacks,
	createUploadAdapter as getUploadAdapter,
	createUploadTransport as getUploadTransport,
};

// Web variant has no native storage health — return undefined
export function getStorageHealthProvider() {
	return undefined;
}
