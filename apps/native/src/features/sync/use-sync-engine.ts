import { env } from "@pengana/env/native";
import {
	type SyncEnginePlatformDeps,
	useSyncEngineCore,
} from "@pengana/sync-engine";
import { randomUUID } from "expo-crypto";
import { AppState, Platform } from "react-native";
import {
	createUploadAdapter,
	createUploadTransport,
} from "@/features/sync/entities/upload-queue";
import { createSyncAdapter } from "@/features/todo/entities/todo";
import { client } from "@/shared/api/orpc";
import { authClient } from "@/shared/lib/auth-client";
import { createNativeStorageHealthProvider } from "@/shared/lib/storage-health";
import { useNetworkStatus } from "./use-network-status";

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
	createSyncAdapter: (userId) => createSyncAdapter(userId),
	createSyncTransport: () => ({
		sync: async (input) => (await client.todo.sync(input)).data,
	}),
	createUploadAdapter,
	createUploadTransport,
	onFocusSubscribe: (triggerSync) => {
		const subscription = AppState.addEventListener("change", (nextAppState) => {
			if (nextAppState === "active") triggerSync();
		});
		return () => subscription.remove();
	},
	storageHealth: createNativeStorageHealthProvider(),
};

export function useSyncEngine(userId: string | undefined) {
	const { isOnline } = useNetworkStatus();

	return useSyncEngineCore(userId, isOnline, platformDeps);
}
