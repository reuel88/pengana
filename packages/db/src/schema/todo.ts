import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const todo = pgTable(
	"todo",
	{
		id: text("id").primaryKey(),
		title: text("title").notNull(),
		completed: boolean("completed").default(false).notNull(),
		deleted: boolean("deleted").default(false).notNull(),
		attachmentUrl: text("attachment_url"),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [
		index("todo_userId_idx").on(table.userId),
		index("todo_userId_updatedAt_idx").on(table.userId, table.updatedAt),
	],
);

export const todoRelations = relations(todo, ({ one }) => ({
	user: one(user, {
		fields: [todo.userId],
		references: [user.id],
	}),
}));
