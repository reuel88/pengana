import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";

import type { SyncableBase } from "../define-entity";
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
) {
	const allItems = useLiveQuery(
		() => db.getTable<TLocal>(tableName).where({ userId: scopeId }).toArray(),
		[tableName, scopeId],
		[],
	);

	const items = useMemo(
		() => allItems.filter((item) => !item.deleted),
		[allItems],
	);

	const conflicts = useMemo(
		() => allItems.filter((item) => item.syncStatus === "conflict"),
		[allItems],
	);

	return { items, conflicts };
}
