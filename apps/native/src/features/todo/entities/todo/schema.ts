import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const todos = sqliteTable("todos", {
	id: text("id").primaryKey(),
	title: text("title").notNull(),
	completed: integer("completed", { mode: "boolean" }).notNull().default(false),
	updatedAt: text("updated_at").notNull(),
	userId: text("user_id").notNull(),
	organizationId: text("organization_id"),
	createdBy: text("created_by"),
	syncStatus: text("sync_status", { enum: ["synced", "pending", "conflict"] })
		.notNull()
		.default("pending"),
	deleted: integer("deleted", { mode: "boolean" }).notNull().default(false),
	attachmentUrl: text("attachment_url"),
	attachmentLocalUri: text("attachment_local_uri"),
	attachmentStatus: text("attachment_status", {
		enum: ["queued", "uploading", "uploaded", "failed"],
	}),
});

export const syncMeta = sqliteTable("sync_meta", {
	key: text("key").primaryKey(),
	value: text("value").notNull(),
});
