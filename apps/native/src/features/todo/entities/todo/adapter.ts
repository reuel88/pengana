import { createDrizzleSyncAdapter as createGenericAdapter } from "@pengana/entity-store/drizzle/create-drizzle-sync-adapter";
import type { SyncAdapter, Todo } from "@pengana/sync-engine";

import { appDb } from "./db";
import { syncMeta, todos } from "./schema";

function rowToTodo(row: typeof todos.$inferSelect): Todo {
	return {
		id: row.id,
		title: row.title,
		completed: row.completed,
		updatedAt: row.updatedAt,
		userId: row.userId,
		organizationId: row.organizationId ?? row.userId,
		createdBy: row.createdBy ?? null,
		syncStatus: row.syncStatus,
		deleted: row.deleted,
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
		organizationId: orgTodo.organizationId ?? todo.userId,
		createdBy: orgTodo.createdBy ?? null,
		syncStatus: syncStatus as "synced" | "pending" | "conflict",
		deleted: todo.deleted,
	};
}

function personalToRow(todo: Todo, syncStatus: string) {
	return {
		...todoToRow(todo, syncStatus),
		scopeType: "personal" as const,
	};
}

function orgToRow(todo: Todo, syncStatus: string) {
	return {
		...todoToRow(todo, syncStatus),
		scopeType: "org" as const,
	};
}

const drizzleAdapterConfig = {
	db: appDb,
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
