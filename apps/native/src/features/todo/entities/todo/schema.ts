import { syncableColumns } from "@pengana/entity-store";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const todos = sqliteTable("todos", {
	...syncableColumns,
	title: text("title").notNull(),
	completed: integer("completed", { mode: "boolean" }).notNull().default(false),
	organizationId: text("organization_id"),
	createdBy: text("created_by"),
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
