import { useNetworkStatus, useSyncEngineCore } from "@pengana/sync-engine";
import { createDexieOrgSyncAdapter } from "@pengana/todo-client";
import { client } from "@/shared/api/orpc";

import { createWebPlatformDeps } from "./platform-deps";

const orgPlatformDeps = createWebPlatformDeps(
	(organizationId) => createDexieOrgSyncAdapter(organizationId),
	() => ({
		sync: async (input) => {
			// Map from sync engine's Todo shape (userId) to OrgTodo shape (organizationId/createdBy)
			const orgInput = {
				changes: input.changes.map((c) => ({
					...c,
					organizationId: c.userId,
					createdBy: null as string | null,
				})),
				lastSyncedAt: input.lastSyncedAt,
			};
			const result = (await client.orgTodo.sync(orgInput)).data;
			// Map back from OrgTodo shape to sync engine's Todo shape
			return {
				...result,
				serverChanges: result.serverChanges.map((s) => ({
					...s,
					userId: s.organizationId,
				})),
			};
		},
	}),
);

export function useOrgSyncEngine(organizationId: string | undefined) {
	const { isOnline } = useNetworkStatus();

	return useSyncEngineCore(organizationId, isOnline, orgPlatformDeps);
}
