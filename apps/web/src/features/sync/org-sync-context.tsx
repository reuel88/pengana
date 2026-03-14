import { SyncContext, SyncDevtoolsContext } from "@pengana/sync-engine";
import {
	createDexieOrgSyncAdapter,
	createOrgSyncTransport,
} from "@pengana/todo-client";
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
