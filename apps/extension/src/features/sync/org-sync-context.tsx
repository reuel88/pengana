import { SyncContext, SyncDevtoolsContext } from "@pengana/sync-engine";
import { createDexieOrgSyncAdapter } from "@pengana/todo-client";
import { client } from "@/shared/api/orpc";
import { appDb } from "@/shared/db";
import { createExtensionPlatformDeps } from "./platform-deps";
import { useSyncEngine } from "./use-sync-engine";

export {
	useSync as useOrgSync,
	useSyncDevtools as useOrgSyncDevtools,
} from "@pengana/sync-engine";

const orgDeps = createExtensionPlatformDeps(
	(organizationId) => createDexieOrgSyncAdapter(appDb, organizationId),
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

export function OrgSyncProvider({
	organizationId,
	userId,
	children,
}: {
	organizationId: string;
	userId: string;
	children: React.ReactNode;
}) {
	const { core, devtools } = useSyncEngine(organizationId, orgDeps, userId);

	return (
		<SyncContext value={core}>
			<SyncDevtoolsContext value={devtools}>{children}</SyncDevtoolsContext>
		</SyncContext>
	);
}
