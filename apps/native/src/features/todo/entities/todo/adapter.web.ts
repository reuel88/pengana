import {
	createTodoSyncAdapter,
	orgTodoConfig,
	personalTodoConfig,
} from "@pengana/local-db/todo";

import { appDb } from "@/shared/db";

export function createDexieSyncAdapter(userId: string) {
	return createTodoSyncAdapter({
		db: appDb,
		scopeId: userId,
		config: personalTodoConfig,
	});
}

export function createDexieOrgSyncAdapter(organizationId: string) {
	return createTodoSyncAdapter({
		db: appDb,
		scopeId: organizationId,
		config: orgTodoConfig,
	});
}
