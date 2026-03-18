import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { organization, user } from "./auth";

export const media = pgTable(
	"media",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		url: text("url"),
		mimeType: text("mime_type").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
		scopeType: text("scope_type", { enum: ["personal", "org"] }).notNull(),
		scopeId: text("scope_id").notNull(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		createdBy: text("created_by")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [
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

export const mediaAttachments = pgTable(
	"media_attachments",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		mediaId: text("media_id")
			.notNull()
			.references(() => media.id, { onDelete: "cascade" }),
		entityType: text("entity_type").notNull(),
		entityId: text("entity_id").notNull(),
		position: integer("position").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("media_attachments_entity_idx").on(table.entityType, table.entityId),
		index("media_attachments_media_id_idx").on(table.mediaId),
	],
);
