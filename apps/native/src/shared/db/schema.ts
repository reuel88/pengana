import { syncableColumns } from "@pengana/local-db/drizzle";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const todos = sqliteTable("todos", {
	...syncableColumns,
	title: text("title").notNull(),
	completed: integer("completed", { mode: "boolean" }).notNull().default(false),
	scopeType: text("scope_type").notNull().default("personal"),
	organizationId: text("organization_id").notNull(),
	createdBy: text("created_by").notNull(),
});

export const media = sqliteTable("media", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull(),
	url: text("url"),
	localUri: text("local_uri"),
	status: text("status", {
		enum: ["queued", "uploading", "uploaded", "failed"],
	}),
	mimeType: text("mime_type").notNull(),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
	scopeType: text("scope_type").notNull().default("personal"),
	scopeId: text("scope_id").notNull().default(""),
	organizationId: text("organization_id").notNull(),
	createdBy: text("created_by").notNull(),
});

export const mediaAttachments = sqliteTable("media_attachments", {
	id: text("id").primaryKey(),
	mediaId: text("media_id").notNull(),
	entityType: text("entity_type").notNull(),
	entityId: text("entity_id").notNull(),
	position: integer("position").notNull(),
	createdAt: text("created_at").notNull(),
});

export const syncMeta = sqliteTable("sync_meta", {
	key: text("key").primaryKey(),
	value: text("value").notNull(),
});
