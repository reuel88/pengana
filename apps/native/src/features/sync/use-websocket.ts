import type { SyncEngine } from "@pengana/sync-engine";
import { useWebSocketReconnect } from "@pengana/sync-engine";
import type { RefObject } from "react";

export function useWebSocket(
	userId: string | undefined,
	effectiveOnline: boolean,
	engineRef: RefObject<SyncEngine | null>,
	getWsUrl: () => string,
	onSyncNotify?: () => void,
) {
	useWebSocketReconnect(
		userId,
		effectiveOnline,
		engineRef,
		getWsUrl,
		onSyncNotify,
	);
}
