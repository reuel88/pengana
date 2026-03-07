import { env } from "@pengana/env/web";
import type { SyncEngine } from "@pengana/sync-engine";
import { useEffect } from "react";

import { notificationQueryKeys } from "@/features/notifications/use-notification-queries";
import { orgQueryKeys } from "@/hooks/use-org-queries";
import { queryClient } from "@/utils/orpc";

import { useStableSyncRef } from "./use-stable-sync-ref";

function getWsUrl() {
	return `${env.VITE_SERVER_URL.replace(/^http/, "ws")}/ws`;
}

export function useWebSocketSync(
	userId: string | undefined,
	isOnline: boolean,
	engineRef: React.RefObject<SyncEngine | null>,
) {
	const syncRef = useStableSyncRef(engineRef);

	useEffect(() => {
		if (!userId || !isOnline) return;

		let ws: WebSocket | null = null;
		let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
		let backoff = 1000;
		let unmounted = false;

		function connect() {
			if (unmounted) return;

			console.log("[ws] connecting to", getWsUrl());
			ws = new WebSocket(getWsUrl());

			ws.onopen = () => {
				console.log("[ws] connected");
				backoff = 1000;
				syncRef.current();
			};

			ws.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					console.log("[ws] message received:", data.type);
					if (data.type === "sync-notify") {
						console.log("[ws] sync-notify received, triggering sync");
						syncRef.current();
						queryClient.invalidateQueries({
							queryKey: notificationQueryKeys.list,
						});
						queryClient.invalidateQueries({
							queryKey: orgQueryKeys.userInvitations,
						});
					}
				} catch {
					// ignore malformed messages
				}
			};

			ws.onclose = (event) => {
				console.log("[ws] closed, code:", event.code, "reason:", event.reason);
				if (unmounted) return;
				reconnectTimeout = setTimeout(() => {
					backoff = Math.min(backoff * 2, 30_000);
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
	}, [userId, isOnline, syncRef.current]);
}
