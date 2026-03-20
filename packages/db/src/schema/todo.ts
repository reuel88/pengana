import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { organization, user } from "./auth";

export const todo = pgTable(
	"todo",
	{
		id: text("id").primaryKey(),
		title: text("title").notNull(),
		completed: boolean("completed").default(false).notNull(),
		deleted: boolean("deleted").default(false).notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
		scopeType: text("scope_type", { enum: ["personal", "org"] }).notNull(),
		scopeId: text("scope_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		createdBy: text("created_by")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [
		index("todo_scope_updatedAt_idx").on(
			table.scopeType,
			table.scopeId,
			table.updatedAt,
		),
	],
);

export const todoRelations = relations(todo, ({ one }) => ({
	user: one(user, {
		fields: [todo.userId],
		references: [user.id],
	}),
}));
