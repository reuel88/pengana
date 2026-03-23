import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";

import type { SyncableBase } from "../core/define-entity";
import type { EntityDatabase } from "../dexie/entity-database";

/**
 * Generic reactive hook for Dexie entities.
 *
 * Filters by scope (userId), separates active vs conflict items,
 * and excludes soft-deleted records from the active list.
 */
export function useDexieEntity<TLocal extends SyncableBase>(
	db: EntityDatabase,
	tableName: string,
	scopeId: string,
	filter?: (item: TLocal) => boolean,
) {
	const allItems = useLiveQuery(
		() => {
			const query = db.getTable<TLocal>(tableName).where({ scopeId: scopeId });
			if (filter) return query.filter(filter).toArray();
			return query.toArray();
		},
		[db, tableName, scopeId, filter],
		[],
	);

	const items = useMemo(
		() =>
			allItems.filter(
				(item) => !item.deleted && item.syncStatus !== "conflict",
			),
		[allItems],
	);

	const conflicts = useMemo(
		() => allItems.filter((item) => item.syncStatus === "conflict"),
		[allItems],
	);

	return { items, conflicts };
}
