import type { RefObject } from "react";
import { useMemo } from "react";

import type { SyncEngine } from "../core/engine";
import { createWebSocketRealtimeTransport } from "../realtime/websocket-realtime-transport";
import { useRealtimeTransport } from "./use-realtime-transport";

export function useWebSocketReconnect(
	notifyKey: string | undefined,
	isOnline: boolean,
	engineRef: RefObject<SyncEngine | null>,
	getWsUrl: () => string | Promise<string>,
	onRefreshNotify?: () => void,
) {
	const createNotifyTransport = useMemo(
		() =>
			(
				_notifyKey: string,
				callbacks: {
					onNotify: (kind: "sync" | "refresh") => void;
					onOpen?: () => void;
				},
			) =>
				createWebSocketRealtimeTransport({
					getUrl: getWsUrl,
					decodeMessage: (data) => {
						try {
							const message = JSON.parse(
								typeof data === "string" ? data : String(data),
							) as { type?: string };
							if (
								message.type === "connected" ||
								message.type === "keepalive"
							) {
								return "heartbeat";
							}
							if (message.type === "sync-notify") return "sync";
							if (message.type === "refresh-notify") return "refresh";
							return null;
						} catch {
							return null;
						}
					},
					onNotify: callbacks.onNotify,
					onOpen: callbacks.onOpen,
				}),
		[getWsUrl],
	);

	useRealtimeTransport(
		notifyKey,
		isOnline,
		engineRef,
		createNotifyTransport,
		onRefreshNotify,
	);
}
