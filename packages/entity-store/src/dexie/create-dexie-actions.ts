import { type HLCTimestamp, serializeHlc } from "@pengana/sync/core";

import type { SyncableBase } from "../define-entity";
import type { EntityDatabase } from "./entity-database";

export interface DexieActions<TLocal extends SyncableBase> {
	add(record: TLocal): Promise<void>;
	update(id: string, changes: Partial<TLocal>): Promise<void>;
	softDelete(id: string): Promise<void>;
	resolveConflict(id: string, resolution: "local" | "server"): Promise<void>;
}

export interface DexieActionsConfig {
	/** Generate an HLC timestamp for the current mutation. */
	hlcNow: () => HLCTimestamp;
}

/**
 * Generic CRUD action factory for Dexie entities.
 *
 * All mutations auto-set `syncStatus: "pending"`, a fresh `updatedAt`,
 * an HLC timestamp, and per-field clocks for changed fields.
 */
export function createDexieActions<TLocal extends SyncableBase>(
	db: EntityDatabase,
	tableName: string,
	config: DexieActionsConfig,
): DexieActions<TLocal> {
	const table = db.getTable<TLocal>(tableName);

	// Dexie's UpdateSpec is strict about known keys on generic types.
	// We know these fields exist on SyncableBase, so the cast is safe.
	const doUpdate = (id: string, changes: Record<string, unknown>) =>
		table.update(id, changes as never);

	function stampFields(
		existing: TLocal | undefined,
		changedFields: string[],
	): { hlcTimestamp: string; fieldClocks: Record<string, string> } {
		const ts = serializeHlc(config.hlcNow());
		const raw = existing?.fieldClocks;
		const existingClocks: Record<string, string> =
			typeof raw === "string" ? JSON.parse(raw) : (raw ?? {});
		const fieldClocks = { ...existingClocks };
		for (const field of changedFields) {
			fieldClocks[field] = ts;
		}
		return { hlcTimestamp: ts, fieldClocks };
	}

	return {
		async add(record: TLocal): Promise<void> {
			await table.add(record);
		},

		async update(id: string, changes: Partial<TLocal>): Promise<void> {
			const existing = await table.get(id);
			const changedFields = Object.keys(changes).filter(
				(k) =>
					k !== "syncStatus" &&
					k !== "updatedAt" &&
					k !== "hlcTimestamp" &&
					k !== "fieldClocks",
			);
			const { hlcTimestamp, fieldClocks } = stampFields(
				existing,
				changedFields,
			);
			await doUpdate(id, {
				...changes,
				updatedAt: new Date().toISOString(),
				hlcTimestamp,
				fieldClocks,
				syncStatus: "pending",
			});
		},

		async softDelete(id: string): Promise<void> {
			const existing = await table.get(id);
			const { hlcTimestamp, fieldClocks } = stampFields(existing, ["deleted"]);
			await doUpdate(id, {
				deleted: true,
				updatedAt: new Date().toISOString(),
				hlcTimestamp,
				fieldClocks,
				syncStatus: "pending",
			});
		},

		async resolveConflict(
			id: string,
			resolution: "local" | "server",
		): Promise<void> {
			if (resolution === "local") {
				const existing = await table.get(id);
				const { hlcTimestamp, fieldClocks } = stampFields(existing, []);
				await doUpdate(id, {
					updatedAt: new Date().toISOString(),
					hlcTimestamp,
					fieldClocks,
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
