import { eq } from "drizzle-orm";
import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import type { SQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";
import { useMemo } from "react";

import type { SyncableBase } from "../define-entity";

/** Any SQLite table that has the syncable base columns. */
type SyncableTable = SQLiteTable & {
	scopeId: SQLiteColumn;
};

/**
 * Generic reactive hook for Drizzle/expo-sqlite entities.
 *
 * Filters by scope (userId), separates active vs conflict items,
 * and excludes soft-deleted records from the active list.
 *
 * NOTE: Not exported from the barrel — import via
 * `@pengana/entity-store/hooks/use-drizzle-entity` to avoid
 * pulling expo-sqlite into web bundles.
 */
export function useDrizzleEntity<TRow extends SyncableBase>(
	db: ExpoSQLiteDatabase,
	table: SyncableTable,
	scopeId: string,
	filter?: (item: TRow) => boolean,
) {
	const { data: allItems } = useLiveQuery(
		db.select().from(table).where(eq(table.scopeId, scopeId)),
		[scopeId],
	);

	const items = useMemo(
		() =>
			(allItems as TRow[]).filter((item) => {
				if (item.deleted || item.syncStatus === "conflict") return false;
				return filter ? filter(item) : true;
			}),
		[allItems, filter],
	);

	const conflicts = useMemo(
		() => (allItems as TRow[]).filter((item) => item.syncStatus === "conflict"),
		[allItems],
	);

	return { items, conflicts };
}
