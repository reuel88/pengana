import { env } from "@pengana/env/native";
import {
	type SyncEnginePlatformDeps,
	useSyncEngineCore,
} from "@pengana/sync-engine";
import { randomUUID } from "expo-crypto";
import { AppState, Platform } from "react-native";
import { createSyncAdapter } from "@/entities/todo";
import {
	createUploadAdapter,
	createUploadTransport,
} from "@/entities/upload-queue";
import { authClient } from "@/lib/auth-client";
import { createNativeStorageHealthProvider } from "@/lib/storage-health";
import { client } from "@/utils/orpc";
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
