import { env } from "@pengana/env/web";
import type { SyncEngine } from "@pengana/sync-engine";
import { useWebSocketReconnect } from "@pengana/sync-engine";
import type { RefObject } from "react";

function getWsUrl() {
	return `${env.VITE_SERVER_URL.replace(/^http/, "ws")}/ws`;
}

export function useWebSocketSync(
	userId: string | undefined,
	isOnline: boolean,
	engineRef: RefObject<SyncEngine | null>,
	onSyncNotify?: () => void,
) {
	useWebSocketReconnect(userId, isOnline, engineRef, getWsUrl, onSyncNotify);
}
