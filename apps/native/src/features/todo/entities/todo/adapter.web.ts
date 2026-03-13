import {
	createDexieOrgSyncAdapter as _createDexieOrgSyncAdapter,
	createDexieSyncAdapter as _createDexieSyncAdapter,
} from "@pengana/todo-client";

import { todoDb } from "./db.web";

export function createDexieSyncAdapter(userId: string) {
	return _createDexieSyncAdapter(todoDb, userId);
}

export function createDexieOrgSyncAdapter(organizationId: string) {
	return _createDexieOrgSyncAdapter(todoDb, organizationId);
}
