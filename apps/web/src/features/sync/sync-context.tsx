import { SyncContext, SyncDevtoolsContext } from "@pengana/sync-engine";
import { createDexieSyncAdapter } from "@pengana/todo-client";
import { client } from "@/shared/api/orpc";
import { appDb } from "@/shared/db";
import { createWebPlatformDeps } from "./platform-deps";
import { useSyncEngine } from "./use-sync-engine";

export { useSync, useSyncDevtools } from "@pengana/sync-engine";

const personalDeps = createWebPlatformDeps(
	(userId) => createDexieSyncAdapter(appDb, userId),
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
