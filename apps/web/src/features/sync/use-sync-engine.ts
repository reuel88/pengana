import { useNetworkStatus, useSyncEngineCore } from "@pengana/sync-engine";
import { createDexieSyncAdapter } from "@pengana/todo-client";
import { client } from "@/shared/api/orpc";
import { appDb } from "@/shared/db";

import { createWebPlatformDeps } from "./platform-deps";

const platformDeps = createWebPlatformDeps(
	(userId) => createDexieSyncAdapter(appDb, userId),
	() => ({
		sync: async (input) => (await client.todo.sync(input)).data,
	}),
);

export function useSyncEngine(userId: string | undefined) {
	const { isOnline } = useNetworkStatus();

	return useSyncEngineCore(userId, isOnline, platformDeps);
}
