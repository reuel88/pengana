import { eq, sql } from "drizzle-orm";

import { db } from "./index";
import { member } from "./schema/auth";
import { subscription } from "./schema/subscription";

export async function getOrgSubscription(organizationId: string) {
	const [row] = await db
		.select()
		.from(subscription)
		.where(eq(subscription.organizationId, organizationId))
		.limit(1);
	return row ?? undefined;
}

export async function upsertSubscription(values: {
	organizationId: string;
	polarSubscriptionId: string;
	polarProductId: string;
	status: string;
	seats: string | null;
}) {
	await db
		.insert(subscription)
		.values({
			id: crypto.randomUUID(),
			...values,
		})
		.onConflictDoUpdate({
			target: subscription.organizationId,
			set: {
				polarSubscriptionId: values.polarSubscriptionId,
				polarProductId: values.polarProductId,
				status: values.status,
				seats: values.seats,
				updatedAt: new Date(),
			},
		});
}

export async function countOrgMembers(organizationId: string) {
	const [result] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(member)
		.where(eq(member.organizationId, organizationId));
	return result?.count ?? 0;
}
