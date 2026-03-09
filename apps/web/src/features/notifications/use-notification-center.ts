import { toast } from "sonner";

import {
	useInvalidateNotifications,
	useNotifications,
} from "@/features/notifications/use-notification-queries";
import { useInvitationActions } from "@/hooks/use-invitation-actions";
import { useUserInvitations } from "@/hooks/use-org-queries";
import { authClient } from "@/lib/auth-client";
import { client } from "@/utils/orpc";

export function useNotificationCenter({
	onAcceptSuccess,
	onError,
}: {
	onAcceptSuccess?: (invitationId: string) => void | Promise<void>;
	onError?: (message: string) => void;
}) {
	const { data: invitations } = useUserInvitations();
	const { data: notifications } = useNotifications();
	const { invalidateNotifications } = useInvalidateNotifications();

	const errorHandler = onError ?? ((message: string) => toast.error(message));

	const invitationActions = useInvitationActions({
		successMessage: "",
		errorMessage: "",
		onAcceptSuccess: async (invitationId) => {
			const invitation = invitations?.find((i) => i.id === invitationId);
			if (invitation) {
				await authClient.organization.setActive({
					organizationId: invitation.organizationId,
				});
				client.notification
					.onInvitationAccepted({ invitationId })
					.catch(() => {});
			}
			await onAcceptSuccess?.(invitationId);
		},
	});

	const pending = invitations?.filter((i) => i.status === "pending") ?? [];
	const unreadNotifications = notifications ?? [];
	const badgeCount = pending.length + unreadNotifications.length;

	const handleMarkRead = async (id: string) => {
		try {
			await client.notification.markRead({ id });
			await invalidateNotifications();
		} catch {
			errorHandler("Failed to mark notification as read");
		}
	};

	const handleMarkAllRead = async () => {
		try {
			await client.notification.markAllRead();
			await invalidateNotifications();
		} catch {
			errorHandler("Failed to mark all notifications as read");
		}
	};

	return {
		pending,
		notifications: unreadNotifications,
		badgeCount,
		handleMarkRead,
		handleMarkAllRead,
		invitationActions,
	};
}
