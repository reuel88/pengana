import { integer, text } from "drizzle-orm/sqlite-core";

/**
 * Shared base columns for syncable entities in Drizzle (SQLite).
 *
 * Usage:
 *   const invoices = sqliteTable("invoices", {
 *     ...syncableColumns,
 *     amount: integer("amount").notNull(),
 *     vendor: text("vendor"),
 *   });
 */
export const syncableColumns = {
	id: text("id").primaryKey(),
	updatedAt: text("updated_at").notNull(),
	userId: text("user_id").notNull(),
	syncStatus: text("sync_status", {
		enum: ["synced", "pending", "conflict"],
	})
		.notNull()
		.default("pending"),
	deleted: integer("deleted", { mode: "boolean" }).notNull().default(false),
} as const;
