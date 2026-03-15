import { createSyncTransport } from "@pengana/sync-client";
import { createSyncProviders } from "@pengana/sync-engine";
import {
	createTodoSyncAdapter,
	orgTodoConfig,
	personalTodoConfig,
} from "@pengana/todo-client";
import { reconcileMedia } from "@pengana/upload-client";
import { client } from "@/shared/api/orpc";
import { appDb } from "@/shared/db";
import { createExtensionPlatformDeps } from "./platform-deps";

export {
	useSync,
	useSync as useOrgSync,
	useSyncDevtools,
	useSyncDevtools as useOrgSyncDevtools,
} from "@pengana/sync-engine";

const personalDeps = createExtensionPlatformDeps(
	(userId) => createTodoSyncAdapter(appDb, userId, personalTodoConfig),
	() =>
		createSyncTransport(
			async (input) =>
				(await client.todo.sync(input, { signal: input.signal })).data,
			(media, entityIds) => reconcileMedia(appDb, media, entityIds),
		),
);

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

export const { SyncProvider, OrgSyncProvider } = createSyncProviders(
	personalDeps,
	orgDeps,
);
