import { SyncContext, SyncDevtoolsContext } from "@pengana/sync-engine";

import { useOrgSyncEngine } from "./use-org-sync-engine";

export {
	useSync as useOrgSync,
	useSyncDevtools as useOrgSyncDevtools,
} from "@pengana/sync-engine";

export function OrgSyncProvider({
	organizationId,
	children,
}: {
	organizationId: string;
	children: React.ReactNode;
}) {
	const { core, devtools } = useOrgSyncEngine(organizationId);

	return (
		<SyncContext value={core}>
			<SyncDevtoolsContext value={devtools}>{children}</SyncDevtoolsContext>
		</SyncContext>
	);
}
