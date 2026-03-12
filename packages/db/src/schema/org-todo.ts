import { relations } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { organization, user } from "./auth";

export const orgTodo = pgTable(
	"org_todo",
	{
		id: text("id").primaryKey(),
		title: text("title").notNull(),
		completed: boolean("completed").default(false).notNull(),
		deleted: boolean("deleted").default(false).notNull(),
		attachmentUrl: text("attachment_url"),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		createdBy: text("created_by").references(() => user.id, {
			onDelete: "set null",
		}),
	},
	(table) => [
		index("org_todo_organizationId_idx").on(table.organizationId),
		index("org_todo_organizationId_updatedAt_idx").on(
			table.organizationId,
			table.updatedAt,
		),
	],
);

export const orgTodoRelations = relations(orgTodo, ({ one }) => ({
	organization: one(organization, {
		fields: [orgTodo.organizationId],
		references: [organization.id],
	}),
	creator: one(user, {
		fields: [orgTodo.createdBy],
		references: [user.id],
	}),
}));
