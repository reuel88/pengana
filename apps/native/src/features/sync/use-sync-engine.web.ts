import { useNetworkStatus } from "@pengana/sync-engine";
import { getServerUrl } from "@/lib/server-url";

import {
	type SyncEnginePlatformDeps,
	useSyncEngineCore,
} from "./use-sync-engine.shared";

function getWsUrl() {
	return `${getServerUrl().replace(/^http/, "ws")}/ws`;
}

const platformDeps: SyncEnginePlatformDeps = {
	getWsUrl,
	generateUUID: () => crypto.randomUUID(),
};

export function useSyncEngine(userId: string | undefined) {
	const { isOnline } = useNetworkStatus();

	return useSyncEngineCore(userId, isOnline, platformDeps);
}
