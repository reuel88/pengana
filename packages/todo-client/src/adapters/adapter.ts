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
): SyncAdapter {
	return createGenericAdapter<WebTodo>(scopeId, {
		db,
		tableName: config.entity.name,
		syncKeyPrefix: config.syncKeyPrefix,
		toWire: (local: WebTodo): Todo => ({
			id: local.id,
			title: local.title,
			completed: local.completed,
			updatedAt: local.updatedAt,
			userId: local.userId,
			organizationId: local.organizationId,
			createdBy: local.createdBy || null,
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
				organizationId:
					(wire as Todo & { organizationId?: string }).organizationId ??
					wire.userId,
				createdBy: (wire as Todo & { createdBy?: string }).createdBy ?? "",
				syncStatus,
				deleted: wire.deleted,
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
