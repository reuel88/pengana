import { type HLCTimestamp, serializeHlc } from "@pengana/sync/core";
import { eq } from "drizzle-orm";
import type { BaseSQLiteDatabase, SQLiteColumn } from "drizzle-orm/sqlite-core";

export interface DrizzleActions<TInsert> {
	add(record: TInsert): Promise<void>;
	update(id: string, changes: Record<string, unknown>): Promise<void>;
	softDelete(id: string): Promise<void>;
	resolveConflict(id: string, resolution: "local" | "server"): Promise<void>;
}

export interface DrizzleActionsConfig {
	/** Generate an HLC timestamp for the current mutation. */
	hlcNow: () => HLCTimestamp;
}

/**
 * Generic CRUD action factory for Drizzle entities.
 *
 * All mutations auto-set `syncStatus: "pending"`, a fresh `updatedAt`,
 * an HLC timestamp, and per-field clocks for changed fields.
 */
export function createDrizzleActions<TInsert>(
	db: BaseSQLiteDatabase<"sync" | "async", unknown>,
	// biome-ignore lint/suspicious/noExplicitAny: Must accept any Drizzle table shape
	table: any,
	idColumn: SQLiteColumn,
	config: DrizzleActionsConfig,
): DrizzleActions<TInsert> {
	function stampFields(
		existingFieldClocks: string | undefined,
		changedFields: string[],
	): { hlcTimestamp: string; fieldClocks: string } {
		const ts = serializeHlc(config.hlcNow());
		const existing: Record<string, string> = existingFieldClocks
			? JSON.parse(existingFieldClocks)
			: {};
		for (const field of changedFields) {
			existing[field] = ts;
		}
		return { hlcTimestamp: ts, fieldClocks: JSON.stringify(existing) };
	}

	return {
		async add(record: TInsert): Promise<void> {
			await db.insert(table).values(record as Record<string, unknown>);
		},

		async update(id: string, changes: Record<string, unknown>): Promise<void> {
			const [existing] = await db
				.select({ fieldClocks: table.fieldClocks })
				.from(table)
				.where(eq(idColumn, id));
			const changedFields = Object.keys(changes).filter(
				(k) =>
					k !== "syncStatus" &&
					k !== "updatedAt" &&
					k !== "hlcTimestamp" &&
					k !== "fieldClocks",
			);
			const { hlcTimestamp, fieldClocks } = stampFields(
				existing?.fieldClocks,
				changedFields,
			);
			await db
				.update(table)
				.set({
					...changes,
					updatedAt: new Date().toISOString(),
					hlcTimestamp,
					fieldClocks,
					syncStatus: "pending",
				})
				.where(eq(idColumn, id));
		},

		async softDelete(id: string): Promise<void> {
			const [existing] = await db
				.select({ fieldClocks: table.fieldClocks })
				.from(table)
				.where(eq(idColumn, id));
			const { hlcTimestamp, fieldClocks } = stampFields(existing?.fieldClocks, [
				"deleted",
			]);
			await db
				.update(table)
				.set({
					deleted: true,
					updatedAt: new Date().toISOString(),
					hlcTimestamp,
					fieldClocks,
					syncStatus: "pending",
				})
				.where(eq(idColumn, id));
		},

		async resolveConflict(
			id: string,
			resolution: "local" | "server",
		): Promise<void> {
			if (resolution === "local") {
				const [existing] = await db
					.select({ fieldClocks: table.fieldClocks })
					.from(table)
					.where(eq(idColumn, id));
				const { hlcTimestamp, fieldClocks } = stampFields(
					existing?.fieldClocks,
					[],
				);
				await db
					.update(table)
					.set({
						updatedAt: new Date().toISOString(),
						hlcTimestamp,
						fieldClocks,
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
