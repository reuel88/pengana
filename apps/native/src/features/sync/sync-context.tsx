import { createSyncTransport } from "@pengana/sync-client";
import { SyncContext, SyncDevtoolsContext } from "@pengana/sync-engine";
import { useMemo } from "react";
import { createSyncAdapter } from "@/features/todo/entities/todo";
import { client } from "@/shared/api/orpc";
import { createPlatformDeps } from "./platform-deps";
import { reconcileNativeMedia } from "./reconcile-media";
import { useSyncEngine } from "./use-sync-engine";

export { useSync, useSyncDevtools } from "@pengana/sync-engine";

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
					createSyncAdapter(
						uid,
						organizationId ? { syncKeySuffix: organizationId } : undefined,
					),
				() =>
					createSyncTransport(
						async (input) =>
							(await client.todo.sync(input, { signal: input.signal })).data,
						reconcileNativeMedia,
					),
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
