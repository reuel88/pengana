import {
	createDexieSyncAdapter as createGenericAdapter,
	type EntityDatabase,
} from "@pengana/entity-store";
import type { SyncAdapter, Todo } from "@pengana/sync-engine";

import type { WebTodo } from "../lib/db";
import type { TodoConfig } from "../lib/todo-config";

export function createTodoSyncAdapter(
	db: EntityDatabase,
	scopeId: string,
	config: TodoConfig,
	options?: { filter?: (item: WebTodo) => boolean; syncKeySuffix?: string },
): SyncAdapter {
	return createGenericAdapter<WebTodo>(scopeId, {
		db,
		tableName: config.entity.name,
		syncKeyPrefix: config.syncKeyPrefix,
		filter: options?.filter,
		syncKeySuffix: options?.syncKeySuffix,
		toWire: (local: WebTodo): Todo => ({
			id: local.id,
			title: local.title,
			completed: local.completed,
			updatedAt: local.updatedAt,
			userId: local.userId,
			organizationId: local.organizationId,
			createdBy: local.createdBy,
			syncStatus: local.syncStatus,
			deleted: local.deleted,
		}),
		toLocal: (
			wire: Todo,
			existing: WebTodo | undefined,
			syncStatus: "synced" | "conflict",
		): WebTodo => {
			const base: WebTodo = {
				id: wire.id,
				title: wire.title,
				completed: wire.completed,
				updatedAt: wire.updatedAt,
				userId: wire.userId,
				organizationId: wire.organizationId,
				createdBy: wire.createdBy,
				syncStatus,
				deleted: wire.deleted,
				scopeId:
					config.scopeType === "personal" ? wire.userId : wire.organizationId,
				scopeType: config.scopeType,
			};

			if (syncStatus !== "conflict" || !existing) {
				return base;
			}

			// Preserve local dirty fields during conflicts
			return {
				...base,
				title: existing.title,
				completed: existing.completed,
				updatedAt: existing.updatedAt,
				deleted: existing.deleted,
			};
		},
	});
}
