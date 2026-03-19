import { createSyncTransport } from "@pengana/sync-client";
import {
	SyncContext,
	SyncDevtoolsContext,
	useSyncEngine,
} from "@pengana/sync-engine";
import { useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import { useNetworkStatus } from "@/features/sync/use-network-status";
import {
	createDrizzleOrgSyncAdapter as createOrgSyncAdapter,
	createDrizzleSyncAdapter as createSyncAdapter,
} from "@/features/todo/entities/todo/adapter";
import { client } from "@/shared/api/orpc";
import { createPlatformDeps } from "./platform-deps";
import { reconcileNativeMedia } from "./reconcile-media";

export {
	useSync,
	useSync as useOrgSync,
	useSyncDevtools,
	useSyncDevtools as useOrgSyncDevtools,
} from "@pengana/sync-engine";

function useAppIsForeground() {
	const [isForeground, setIsForeground] = useState(
		AppState.currentState === "active",
	);

	useEffect(() => {
		const subscription = AppState.addEventListener("change", (nextAppState) => {
			setIsForeground(nextAppState === "active");
		});
		return () => subscription.remove();
	}, []);

	return isForeground;
}

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
	const isForeground = useAppIsForeground();

	const deps = useMemo(
		() =>
			createPlatformDeps(
				(uid) => createSyncAdapter(uid, { syncKeySuffix: organizationId }),
				() =>
					createSyncTransport(
						async (input) =>
							(await client.todo.sync(input, { signal: input.signal })).data,
						reconcileNativeMedia,
					),
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
	(organizationId) => createOrgSyncAdapter(organizationId),
	() =>
		createSyncTransport(async (input) => {
			return (await client.orgTodo.sync(input, { signal: input.signal })).data;
		}, reconcileNativeMedia),
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
	const isForeground = useAppIsForeground();

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
