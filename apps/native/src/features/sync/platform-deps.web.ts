import { parseWsMessage } from "@pengana/api/ws-types";
import {
	createWebSocketRealtimeTransport,
	type SyncEnginePlatformDeps,
} from "@pengana/sync-engine";
import {
	createUploadAdapter,
	createUploadTransport,
} from "@/features/sync/entities/upload-queue";
import { getServerUrl } from "@/shared/lib/server-url";

function getWsUrl() {
	return `${getServerUrl().replace(/^http/, "ws")}/ws`;
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
		generateUUID: () => crypto.randomUUID(),
		createNotifyTransport: createRealtimeTransport,
		createSyncAdapter,
		createSyncTransport,
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
}
