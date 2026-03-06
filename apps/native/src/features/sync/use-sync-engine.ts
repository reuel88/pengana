import { env } from "@pengana/env/native";
import { randomUUID } from "expo-crypto";
import * as Network from "expo-network";
import { useEffect, useState } from "react";
import { AppState, type AppStateStatus, Platform } from "react-native";

import { authClient } from "@/lib/auth-client";

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
	const [isOnline, setIsOnline] = useState(true);

	// Network connectivity listener
	useEffect(() => {
		Network.getNetworkStateAsync().then((state) => {
			setIsOnline(state.isConnected ?? true);
		});

		const subscription = Network.addNetworkStateListener((state) => {
			setIsOnline(state.isConnected ?? false);
		});

		return () => {
			subscription.remove();
		};
	}, []);

	const result = useSyncEngineCore(userId, isOnline, platformDeps);

	// Sync when app comes to foreground (e.g. user returns from another device)
	useEffect(() => {
		if (!result.isOnline) return;

		const subscription = AppState.addEventListener(
			"change",
			(nextAppState: AppStateStatus) => {
				if (nextAppState === "active") {
					result.triggerSync();
				}
			},
		);
		return () => subscription.remove();
	}, [result.isOnline, result.triggerSync]);

	return result;
}
