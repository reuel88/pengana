import { SyncContext, SyncDevtoolsContext } from "@pengana/sync-engine";
import { createOrgSyncAdapter } from "@/features/todo/entities/todo";
import { client } from "@/shared/api/orpc";
import { createPlatformDeps } from "./platform-deps";
import { useSyncEngine } from "./use-sync-engine";

export {
	useSync as useOrgSync,
	useSyncDevtools as useOrgSyncDevtools,
} from "@pengana/sync-engine";

const orgDeps = createPlatformDeps(
	(organizationId) => createOrgSyncAdapter(organizationId),
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
			const result = (
				await client.orgTodo.sync(orgInput, { signal: input.signal })
			).data;
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
