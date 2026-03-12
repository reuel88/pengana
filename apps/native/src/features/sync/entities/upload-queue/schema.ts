import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const uploadQueue = sqliteTable("upload_queue", {
	id: text("id").primaryKey(),
	todoId: text("todo_id").notNull(),
	fileUri: text("file_uri").notNull(),
	mimeType: text("mime_type").notNull(),
	status: text("status", {
		enum: ["queued", "uploading", "uploaded", "failed"],
	})
		.notNull()
		.default("queued"),
	retryCount: integer("retry_count").notNull().default(0),
	createdAt: text("created_at").notNull(),
});
