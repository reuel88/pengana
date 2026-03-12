import { and, eq, sql } from "drizzle-orm";

import { db } from "./index";
import { member } from "./schema/auth";
import { seatAssignment } from "./schema/seat-assignment";
import { getOrgSubscription } from "./subscription-queries";

const FREE_TIER_SEATS = Number(process.env.FREE_TIER_SEATS) || 2;

export async function getEffectiveSeatLimit(orgId: string) {
	const sub = await getOrgSubscription(orgId);
	if (sub?.status === "active" && sub.seats) {
		return Number.parseInt(sub.seats, 10);
	}
	return FREE_TIER_SEATS;
}

export async function countSeatedMembers(orgId: string) {
	const [result] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(seatAssignment)
		.where(eq(seatAssignment.organizationId, orgId));
	return result?.count ?? 0;
}

export async function isMemberSeatedByUserId(orgId: string, userId: string) {
	const [result] = await db
		.select({ id: seatAssignment.id })
		.from(seatAssignment)
		.innerJoin(member, eq(seatAssignment.memberId, member.id))
		.where(
			and(eq(seatAssignment.organizationId, orgId), eq(member.userId, userId)),
		)
		.limit(1);
	return !!result;
}

export async function assignSeatIfAvailable(orgId: string, memberId: string) {
	return await db.transaction(async (tx) => {
		const [countResult] = await tx
			.select({ count: sql<number>`count(*)::int` })
			.from(seatAssignment)
			.where(eq(seatAssignment.organizationId, orgId));
		const seated = countResult?.count ?? 0;

		const limit = await getEffectiveSeatLimit(orgId);
		if (seated >= limit) return false;

		await tx
			.insert(seatAssignment)
			.values({
				id: crypto.randomUUID(),
				organizationId: orgId,
				memberId,
			})
			.onConflictDoNothing();
		return true;
	});
}

export async function autoSeatOwner(orgId: string, userId: string) {
	const [ownerMember] = await db
		.select({ id: member.id, role: member.role })
		.from(member)
		.where(and(eq(member.organizationId, orgId), eq(member.userId, userId)))
		.limit(1);

	if (ownerMember?.role === "owner") {
		return assignSeatIfAvailable(orgId, ownerMember.id);
	}
	return false;
}

export async function revokeSeat(orgId: string, memberId: string) {
	await db
		.delete(seatAssignment)
		.where(
			and(
				eq(seatAssignment.organizationId, orgId),
				eq(seatAssignment.memberId, memberId),
			),
		);
}

export async function getSeatedMemberUserIds(orgId: string): Promise<string[]> {
	const rows = await db
		.select({ userId: member.userId })
		.from(seatAssignment)
		.innerJoin(member, eq(seatAssignment.memberId, member.id))
		.where(eq(seatAssignment.organizationId, orgId));
	return rows.map((r) => r.userId);
}
