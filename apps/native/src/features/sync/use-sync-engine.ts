import { env } from "@pengana/env/native";
import { randomUUID } from "expo-crypto";
import { useEffect } from "react";
import { AppState, type AppStateStatus, Platform } from "react-native";

import { authClient } from "@/lib/auth-client";

import { useNetworkStatus } from "./use-network-status";
import {
	type SyncEnginePlatformDeps,
	useSyncEngineCore,
} from "./use-sync-engine.shared";

function getWsUrl() {
	const base = `${env.EXPO_PUBLIC_SERVER_URL.replace(/^http/, "ws")}/ws`;

	if (Platform.OS !== "web") {
		const cookies = authClient.getCookie();
		if (cookies) {
			return `${base}?cookie=${encodeURIComponent(cookies)}`;
		}
	}

	return base;
}

const platformDeps: SyncEnginePlatformDeps = {
	getWsUrl,
	generateUUID: randomUUID,
};

export function useSyncEngine(userId: string | undefined) {
	const { isOnline } = useNetworkStatus();

	const { core, devtools } = useSyncEngineCore(userId, isOnline, platformDeps);

	// Sync when app comes to foreground (e.g. user returns from another device)
	useEffect(() => {
		if (!core.isOnline) return;

		const subscription = AppState.addEventListener(
			"change",
			(nextAppState: AppStateStatus) => {
				if (nextAppState === "active") {
					core.triggerSync();
				}
			},
		);
		return () => subscription.remove();
	}, [core.isOnline, core.triggerSync]);

	return { core, devtools };
}
