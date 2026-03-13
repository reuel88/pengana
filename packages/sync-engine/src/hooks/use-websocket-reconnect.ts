import type { RefObject } from "react";
import { useMemo } from "react";

import type { SyncEngine } from "../core/engine";
import { createWebSocketRealtimeTransport } from "../realtime/websocket-realtime-transport";
import { useRealtimeTransport } from "./use-realtime-transport";

export function useWebSocketReconnect(
	userId: string | undefined,
	isOnline: boolean,
	engineRef: RefObject<SyncEngine | null>,
	getWsUrl: () => string | Promise<string>,
	onSyncNotify?: () => void,
) {
	const createRealtimeTransport = useMemo(
		() =>
			(
				_userId: string,
				callbacks: { onNotify: () => void; onOpen?: () => void },
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
							return message.type === "sync-notify" ? "notify" : null;
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
		userId,
		isOnline,
		engineRef,
		createRealtimeTransport,
		onSyncNotify,
	);
}
