import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "./index";
import { invitation, organization, user } from "./schema/auth";
import { notification } from "./schema/notification";

export async function getUnreadNotifications(userId: string) {
	return db
		.select()
		.from(notification)
		.where(and(eq(notification.userId, userId), eq(notification.read, false)))
		.orderBy(desc(notification.createdAt));
}

export async function markNotificationRead(id: string, userId: string) {
	const updated = await db
		.update(notification)
		.set({ read: true })
		.where(and(eq(notification.id, id), eq(notification.userId, userId)))
		.returning({ id: notification.id });
	return updated.length > 0;
}

export async function markAllNotificationsRead(userId: string) {
	await db
		.update(notification)
		.set({ read: true })
		.where(and(eq(notification.userId, userId), eq(notification.read, false)));
}

export async function insertNotification(values: {
	id: string;
	userId: string;
	type: string;
	body: string;
	metadata?: Record<string, unknown> | null;
}) {
	await db.insert(notification).values(values);
}

export async function findUserByEmail(email: string) {
	const [found] = await db
		.select({ id: user.id, name: user.name })
		.from(user)
		.where(eq(user.email, email))
		.limit(1);
	return found ?? null;
}

export async function getInvitationWithOrg(invitationId: string) {
	const rows = await db
		.select({
			inviterId: invitation.inviterId,
			email: invitation.email,
			orgName: organization.name,
			status: invitation.status,
		})
		.from(invitation)
		.innerJoin(organization, eq(invitation.organizationId, organization.id))
		.where(eq(invitation.id, invitationId))
		.limit(1);

	return rows[0] ?? null;
}

export async function getPublicInvitationSummary(invitationId: string) {
	const rows = await db
		.select({
			id: invitation.id,
			email: invitation.email,
			role: invitation.role,
			status: invitation.status,
			expiresAt: invitation.expiresAt,
			organizationId: invitation.organizationId,
			organizationName: organization.name,
			teamId: invitation.teamId,
			inviterEmail: user.email,
		})
		.from(invitation)
		.innerJoin(organization, eq(invitation.organizationId, organization.id))
		.innerJoin(user, eq(invitation.inviterId, user.id))
		.where(eq(invitation.id, invitationId))
		.limit(1);

	return rows[0] ?? null;
}

export async function findNotificationByTypeAndInvitation(
	userId: string,
	invitationId: string,
) {
	const [found] = await db
		.select({ id: notification.id })
		.from(notification)
		.where(
			and(
				eq(notification.userId, userId),
				eq(notification.type, "invitation_accepted"),
				sql`${notification.metadata}->>'invitationId' = ${invitationId}`,
			),
		)
		.limit(1);
	return found ?? null;
}
