import {
	createDexieOrgSyncAdapter as _createDexieOrgSyncAdapter,
	createDexieSyncAdapter as _createDexieSyncAdapter,
} from "@pengana/todo-client";

import { appDb } from "./db.web";

export function createDexieSyncAdapter(userId: string) {
	return _createDexieSyncAdapter(appDb, userId);
}

export function createDexieOrgSyncAdapter(organizationId: string) {
	return _createDexieOrgSyncAdapter(appDb, organizationId);
}
