import { SyncContext, SyncDevtoolsContext } from "@pengana/sync-engine";
import { createOrgSyncTransport } from "@pengana/todo-client";
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
	() =>
		createOrgSyncTransport(async (input) => {
			return (await client.orgTodo.sync(input, { signal: input.signal })).data;
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
