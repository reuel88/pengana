import { createDrizzleSyncAdapter as createGenericAdapter } from "@pengana/entity-store/drizzle/create-drizzle-sync-adapter";
import type { SyncAdapter, Todo } from "@pengana/sync-engine";

import { db } from "./db";
import { syncMeta, todos } from "./schema";

function rowToTodo(row: typeof todos.$inferSelect): Todo {
	return {
		id: row.id,
		title: row.title,
		completed: row.completed,
		updatedAt: row.updatedAt,
		userId: row.userId,
		syncStatus: row.syncStatus,
		deleted: row.deleted,
		attachmentUrl: row.attachmentUrl ?? null,
	};
}

function todoToRow(todo: Todo, syncStatus: string) {
	const orgTodo = todo as Todo & {
		organizationId?: string | null;
		createdBy?: string | null;
	};

	return {
		id: todo.id,
		title: todo.title,
		completed: todo.completed,
		updatedAt: todo.updatedAt,
		userId: todo.userId,
		organizationId: orgTodo.organizationId ?? null,
		createdBy: orgTodo.createdBy ?? null,
		syncStatus: syncStatus as "synced" | "pending" | "conflict",
		deleted: todo.deleted,
		attachmentUrl: todo.attachmentUrl ?? null,
	};
}

const drizzleAdapterConfig = {
	db,
	table: todos,
	syncMetaTable: syncMeta,
	columns: {
		id: todos.id,
		userId: todos.userId,
		syncStatus: todos.syncStatus,
		updatedAt: todos.updatedAt,
	},
	syncMetaColumns: {
		key: syncMeta.key,
	},
	toWire: rowToTodo,
	toRow: todoToRow,
};

export function createDrizzleSyncAdapter(userId: string): SyncAdapter {
	return createGenericAdapter(userId, {
		...drizzleAdapterConfig,
		syncKeyPrefix: "lastSyncedAt",
	});
}

export function createDrizzleOrgSyncAdapter(
	organizationId: string,
): SyncAdapter {
	return createGenericAdapter(organizationId, {
		...drizzleAdapterConfig,
		syncKeyPrefix: "lastSyncedAt:org",
	});
}
