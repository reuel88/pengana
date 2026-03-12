import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@pengana/db/seat-queries", () => ({
	isMemberSeatedByUserId: vi.fn(),
	autoSeatOwner: vi.fn(),
}));

vi.mock("@pengana/db/notification-queries", () => ({
	getUnreadNotifications: vi.fn(),
	markNotificationRead: vi.fn(),
	markAllNotificationsRead: vi.fn(),
	getInvitationWithOrg: vi.fn(),
	findNotificationByTypeAndInvitation: vi.fn(),
	insertNotification: vi.fn(),
}));

import { call } from "@orpc/server";
import {
	findNotificationByTypeAndInvitation,
	getInvitationWithOrg,
	getUnreadNotifications,
	insertNotification,
	markAllNotificationsRead,
	markNotificationRead,
} from "@pengana/db/notification-queries";
import { notificationRouter } from "./notification";

function makeContext(overrides: Record<string, unknown> = {}) {
	return {
		session: {
			user: {
				id: "user-1",
				email: "user@example.com",
				name: "Test User",
			},
		},
		locale: "en-US",
		t: (key: string) => key,
		notifyUser: vi.fn(),
		...overrides,
	} as never;
}

function makeNotificationRow(overrides: Record<string, unknown> = {}) {
	return {
		id: "notif-1",
		userId: "user-1",
		type: "invitation_accepted",
		body: "Someone accepted your invite",
		read: false,
		metadata: null,
		createdAt: new Date("2025-01-01T00:00:00.000Z"),
		...overrides,
	};
}

describe("notification.list", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns unread notifications for the authenticated user", async () => {
		const row = makeNotificationRow();
		vi.mocked(getUnreadNotifications).mockResolvedValue([row]);

		const result = await call(notificationRouter.list, undefined, {
			context: makeContext(),
		});

		expect(getUnreadNotifications).toHaveBeenCalledWith("user-1");
		expect(result.data).toHaveLength(1);
		expect(result.data[0]).toMatchObject({ id: "notif-1", userId: "user-1" });
	});

	it("returns empty array when no notifications exist", async () => {
		vi.mocked(getUnreadNotifications).mockResolvedValue([]);

		const result = await call(notificationRouter.list, undefined, {
			context: makeContext(),
		});

		expect(result.data).toEqual([]);
	});
});

describe("notification.markRead", () => {
	beforeEach(() => vi.clearAllMocks());

	it("marks a notification as read", async () => {
		vi.mocked(markNotificationRead).mockResolvedValue(true);

		const result = await call(
			notificationRouter.markRead,
			{ id: "notif-1" },
			{ context: makeContext() },
		);

		expect(markNotificationRead).toHaveBeenCalledWith("notif-1", "user-1");
		expect(result.data).toEqual({ success: true });
	});

	it("throws NOT_FOUND when notification belongs to another user", async () => {
		vi.mocked(markNotificationRead).mockResolvedValue(false);

		await expect(
			call(
				notificationRouter.markRead,
				{ id: "notif-1" },
				{ context: makeContext() },
			),
		).rejects.toThrow();
	});
});

describe("notification.markAllRead", () => {
	beforeEach(() => vi.clearAllMocks());

	it("marks all notifications as read for the user", async () => {
		vi.mocked(markAllNotificationsRead).mockResolvedValue(undefined);

		const result = await call(notificationRouter.markAllRead, undefined, {
			context: makeContext(),
		});

		expect(markAllNotificationsRead).toHaveBeenCalledWith("user-1");
		expect(result.data).toEqual({ success: true });
	});
});

describe("notification.onInvitationAccepted", () => {
	beforeEach(() => vi.clearAllMocks());

	it("inserts a notification for the inviter", async () => {
		vi.mocked(getInvitationWithOrg).mockResolvedValue({
			inviterId: "inviter-1",
			email: "user@example.com",
			orgName: "Acme",
			status: "accepted",
		});
		vi.mocked(findNotificationByTypeAndInvitation).mockResolvedValue(null);
		vi.mocked(insertNotification).mockResolvedValue(undefined);

		const result = await call(
			notificationRouter.onInvitationAccepted,
			{ invitationId: "inv-1" },
			{ context: makeContext() },
		);

		expect(insertNotification).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: "inviter-1",
				type: "invitation_accepted",
			}),
		);
		expect(result.data).toEqual({ notified: true });
	});

	it("returns notified: false if notification already exists", async () => {
		vi.mocked(getInvitationWithOrg).mockResolvedValue({
			inviterId: "inviter-1",
			email: "user@example.com",
			orgName: "Acme",
			status: "accepted",
		});
		vi.mocked(findNotificationByTypeAndInvitation).mockResolvedValue({
			id: "existing-notif",
		});

		const result = await call(
			notificationRouter.onInvitationAccepted,
			{ invitationId: "inv-1" },
			{ context: makeContext() },
		);

		expect(insertNotification).not.toHaveBeenCalled();
		expect(result.data).toEqual({ notified: false });
	});

	it("throws NOT_FOUND when invitation does not exist", async () => {
		vi.mocked(getInvitationWithOrg).mockResolvedValue(null);

		await expect(
			call(
				notificationRouter.onInvitationAccepted,
				{ invitationId: "inv-1" },
				{ context: makeContext() },
			),
		).rejects.toThrow();
	});

	it("throws FORBIDDEN when email does not match authenticated user", async () => {
		vi.mocked(getInvitationWithOrg).mockResolvedValue({
			inviterId: "inviter-1",
			email: "other@example.com",
			orgName: "Acme",
			status: "accepted",
		});

		await expect(
			call(
				notificationRouter.onInvitationAccepted,
				{ invitationId: "inv-1" },
				{ context: makeContext() },
			),
		).rejects.toThrow();
	});
});
