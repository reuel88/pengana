import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const media = pgTable(
	"media",
	{
		id: text("id").primaryKey(),
		entityId: text("entity_id"),
		entityType: text("entity_type"),
		userId: text("user_id").notNull(),
		url: text("url"),
		mimeType: text("mime_type").notNull(),
		position: integer("position").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("media_entity_id_idx").on(table.entityId),
		index("media_user_id_idx").on(table.userId),
	],
);
