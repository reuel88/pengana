import type { SyncAdapter, Todo } from "@pengana/sync/core";
import {
	createDexieSyncAdapter as createGenericAdapter,
	type EntityDatabase,
} from "../dexie";

import type { LocalTodo } from "./db";
import type { TodoConfig } from "./todo-config";

export function createTodoSyncAdapter(params: {
	db: EntityDatabase;
	scopeId: string;
	config: TodoConfig;
	filter?: (item: LocalTodo) => boolean;
	syncKeySuffix?: string;
}): SyncAdapter {
	const { db, scopeId, config, filter, syncKeySuffix } = params;
	return createGenericAdapter<LocalTodo>(scopeId, {
		db,
		tableName: config.entity.name,
		syncKeyPrefix: config.syncKeyPrefix,
		filter,
		syncKeySuffix,
		toWire: (local: LocalTodo): Todo => ({
			id: local.id,
			title: local.title,
			completed: local.completed,
			updatedAt: local.updatedAt,
			hlcTimestamp: local.hlcTimestamp ?? "",
			fieldClocks: local.fieldClocks ?? {},
			userId: local.userId,
			organizationId: local.organizationId ?? "",
			createdBy: local.createdBy ?? local.userId,
			syncStatus: local.syncStatus,
			deleted: local.deleted,
		}),
		toLocal: (
			wire: Todo,
			existing: LocalTodo | undefined,
			syncStatus: "synced" | "conflict",
		): LocalTodo => {
			const base: LocalTodo = {
				id: wire.id,
				title: wire.title,
				completed: wire.completed,
				updatedAt: wire.updatedAt,
				hlcTimestamp: wire.hlcTimestamp ?? "",
				fieldClocks: wire.fieldClocks ?? {},
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
				hlcTimestamp: existing.hlcTimestamp,
				fieldClocks: existing.fieldClocks,
				deleted: existing.deleted,
			};
		},
	});
}
