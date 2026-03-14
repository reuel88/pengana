import { useTranslation } from "@pengana/i18n";
import { filterPendingInvitations } from "@pengana/org-client";
import { toast } from "sonner";
import {
	useInvalidateNotifications,
	useNotifications,
} from "@/features/notifications/use-notification-queries";
import { client } from "@/shared/api/orpc";
import { useInvitationActions } from "@/shared/hooks/use-invitation-actions";
import { useUserInvitations } from "@/shared/hooks/use-org-queries";

export function useNotificationCenter() {
	const { t } = useTranslation("organization");
	const { data: invitations } = useUserInvitations();
	const { data: notifications } = useNotifications();
	const { invalidateNotifications } = useInvalidateNotifications();

	const invitationActions = useInvitationActions({
		onAcceptSuccess: async (invitationId) => {
			await client.notification
				.onInvitationAccepted({ invitationId })
				.catch(() => {
					// Best-effort notification — failure doesn't affect the user flow
				});
			await invalidateNotifications();
		},
	});

	const pending = filterPendingInvitations(invitations ?? []);
	const unreadNotifications = notifications ?? [];
	const badgeCount = pending.length + unreadNotifications.length;

	const handleMarkRead = async (id: string) => {
		try {
			await client.notification.markRead({ id });
			await invalidateNotifications();
		} catch {
			toast.error(t("notifications.markReadError"));
		}
	};

	const handleMarkAllRead = async () => {
		try {
			await client.notification.markAllRead();
			await invalidateNotifications();
		} catch {
			toast.error(t("notifications.markAllReadError"));
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
