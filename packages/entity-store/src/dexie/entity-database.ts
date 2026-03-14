import Dexie, { type EntityTable, type Table } from "dexie";

import type { EntityDefinition } from "../define-entity";

export interface RawStoreDefinition {
	name: string;
	indexes: string;
}

interface SyncMeta {
	key: string;
	value: string;
}

/**
 * Generic Dexie database that replaces entity-specific database classes.
 *
 * Usage:
 *   const db = new EntityDatabase("AppDatabase");
 *   db.applySchema(1, [todoEntity]);
 *   db.applySchema(2, [todoEntity]); // version bump for non-indexed column changes
 *   db.applySchema(3, [todoEntity, orgTodoEntity]); // add new entity table
 */
export class EntityDatabase extends Dexie {
	syncMeta!: EntityTable<SyncMeta, "key">;

	/**
	 * Register a Dexie version with the given entities.
	 * The syncMeta table is always included automatically.
	 *
	 * Version bumping remains manual — Dexie versions are a browser contract
	 * and should be explicitly controlled by the developer.
	 */
	applySchema(
		version: number,
		entities: EntityDefinition[],
		rawStores?: RawStoreDefinition[],
	): this {
		const stores: Record<string, string> = { syncMeta: "key" };
		for (const entity of entities) {
			stores[entity.name] = entity.indexes;
		}
		if (rawStores) {
			for (const raw of rawStores) {
				stores[raw.name] = raw.indexes;
			}
		}
		this.version(version).stores(stores);
		return this;
	}

	/** Get a typed table reference for an entity. */
	getTable<T>(name: string): Table<T, string> {
		return this.table(name) as Table<T, string>;
	}
}
