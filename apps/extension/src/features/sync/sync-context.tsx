import { SyncContext, SyncDevtoolsContext } from "@pengana/sync-engine";
import {
	createDexieSyncAdapter,
	createPersonalSyncTransport,
	reconcileMedia,
} from "@pengana/todo-client";
import { client } from "@/shared/api/orpc";
import { appDb } from "@/shared/db";
import { createExtensionPlatformDeps } from "./platform-deps";
import { useSyncEngine } from "./use-sync-engine";

export { useSync, useSyncDevtools } from "@pengana/sync-engine";

const personalDeps = createExtensionPlatformDeps(
	(userId) => createDexieSyncAdapter(appDb, userId),
	() =>
		createPersonalSyncTransport(
			async (input) =>
				(await client.todo.sync(input, { signal: input.signal })).data,
			(media, entityIds) => reconcileMedia(appDb, media, entityIds),
		),
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
