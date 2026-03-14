import { useTranslation } from "@pengana/i18n";
import { useInvitationActions as useInvitationActionsBase } from "@pengana/org-client";
import { toast } from "sonner";

export function useInvitationActions({
	onAcceptSuccess,
	onRejectSuccess,
}: {
	onAcceptSuccess?: (invitationId: string) => void | Promise<void>;
	onRejectSuccess?: () => void | Promise<void>;
} = {}) {
	const { t } = useTranslation("organization");

	return useInvitationActionsBase({
		onAcceptSuccess: async (invitationId) => {
			toast.success(t("invitations.acceptSuccess"));
			await onAcceptSuccess?.(invitationId);
		},
		onRejectSuccess: async () => {
			toast.success(t("invitations.rejectSuccess"));
			await onRejectSuccess?.();
		},
		onError: (message) => toast.error(message || t("invitations.error")),
	});
}
