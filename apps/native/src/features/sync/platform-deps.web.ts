import { parseWsMessage } from "@pengana/api/ws-types";
import {
	createWebSocketRealtimeTransport,
	type SyncEnginePlatformDeps,
} from "@pengana/sync-engine";
import {
	createNativeUploadLifecycleCallbacks,
	createUploadAdapter,
	createUploadTransport,
} from "@/features/sync/entities/upload-queue";
import { getServerUrl } from "@/shared/lib/server-url";

function getWsUrl() {
	return `${getServerUrl().replace(/^http/, "ws")}/ws`;
}

function createRealtimeTransport(
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
		uploadLifecycleCallbacks: createNativeUploadLifecycleCallbacks(),
		onFocusSubscribe: (triggerSync) => {
			const handler = () => {
				if (document.visibilityState === "visible") triggerSync();
			};
			document.addEventListener("visibilitychange", handler);
			return () => document.removeEventListener("visibilitychange", handler);
		},
	};
}
