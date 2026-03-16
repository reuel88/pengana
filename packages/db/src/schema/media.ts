import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { organization, user } from "./auth";

export const media = pgTable(
	"media",
	{
		id: text("id").primaryKey(),
		entityId: text("entity_id"),
		entityType: text("entity_type"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		url: text("url"),
		mimeType: text("mime_type").notNull(),
		position: integer("position").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
		scopeType: text("scope_type", { enum: ["personal", "org"] }).notNull(),
		scopeId: text("scope_id").notNull(),
		organizationId: text("organization_id").references(() => organization.id, {
			onDelete: "set null",
		}),
		createdBy: text("created_by").references(() => user.id, {
			onDelete: "set null",
		}),
	},
	(table) => [
		index("media_entity_id_idx").on(table.entityId),
		index("media_scope_updatedAt_idx").on(
			table.scopeType,
			table.scopeId,
			table.updatedAt,
		),
		index("media_user_id_idx").on(table.userId),
		index("media_organization_id_idx").on(table.organizationId),
		index("media_created_by_idx").on(table.createdBy),
	],
);
