import { useEffect, useState } from "react";

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
	const [isOnline, setIsOnline] = useState(navigator.onLine);

	// Network connectivity listener using browser APIs
	useEffect(() => {
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	return useSyncEngineCore(userId, isOnline, platformDeps);
}
