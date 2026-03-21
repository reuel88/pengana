import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const drizzleUploadQueue = sqliteTable("upload_queue", {
	id: text("id").primaryKey(),
	fileUri: text("file_uri").notNull(),
	mimeType: text("mime_type").notNull(),
	entityType: text("entity_type"),
	entityId: text("entity_id"),
	status: text("status", {
		enum: ["queued", "uploading", "uploaded", "failed"],
	})
		.notNull()
		.default("queued"),
	retryCount: integer("retry_count").notNull().default(0),
	createdAt: text("created_at").notNull(),
});
