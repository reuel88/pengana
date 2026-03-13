import type { SyncableBase } from "../define-entity";
import type { EntityDatabase } from "./entity-database";

export interface DexieActions<TLocal extends SyncableBase> {
	add(record: TLocal): Promise<void>;
	update(id: string, changes: Partial<TLocal>): Promise<void>;
	softDelete(id: string): Promise<void>;
	resolveConflict(id: string, resolution: "local" | "server"): Promise<void>;
}

/**
 * Generic CRUD action factory for Dexie entities.
 *
 * All mutations auto-set `syncStatus: "pending"` and a fresh `updatedAt`.
 * Entity-specific actions (e.g. `toggleTodo`) should be written as thin wrappers
 * using the `update()` method.
 */
export function createDexieActions<TLocal extends SyncableBase>(
	db: EntityDatabase,
	tableName: string,
): DexieActions<TLocal> {
	const table = db.getTable<TLocal>(tableName);

	// Dexie's UpdateSpec is strict about known keys on generic types.
	// We know these fields exist on SyncableBase, so the cast is safe.
	const doUpdate = (id: string, changes: Record<string, unknown>) =>
		table.update(id, changes as never);

	return {
		async add(record: TLocal): Promise<void> {
			await table.add(record);
		},

		async update(id: string, changes: Partial<TLocal>): Promise<void> {
			await doUpdate(id, {
				...changes,
				updatedAt: new Date().toISOString(),
				syncStatus: "pending",
			});
		},

		async softDelete(id: string): Promise<void> {
			await doUpdate(id, {
				deleted: true,
				updatedAt: new Date().toISOString(),
				syncStatus: "pending",
			});
		},

		async resolveConflict(
			id: string,
			resolution: "local" | "server",
		): Promise<void> {
			if (resolution === "local") {
				await doUpdate(id, {
					updatedAt: new Date().toISOString(),
					syncStatus: "pending",
				});
			} else {
				await doUpdate(id, {
					syncStatus: "synced",
				});
			}
		},
	};
}
