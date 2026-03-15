import {
	createTodoSyncAdapter,
	orgTodoConfig,
	personalTodoConfig,
} from "@pengana/todo-client";

import { appDb } from "./db.web";

export function createDexieSyncAdapter(userId: string) {
	return createTodoSyncAdapter(appDb, userId, personalTodoConfig);
}

export function createDexieOrgSyncAdapter(organizationId: string) {
	return createTodoSyncAdapter(appDb, organizationId, orgTodoConfig);
}
