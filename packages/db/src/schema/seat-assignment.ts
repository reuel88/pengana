import { relations } from "drizzle-orm";
import {
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

import { member, organization } from "./auth";

export const seatAssignment = pgTable(
	"seat_assignment",
	{
		id: text("id").primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		memberId: text("member_id")
			.notNull()
			.references(() => member.id, { onDelete: "cascade" }),
		assignedAt: timestamp("assigned_at").defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("seat_assignment_orgId_memberId_uidx").on(
			table.organizationId,
			table.memberId,
		),
		index("seat_assignment_organizationId_idx").on(table.organizationId),
	],
);

export const seatAssignmentRelations = relations(seatAssignment, ({ one }) => ({
	organization: one(organization, {
		fields: [seatAssignment.organizationId],
		references: [organization.id],
	}),
	member: one(member, {
		fields: [seatAssignment.memberId],
		references: [member.id],
	}),
}));
