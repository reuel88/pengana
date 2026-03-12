import { relations } from "drizzle-orm";
import {
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

import { organization } from "./auth";

export const subscription = pgTable(
	"subscription",
	{
		id: text("id").primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		polarSubscriptionId: text("polar_subscription_id").notNull(),
		polarProductId: text("polar_product_id").notNull(),
		status: text("status").default("active").notNull(),
		seats: text("seats"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("subscription_organizationId_uidx").on(table.organizationId),
		index("subscription_polarSubscriptionId_idx").on(table.polarSubscriptionId),
		index("subscription_status_idx").on(table.status),
	],
);

export const subscriptionRelations = relations(subscription, ({ one }) => ({
	organization: one(organization, {
		fields: [subscription.organizationId],
		references: [organization.id],
	}),
}));
