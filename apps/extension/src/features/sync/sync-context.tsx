import { createSyncTransport } from "@pengana/sync-client";
import {
	createSyncProviders,
	SyncContext,
	SyncDevtoolsContext,
	useSyncEngine,
} from "@pengana/sync-engine";
import {
	createTodoSyncAdapter,
	orgTodoConfig,
	personalTodoConfig,
} from "@pengana/todo-client";
import { reconcileMedia } from "@pengana/upload-client";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { client } from "@/shared/api/orpc";
import { appDb } from "@/shared/db";
import { createExtensionPlatformDeps } from "./platform-deps";

export {
	useSync,
	useSync as useOrgSync,
	useSyncDevtools,
	useSyncDevtools as useOrgSyncDevtools,
} from "@pengana/sync-engine";

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
	children: ReactNode;
}) {
	const deps = useMemo(
		() =>
			createExtensionPlatformDeps(
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

const orgDeps = createExtensionPlatformDeps(
	(organizationId) =>
		createTodoSyncAdapter(appDb, organizationId, orgTodoConfig),
	() =>
		createSyncTransport(
			async (input) => {
				return (await client.orgTodo.sync(input, { signal: input.signal }))
					.data;
			},
			(media, entityIds) => reconcileMedia(appDb, media, entityIds),
		),
);

const orgProviders = createSyncProviders(orgDeps, orgDeps);

export const OrgSyncProvider = orgProviders.OrgSyncProvider;
