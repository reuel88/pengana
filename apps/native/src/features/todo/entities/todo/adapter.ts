import { createDrizzleSyncAdapter as createGenericAdapter } from "@pengana/entity-store/drizzle/create-drizzle-sync-adapter";
import type { SyncAdapter, Todo } from "@pengana/sync/core";

import { appDb, syncMeta, todos } from "@/shared/db";

function rowToTodo(row: typeof todos.$inferSelect): Todo {
	return {
		id: row.id,
		title: row.title,
		completed: row.completed,
		updatedAt: row.updatedAt,
		userId: row.userId,
		organizationId: row.organizationId,
		createdBy: row.createdBy,
		syncStatus: row.syncStatus,
		deleted: row.deleted,
	};
}

function personalToRow(todo: Todo, syncStatus: string) {
	return {
		id: todo.id,
		title: todo.title,
		completed: todo.completed,
		updatedAt: todo.updatedAt,
		userId: todo.userId,
		scopeId: todo.userId,
		organizationId: todo.organizationId,
		createdBy: todo.createdBy,
		syncStatus: syncStatus as "synced" | "pending" | "conflict",
		deleted: todo.deleted,
		scopeType: "personal" as const,
	};
}

function orgToRow(todo: Todo, syncStatus: string) {
	return {
		id: todo.id,
		title: todo.title,
		completed: todo.completed,
		updatedAt: todo.updatedAt,
		userId: todo.userId,
		scopeId: todo.organizationId,
		organizationId: todo.organizationId,
		createdBy: todo.createdBy,
		syncStatus: syncStatus as "synced" | "pending" | "conflict",
		deleted: todo.deleted,
		scopeType: "org" as const,
	};
}

const drizzleAdapterConfig = {
	db: appDb,
	table: todos,
	syncMetaTable: syncMeta,
	columns: {
		id: todos.id,
		scopeId: todos.scopeId,
		syncStatus: todos.syncStatus,
		updatedAt: todos.updatedAt,
	},
	syncMetaColumns: {
		key: syncMeta.key,
	},
	toWire: rowToTodo,
};

export function createDrizzleSyncAdapter(
	userId: string,
	options?: {
		filter?: (item: typeof todos.$inferSelect) => boolean;
		syncKeySuffix?: string;
	},
): SyncAdapter {
	return createGenericAdapter(userId, {
		...drizzleAdapterConfig,
		toRow: personalToRow,
		syncKeyPrefix: "lastSyncedAt",
		filter: options?.filter,
		syncKeySuffix: options?.syncKeySuffix,
	});
}

export function createDrizzleOrgSyncAdapter(
	organizationId: string,
): SyncAdapter {
	return createGenericAdapter(organizationId, {
		...drizzleAdapterConfig,
		toRow: orgToRow,
		syncKeyPrefix: "lastSyncedAt:org",
	});
}
