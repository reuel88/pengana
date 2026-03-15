import { createSyncTransport } from "@pengana/sync-client";
import { SyncContext, SyncDevtoolsContext } from "@pengana/sync-engine";
import {
	createTodoSyncAdapter,
	personalTodoConfig,
} from "@pengana/todo-client";
import { reconcileMedia } from "@pengana/upload-client";
import { appDb } from "@/features/todo/entities/todo";
import { client } from "@/shared/api/orpc";
import { createPlatformDeps } from "./platform-deps";
import { useSyncEngine } from "./use-sync-engine";

export { useSync, useSyncDevtools } from "@pengana/sync-engine";

const personalDeps = createPlatformDeps(
	(userId) => createTodoSyncAdapter(appDb, userId, personalTodoConfig),
	() =>
		createSyncTransport(
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
