import { createSyncTransport } from "@pengana/sync-client";
import { SyncContext, SyncDevtoolsContext } from "@pengana/sync-engine";
import {
	createTodoSyncAdapter,
	personalTodoConfig,
} from "@pengana/todo-client";
import { reconcileMedia } from "@pengana/upload-client";
import { useMemo } from "react";
import { appDb } from "@/features/todo/entities/todo";
import { client } from "@/shared/api/orpc";
import { createPlatformDeps } from "./platform-deps";
import { useSyncEngine } from "./use-sync-engine";

export { useSync, useSyncDevtools } from "@pengana/sync-engine";

const personalTransportFactory = () =>
	createSyncTransport(
		async (input) =>
			(await client.todo.sync(input, { signal: input.signal })).data,
		(media, entityIds) => reconcileMedia(appDb, media, entityIds),
	);

export function SyncProvider({
	userId,
	organizationId,
	children,
}: {
	userId: string;
	organizationId?: string;
	children: React.ReactNode;
}) {
	const deps = useMemo(
		() =>
			createPlatformDeps(
				(uid) =>
					createTodoSyncAdapter(
						appDb,
						uid,
						personalTodoConfig,
						organizationId
							? {
									filter: (todo) => todo.organizationId === organizationId,
									syncKeySuffix: organizationId,
								}
							: undefined,
					),
				personalTransportFactory,
			),
		[organizationId],
	);

	const { core, devtools } = useSyncEngine(userId, deps);

	return (
		<SyncContext value={core}>
			<SyncDevtoolsContext value={devtools}>{children}</SyncDevtoolsContext>
		</SyncContext>
	);
}
