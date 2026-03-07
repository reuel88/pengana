import { and, desc, eq } from "drizzle-orm";

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
	await db
		.update(notification)
		.set({ read: true })
		.where(and(eq(notification.id, id), eq(notification.userId, userId)));
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
	metadata?: string | null;
}) {
	await db.insert(notification).values(values);
}

export async function findUserByEmail(email: string) {
	const [found] = await db
		.select({ id: user.id })
		.from(user)
		.where(eq(user.email, email))
		.limit(1);
	return found ?? null;
}

export async function getInvitationWithOrg(invitationId: string) {
	const rows = await db
		.select({
			inviterId: invitation.inviterId,
			orgName: organization.name,
			status: invitation.status,
		})
		.from(invitation)
		.innerJoin(organization, eq(invitation.organizationId, organization.id))
		.where(eq(invitation.id, invitationId))
		.limit(1);

	return rows[0] ?? null;
}
