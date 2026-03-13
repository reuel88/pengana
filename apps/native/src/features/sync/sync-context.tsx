import { SyncContext, SyncDevtoolsContext } from "@pengana/sync-engine";
import { createSyncAdapter } from "@/features/todo/entities/todo";
import { client } from "@/shared/api/orpc";
import { createPlatformDeps } from "./platform-deps";
import { useSyncEngine } from "./use-sync-engine";

export { useSync, useSyncDevtools } from "@pengana/sync-engine";

const personalDeps = createPlatformDeps(
	(userId) => createSyncAdapter(userId),
	() => ({
		sync: async (input) => (await client.todo.sync(input)).data,
	}),
);

export function SyncProvider({
	userId,
	children,
}: {
	userId: string;
	children: React.ReactNode;
}) {
	const { core, devtools } = useSyncEngine(userId, personalDeps);

	return (
		<SyncContext value={core}>
			<SyncDevtoolsContext value={devtools}>{children}</SyncDevtoolsContext>
		</SyncContext>
	);
}
