import type { SyncAdapter, Todo } from "@pengana/sync-engine";
import { isQuotaError, StorageFullError } from "@pengana/sync-engine";

import type { EntityDatabase } from "./entity-database";

export interface DexieSyncAdapterConfig<TLocal> {
	/** The EntityDatabase instance. */
	db: EntityDatabase;
	/** The Dexie table name for the entity. */
	tableName: string;
	/** Prefix for the syncMeta key (e.g. "lastSyncedAt" → key becomes "lastSyncedAt:${scopeId}"). */
	syncKeyPrefix: string;
	/** Convert a local record to a wire (2do) record for pushing to the server. */
	toWire: (local: TLocal) => Todo;
	/** Convert a server (2do) record to a local record for storing in Dexie. */
	toLocal: (
		wire: Todo,
		existing: TLocal | undefined,
		syncStatus: "synced" | "conflict",
	) => TLocal;
}

/**
 * Generic Dexie SyncAdapter factory.
 *
 * Creates a SyncAdapter that operates on any entity table in an EntityDatabase.
 * Replaces entity-specific adapter functions like `createDexieSyncAdapter` and `createDexieOrgSyncAdapter`.
 */
export function createDexieSyncAdapter<TLocal>(
	scopeId: string,
	config: DexieSyncAdapterConfig<TLocal>,
): SyncAdapter {
	const table = config.db.getTable<TLocal>(config.tableName);

	// Dexie's UpdateSpec is strict about known keys on generic types — safe cast.
	const doUpdate = (id: string, changes: Record<string, unknown>) =>
		table.update(id, changes as never);

	return {
		async getPendingChanges(): Promise<Todo[]> {
			const rows = await table
				.where({ userId: scopeId, syncStatus: "pending" })
				.toArray();
			return rows.map(config.toWire);
		},

		async applyServerChanges(
			todos: Todo[],
			conflictIds: string[] = [],
		): Promise<void> {
			const conflictSet = new Set(conflictIds);
			try {
				await config.db.transaction("rw", table, async () => {
					for (const serverTodo of todos) {
						const local = await table.get(serverTodo.id);
						const isConflict = conflictSet.has(serverTodo.id);
						if (
							!local ||
							(local as { syncStatus?: string }).syncStatus !== "pending" ||
							isConflict
						) {
							const syncStatus = isConflict
								? ("conflict" as const)
								: ("synced" as const);
							await table.put(config.toLocal(serverTodo, local, syncStatus));
						}
					}
				});
			} catch (e) {
				if (isQuotaError(e)) throw new StorageFullError();
				throw e;
			}
		},

		async markAsSynced(pushedItems: Todo[]): Promise<void> {
			await config.db.transaction("rw", table, async () => {
				for (const item of pushedItems) {
					const local = await table.get(item.id);
					if (
						local &&
						(local as { updatedAt?: string }).updatedAt === item.updatedAt
					) {
						await doUpdate(item.id, { syncStatus: "synced" });
					}
				}
			});
		},

		async markAsConflict(ids: string[]): Promise<void> {
			await config.db.transaction("rw", table, async () => {
				for (const id of ids) {
					await doUpdate(id, { syncStatus: "conflict" });
				}
			});
		},

		async getLastSyncedAt(): Promise<string | null> {
			const meta = await config.db.syncMeta.get(
				`${config.syncKeyPrefix}:${scopeId}`,
			);
			return meta?.value ?? null;
		},

		async setLastSyncedAt(timestamp: string): Promise<void> {
			await config.db.syncMeta.put({
				key: `${config.syncKeyPrefix}:${scopeId}`,
				value: timestamp,
			});
		},
	};
}
