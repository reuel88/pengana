import { env } from "@pengana/env/web";
import type { SyncEngine } from "@pengana/sync-engine";
import { useStableSyncRef, WS_MAX_BACKOFF_MS } from "@pengana/sync-engine";
import { useEffect, useRef } from "react";

function getWsUrl() {
	return `${env.VITE_SERVER_URL.replace(/^http/, "ws")}/ws`;
}

export function useWebSocketSync(
	userId: string | undefined,
	isOnline: boolean,
	engineRef: React.RefObject<SyncEngine | null>,
	onSyncNotify?: () => void,
) {
	const syncRef = useStableSyncRef(engineRef);
	const onSyncNotifyRef = useRef(onSyncNotify);
	onSyncNotifyRef.current = onSyncNotify;

	// biome-ignore lint/correctness/useExhaustiveDependencies: syncRef and onSyncNotifyRef are stable refs, their .current never triggers re-renders
	useEffect(() => {
		if (!userId || !isOnline) return;

		let ws: WebSocket | null = null;
		let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
		let backoff = 1000;
		let unmounted = false;

		function connect() {
			if (unmounted) return;

			ws = new WebSocket(getWsUrl());

			ws.onopen = () => {
				backoff = 1000;
				syncRef.current();
			};

			ws.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					if (data.type === "sync-notify") {
						syncRef.current();
						onSyncNotifyRef.current?.();
					}
				} catch (err) {
					console.error("[ws] failed to parse message:", event.data, err);
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
