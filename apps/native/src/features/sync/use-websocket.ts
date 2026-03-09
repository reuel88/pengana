import type { SyncEngine } from "@pengana/sync-engine";
import { type MutableRefObject, useEffect, useRef } from "react";

import { WS_MAX_BACKOFF_MS } from "@/lib/design-tokens";

export function useWebSocket(
	userId: string | undefined,
	effectiveOnline: boolean,
	engineRef: MutableRefObject<SyncEngine | null>,
	getWsUrl: () => string,
	onSyncNotify?: () => void,
) {
	const getWsUrlRef = useRef(getWsUrl);
	const onSyncNotifyRef = useRef(onSyncNotify);
	getWsUrlRef.current = getWsUrl;
	onSyncNotifyRef.current = onSyncNotify;

	// biome-ignore lint/correctness/useExhaustiveDependencies: getWsUrlRef/onSyncNotifyRef/engineRef are stable refs — their .current is read dynamically inside the effect
	useEffect(() => {
		if (!userId || !effectiveOnline) return;

		let ws: WebSocket | null = null;
		let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
		let backoff = 1000;
		let unmounted = false;

		function connect() {
			if (unmounted) return;

			ws = new WebSocket(getWsUrlRef.current());

			ws.onopen = () => {
				backoff = 1000;
			};

			ws.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data as string);
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

			ws.onerror = () => {
				ws?.close();
			};
		}

		connect();

		return () => {
			unmounted = true;
			if (reconnectTimeout) clearTimeout(reconnectTimeout);
			ws?.close();
		};
	}, [userId, effectiveOnline]);
}
