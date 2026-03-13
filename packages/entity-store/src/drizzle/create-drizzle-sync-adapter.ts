import type { SyncAdapter, Todo } from "@pengana/sync-engine";
import { isQuotaError, StorageFullError } from "@pengana/sync-engine";
import { and, eq, inArray } from "drizzle-orm";
import type { BaseSQLiteDatabase, SQLiteColumn } from "drizzle-orm/sqlite-core";

export interface DrizzleSyncAdapterConfig {
	db: BaseSQLiteDatabase<"sync" | "async", unknown>;
	/** The entity table — pass the Drizzle table object directly. */
	// biome-ignore lint/suspicious/noExplicitAny: Must accept any Drizzle table shape
	table: any;
	/** The syncMeta table. */
	// biome-ignore lint/suspicious/noExplicitAny: Must accept any Drizzle table shape
	syncMetaTable: any;
	columns: {
		id: SQLiteColumn;
		userId: SQLiteColumn;
		syncStatus: SQLiteColumn;
		updatedAt: SQLiteColumn;
	};
	syncMetaColumns: {
		key: SQLiteColumn;
	};
	syncKeyPrefix: string;
	// biome-ignore lint/suspicious/noExplicitAny: Row shape varies per entity
	toWire: (row: any) => Todo;
	// biome-ignore lint/suspicious/noExplicitAny: Insert shape varies per entity
	toRow: (wire: Todo, syncStatus: string) => any;
}

/**
 * Generic Drizzle SyncAdapter factory.
 *
 * Replaces `createDrizzleSyncAdapter` and `createDrizzleOrgSyncAdapter`.
 */
export function createDrizzleSyncAdapter(
	scopeId: string,
	config: DrizzleSyncAdapterConfig,
): SyncAdapter {
	const {
		db,
		table,
		syncMetaTable,
		columns,
		syncMetaColumns,
		syncKeyPrefix,
		toWire,
		toRow,
	} = config;
	const lastSyncedAtKey = `${syncKeyPrefix}:${scopeId}`;

	return {
		async getPendingChanges(): Promise<Todo[]> {
			const rows = await db
				.select()
				.from(table)
				.where(
					and(eq(columns.userId, scopeId), eq(columns.syncStatus, "pending")),
				);

			return rows.map(toWire);
		},

		async applyServerChanges(
			serverTodos: Todo[],
			conflictIds: string[] = [],
		): Promise<void> {
			const conflictSet = new Set(conflictIds);
			try {
				for (const serverTodo of serverTodos) {
					const [local] = await db
						.select()
						.from(table)
						.where(eq(columns.id, serverTodo.id));

					const isConflict = conflictSet.has(serverTodo.id);
					if (
						!local ||
						(local as { syncStatus: string }).syncStatus !== "pending" ||
						isConflict
					) {
						const syncStatus = isConflict ? "conflict" : "synced";
						await db
							.insert(table)
							.values(toRow(serverTodo, syncStatus))
							.onConflictDoUpdate({
								target: columns.id,
								set: toRow(serverTodo, syncStatus),
							});
					}
				}
			} catch (e) {
				if (isQuotaError(e)) throw new StorageFullError();
				throw e;
			}
		},

		async markAsSynced(pushedItems: Todo[]): Promise<void> {
			for (const item of pushedItems) {
				const [local] = await db
					.select()
					.from(table)
					.where(eq(columns.id, item.id));
				if (
					local &&
					(local as { updatedAt: string }).updatedAt === item.updatedAt
				) {
					await db
						.update(table)
						.set({ syncStatus: "synced" })
						.where(eq(columns.id, item.id));
				}
			}
		},

		async markAsConflict(ids: string[]): Promise<void> {
			if (ids.length === 0) return;
			await db
				.update(table)
				.set({ syncStatus: "conflict" })
				.where(inArray(columns.id, ids));
		},

		async getLastSyncedAt(): Promise<string | null> {
			const [row] = await db
				.select()
				.from(syncMetaTable)
				.where(eq(syncMetaColumns.key, lastSyncedAtKey));
			return (row as { value?: string } | undefined)?.value ?? null;
		},

		async setLastSyncedAt(timestamp: string): Promise<void> {
			await db
				.insert(syncMetaTable)
				.values({ key: lastSyncedAtKey, value: timestamp })
				.onConflictDoUpdate({
					target: syncMetaColumns.key,
					set: { value: timestamp },
				});
		},
	};
}
