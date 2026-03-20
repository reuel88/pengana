import { createSyncTransport } from "@pengana/sync-client";
import {
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
import { useEffect, useMemo, useState } from "react";
import { useNetworkStatus } from "@/features/sync/use-network-status";
import { client } from "@/shared/api/orpc";
import { appDb } from "@/shared/db";
import { createPlatformDeps } from "./platform-deps";

export {
	useSync,
	useSync as useOrgSync,
	useSyncDevtools,
	useSyncDevtools as useOrgSyncDevtools,
} from "@pengana/sync-engine";

function useDocumentVisible() {
	const [isVisible, setIsVisible] = useState(
		document.visibilityState === "visible",
	);

	useEffect(() => {
		const handleVisibilityChange = () => {
			setIsVisible(document.visibilityState === "visible");
		};
		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () =>
			document.removeEventListener("visibilitychange", handleVisibilityChange);
	}, []);

	return isVisible;
}

const personalTransportFactory = () =>
	createSyncTransport(
		async (input) =>
			(await client.todo.sync(input, { signal: input.signal })).data,
		(media, attachments, entityIds) =>
			reconcileMedia(appDb, media, attachments, entityIds),
	);

export function SyncProvider({
	userId,
	organizationId,
	children,
}: {
	userId: string;
	organizationId: string;
	children: React.ReactNode;
}) {
	const { isOnline } = useNetworkStatus();
	const isForeground = useDocumentVisible();

	const deps = useMemo(
		() =>
			createPlatformDeps(
				(uid) =>
					createTodoSyncAdapter(appDb, uid, personalTodoConfig, {
						filter: (todo) => todo.organizationId === organizationId,
						syncKeySuffix: organizationId,
					}),
				personalTransportFactory,
			),
		[organizationId],
	);

	const { core, devtools } = useSyncEngine({
		isOnline,
		scopeId: userId,
		deps,
		isForeground,
	});

	return (
		<SyncContext value={core}>
			<SyncDevtoolsContext value={devtools}>{children}</SyncDevtoolsContext>
		</SyncContext>
	);
}

const orgDeps = createPlatformDeps(
	(organizationId) =>
		createTodoSyncAdapter(appDb, organizationId, orgTodoConfig),
	() =>
		createSyncTransport(
			async (input) => {
				return (await client.orgTodo.sync(input, { signal: input.signal }))
					.data;
			},
			(media, attachments, entityIds) =>
				reconcileMedia(appDb, media, attachments, entityIds),
		),
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
	const { isOnline } = useNetworkStatus();
	const isForeground = useDocumentVisible();

	const { core, devtools } = useSyncEngine({
		isOnline,
		scopeId: organizationId,
		deps: orgDeps,
		notifyKey: userId,
		isForeground,
	});

	return (
		<SyncContext value={core}>
			<SyncDevtoolsContext value={devtools}>{children}</SyncDevtoolsContext>
		</SyncContext>
	);
}
