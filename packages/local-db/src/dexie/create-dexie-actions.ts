import {
	type HLCTimestamp,
	safeParseFieldClocks,
	serializeHlc,
} from "@pengana/sync/core";

import type { SyncableBase } from "../core/define-entity";
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

export interface DexieActionContext {
	db: EntityDatabase;
	tableName: string;
	config: DexieActionsConfig;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function stampFields<TLocal extends SyncableBase>(
	options: {
		tableName: string;
		id: string;
		hlcNow: () => HLCTimestamp;
	},
	existing: TLocal | undefined,
	changedFields: string[],
): { hlcTimestamp: string; fieldClocks: Record<string, string> } {
	const ts = serializeHlc(options.hlcNow());
	const raw = existing?.fieldClocks;
	const existingClocks: Record<string, string> = safeParseFieldClocks(raw);
	const fieldClocks = { ...existingClocks };
	for (const field of changedFields) {
		fieldClocks[field] = ts;
	}
	return { hlcTimestamp: ts, fieldClocks };
}

// ---------------------------------------------------------------------------
// Generic CRUD
// ---------------------------------------------------------------------------

export async function dexieAdd<TLocal extends SyncableBase>(
	db: EntityDatabase,
	tableName: string,
	record: TLocal,
): Promise<void> {
	await db.getTable<TLocal>(tableName).add(record);
}

export async function dexieUpdate<TLocal extends SyncableBase>(
	db: EntityDatabase,
	options: {
		tableName: string;
		id: string;
		hlcNow: () => HLCTimestamp;
	},
	changes: Partial<TLocal>,
): Promise<void> {
	const table = db.getTable<TLocal>(options.tableName);

	const existing = await table.get(options.id);

	const changedFields = Object.keys(changes).filter(
		(k) =>
			k !== "syncStatus" &&
			k !== "updatedAt" &&
			k !== "hlcTimestamp" &&
			k !== "fieldClocks",
	);
	const { hlcTimestamp, fieldClocks } = stampFields(
		options,
		existing,
		changedFields,
	);
	// Dexie's UpdateSpec is strict about known keys on generic types.
	// We know these fields exist on SyncableBase, so the cast is safe.
	await table.update(options.id, {
		...changes,
		updatedAt: new Date().toISOString(),
		hlcTimestamp,
		fieldClocks,
		syncStatus: "pending",
	} as never);
}

export async function dexieSoftDelete<TLocal extends SyncableBase>(
	db: EntityDatabase,
	options: {
		tableName: string;
		id: string;
		hlcNow: () => HLCTimestamp;
	},
): Promise<void> {
	const table = db.getTable<TLocal>(options.tableName);

	const existing = await table.get(options.id);

	const { hlcTimestamp, fieldClocks } = stampFields(options, existing, [
		"deleted",
	]);

	await table.update(options.id, {
		deleted: true,
		updatedAt: new Date().toISOString(),
		hlcTimestamp,
		fieldClocks,
		syncStatus: "pending",
	} as never);
}

export async function dexieResolveConflict<TLocal extends SyncableBase>(
	db: EntityDatabase,
	options: {
		tableName: string;
		id: string;
		hlcNow: () => HLCTimestamp;
		resolution: "local" | "server";
	},
): Promise<void> {
	const table = db.getTable<TLocal>(options.tableName);

	if (options.resolution === "local") {
		const existing = await table.get(options.id);

		const { hlcTimestamp, fieldClocks } = stampFields(options, existing, []);

		await table.update(options.id, {
			updatedAt: new Date().toISOString(),
			hlcTimestamp,
			fieldClocks,
			syncStatus: "pending",
		} as never);
	} else {
		await table.update(options.id, {
			syncStatus: "synced",
		} as never);
	}
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

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
	return {
		add: (record) => dexieAdd(db, tableName, record),
		update: (id, changes) =>
			dexieUpdate(
				db,
				{
					id,
					tableName,
					...config,
				},
				changes,
			),
		softDelete: (id) =>
			dexieSoftDelete(db, {
				id,
				tableName,
				...config,
			}),
		resolveConflict: (id, resolution) =>
			dexieResolveConflict(db, {
				id,
				tableName,
				resolution,
				...config,
			}),
	};
}
