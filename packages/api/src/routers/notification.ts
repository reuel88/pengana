import {
	findNotificationByTypeAndInvitation,
	getInvitationWithOrg,
	getUnreadNotifications,
	insertNotification,
	markAllNotificationsRead,
	markNotificationRead,
} from "@pengana/db/notification-queries";
import { z } from "zod";
import { apiError } from "../errors";
import { envelope, envelopeOutput, protectedProcedure } from "../index";

const notificationSchema = z.object({
	id: z.string(),
	userId: z.string(),
	type: z.string(),
	body: z.string(),
	read: z.boolean(),
	metadata: z.record(z.string(), z.unknown()).nullable(),
	createdAt: z.date(),
});

export const notificationRouter = {
	list: protectedProcedure
		.route({
			method: "GET",
			path: "/notification/list",
			summary: "List unread notifications",
		})
		.output(envelopeOutput(z.array(notificationSchema)))
		.handler(async ({ context }) => {
			const notifications = await getUnreadNotifications(
				context.session.user.id,
			);
			return envelope(
				notifications.map((n) => ({
					...n,
					metadata: n.metadata as Record<string, unknown> | null,
				})),
			);
		}),

	markRead: protectedProcedure
		.route({
			method: "POST",
			path: "/notification/mark-read",
			summary: "Mark a notification as read",
		})
		.input(z.object({ id: z.string() }))
		.output(envelopeOutput(z.object({ success: z.boolean() })))
		.handler(async ({ input, context }) => {
			await markNotificationRead(input.id, context.session.user.id);
			return envelope({ success: true });
		}),

	markAllRead: protectedProcedure
		.route({
			method: "POST",
			path: "/notification/mark-all-read",
			summary: "Mark all notifications as read",
		})
		.output(envelopeOutput(z.object({ success: z.boolean() })))
		.handler(async ({ context }) => {
			await markAllNotificationsRead(context.session.user.id);
			return envelope({ success: true });
		}),

	onInvitationAccepted: protectedProcedure
		.route({
			method: "POST",
			path: "/notification/invitation-accepted",
			summary: "Create notification when an invitation is accepted",
		})
		.input(z.object({ invitationId: z.string() }))
		.output(envelopeOutput(z.object({ notified: z.boolean() })))
		.handler(async ({ input, context }) => {
			const row = await getInvitationWithOrg(input.invitationId);

			if (!row) {
				throw apiError("NOT_FOUND", "Invitation not found");
			}
			if (row.status !== "accepted") {
				throw apiError("BAD_REQUEST", "Invitation is not accepted");
			}
			if (row.email !== context.session.user.email) {
				throw apiError("FORBIDDEN", "Not the invitation recipient");
			}

			const existing = await findNotificationByTypeAndInvitation(
				row.inviterId,
				input.invitationId,
			);
			if (existing) {
				return envelope({ notified: false });
			}

			const accepterName =
				context.session.user.name || context.session.user.email;

			const notificationId = crypto.randomUUID();
			await insertNotification({
				id: notificationId,
				userId: row.inviterId,
				type: "invitation_accepted",
				body: `${accepterName} accepted your invitation to ${row.orgName}`,
				metadata: {
					invitationId: input.invitationId,
					orgName: row.orgName,
				},
			});

			context.notifyUser?.(row.inviterId);

			return envelope({ notified: true });
		}),
};
