import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const notification = pgTable(
	"notification",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		type: text("type").notNull(),
		body: text("body").notNull(),
		read: boolean("read").default(false).notNull(),
		metadata: text("metadata"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("notification_userId_read_idx").on(table.userId, table.read),
	],
);

export const notificationRelations = relations(notification, ({ one }) => ({
	user: one(user, {
		fields: [notification.userId],
		references: [user.id],
	}),
}));
