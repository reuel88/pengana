import { SyncContext, SyncDevtoolsContext } from "@pengana/sync-engine";
import { createDexieOrgSyncAdapter } from "@pengana/todo-client";
import { client } from "@/shared/api/orpc";
import { appDb } from "@/shared/db";
import { createWebPlatformDeps } from "./platform-deps";
import { useSyncEngine } from "./use-sync-engine";

export {
	useSync as useOrgSync,
	useSyncDevtools as useOrgSyncDevtools,
} from "@pengana/sync-engine";

const orgDeps = createWebPlatformDeps(
	(organizationId) => createDexieOrgSyncAdapter(appDb, organizationId),
	() => ({
		sync: async (input) => {
			const orgInput = {
				changes: input.changes.map((c) => ({
					...c,
					organizationId: c.userId,
					createdBy: null as string | null,
				})),
				lastSyncedAt: input.lastSyncedAt,
			};
			const result = (await client.orgTodo.sync(orgInput)).data;
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
