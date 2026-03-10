import type { RefObject } from "react";
import { useEffect, useRef } from "react";

import { WS_MAX_BACKOFF_MS } from "../constants/sync";
import type { SyncEngine } from "../core/engine";

export function useWebSocketReconnect(
	userId: string | undefined,
	isOnline: boolean,
	engineRef: RefObject<SyncEngine | null>,
	getWsUrl: () => string,
	onSyncNotify?: () => void,
) {
	const getWsUrlRef = useRef(getWsUrl);
	const onSyncNotifyRef = useRef(onSyncNotify);
	getWsUrlRef.current = getWsUrl;
	onSyncNotifyRef.current = onSyncNotify;

	// biome-ignore lint/correctness/useExhaustiveDependencies: getWsUrlRef/onSyncNotifyRef/engineRef are stable refs — their .current is read dynamically inside the effect
	useEffect(() => {
		if (!userId || !isOnline) return;

		let ws: WebSocket | null = null;
		let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
		let backoff = 1000;
		let unmounted = false;

		function connect() {
			if (unmounted) return;

			ws = new WebSocket(getWsUrlRef.current());

			ws.onopen = () => {
				backoff = 1000;
				engineRef.current?.sync();
			};

			ws.onmessage = (event) => {
				try {
					const data = JSON.parse(
						typeof event.data === "string" ? event.data : String(event.data),
					);
					if (data.type === "sync-notify") {
						engineRef.current?.sync();
						onSyncNotifyRef.current?.();
					}
				} catch {
					// ignore malformed messages
				}
			};

			ws.onclose = () => {
				if (unmounted) return;
				reconnectTimeout = setTimeout(() => {
					backoff = Math.min(backoff * 2, WS_MAX_BACKOFF_MS);
					connect();
				}, backoff);
			};

			ws.onerror = (event) => {
				console.error("[ws] error:", event);
				ws?.close();
			};
		}

		connect();

		return () => {
			unmounted = true;
			if (reconnectTimeout) clearTimeout(reconnectTimeout);
			ws?.close();
		};
	}, [userId, isOnline]);
}
