import { createSyncTransport } from "@pengana/sync-client";
import {
	SyncContext,
	SyncDevtoolsContext,
	useNetworkStatus,
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

export function SyncProvider({
	userId,
	organizationId,
	children,
}: {
	userId: string;
	organizationId: string;
	children: ReactNode;
}) {
	const deps = useMemo(
		() =>
			createExtensionPlatformDeps(
				(uid) =>
					createTodoSyncAdapter(appDb, uid, personalTodoConfig, {
						filter: (todo) => todo.organizationId === organizationId,
						syncKeySuffix: organizationId,
					}),
				() =>
					createSyncTransport(
						async (input) =>
							(await client.todo.sync(input, { signal: input.signal })).data,
						(media, attachments, entityIds) =>
							reconcileMedia(appDb, media, attachments, entityIds),
					),
			),
		[organizationId],
	);
	const { isOnline } = useNetworkStatus();

	const { core, devtools } = useSyncEngine({ scopeId: userId, isOnline, deps });

	return (
		<SyncContext value={core}>
			<SyncDevtoolsContext value={devtools}>{children}</SyncDevtoolsContext>
		</SyncContext>
	);
}

export function OrgSyncProvider({
	organizationId,
	children,
}: {
	userId: string;
	organizationId: string;
	children: ReactNode;
}) {
	const orgDeps = useMemo(
		() =>
			createExtensionPlatformDeps(
				(organizationId) =>
					createTodoSyncAdapter(appDb, organizationId, orgTodoConfig),
				() =>
					createSyncTransport(
						async (input) => {
							return (
								await client.orgTodo.sync(input, { signal: input.signal })
							).data;
						},
						(media, attachments, entityIds) =>
							reconcileMedia(appDb, media, attachments, entityIds),
					),
			),
		[],
	);
	const { isOnline } = useNetworkStatus();

	const { core, devtools } = useSyncEngine({
		scopeId: organizationId,
		isOnline,
		deps: orgDeps,
	});

	return (
		<SyncContext value={core}>
			<SyncDevtoolsContext value={devtools}>{children}</SyncDevtoolsContext>
		</SyncContext>
	);
}
