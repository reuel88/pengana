import { useNetworkStatus, useSyncEngineCore } from "@pengana/sync-engine";
import { createDexieOrgSyncAdapter } from "@pengana/todo-client";
import { client } from "@/shared/api/orpc";

import { createExtensionPlatformDeps } from "./platform-deps";

const platformDeps = createExtensionPlatformDeps(
	(organizationId) => createDexieOrgSyncAdapter(organizationId),
	() => ({
		sync: async (input) => {
			const orgInput = {
				changes: input.changes.map((change) => ({
					...change,
					organizationId: change.userId,
					createdBy: null as string | null,
				})),
				lastSyncedAt: input.lastSyncedAt,
			};
			const result = (await client.orgTodo.sync(orgInput)).data;
			return {
				...result,
				serverChanges: result.serverChanges.map((change) => ({
					...change,
					userId: change.organizationId,
				})),
			};
		},
	}),
);

export function useOrgSyncEngine(
	organizationId: string | undefined,
	userId: string | undefined,
) {
	const { isOnline } = useNetworkStatus();

	return useSyncEngineCore(
		organizationId,
		isOnline,
		platformDeps,
		true,
		userId,
	);
}
