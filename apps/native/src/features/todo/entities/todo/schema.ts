import { syncableColumns } from "@pengana/entity-store";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const todos = sqliteTable("todos", {
	...syncableColumns,
	title: text("title").notNull(),
	completed: integer("completed", { mode: "boolean" }).notNull().default(false),
	organizationId: text("organization_id"),
	createdBy: text("created_by"),
});

export const media = sqliteTable("media", {
	id: text("id").primaryKey(),
	entityId: text("entity_id"),
	entityType: text("entity_type"),
	userId: text("user_id").notNull(),
	url: text("url"),
	localUri: text("local_uri"),
	status: text("status", {
		enum: ["queued", "uploading", "uploaded", "failed"],
	}),
	mimeType: text("mime_type").notNull(),
	position: integer("position").notNull(),
	createdAt: text("created_at").notNull(),
});

export const syncMeta = sqliteTable("sync_meta", {
	key: text("key").primaryKey(),
	value: text("value").notNull(),
});
