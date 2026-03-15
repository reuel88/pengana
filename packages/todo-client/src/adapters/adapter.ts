import {
	createDexieSyncAdapter as createGenericAdapter,
	type EntityDatabase,
} from "@pengana/entity-store";
import type { SyncAdapter, Todo } from "@pengana/sync-engine";

import type { WebTodo } from "../lib/db";

export function createDexieSyncAdapter(
	db: EntityDatabase,
	userId: string,
): SyncAdapter {
	return createGenericAdapter<WebTodo>(userId, {
		db,
		tableName: "todos",
		syncKeyPrefix: "lastSyncedAt",
		toWire: (local: WebTodo): Todo => ({
			id: local.id,
			title: local.title,
			completed: local.completed,
			updatedAt: local.updatedAt,
			userId: local.userId,
			syncStatus: local.syncStatus,
			deleted: local.deleted,
		}),
		toLocal: (
			wire: Todo,
			_existing: WebTodo | undefined,
			syncStatus: "synced" | "conflict",
		): WebTodo => ({
			...wire,
			syncStatus,
		}),
	});
}
