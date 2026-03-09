import { useTranslation } from "@pengana/i18n";
import { toast } from "sonner";
import {
	useInvalidateNotifications,
	useNotifications,
} from "@/features/notifications/use-notification-queries";
import { useInvitationActions } from "@/hooks/use-invitation-actions";
import { useUserInvitations } from "@/hooks/use-org-queries";
import { authClient } from "@/lib/auth-client";
import { client } from "@/utils/orpc";

export function useNotificationCenter() {
	const { t } = useTranslation("organization");
	const { data: invitations } = useUserInvitations();
	const { data: notifications } = useNotifications();
	const { invalidateNotifications } = useInvalidateNotifications();

	const invitationActions = useInvitationActions({
		successMessage: t("invitations.acceptSuccess"),
		errorMessage: t("invitations.error"),
		rejectSuccessMessage: t("invitations.rejectSuccess"),
		rejectErrorMessage: t("invitations.error"),
		onAcceptSuccess: async (invitationId) => {
			const invitation = invitations?.find((i) => i.id === invitationId);
			if (invitation) {
				await authClient.organization.setActive({
					organizationId: invitation.organizationId,
				});
				try {
					await client.notification.onInvitationAccepted({ invitationId });
				} catch (err) {
					console.error("Failed to notify invitation accepted", err);
				}
				await invalidateNotifications();
			}
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
