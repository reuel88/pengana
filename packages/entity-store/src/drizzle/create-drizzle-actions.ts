import { eq } from "drizzle-orm";
import type { BaseSQLiteDatabase, SQLiteColumn } from "drizzle-orm/sqlite-core";

export interface DrizzleActions<TInsert> {
	add(record: TInsert): Promise<void>;
	update(id: string, changes: Record<string, unknown>): Promise<void>;
	softDelete(id: string): Promise<void>;
	resolveConflict(id: string, resolution: "local" | "server"): Promise<void>;
}

/**
 * Generic CRUD action factory for Drizzle entities.
 *
 * All mutations auto-set `syncStatus: "pending"` and a fresh `updatedAt`.
 */
export function createDrizzleActions<TInsert>(
	db: BaseSQLiteDatabase<"sync" | "async", unknown>,
	// biome-ignore lint/suspicious/noExplicitAny: Must accept any Drizzle table shape
	table: any,
	idColumn: SQLiteColumn,
): DrizzleActions<TInsert> {
	return {
		async add(record: TInsert): Promise<void> {
			await db.insert(table).values(record as Record<string, unknown>);
		},

		async update(id: string, changes: Record<string, unknown>): Promise<void> {
			await db
				.update(table)
				.set({
					...changes,
					updatedAt: new Date().toISOString(),
					syncStatus: "pending",
				})
				.where(eq(idColumn, id));
		},

		async softDelete(id: string): Promise<void> {
			await db
				.update(table)
				.set({
					deleted: true,
					updatedAt: new Date().toISOString(),
					syncStatus: "pending",
				})
				.where(eq(idColumn, id));
		},

		async resolveConflict(
			id: string,
			resolution: "local" | "server",
		): Promise<void> {
			if (resolution === "local") {
				await db
					.update(table)
					.set({
						updatedAt: new Date().toISOString(),
						syncStatus: "pending",
					})
					.where(eq(idColumn, id));
			} else {
				await db
					.update(table)
					.set({ syncStatus: "synced" })
					.where(eq(idColumn, id));
			}
		},
	};
}
