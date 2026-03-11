import { SyncContext } from "@pengana/sync-engine";

import { useSyncEngine } from "./use-sync-engine";

export { useSync, useSyncDevtools } from "@pengana/sync-engine";

export function SyncProvider({
	userId,
	children,
}: {
	userId: string;
	children: React.ReactNode;
}) {
	const { core } = useSyncEngine(userId);

	return <SyncContext value={core}>{children}</SyncContext>;
}
